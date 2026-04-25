"""Database models matching Supabase schema"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserDB(BaseModel):
    """User database model"""
    id: UUID
    name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """User creation request"""
    name: str
    email: EmailStr
    hashed_password: str


class UserUpdate(BaseModel):
    """User update request"""
    name: Optional[str] = None
    updated_at: datetime = None


class AnalysisDB(BaseModel):
    """Analysis result database model"""
    id: UUID
    user_id: UUID
    speed: str
    trajectory: list
    predicted_trajectory: Optional[list] = None
    detections: list
    processing_time: float
    bounce_frame: Optional[int] = None
    spin_angle: Optional[float] = None
    spin_direction: Optional[str] = None
    total_frames: Optional[int] = None
    frames_detected: Optional[int] = None
    fps: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisCreate(BaseModel):
    """Analysis creation request"""
    user_id: UUID
    speed: str
    trajectory: list
    predicted_trajectory: Optional[list] = None
    detections: list
    processing_time: float
    bounce_frame: Optional[int] = None
    spin_angle: Optional[float] = None
    spin_direction: Optional[str] = None
    total_frames: Optional[int] = None
    frames_detected: Optional[int] = None
    fps: Optional[int] = None
