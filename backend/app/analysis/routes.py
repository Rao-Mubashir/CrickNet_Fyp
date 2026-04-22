"""Analysis routes"""

import os
import time
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.analysis.models import AnalysisResult, Detection
from app.analysis.utils import (
    load_yolo_model, 
    calculate_speed,
    extract_ball_coordinates,
    smooth_trajectory,
    draw_fluffy_trajectory
)
from app.auth.utils import get_current_user
from app.config import UPLOAD_DIR
from app.database.client import get_db_client
from app.database.models import AnalysisCreate

router = APIRouter(tags=["analysis"])
db = get_db_client()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_video(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict:
    """Analyze cricket delivery video and detect ball speed/trajectory"""

    # Save uploaded file temporarily
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}.mp4")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    start_time = time.time()

    try:
        # Load YOLO model
        model = load_yolo_model()

        # Single source of truth: use extract_ball_coordinates from utils
        raw_data, fps, width, height, total_frames = extract_ball_coordinates(temp_path, model)

        # Build trajectory, detections, and speeds from raw_data
        trajectory = []
        detections = []
        speeds = []
        prev_pos = None

        for entry in raw_data:
            x_center = entry['x']
            y_center = entry['y']

            trajectory.append([x_center, y_center])

            detections.append(
                Detection(
                    frame=entry['frame'],
                    x=x_center,
                    y=y_center,
                    confidence=1.0,  # YOLO conf already filtered in extract_ball_coordinates
                )
            )

            if prev_pos:
                speed = calculate_speed(
                    prev_pos, (x_center, y_center), fps=fps
                )
                speeds.append(speed)

            prev_pos = (x_center, y_center)

        # Calculate average and max speed
        avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
        max_speed = max(speeds) if speeds else 0.0

        speed_str = f"{max_speed:.1f} km/h (avg: {avg_speed:.1f} km/h)"

        processing_time = round(time.time() - start_time, 2)

        result = {
            "speed": speed_str,
            "trajectory": trajectory,
            "detections": [d.dict() for d in detections],
            "processing_time": processing_time,
        }

        # Save analysis to Supabase database
        try:
            analysis_data = AnalysisCreate(
                user_id=user["id"],
                speed=speed_str,
                trajectory=trajectory,
                detections=[d.dict() for d in detections],
                processing_time=processing_time,
            )
            saved_analysis = await db.save_analysis_result(analysis_data)
            result["analysis_id"] = str(saved_analysis.id)

        except Exception as e:
            # Log error but still return the analysis result
            print(f"Warning: Failed to save analysis to database: {str(e)}")

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)


import asyncio

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

@router.post("/analyze/fluffy")
async def analyze_video_fluffy(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Analyze video and return a new video with a fluffy trajectory tail"""
    
    # Save uploaded file temporarily
    file_id = str(uuid.uuid4())
    temp_input_path = os.path.join(UPLOAD_DIR, f"{file_id}_in.mp4")
    temp_output_path = os.path.join(UPLOAD_DIR, f"{file_id}_out.mp4")
    
    with open(temp_input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        # Load YOLO model
        model = load_yolo_model()
        
        # Pass 1: Extract coordinates
        raw_data, fps, width, height, total_frames = extract_ball_coordinates(temp_input_path, model)
        
        # Smooth and fill gaps
        df = smooth_trajectory(raw_data, total_frames)
        
        # Pass 2: Draw fluffy trajectory and save
        draw_fluffy_trajectory(temp_input_path, temp_output_path, df, fps, width, height)
        
        # Check if output video was created
        if not os.path.exists(temp_output_path):
            raise HTTPException(status_code=500, detail="Failed to generate output video")
            
        # Clean up input immediately, keep output for 5 minutes so it can be viewed
        background_tasks.add_task(cleanup_files, temp_input_path)
        background_tasks.add_task(delayed_cleanup, temp_output_path, delay_seconds=300)
            
        return {
            "message": "Analysis complete",
            "video_url": f"/static/{file_id}_out.mp4"
        }

    except Exception as e:
        background_tasks.add_task(cleanup_files, temp_input_path, temp_output_path)
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
