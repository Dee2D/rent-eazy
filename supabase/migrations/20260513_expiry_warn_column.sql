ALTER TABLE properties ADD COLUMN IF NOT EXISTS expiry_warning_sent BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_props_expiry_warn ON properties (is_active, expires_at) WHERE expiry_warning_sent = false;
