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

def _color_confidence(roi: np.ndarray) -> float:
    """
    Compute a soft color-confidence score for how "red" the ROI looks.
    Returns a value from 0.0 to 1.0.  This is used as a BONUS to rank
    candidates — it should NEVER be used as a hard gate since mobile
    videos have heavy motion blur, compression, and white-balance shifts
    that destroy color accuracy on small objects.
    """
    if roi.size == 0 or roi.shape[0] < 2 or roi.shape[1] < 2:
        return 0.0

    total_pixels = roi.shape[0] * roi.shape[1]

    # --- HSV: very broad red ranges ---
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    # Low-hue reds (H 0-20, generous S & V to handle blur/shadow)
    m1 = cv2.inRange(hsv, np.array([0,   30, 30]), np.array([20,  255, 255]))
    # Wrap-around reds (H 160-180)
    m2 = cv2.inRange(hsv, np.array([160, 30, 30]), np.array([180, 255, 255]))
    hsv_mask = cv2.bitwise_or(m1, m2)

    # Only apply morphological cleanup on ROIs large enough that it won't
    # erase the entire mask (ball can be as small as 5-6 px in mobile video)
    if min(roi.shape[0], roi.shape[1]) >= 8:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        hsv_mask = cv2.morphologyEx(hsv_mask, cv2.MORPH_CLOSE, kernel)

    hsv_ratio = cv2.countNonZero(hsv_mask) / total_pixels

    # --- Simple BGR channel check (no color-space conversion needed) ---
    # For a red ball: R channel should dominate over G and B on average
    b_mean = np.mean(roi[:, :, 0])
    g_mean = np.mean(roi[:, :, 1])
    r_mean = np.mean(roi[:, :, 2])

    # Red dominance bonus: how much R exceeds G and B
    r_dominance = 0.0
    if r_mean > g_mean and r_mean > b_mean and r_mean > 30:
        r_dominance = min(1.0, (r_mean - max(g_mean, b_mean)) / 80.0)

    # Combine: HSV mask ratio + raw channel dominance
    confidence = (hsv_ratio * 0.6) + (r_dominance * 0.4)
    return min(1.0, confidence)


def extract_ball_coordinates(input_video: str, model: YOLO) -> Tuple[List[Dict], int, int, int, int]:
    """
    Pass 1: Analyze video and extract ball coordinates.
    
    Strategy: TRUST the YOLO model (it's trained specifically for cricket balls).
    Color analysis is only used as a soft ranking bonus when multiple detections
    exist in the same frame — it is NOT a hard gate.
    
    Handles mobile video issues: motion blur, compression artifacts,
    auto white-balance, small ball sizes.
    
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

        # Run YOLO — use the same conf threshold the model was validated with
        results = model.predict(frame, conf=0.20, verbose=False)

        best_candidate = None
        best_score = -1.0

        if len(results[0].boxes) > 0:
            for box in results[0].boxes:
                if int(box.cls[0]) == 0:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    yolo_conf = float(box.conf[0])
                    box_w = x2 - x1
                    box_h = y2 - y1

                    # Skip impossibly tiny detections (< 2px)
                    if box_w < 2 or box_h < 2:
                        continue

                    center_x = (x1 + x2) / 2
                    center_y = (y1 + y2) / 2

                    # --- Soft color bonus (never blocks a detection) ---
                    roi = frame[max(0, int(y1)):min(height, int(y2)),
                                max(0, int(x1)):min(width, int(x2))]
                    color_bonus = _color_confidence(roi)

                    # Combined score: YOLO confidence is primary, color is a bonus
                    score = yolo_conf + (color_bonus * 0.3)

                    if score > best_score:
                        best_score = score
                        best_candidate = {
                            'frame': frame_idx,
                            'x': center_x,
                            'y': center_y,
                            'r': max((box_w + box_h) / 4, 2.0),  # Minimum 2px radius
                        }

        if best_candidate:
            raw_data.append(best_candidate)

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
