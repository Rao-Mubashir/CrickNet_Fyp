"""Supabase database client"""

from typing import Optional
from uuid import UUID
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY
from app.database.models import UserDB, UserCreate, AnalysisDB, AnalysisCreate


class DatabaseClient:
    """Supabase database client wrapper"""

    def __init__(self):
        """Initialize Supabase client"""
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError(
                "Supabase credentials not configured in .env. "
                "Please set SUPABASE_URL and SUPABASE_ANON_KEY"
            )

        self.client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    # ─────────────────────────────────────────────
    # USER OPERATIONS
    # ─────────────────────────────────────────────

    async def create_user(self, user_data: UserCreate) -> UserDB:
        """Create a new user in database"""
        try:
            response = self.client.table("users").insert({
                "name": user_data.name,
                "email": user_data.email,
                "hashed_password": user_data.hashed_password,
            }).execute()

            if response.data and len(response.data) > 0:
                user = response.data[0]
                return UserDB(**user)
            else:
                raise Exception("Failed to create user")

        except Exception as e:
            raise Exception(f"Database error creating user: {str(e)}")

    async def get_user_by_email(self, email: str) -> Optional[UserDB]:
        """Get user by email"""
        try:
            response = self.client.table("users").select("*").eq(
                "email", email
            ).execute()

            if response.data and len(response.data) > 0:
                user = response.data[0]
                return UserDB(**user)
            else:
                return None

        except Exception as e:
            raise Exception(f"Database error fetching user: {str(e)}")

    async def get_user_by_id(self, user_id: UUID) -> Optional[UserDB]:
        """Get user by ID"""
        try:
            response = self.client.table("users").select("*").eq(
                "id", str(user_id)
            ).execute()

            if response.data and len(response.data) > 0:
                user = response.data[0]
                return UserDB(**user)
            else:
                return None

        except Exception as e:
            raise Exception(f"Database error fetching user: {str(e)}")

    async def update_user(
        self, user_id: UUID, user_data: dict
    ) -> Optional[UserDB]:
        """Update user information"""
        try:
            response = self.client.table("users").update(
                user_data
            ).eq("id", str(user_id)).execute()

            if response.data and len(response.data) > 0:
                user = response.data[0]
                return UserDB(**user)
            else:
                return None

        except Exception as e:
            raise Exception(f"Database error updating user: {str(e)}")

    async def delete_user(self, user_id: UUID) -> bool:
        """Delete a user"""
        try:
            response = self.client.table("users").delete().eq(
                "id", str(user_id)
            ).execute()

            return len(response.data) > 0

        except Exception as e:
            raise Exception(f"Database error deleting user: {str(e)}")

    # ─────────────────────────────────────────────
    # ANALYSIS OPERATIONS
    # ─────────────────────────────────────────────

    async def save_analysis_result(
        self, analysis_data: AnalysisCreate
    ) -> AnalysisDB:
        """Save analysis result to database"""
        try:
            insert_data = {
                "user_id": str(analysis_data.user_id),
                "speed": analysis_data.speed,
                "trajectory": analysis_data.trajectory,
                "predicted_trajectory": analysis_data.predicted_trajectory,
                "detections": analysis_data.detections,
                "processing_time": analysis_data.processing_time,
                "bounce_frame": analysis_data.bounce_frame,
                "spin_angle": analysis_data.spin_angle,
                "spin_direction": analysis_data.spin_direction,
                "total_frames": analysis_data.total_frames,
                "frames_detected": analysis_data.frames_detected,
                "fps": analysis_data.fps,
            }
            # Remove None values so Supabase uses column defaults
            insert_data = {k: v for k, v in insert_data.items() if v is not None}
            response = self.client.table("analyses").insert(insert_data).execute()

            if response.data and len(response.data) > 0:
                analysis = response.data[0]
                return AnalysisDB(**analysis)
            else:
                raise Exception("Failed to save analysis")

        except Exception as e:
            raise Exception(f"Database error saving analysis: {str(e)}")

    async def get_user_analyses(self, user_id: UUID) -> list[AnalysisDB]:
        """Get all analyses for a user"""
        try:
            response = self.client.table("analyses").select("*").eq(
                "user_id", str(user_id)
            ).order("created_at", desc=True).execute()

            if response.data:
                return [AnalysisDB(**analysis) for analysis in response.data]
            else:
                return []

        except Exception as e:
            raise Exception(f"Database error fetching analyses: {str(e)}")

    async def get_analysis_by_id(self, analysis_id: UUID) -> Optional[AnalysisDB]:
        """Get analysis by ID"""
        try:
            response = self.client.table("analyses").select("*").eq(
                "id", str(analysis_id)
            ).execute()

            if response.data and len(response.data) > 0:
                analysis = response.data[0]
                return AnalysisDB(**analysis)
            else:
                return None

        except Exception as e:
            raise Exception(f"Database error fetching analysis: {str(e)}")

    async def delete_analysis(self, analysis_id: UUID) -> bool:
        """Delete an analysis"""
        try:
            response = self.client.table("analyses").delete().eq(
                "id", str(analysis_id)
            ).execute()

            return len(response.data) > 0

        except Exception as e:
            raise Exception(f"Database error deleting analysis: {str(e)}")


# Global database client instance
db_client: Optional[DatabaseClient] = None


def get_db_client() -> DatabaseClient:
    """Get or initialize database client"""
    global db_client
    if db_client is None:
        db_client = DatabaseClient()
    return db_client
