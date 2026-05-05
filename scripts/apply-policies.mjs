/**
 * Applies supplemental RLS policies to the live Supabase database.
 * Run: node scripts/apply-policies.mjs
 * Requires: SUPABASE_DB_PASSWORD env var (find in Supabase Dashboard → Settings → Database)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bccpnxkyaijozgpbjjrp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var (find in Supabase Dashboard → Settings → API → service_role key)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const policies = [
  `CREATE POLICY IF NOT EXISTS "payments_insert_own" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id)`,
  `CREATE POLICY IF NOT EXISTS "payments_update_own" ON payments FOR UPDATE USING (auth.uid() = user_id)`,
  `CREATE POLICY IF NOT EXISTS "subscriptions_insert_own" ON subscriptions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.profile_id = auth.uid())
  )`,
  `CREATE POLICY IF NOT EXISTS "subscriptions_update_own" ON subscriptions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.profile_id = auth.uid())
  )`,
];

for (const sql of policies) {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();
  if (error) {
    console.log(`Note: ${error.message} — run manually in SQL Editor if needed`);
  } else {
    console.log('✓ Policy applied');
  }
}

console.log('\nDone. Also run supabase/add-policies.sql in the Supabase SQL Editor to confirm.');
