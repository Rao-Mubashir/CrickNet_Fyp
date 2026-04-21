"""Pydantic models for analysis"""

from typing import List
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
    detections: List[Detection]
    processing_time: float
