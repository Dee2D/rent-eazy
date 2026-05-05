import { createClient } from './client';
import type { Property } from '@/types';

export async function getFilteredPropertiesClient(
  district?: string,
  area?: string
): Promise<Property[]> {
  const supabase = createClient();
  let query = supabase
    .from('properties')
    .select('*')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());

  if (district) query = query.eq('district', district);
  if (area) query = query.ilike('area_name', `%${area}%`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Property[]) ?? [];
}
