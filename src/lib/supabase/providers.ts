import { createClient } from './server';
import type { ServiceProvider, ServiceCategory } from '@/types';

export async function getVisibleProviders(): Promise<ServiceProvider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_providers')
    .select('*, profiles(full_name, phone_number), service_categories(name)')
    .eq('is_visible', true);

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
  providerData: { category_id: string; description: string | null; latitude: number; longitude: number },
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
