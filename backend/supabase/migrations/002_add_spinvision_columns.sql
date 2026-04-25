-- ============================================================================
-- Migration 002: Add SpinVision columns to analyses table
-- Adds predicted trajectory, bounce detection, spin analysis, and video metadata
-- ============================================================================

ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS predicted_trajectory JSONB,
  ADD COLUMN IF NOT EXISTS bounce_frame INTEGER,
  ADD COLUMN IF NOT EXISTS spin_angle DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS spin_direction TEXT,
  ADD COLUMN IF NOT EXISTS total_frames INTEGER,
  ADD COLUMN IF NOT EXISTS frames_detected INTEGER,
  ADD COLUMN IF NOT EXISTS fps INTEGER;
