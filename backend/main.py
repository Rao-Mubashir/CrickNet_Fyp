"""
Cricket Vision – FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import API_TITLE, API_VERSION
from app.auth.routes import router as auth_router
from app.analysis.routes import router as analysis_router

# Initialize FastAPI app
app = FastAPI(title=API_TITLE, version=API_VERSION)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(analysis_router)

# Mount static directory for video files
from app.config import UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")


@app.get("/")
def root() -> dict:
    """Root endpoint"""
    return {"message": "Welcome to Cricket Vision API!", "version": API_VERSION}


@app.get("/health")
def health() -> dict:
    """Health check endpoint"""
    return {"status": "ok"}