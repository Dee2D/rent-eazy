import { createClient, createPublicClient } from './server';
import type { Property, PropertyFilters } from '@/types';

export const PROPERTIES_PAGE_SIZE = 12;

export async function getActiveProperties(): Promise<Property[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_images(*), profiles(full_name, phone_number)')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Property[]) ?? [];
}

export async function getFilteredProperties(filters: PropertyFilters): Promise<Property[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from('properties')
    .select('*, property_images(*), profiles(full_name, phone_number)')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());

  if (filters.district) query = query.eq('district', filters.district);
  if (filters.area_name) query = query.ilike('area_name', `%${filters.area_name}%`);
  if (filters.min_price) query = query.gte('price_ugx', filters.min_price);
  if (filters.max_price) query = query.lte('price_ugx', filters.max_price);
  if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
  if (filters.property_type) query = query.eq('property_type', filters.property_type);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Property[]) ?? [];
}

export async function getFilteredPropertiesPaginated(
  filters: PropertyFilters,
  page = 1,
  limit = PROPERTIES_PAGE_SIZE
): Promise<{ properties: Property[]; total: number }> {
  const supabase = createPublicClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('properties')
    .select('*, property_images(*), profiles(full_name, phone_number)', { count: 'exact' })
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());

  if (filters.q) {
    const term = filters.q.replace(/[%_]/g, '\\$&'); // escape LIKE special chars
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,area_name.ilike.%${term}%`);
  }
  if (filters.district) query = query.eq('district', filters.district);
  if (filters.area_name) query = query.ilike('area_name', `%${filters.area_name}%`);
  if (filters.min_price) query = query.gte('price_ugx', filters.min_price);
  if (filters.max_price) query = query.lte('price_ugx', filters.max_price);
  if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
  if (filters.property_type) query = query.eq('property_type', filters.property_type);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { properties: (data as Property[]) ?? [], total: count ?? 0 };
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_images(*), profiles(full_name, phone_number)')
    .eq('id', id)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) return null;
  return data as Property;
}

export async function createProperty(
  propertyData: Omit<Property, 'id' | 'created_at' | 'is_active' | 'expires_at' | 'landlord_id' | 'view_count' | 'property_images' | 'profiles'>,
  landlordId: string
): Promise<Property> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .insert({ ...propertyData, landlord_id: landlordId, is_active: false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Property;
}

export async function markPropertyAsTaken(propertyId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('properties')
    .update({ is_active: false })
    .eq('id', propertyId);
  if (error) throw new Error(error.message);
}

export async function getLandlordProperties(landlordId: string): Promise<Property[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_images(*)')
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Property[]) ?? [];
}

export async function getSimilarProperties(district: string, excludeId: string, limit = 3): Promise<Property[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('properties')
    .select('*, property_images(*)')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .eq('district', district)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as Property[]) ?? [];
}

export async function getAllPropertiesForSitemap(): Promise<{ id: string }[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('properties')
    .select('id')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());
  return (data as { id: string }[]) ?? [];
}
