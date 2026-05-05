-- Supplemental RLS policies required for the payment flow
-- Run this in the Supabase SQL Editor if not already applied

-- payments: authenticated users can insert their own payment records
CREATE POLICY IF NOT EXISTS "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- payments: authenticated users can update their own payment status
CREATE POLICY IF NOT EXISTS "payments_update_own" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

-- subscriptions: service providers can insert their own subscriptions
CREATE POLICY IF NOT EXISTS "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_providers sp
      WHERE sp.id = provider_id AND sp.profile_id = auth.uid()
    )
  );

-- subscriptions: service providers can update their own subscriptions
CREATE POLICY IF NOT EXISTS "subscriptions_update_own" ON subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM service_providers sp
      WHERE sp.id = provider_id AND sp.profile_id = auth.uid()
    )
  );
