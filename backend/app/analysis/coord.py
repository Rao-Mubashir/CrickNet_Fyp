import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
import sys
import os

if len(sys.argv) < 3:
    print("Usage: python coord.py <video_path> <coordinates_txt_path>")
    sys.exit(1)

VIDEO_PATH = sys.argv[1]
COORDS_PATH = sys.argv[2]
# Using the model from Detection Model Folder relative to backend directory
MODEL_PATH = os.path.join("Detection Model", "best.pt")
TARGET_CLASS_ID = None
DETECTION_CONF = 0.10

# Load the model
model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(VIDEO_PATH)

# Open a file to write coordinates
coord_file = open(COORDS_PATH, "w")

frame_num = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_num += 1
    black_frame = np.zeros_like(frame)

    results = model(frame, conf=DETECTION_CONF, verbose=False)[0]

    if results.boxes is not None and len(results.boxes) > 0:
        class_ids = results.boxes.cls.cpu().numpy()
        confidences = results.boxes.conf.cpu().numpy()
        boxes = results.boxes.xyxy.cpu().numpy()

        if TARGET_CLASS_ID is None:
            selected_indices = list(range(len(class_ids)))
        else:
            selected_indices = [i for i, cls_id in enumerate(class_ids) if int(cls_id) == TARGET_CLASS_ID]

        if selected_indices:
            best_idx = max(selected_indices, key=lambda i: confidences[i])
            x1, y1, x2, y2 = map(int, boxes[best_idx])
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            # Write to coordinates file
            coord_file.write(f"{frame_num},{cx},{cy}\n")
            print(f"Frame {frame_num}: Ball at ({cx},{cy})")

        else:
            detected_classes = ", ".join(str(int(cls_id)) for cls_id in class_ids)
            print(f"Frame {frame_num}: No target class detected (found classes: {detected_classes})")
    else:
        print(f"Frame {frame_num}: No object detected")

# Clean up
coord_file.close()
cap.release()
cv2.destroyAllWindows()
