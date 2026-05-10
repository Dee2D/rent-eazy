-- Migration: SEO-friendly slug column for public provider profile URLs
-- Includes: column, unique index, slugify() helper, auto-slug trigger, backfill

ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_providers_slug ON service_providers(slug);

-- URL-safe slug generator: lower-case, letters/digits/hyphens only
CREATE OR REPLACE FUNCTION slugify(v TEXT) RETURNS TEXT
  LANGUAGE sql IMMUTABLE STRICT AS
$$
  SELECT lower(
    regexp_replace(
      regexp_replace(btrim(v), '[^a-zA-Z0-9 -]', '', 'g'),
      '[ -]+', '-', 'g'
    )
  )
$$;

-- Trigger function: generates slug from name + category + area on INSERT
CREATE OR REPLACE FUNCTION generate_provider_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_name     TEXT;
  v_category TEXT;
  v_base     TEXT;
  v_final    TEXT;
  v_counter  INT := 0;
BEGIN
  SELECT p.full_name, sc.name
    INTO v_name, v_category
    FROM profiles p, service_categories sc
   WHERE p.id  = NEW.profile_id
     AND sc.id = NEW.category_id;

  v_base  := slugify(
    COALESCE(v_name,     'provider') || ' ' ||
    COALESCE(v_category, 'service')  || ' ' ||
    COALESCE(NEW.area_name, 'uganda')
  );
  v_final := v_base;

  WHILE EXISTS (
    SELECT 1 FROM service_providers
    WHERE slug = v_final AND id IS DISTINCT FROM NEW.id
  ) LOOP
    v_counter := v_counter + 1;
    v_final   := v_base || '-' || v_counter;
  END LOOP;

  NEW.slug := v_final;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provider_slug ON service_providers;
CREATE TRIGGER trg_provider_slug
  BEFORE INSERT ON service_providers
  FOR EACH ROW
  WHEN (NEW.slug IS NULL)
  EXECUTE FUNCTION generate_provider_slug();

-- Backfill: generate slugs for existing rows
WITH numbered AS (
  SELECT
    sp.id,
    slugify(
      COALESCE(p.full_name,  'provider') || ' ' ||
      COALESCE(sc.name,      'service')  || ' ' ||
      COALESCE(sp.area_name, 'uganda')
    ) AS base_slug,
    row_number() OVER (
      PARTITION BY slugify(
        COALESCE(p.full_name,  'provider') || ' ' ||
        COALESCE(sc.name,      'service')  || ' ' ||
        COALESCE(sp.area_name, 'uganda')
      )
      ORDER BY sp.id
    ) AS rn
  FROM service_providers sp
  JOIN profiles          p  ON p.id  = sp.profile_id
  JOIN service_categories sc ON sc.id = sp.category_id
  WHERE sp.slug IS NULL
)
UPDATE service_providers sp
SET slug = CASE
  WHEN n.rn = 1 THEN n.base_slug
  ELSE n.base_slug || '-' || n.rn
END
FROM numbered n
WHERE sp.id = n.id;
