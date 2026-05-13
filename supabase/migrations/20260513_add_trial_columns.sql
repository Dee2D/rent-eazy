-- Add 3-month free trial columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date   TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trial_active  BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing users: trial runs from their account creation date
UPDATE profiles
SET
  trial_start_date = created_at,
  trial_end_date   = created_at + INTERVAL '3 months',
  is_trial_active  = (created_at + INTERVAL '3 months') > now()
WHERE trial_start_date IS NULL;
