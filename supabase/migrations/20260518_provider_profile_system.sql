-- ─── Provider Profile System — Migration ──────────────────────────────────────
-- Safe to run on existing database. Uses IF NOT EXISTS throughout.
-- Run in: Supabase Dashboard → SQL Editor

-- ── 1. Extend service_providers ───────────────────────────────────────────────

ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS headline           TEXT,
  ADD COLUMN IF NOT EXISTS provider_bio       TEXT,
  ADD COLUMN IF NOT EXISTS profile_image      TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images     TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_tags       TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_locations  TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_status TEXT       NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS years_active       INTEGER,
  ADD COLUMN IF NOT EXISTS response_time_hours INTEGER    DEFAULT 24,
  ADD COLUMN IF NOT EXISTS verification_status TEXT       NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS featured_provider  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_average     DECIMAL(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count       INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views      INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title          TEXT,
  ADD COLUMN IF NOT EXISTS seo_description    TEXT,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT NOW();

-- CHECK constraints (add only if not already present)
DO $$ BEGIN
  ALTER TABLE service_providers
    ADD CONSTRAINT chk_availability_status
      CHECK (availability_status IN ('available', 'busy', 'offline'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE service_providers
    ADD CONSTRAINT chk_verification_status
      CHECK (verification_status IN ('unverified', 'verified', 'featured'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- indexes
CREATE INDEX IF NOT EXISTS idx_providers_featured    ON service_providers (featured_provider, is_visible);
CREATE INDEX IF NOT EXISTS idx_providers_rating      ON service_providers (rating_average DESC, is_visible);
CREATE INDEX IF NOT EXISTS idx_providers_verification ON service_providers (verification_status, is_visible);

-- ── 2. provider_reviews table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_reviews (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID        REFERENCES service_providers (id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID        REFERENCES profiles (id)          ON DELETE CASCADE NOT NULL,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT        CHECK (char_length(comment) <= 500),
  is_hidden   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider_id, reviewer_id)   -- one review per user per provider
);

CREATE INDEX IF NOT EXISTS idx_reviews_provider ON provider_reviews (provider_id, is_hidden);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON provider_reviews (reviewer_id);

ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

-- everyone reads visible reviews
DO $$ BEGIN
  CREATE POLICY "reviews_select_visible" ON provider_reviews
    FOR SELECT USING (is_hidden = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- authenticated users submit their own reviews
DO $$ BEGIN
  CREATE POLICY "reviews_insert_own" ON provider_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- reviewers can delete their own
DO $$ BEGIN
  CREATE POLICY "reviews_delete_own" ON provider_reviews
    FOR DELETE USING (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. provider_analytics table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_analytics (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID        REFERENCES service_providers (id) ON DELETE CASCADE NOT NULL,
  event_type  TEXT        NOT NULL CHECK (event_type IN ('profile_view', 'whatsapp_click', 'call_click')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_provider_time
  ON provider_analytics (provider_id, created_at DESC);

ALTER TABLE provider_analytics ENABLE ROW LEVEL SECURITY;

-- providers read their own analytics
DO $$ BEGIN
  CREATE POLICY "analytics_select_own" ON provider_analytics
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM service_providers sp
        WHERE sp.id = provider_id AND sp.profile_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. Auto-update rating_average + review_count on review changes ─────────────

CREATE OR REPLACE FUNCTION sync_provider_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _pid UUID := COALESCE(NEW.provider_id, OLD.provider_id);
BEGIN
  UPDATE service_providers SET
    rating_average = COALESCE((
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM provider_reviews
      WHERE provider_id = _pid AND is_hidden = false
    ), 0),
    review_count = (
      SELECT COUNT(*) FROM provider_reviews
      WHERE provider_id = _pid AND is_hidden = false
    ),
    updated_at = NOW()
  WHERE id = _pid;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_provider_rating ON provider_reviews;
CREATE TRIGGER trg_sync_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON provider_reviews
  FOR EACH ROW EXECUTE FUNCTION sync_provider_rating();

-- ── 5. Auto-increment profile_views via function (called from API) ────────────

CREATE OR REPLACE FUNCTION increment_provider_views(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE service_providers
  SET profile_views = profile_views + 1, updated_at = NOW()
  WHERE id = p_id AND is_visible = true;
END $$;

-- Grant execute to anon/authenticated so the API route can call it
GRANT EXECUTE ON FUNCTION increment_provider_views(UUID) TO anon, authenticated;
