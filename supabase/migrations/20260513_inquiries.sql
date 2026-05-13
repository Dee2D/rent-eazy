CREATE TABLE IF NOT EXISTS inquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message       TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 1000),
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Tenants can create inquiries and read their own
CREATE POLICY "Tenants insert own inquiries" ON inquiries
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants read own inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = tenant_id);

-- Landlords can read inquiries for their own properties
CREATE POLICY "Landlords read received inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = landlord_id);

-- Landlords can mark inquiries as read
CREATE POLICY "Landlords update read status" ON inquiries
  FOR UPDATE USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

CREATE INDEX IF NOT EXISTS idx_inquiries_landlord ON inquiries (landlord_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_tenant ON inquiries (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries (property_id, created_at DESC);
