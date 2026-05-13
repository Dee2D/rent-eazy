-- Saved properties (tenant favourites)
CREATE TABLE IF NOT EXISTS saved_properties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Users can only read and manage their own saved properties
CREATE POLICY "Users read own saved" ON saved_properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved" ON saved_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved" ON saved_properties
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_properties (user_id, created_at DESC);
