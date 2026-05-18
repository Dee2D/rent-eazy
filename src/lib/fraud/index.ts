/** Fraud detection orchestrator — combines all heuristic signals. */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { analyseSpamText, isPriceAnomaly } from './spam';

export type FraudAction = 'allow' | 'review' | 'reject';

export interface FraudSignal {
  score: number;   // 0–100
  flags: string[];
  action: FraudAction;
}

interface ListingInput {
  title:       string;
  description: string;
  priceUGX:    number;
  landlordId:  string;
  district?:   string;
}

/** Days since a date string. */
function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
}

export async function assessListing(input: ListingInput): Promise<FraudSignal> {
  const flags: string[] = [];
  let score = 0;

  // 1. Spam text analysis on title + description
  const titleResult = analyseSpamText(input.title);
  const descResult  = analyseSpamText(input.description);

  if (titleResult.isSpam || descResult.isSpam) {
    flags.push('spam_content');
    score += Math.max(titleResult.score, descResult.score) * 0.5;
  } else {
    // Partial score even below spam threshold
    score += Math.max(titleResult.score, descResult.score) * 0.25;
  }
  flags.push(...new Set([...titleResult.flags, ...descResult.flags]));

  // 2. Price anomaly
  const priceCheck = isPriceAnomaly(input.priceUGX);
  if (priceCheck.anomalous && priceCheck.reason) {
    flags.push(priceCheck.reason);
    score += 25;
  }

  // 3. Account-age signal (new accounts = higher risk)
  try {
    const supabase = await createServiceRoleClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, trust_score, phone_verified')
      .eq('id', input.landlordId)
      .single();

    if (profile) {
      const ageDays = daysSince(profile.created_at);
      if (ageDays < 1) {
        flags.push('new_account');
        score += 20;
      } else if (ageDays < 7) {
        flags.push('young_account');
        score += 10;
      }

      if (!profile.phone_verified) {
        flags.push('unverified_phone');
        score += 10;
      }

      // Trust score inversion — low trust → higher fraud score
      const trustScore: number = profile.trust_score ?? 50;
      if (trustScore < 30) {
        flags.push('low_trust_score');
        score += 15;
      }
    }

    // 4. Duplicate detection — same landlord, same price in same district (last 24h)
    if (input.district) {
      const since = new Date(Date.now() - 86_400_000).toISOString();
      const { count } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('landlord_id', input.landlordId)
        .eq('district', input.district)
        .eq('price_ugx', input.priceUGX)
        .gte('created_at', since);

      if ((count ?? 0) >= 2) {
        flags.push('duplicate_listing');
        score += 20;
      }
    }

    // 5. Burst posting — more than 5 listings in the last hour
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count: recentCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('landlord_id', input.landlordId)
      .gte('created_at', hourAgo);

    if ((recentCount ?? 0) >= 5) {
      flags.push('burst_posting');
      score += 20;
    }
  } catch {
    // Non-fatal — DB signals unavailable, continue with text signals only
  }

  const finalScore = Math.min(Math.round(score), 100);
  const uniqueFlags = [...new Set(flags)];

  let action: FraudAction = 'allow';
  if (finalScore >= 70) action = 'reject';
  else if (finalScore >= 40) action = 'review';

  return { score: finalScore, flags: uniqueFlags, action };
}
