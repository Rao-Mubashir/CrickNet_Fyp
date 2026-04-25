"""Analysis routes"""

import os
import time
import uuid
import shutil
import subprocess
import asyncio
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.analysis.models import AnalysisResult, Detection
from app.analysis.utils import run_full_analysis
from app.auth.utils import get_current_user
from app.config import UPLOAD_DIR
from app.database.client import get_db_client
from app.database.models import AnalysisCreate

router = APIRouter(tags=["analysis"])
db = get_db_client()

def cleanup_files(*file_paths):
    """Background task to remove temporary files after response is sent"""
    for path in file_paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Failed to remove temp file {path}: {e}")

async def delayed_cleanup(*file_paths, delay_seconds=300):
    """Wait before cleaning up so the user has time to view the video"""
    await asyncio.sleep(delay_seconds)
    cleanup_files(*file_paths)

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict:
    """Analyze cricket delivery video and detect ball speed/trajectory"""

    # Save uploaded file temporarily
    file_id = str(uuid.uuid4())
    temp_input_path = os.path.join(UPLOAD_DIR, f"{file_id}_in.mp4")
    temp_output_path = os.path.join(UPLOAD_DIR, f"{file_id}_out.mp4")
    
    with open(temp_input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Generate unique temporary files for coordinates
    temp_coords_path = os.path.join(UPLOAD_DIR, f"{file_id}_coords.txt")
    temp_no_spin_path = os.path.join(UPLOAD_DIR, f"{file_id}_no_spin.txt")

    start_time = time.time()

    try:
        # Run full analysis using Subprocess on NewLogic scripts
        analysis = run_full_analysis(temp_input_path, temp_coords_path, temp_no_spin_path)

        # Draw overlay trajectory using subprocess
        import sys
        print(f"Running overlay.py on {temp_input_path} -> {temp_output_path}...")
        subprocess.run([sys.executable, "app/analysis/overlay.py", temp_input_path, temp_output_path, temp_coords_path, temp_no_spin_path], check=True)
        
        # Clean up input immediately, keep output for 5 minutes so it can be viewed
        background_tasks.add_task(cleanup_files, temp_input_path, temp_coords_path, temp_no_spin_path)
        background_tasks.add_task(delayed_cleanup, temp_output_path, delay_seconds=300)

        processing_time = round(time.time() - start_time, 2)

        result = {
            "speed": analysis["speed"],
            "trajectory": analysis["trajectory"],
            "predicted_trajectory": analysis["predicted_trajectory"],
            "detections": analysis["detections"],
            "processing_time": processing_time,
            "bounce_frame": analysis["bounce_frame"],
            "spin_angle": analysis["spin_angle"],
            "spin_direction": analysis["spin_direction"],
            "total_frames": analysis["total_frames"],
            "frames_detected": analysis["frames_detected"],
            "fps": analysis["fps"],
            "video_width": analysis["video_width"],
            "video_height": analysis["video_height"],
            "video_url": f"/static/{file_id}_out.mp4",
        }

        # Save analysis to Supabase database
        try:
            analysis_data = AnalysisCreate(
                user_id=user["id"],
                speed=analysis["speed"],
                trajectory=analysis["trajectory"],
                predicted_trajectory=analysis["predicted_trajectory"],
                detections=analysis["detections"],
                processing_time=processing_time,
                bounce_frame=analysis["bounce_frame"],
                spin_angle=analysis["spin_angle"],
                spin_direction=analysis["spin_direction"],
                total_frames=analysis["total_frames"],
                frames_detected=analysis["frames_detected"],
                fps=analysis["fps"],
            )
            saved_analysis = await db.save_analysis_result(analysis_data)
            result["analysis_id"] = str(saved_analysis.id)

        except Exception as e:
            # Log error but still return the analysis result
            print(f"Warning: Failed to save analysis to database: {str(e)}")

        return result

    except Exception as e:
        background_tasks.add_task(cleanup_files, temp_input_path, temp_output_path, temp_coords_path, temp_no_spin_path)
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.get("/analyses")
async def get_user_analyses(user: dict = Depends(get_current_user)) -> dict:
    """Get all analyses for the current user"""
    try:
        analyses = await db.get_user_analyses(user["id"])
        return {
            "user_id": user["id"],
            "analyses": [analysis.dict() for analysis in analyses],
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch analyses: {str(e)}"
        )


@router.get("/analyses/{analysis_id}")
async def get_analysis(
    analysis_id: str, user: dict = Depends(get_current_user)
) -> dict:
    """Get a specific analysis by ID"""
    try:
        analysis = await db.get_analysis_by_id(analysis_id)

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        # Verify ownership
        if str(analysis.user_id) != user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")

        return analysis.dict()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analysis: {str(e)}")
