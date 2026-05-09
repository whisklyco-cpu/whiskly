-- Migration 002: Add is_listed column to bakers table
-- Allows individual bakers to be hidden from Browse Bakers and homepage
-- without deleting their record.

ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;

-- Hide Daisy Belle Bakery from public listings.
-- Find their row first: SELECT id, business_name FROM bakers WHERE business_name ILIKE '%daisy belle%';
-- Then run:
UPDATE bakers
SET is_listed = false
WHERE business_name ILIKE '%daisy belle%';
