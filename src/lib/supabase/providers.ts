import { createClient, createPublicClient, createServiceRoleClient } from './server';
import type { ServiceProvider, ServiceCategory, ProviderReview, ProviderAnalyticsSummary } from '@/types';
import { slugifyText } from '@/lib/utils';

// Full column list for public profile pages
const PROVIDER_SELECT = `
  *,
  profiles(full_name, phone_number, phone_verified),
  service_categories(name)
`;

export async function getVisibleProviders(
  filters?: { district?: string; area_name?: string; category?: string }
): Promise<ServiceProvider[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from('service_providers')
    .select(PROVIDER_SELECT)
    .eq('is_visible', true)
    .order('featured_provider', { ascending: false })
    .order('rating_average', { ascending: false });

  if (filters?.district)   query = query.eq('district', filters.district);
  if (filters?.area_name)  query = query.ilike('area_name', `%${filters.area_name}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ServiceProvider[]) ?? [];
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return (data as ServiceCategory[]) ?? [];
}

export async function createServiceProvider(
  providerData: {
    category_id: string;
    description: string | null;
    latitude: number;
    longitude: number;
    district: string;
    area_name: string;
  },
  profileId: string
): Promise<ServiceProvider> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .insert({ ...providerData, profile_id: profileId, is_visible: false })
    .select(PROVIDER_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as ServiceProvider;
}

export async function getProviderByProfileId(profileId: string): Promise<ServiceProvider | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('service_providers')
    .select(PROVIDER_SELECT)
    .eq('profile_id', profileId)
    .single();

  return data ? (data as ServiceProvider) : null;
}

export async function getProviderBySlug(slug: string): Promise<ServiceProvider | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('service_providers')
    .select(PROVIDER_SELECT)
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  return data ? (data as ServiceProvider) : null;
}

export async function updateProviderProfile(
  providerId: string,
  profileId: string,
  updates: Partial<{
    headline: string;
    provider_bio: string;
    profile_image: string;
    gallery_images: string[];
    service_tags: string[];
    service_locations: string[];
    availability_status: string;
    years_active: number;
    response_time_hours: number;
    seo_title: string;
    seo_description: string;
    description: string;
    district: string;
    area_name: string;
    latitude: number;
    longitude: number;
    category_id: string;
  }>
): Promise<ServiceProvider> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', providerId)
    .eq('profile_id', profileId) // ownership guard
    .select(PROVIDER_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as ServiceProvider;
}

export async function getProvidersByCategoryAndArea(
  categoryName: string,
  areaSlug: string,
  limit = 20
): Promise<ServiceProvider[]> {
  const supabase = createPublicClient();
  const areaSearch = areaSlug.replace(/-/g, ' ');

  const { data: catData } = await supabase
    .from('service_categories')
    .select('id')
    .ilike('name', categoryName)
    .single();

  if (!catData) return [];

  const { data } = await supabase
    .from('service_providers')
    .select(PROVIDER_SELECT)
    .eq('is_visible', true)
    .eq('category_id', catData.id)
    .ilike('area_name', `%${areaSearch}%`)
    .order('featured_provider', { ascending: false })
    .order('rating_average', { ascending: false })
    .limit(limit);

  return (data as ServiceProvider[]) ?? [];
}

export async function getRelatedProviders(
  excludeId: string,
  categoryId: string,
  district: string,
  limit = 3
): Promise<ServiceProvider[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('service_providers')
    .select(PROVIDER_SELECT)
    .eq('is_visible', true)
    .eq('category_id', categoryId)
    .eq('district', district)
    .neq('id', excludeId)
    .order('rating_average', { ascending: false })
    .limit(limit);

  return (data as ServiceProvider[]) ?? [];
}

export async function getProvidersNearProperty(
  district: string,
  areaName: string,
  limit = 4
): Promise<ServiceProvider[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('service_providers')
    .select(PROVIDER_SELECT)
    .eq('is_visible', true)
    .or(`district.eq.${district},area_name.ilike.%${areaName}%`)
    .order('rating_average', { ascending: false })
    .limit(limit);

  return (data as ServiceProvider[]) ?? [];
}

export async function getProviderReviews(providerId: string, limit = 10): Promise<ProviderReview[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('provider_reviews')
    .select('*, profiles(full_name)')
    .eq('provider_id', providerId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data as ProviderReview[]) ?? [];
}

export async function submitProviderReview(
  providerId: string,
  reviewerId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Self-review guard
  const { data: sp } = await supabase
    .from('service_providers')
    .select('profile_id')
    .eq('id', providerId)
    .single();
  if (sp?.profile_id === reviewerId) return { success: false, error: 'You cannot review your own profile.' };

  const { error } = await supabase.from('provider_reviews').insert({
    provider_id: providerId,
    reviewer_id: reviewerId,
    rating,
    comment: comment.trim() || null,
  });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'You have already reviewed this provider.' };
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function trackProviderAnalytics(
  providerId: string,
  eventType: 'profile_view' | 'whatsapp_click' | 'call_click'
): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    await Promise.all([
      supabase.from('provider_analytics').insert({ provider_id: providerId, event_type: eventType }),
      eventType === 'profile_view'
        ? supabase.rpc('increment_provider_views', { p_id: providerId })
        : Promise.resolve(),
    ]);
  } catch {
    // Non-fatal — analytics failures must never break the user experience
  }
}

export async function getProviderAnalytics(
  providerId: string,
  profileId: string
): Promise<ProviderAnalyticsSummary> {
  const supabase = await createClient();
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // Ownership check via RLS — query will return empty if not the owner
  const { data } = await supabase
    .from('provider_analytics')
    .select('event_type, created_at')
    .eq('provider_id', providerId);

  const rows = data ?? [];
  const recent = rows.filter((r) => r.created_at >= since30d);

  return {
    total_views:     rows.filter((r) => r.event_type === 'profile_view').length,
    whatsapp_clicks: rows.filter((r) => r.event_type === 'whatsapp_click').length,
    call_clicks:     rows.filter((r) => r.event_type === 'call_click').length,
    views_last_30d:  recent.filter((r) => r.event_type === 'profile_view').length,
    clicks_last_30d: recent.filter((r) => r.event_type !== 'profile_view').length,
  };
}

export async function getAllProvidersForSitemap(): Promise<{ slug: string; updated_at: string | null }[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('service_providers')
    .select('slug, updated_at')
    .eq('is_visible', true)
    .not('slug', 'is', null);

  return (data as { slug: string; updated_at: string | null }[])?.filter((r) => r.slug) ?? [];
}

export async function getDistinctCategoryAreaCombos(): Promise<
  { category: string; area_name: string; district: string }[]
> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('service_providers')
    .select('area_name, district, service_categories(name)')
    .eq('is_visible', true);

  if (error || !data) return [];

  const seen = new Set<string>();
  const result: { category: string; area_name: string; district: string }[] = [];

  for (const row of data) {
    const cat = (row.service_categories as unknown as { name: string } | null)?.name;
    if (!cat || !row.area_name) continue;
    const key = `${slugifyText(cat)}:${slugifyText(row.area_name)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ category: cat, area_name: row.area_name, district: row.district });
    }
  }

  return result;
}
