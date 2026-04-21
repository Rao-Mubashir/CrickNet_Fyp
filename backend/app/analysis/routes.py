"""Analysis routes"""

import os
import time
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
import cv2

from app.analysis.models import AnalysisResult, Detection
from app.analysis.utils import load_yolo_model, calculate_speed
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

        # Open video
        cap = cv2.VideoCapture(temp_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30

        trajectory = []
        detections = []
        speeds = []
        prev_pos = None
        frame_id = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Run YOLO inference
            results = model(frame, verbose=False)

            # Extract detections for class 0 (cricket ball)
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0])

                    # Only process class 0 (cricket ball)
                    if class_id == 0:
                        confidence = float(box.conf[0])
                        x_center = float(box.xywh[0][0])
                        y_center = float(box.xywh[0][1])

                        # Add to trajectory
                        trajectory.append([x_center, y_center])

                        # Add to detections
                        detections.append(
                            Detection(
                                frame=frame_id,
                                x=x_center,
                                y=y_center,
                                confidence=confidence,
                            )
                        )

                        # Calculate speed from consecutive detections
                        if prev_pos:
                            speed = calculate_speed(
                                prev_pos, (x_center, y_center), fps=fps
                            )
                            speeds.append(speed)

                        prev_pos = (x_center, y_center)

            frame_id += 1

        cap.release()

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
