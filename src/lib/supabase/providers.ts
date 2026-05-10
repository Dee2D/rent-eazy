import { createClient } from './server';
import type { ServiceProvider, ServiceCategory } from '@/types';
import { slugifyText } from '@/lib/utils';

export async function getVisibleProviders(filters?: { district?: string; area_name?: string; category?: string }): Promise<ServiceProvider[]> {
  const supabase = await createClient();
  let query = supabase
    .from('service_providers')
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .eq('is_visible', true);

  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.area_name) query = query.ilike('area_name', `%${filters.area_name}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ServiceProvider[]) ?? [];
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return (data as ServiceCategory[]) ?? [];
}

export async function createServiceProvider(
  providerData: { category_id: string; description: string | null; latitude: number; longitude: number; district: string; area_name: string },
  profileId: string
): Promise<ServiceProvider> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .insert({ ...providerData, profile_id: profileId, is_visible: false })
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .single();

  if (error) throw new Error(error.message);
  return data as ServiceProvider;
}

export async function getProviderByProfileId(profileId: string): Promise<ServiceProvider | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .eq('profile_id', profileId)
    .single();

  if (error) return null;
  return data as ServiceProvider;
}

export async function getProviderBySlug(slug: string): Promise<ServiceProvider | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error) return null;
  return data as ServiceProvider;
}

export async function getProvidersByCategoryAndArea(
  categoryName: string,
  areaSlug: string,
  limit = 20
): Promise<ServiceProvider[]> {
  const supabase = await createClient();
  const areaSearch = areaSlug.replace(/-/g, ' ');

  const { data: catData } = await supabase
    .from('service_categories')
    .select('id')
    .ilike('name', categoryName)
    .single();

  if (!catData) return [];

  const { data, error } = await supabase
    .from('service_providers')
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .eq('is_visible', true)
    .eq('category_id', catData.id)
    .ilike('area_name', `%${areaSearch}%`)
    .limit(limit);

  if (error) return [];
  return (data as ServiceProvider[]) ?? [];
}

export async function getRelatedProviders(
  excludeId: string,
  categoryId: string,
  district: string,
  limit = 3
): Promise<ServiceProvider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .eq('is_visible', true)
    .eq('category_id', categoryId)
    .eq('district', district)
    .neq('id', excludeId)
    .limit(limit);

  if (error) return [];
  return (data as ServiceProvider[]) ?? [];
}

export async function getProvidersNearProperty(
  district: string,
  areaName: string,
  limit = 4
): Promise<ServiceProvider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .eq('is_visible', true)
    .or(`district.eq.${district},area_name.ilike.%${areaName}%`)
    .limit(limit);

  if (error) return [];
  return (data as ServiceProvider[]) ?? [];
}

export async function getAllProvidersForSitemap(): Promise<{ slug: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .select('slug')
    .eq('is_visible', true)
    .not('slug', 'is', null);

  if (error) return [];
  return (data as { slug: string }[]).filter((r) => r.slug);
}

export async function getDistinctCategoryAreaCombos(): Promise<
  { category: string; area_name: string; district: string }[]
> {
  const supabase = await createClient();
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
