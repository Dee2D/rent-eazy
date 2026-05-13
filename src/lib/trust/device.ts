/** Device/account trust scoring for Uganda rental marketplace. */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface TrustScore {
  score:   number;   // 0–100
  factors: Record<string, number>;
}

/**
 * Computes a trust score for a user account.
 * Higher = more trustworthy.
 */
export async function computeTrustScore(userId: string): Promise<TrustScore> {
  const supabase = await createServiceRoleClient();
  const factors: Record<string, number> = {};
  let score = 0;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at, phone_verified')
    .eq('id', userId)
    .single();

  if (!profile) return { score: 0, factors: { profile_missing: -100 } };

  // Phone verified (+25)
  if (profile.phone_verified) {
    factors.phone_verified = 25;
    score += 25;
  }

  // Account age: 7+ days (+15)
  const ageDays = (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
  if (ageDays >= 7) {
    factors.account_age = 15;
    score += 15;
  } else if (ageDays >= 1) {
    factors.account_age = 5;
    score += 5;
  }

  // No failed login attempts in last 24h (+20)
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { count: failedCount } = await supabase
    .from('login_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', false)
    .gte('created_at', dayAgo);

  if ((failedCount ?? 0) === 0) {
    factors.no_recent_failures = 20;
    score += 20;
  } else if ((failedCount ?? 0) < 3) {
    factors.few_failures = 5;
    score += 5;
  }

  // Has at least one completed payment (+15)
  const { count: paymentCount } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  if ((paymentCount ?? 0) > 0) {
    factors.completed_payment = 15;
    score += 15;
  }

  // Consistent IP — all recent logins from ≤ 3 unique IPs (+10)
  const { data: recentLogs } = await supabase
    .from('login_logs')
    .select('ip_address')
    .eq('user_id', userId)
    .eq('success', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentLogs && recentLogs.length > 0) {
    const uniqueIPs = new Set(recentLogs.map((l: { ip_address: string | null }) => l.ip_address)).size;
    if (uniqueIPs <= 3) {
      factors.consistent_ip = 10;
      score += 10;
    }
  }

  // No fraud flags (+15)
  const { count: fraudCount } = await supabase
    .from('fraud_flags')
    .select('id', { count: 'exact', head: true })
    .eq('entity_id', userId);

  if ((fraudCount ?? 0) === 0) {
    factors.no_fraud_flags = 15;
    score += 15;
  }

  const finalScore = Math.min(score, 100);

  // Persist updated trust score
  await supabase
    .from('profiles')
    .update({ trust_score: finalScore, trust_score_updated_at: new Date().toISOString() })
    .eq('id', userId);

  return { score: finalScore, factors };
}
