import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProviderProfile } from '@/lib/supabase/providers';
import { sanitizeText, isValidUgandaCoords, isValidUUID } from '@/lib/security';

// PATCH /api/provider/profile — update authenticated provider's profile fields
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { providerId, ...updates } = body;

  if (!providerId || typeof providerId !== 'string' || !isValidUUID(providerId)) {
    return NextResponse.json({ error: 'Invalid providerId' }, { status: 400 });
  }

  // Sanitize text fields
  const sanitized: Parameters<typeof updateProviderProfile>[2] = {};

  if (typeof updates.headline === 'string')
    sanitized.headline = sanitizeText(updates.headline, 120);
  if (typeof updates.provider_bio === 'string')
    sanitized.provider_bio = sanitizeText(updates.provider_bio, 1000);
  if (typeof updates.description === 'string')
    sanitized.description = sanitizeText(updates.description, 2000);
  if (typeof updates.district === 'string')
    sanitized.district = sanitizeText(updates.district, 100);
  if (typeof updates.area_name === 'string')
    sanitized.area_name = sanitizeText(updates.area_name, 100);
  if (typeof updates.seo_title === 'string')
    sanitized.seo_title = sanitizeText(updates.seo_title, 120);
  if (typeof updates.seo_description === 'string')
    sanitized.seo_description = sanitizeText(updates.seo_description, 200);
  if (typeof updates.profile_image === 'string')
    sanitized.profile_image = updates.profile_image;
  if (typeof updates.years_active === 'number' && updates.years_active >= 0)
    sanitized.years_active = Math.min(updates.years_active, 100);
  if (typeof updates.response_time_hours === 'number' && updates.response_time_hours >= 1)
    sanitized.response_time_hours = Math.min(updates.response_time_hours, 168);
  if (typeof updates.category_id === 'string' && isValidUUID(updates.category_id))
    sanitized.category_id = updates.category_id;

  if (['available', 'busy', 'offline'].includes(updates.availability_status as string))
    sanitized.availability_status = updates.availability_status as 'available' | 'busy' | 'offline';

  if (Array.isArray(updates.service_tags))
    sanitized.service_tags = (updates.service_tags as unknown[])
      .filter((t): t is string => typeof t === 'string')
      .map((t) => sanitizeText(t, 50))
      .slice(0, 15);

  if (Array.isArray(updates.service_locations))
    sanitized.service_locations = (updates.service_locations as unknown[])
      .filter((l): l is string => typeof l === 'string')
      .map((l) => sanitizeText(l, 100))
      .slice(0, 10);

  if (Array.isArray(updates.gallery_images))
    sanitized.gallery_images = (updates.gallery_images as unknown[])
      .filter((u): u is string => typeof u === 'string')
      .slice(0, 10);

  if (typeof updates.latitude === 'number' && typeof updates.longitude === 'number') {
    if (!isValidUgandaCoords(updates.latitude, updates.longitude)) {
      return NextResponse.json({ error: 'Coordinates must be within Uganda.' }, { status: 422 });
    }
    sanitized.latitude = updates.latitude;
    sanitized.longitude = updates.longitude;
  }

  try {
    const provider = await updateProviderProfile(providerId, user.id, sanitized);
    return NextResponse.json({ provider });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Update failed' }, { status: 500 });
  }
}
