"""Pydantic models for authentication"""

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """User registration request"""
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """User login response"""
    access_token: str
    token_type: str
    user_id: str
    name: str
    email: str


class User(BaseModel):
    """User model"""
    id: str
    name: str
    email: str
    hashed_password: str
