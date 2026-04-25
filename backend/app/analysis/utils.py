import os
import subprocess
import cv2

def parse_coords(filename):
    coords = []
    if not os.path.exists(filename):
        return coords
    with open(filename, "r") as f:
        for line in f:
            parts = line.strip().split(",")
            if len(parts) == 3:
                frame, x, y = int(parts[0]), float(parts[1]), float(parts[2])
                coords.append((frame, x, y))
    return coords

def run_full_analysis(video_path: str, coords_file: str, no_spin_file: str) -> dict:
    import sys
    
    # 1. Run coord.py
    print(f"Running coord.py on {video_path}...")
    subprocess.run([sys.executable, "app/analysis/coord.py", video_path, coords_file], check=True)

    # 2. Run predict.py
    print("Running predict.py...")
    subprocess.run([sys.executable, "app/analysis/predict.py", coords_file, no_spin_file], check=True)

    # 3. Run estimate_speed.py and capture output
    print("Running estimate_speed.py...")
    result = subprocess.run([sys.executable, "app/analysis/estimate_speed.py", coords_file], capture_output=True, text=True)
    
    speed_kmh = "N/A"
    bounce_frame = None
    for line in result.stdout.split('\n'):
        if "Average speed:" in line and "km/h" in line:
            speed_kmh = line.split("Average speed:")[1].strip()
        if "Bounce frame:" in line:
            bounce_frame = int(line.split("Bounce frame:")[1].strip())
            
    raw_coords = parse_coords(coords_file)
    predicted_coords = parse_coords(no_spin_file)
    
    detections = []
    for frame, x, y in raw_coords:
        detections.append({'frame': frame, 'x': x, 'y': y, 'confidence': 1.0})
        
    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS) or 30)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    
    # Calculate spin direction manually since we need it for frontend
    spin_direction = "No Spin"
    spin_angle = None
    if os.path.exists(coords_file) and os.path.exists(no_spin_file) and bounce_frame:
        # Just simple calculation for UI, overlay.py handles the real calculation for video
        import numpy as np
        original_dict = {f: (x, y) for f, x, y in raw_coords}
        predicted_dict = {f: (x, y) for f, x, y in predicted_coords}
        
        try:
            end_actual = original_dict[max(original_dict.keys())]
            end_pred = predicted_dict[max(predicted_dict.keys())]
            bounce_pos = original_dict[bounce_frame]
            
            v_actual = np.array([end_actual[0] - bounce_pos[0], end_actual[1] - bounce_pos[1]])
            v_pred = np.array([end_pred[0] - bounce_pos[0], end_pred[1] - bounce_pos[1]])
            
            norm_actual = np.linalg.norm(v_actual)
            norm_pred = np.linalg.norm(v_pred)
            
            if norm_actual > 0 and norm_pred > 0:
                cos_theta = np.dot(v_actual, v_pred) / (norm_actual * norm_pred)
                angle_rad = np.arccos(np.clip(cos_theta, -1.0, 1.0))
                spin_angle = round(np.degrees(angle_rad), 2)
                
                cross = v_pred[0] * v_actual[1] - v_pred[1] * v_actual[0]
                if abs(spin_angle) < 1.0:
                    spin_direction = "No Spin"
                elif cross > 0:
                    spin_direction = "Turns Right"
                else:
                    spin_direction = "Turns Left"
        except Exception:
            pass
            
    return {
        "trajectory": [[x, y] for _, x, y in raw_coords],
        "predicted_trajectory": [[x, y] for _, x, y in predicted_coords],
        "detections": detections,
        "speed": speed_kmh,
        "bounce_frame": bounce_frame,
        "spin_angle": spin_angle,
        "spin_direction": spin_direction,
        "total_frames": total_frames,
        "frames_detected": len(raw_coords),
        "fps": fps,
        "video_width": width,
        "video_height": height,
    }
