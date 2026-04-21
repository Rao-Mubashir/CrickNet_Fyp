"""Analysis utility functions"""

import math
from typing import Optional, Tuple
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
    """
    Calculate ball speed from position change.

    Args:
        prev_pos: (x, y) tuple of previous position
        curr_pos: (x, y) tuple of current position
        fps: frames per second of video
        pixel_to_kmh: conversion factor from pixels to km/h

    Returns:
        speed in km/h
    """
    if not prev_pos or not curr_pos:
        return 0.0

    dx = curr_pos[0] - prev_pos[0]
    dy = curr_pos[1] - prev_pos[1]
    pixel_distance = math.sqrt(dx**2 + dy**2)

    # Assuming 30 fps: distance per frame * fps * conversion factor
    speed_kmh = pixel_distance * fps * pixel_to_kmh
    return speed_kmh
