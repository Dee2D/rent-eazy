-- Admin migration: add is_taken flag to properties
-- Run in Supabase SQL Editor

ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_taken BOOLEAN NOT NULL DEFAULT false;

-- Allow service role (used in API routes) to read all profiles
-- The service role key already bypasses RLS, but these policies
-- allow the admin panel to read data it needs via the anon key if ever needed.

-- No additional RLS changes needed — admin routes use service_role key which bypasses RLS.
