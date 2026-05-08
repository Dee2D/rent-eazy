ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS district  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS area_name TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_providers_district ON service_providers(district);
