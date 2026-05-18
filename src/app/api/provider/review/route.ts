import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitProviderReview } from '@/lib/supabase/providers';
import { sanitizeText, isValidUUID } from '@/lib/security';

// POST /api/provider/review — submit a review for a provider
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { providerId?: unknown; rating?: unknown; comment?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { providerId, rating, comment } = body;

  if (!providerId || typeof providerId !== 'string' || !isValidUUID(providerId)) {
    return NextResponse.json({ error: 'Invalid providerId' }, { status: 400 });
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 422 });
  }

  const commentStr = typeof comment === 'string'
    ? sanitizeText(comment, 500)
    : '';

  const result = await submitProviderReview(providerId, user.id, ratingNum, commentStr);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}
