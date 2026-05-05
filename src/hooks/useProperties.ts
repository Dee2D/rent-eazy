'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Property, PropertyFilters } from '@/types';

export function useProperties(filters?: PropertyFilters) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        let query = supabase
          .from('properties')
          .select('*, property_images(*), profiles(full_name, phone_number)')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString());

        if (filters?.district) query = query.eq('district', filters.district);
        if (filters?.min_price) query = query.gte('price_ugx', filters.min_price);
        if (filters?.max_price) query = query.lte('price_ugx', filters.max_price);
        if (filters?.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
        if (filters?.property_type) query = query.eq('property_type', filters.property_type);

        const { data, error: dbErr } = await query.order('created_at', { ascending: false });
        if (dbErr) throw new Error(dbErr.message);
        setProperties((data as Property[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [
    filters?.district,
    filters?.min_price,
    filters?.max_price,
    filters?.bedrooms,
    filters?.property_type,
  ]);

  return { properties, loading, error };
}
