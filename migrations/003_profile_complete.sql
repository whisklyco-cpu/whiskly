-- Migration 003: Add profile_complete and has_seen_plan_modal to bakers table
-- Run this manually in Supabase SQL editor.

ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_seen_plan_modal boolean DEFAULT false;

-- Index for the browse bakers query which filters on profile_complete
CREATE INDEX IF NOT EXISTS idx_bakers_profile_complete ON bakers (is_active, profile_complete, is_listed);
