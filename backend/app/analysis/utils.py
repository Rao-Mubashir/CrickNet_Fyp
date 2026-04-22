"""Analysis utility functions"""

import math
import os
import cv2
import numpy as np
import pandas as pd
from typing import Optional, Tuple, List, Dict
from ultralytics import YOLO
from app.config import MODEL_PATH

def load_yolo_model() -> YOLO:
    """Load YOLOv8 model from file"""
    try:
        model = YOLO(MODEL_PATH)
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {str(e)}")

def calculate_speed(
    prev_pos: Optional[Tuple[float, float]],
    curr_pos: Tuple[float, float],
    fps: float = 30,
    pixel_to_kmh: float = 0.1,
) -> float:
    """Calculate ball speed from position change."""
    if not prev_pos or not curr_pos:
        return 0.0

    dx = curr_pos[0] - prev_pos[0]
    dy = curr_pos[1] - prev_pos[1]
    pixel_distance = math.sqrt(dx**2 + dy**2)

    # Assuming 30 fps: distance per frame * fps * conversion factor
    speed_kmh = pixel_distance * fps * pixel_to_kmh
    return speed_kmh

def extract_ball_coordinates(input_video: str, model: YOLO) -> Tuple[List[Dict], int, int, int, int]:
    """
    Pass 1: Analyze video and extract ball coordinates.
    Returns: (raw_data, fps, width, height, total_frames)
    """
    cap = cv2.VideoCapture(input_video)
    fps = int(cap.get(cv2.CAP_PROP_FPS) or 30)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    raw_data = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Run YOLO
        results = model.predict(frame, conf=0.25, verbose=False)

        # Check if a ball is detected
        if len(results[0].boxes) > 0:
            for box in results[0].boxes:
                if int(box.cls[0]) == 0:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    # Color validation
                    roi = frame[int(y1):int(y2), int(x1):int(x2)]
                    if roi.size > 0:
                        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
                        
                        mask1 = cv2.inRange(hsv, np.array([0, 100, 50]), np.array([10, 255, 150]))
                        mask2 = cv2.inRange(hsv, np.array([0, 80, 150]), np.array([15, 255, 255]))
                        mask3 = cv2.inRange(hsv, np.array([170, 80, 80]), np.array([180, 255, 255]))
                        
                        combined = cv2.bitwise_or(mask1, mask2)
                        combined = cv2.bitwise_or(combined, mask3)
                        
                        red_ratio = cv2.countNonZero(combined) / (roi.shape[0] * roi.shape[1])
                        
                        if red_ratio >= 0.25:
                            center_x = (x1 + x2) / 2
                            center_y = (y1 + y2) / 2
                            radius = (x2 - x1) / 2

                            raw_data.append({
                                'frame': frame_idx, 
                                'x': center_x, 
                                'y': center_y, 
                                'r': radius
                            })
                            break  # Only take the first valid ball in this frame

        frame_idx += 1

    cap.release()
    return raw_data, fps, width, height, total_frames

def smooth_trajectory(raw_data: List[Dict], total_frames: int) -> pd.DataFrame:
    """
    Data Smoothing & Gap Filling:
    Interpolates missing detections and smooths the trajectory path.
    """
    if not raw_data:
        # Return an empty dataframe with expected columns if no ball detected
        return pd.DataFrame(columns=['x', 'y', 'r'])

    df = pd.DataFrame(raw_data).set_index('frame')
    
    # Check if there are any valid records before reindexing
    if len(df) == 0:
        return pd.DataFrame(columns=['x', 'y', 'r'])

    df = df.reindex(range(total_frames))

    # 1. Interpolate to fill missing detections
    df = df.interpolate(method='linear', limit_direction='both')

    # 2. Smooth the path (Rolling average over 7 frames)
    df['x'] = df['x'].rolling(window=7, center=True, min_periods=1).mean()
    df['y'] = df['y'].rolling(window=7, center=True, min_periods=1).mean()
    df['r'] = df['r'].rolling(window=7, center=True, min_periods=1).mean()

    return df

def draw_fluffy_trajectory(input_video: str, output_video: str, df: pd.DataFrame, fps: int, width: int, height: int):
    """
    Pass 2: Drawing continuous fluffy trajectory and saving the output video.
    """
    cap = cv2.VideoCapture(input_video)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

    tail_length = fps  # 1 second tail
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        start_idx = max(0, frame_idx - tail_length)
        
        if not df.empty:
            recent_points = df.loc[start_idx:frame_idx].dropna().to_dict('records')
            num_points = len(recent_points)

            overlay = frame.copy()

            if num_points > 1:
                for i in range(num_points - 1):
                    pt1 = recent_points[i]
                    pt2 = recent_points[i + 1]

                    x1, y1 = int(pt1['x']), int(pt1['y'])
                    x2, y2 = int(pt2['x']), int(pt2['y'])

                    base_radius = pt1['r']
                    thickness = int(base_radius * 1.1)

                    if thickness > 0:
                        color = (0, 10, 255)  # Orange BGR
                        cv2.line(overlay, (x1, y1), (x2, y2), color, thickness, lineType=cv2.LINE_AA)
                        cv2.circle(overlay, (x2, y2), int(thickness / 2), color, -1, lineType=cv2.LINE_AA)

            alpha = 0.8
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

        out.write(frame)
        frame_idx += 1

    cap.release()
    out.release()
