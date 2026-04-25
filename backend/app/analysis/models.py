"""Pydantic models for analysis"""

from typing import List, Optional
from pydantic import BaseModel


class Detection(BaseModel):
    """Detection result for a single frame"""
    frame: int
    x: float
    y: float
    confidence: float


class AnalysisResult(BaseModel):
    """Complete analysis result from video processing"""
    speed: str
    trajectory: List[List[float]]
    predicted_trajectory: List[List[float]]
    detections: List[Detection]
    processing_time: float
    bounce_frame: Optional[int] = None
    spin_angle: Optional[float] = None
    spin_direction: Optional[str] = None
    total_frames: int = 0
    frames_detected: int = 0
    fps: int = 30
    video_width: int = 0
    video_height: int = 0
    video_url: Optional[str] = None
