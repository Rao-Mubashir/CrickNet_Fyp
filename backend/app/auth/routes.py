"""Authentication routes"""

import uuid
from fastapi import APIRouter, HTTPException
from app.auth.models import RegisterRequest, LoginRequest, LoginResponse
from app.auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    fake_users_db,
)
from app.database.client import get_db_client
from app.database.models import UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])
db = get_db_client()


@router.post("/register")
async def register(req: RegisterRequest) -> dict:
    """Register a new user"""

    # Check if user already exists in Supabase
    try:
        existing_user = await db.get_user_by_email(req.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        if "Email already registered" not in str(e):
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Create user in Supabase
    try:
        user_data = UserCreate(
            name=req.name,
            email=req.email,
            hashed_password=hash_password(req.password),
        )
        user = await db.create_user(user_data)
        return {"message": "Account created successfully", "user_id": str(user.id)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create account: {str(e)}")


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest) -> dict:
    """Login a user and return JWT token"""

    # Get user from Supabase
    try:
        user = await db.get_user_by_email(req.email)

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect password")

        token = create_access_token({"sub": user.email})

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": str(user.id),
            "name": user.name,
            "email": user.email,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")
