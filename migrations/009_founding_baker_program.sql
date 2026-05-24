-- Migration 009: Founding Baker Program
-- Adds all fields for the Founding Baker tier, photo authentication,
-- commission activation lifecycle, and subscription billing infrastructure.
-- Run on Supabase SQL Editor. Safe to re-run (IF NOT EXISTS / DO blocks guard all ops).

-- ============================================================
-- 1. tier: Add CHECK constraint (column already exists as plain text)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bakers' AND constraint_name = 'bakers_tier_check'
  ) THEN
    ALTER TABLE bakers
      ADD CONSTRAINT bakers_tier_check
        CHECK (tier IN ('free', 'pro', 'elite', 'founding') OR tier IS NULL);
  END IF;
END $$;

-- ============================================================
-- 2. Founding Baker program fields
-- ============================================================
ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS founding_baker_number          integer UNIQUE,
  ADD COLUMN IF NOT EXISTS founding_approval_date         timestamptz,
  ADD COLUMN IF NOT EXISTS founding_first_order_deadline  timestamptz;

-- CHECK: founding_baker_number must be 1–50 when set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bakers' AND constraint_name = 'bakers_founding_number_range'
  ) THEN
    ALTER TABLE bakers
      ADD CONSTRAINT bakers_founding_number_range
        CHECK (founding_baker_number BETWEEN 1 AND 50);
  END IF;
END $$;

-- ============================================================
-- 3. Commission activation lifecycle fields
-- ============================================================
ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS activation_date                    date,
  ADD COLUMN IF NOT EXISTS commission_activation_date         date,
  ADD COLUMN IF NOT EXISTS commission_activation_trigger      text,
  ADD COLUMN IF NOT EXISTS founding_baker_free_tier_expires_at date,
  ADD COLUMN IF NOT EXISTS disclosure_acknowledged_at         timestamptz,
  ADD COLUMN IF NOT EXISTS disclosure_version_acknowledged    text,
  ADD COLUMN IF NOT EXISTS threshold_30_notice_sent_at        timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bakers' AND constraint_name = 'bakers_commission_trigger_check'
  ) THEN
    ALTER TABLE bakers
      ADD CONSTRAINT bakers_commission_trigger_check
        CHECK (
          commission_activation_trigger IN ('40_percent', '18_month_backstop', 'early_activation')
          OR commission_activation_trigger IS NULL
        );
  END IF;
END $$;

-- ============================================================
-- 4. Photo authentication fields
-- ============================================================
ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS photo_auth_required          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_auth_completed_at      timestamptz,
  ADD COLUMN IF NOT EXISTS photo_auth_affidavit_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS photo_auth_admin_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS photo_auth_admin_verified_by text,
  ADD COLUMN IF NOT EXISTS verification_video_url       text;

-- ============================================================
-- 5. Subscription billing fields
-- ============================================================
ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS stripe_customer_id              text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id          text,
  ADD COLUMN IF NOT EXISTS subscription_status             text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;

-- ============================================================
-- 6. BACKFILL: All existing bakers require photo authentication
-- (New bakers start at false and are flagged through the admin flow)
-- ============================================================
UPDATE bakers
SET photo_auth_required = true;

-- ============================================================
-- 7. BACKFILL: For founding bakers, seed activation and founding dates
-- from created_at. Do not assign founding_baker_number here —
-- that is assigned when the baker fulfills their first order.
-- ============================================================
UPDATE bakers
SET
  activation_date              = created_at::date,
  founding_approval_date       = created_at,
  founding_first_order_deadline = created_at + INTERVAL '45 days'
WHERE
  is_founding_baker = true
  AND activation_date IS NULL;
