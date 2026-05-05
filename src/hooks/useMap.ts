'use client';

import { useMemo } from 'react';
import type { Property, ServiceProvider, MapMarker } from '@/types';
import { formatUGX, formatPeriod } from '@/lib/utils';

export function useMap(properties: Property[], providers: ServiceProvider[]): MapMarker[] {
  return useMemo(() => [
    ...properties.map((p): MapMarker => ({
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      type: 'property',
      title: p.title,
      subtitle: `${formatUGX(p.price_ugx)}${formatPeriod(p.payment_period)}`,
      linkHref: `/properties/${p.id}`,
    })),
    ...providers.map((pr): MapMarker => ({
      id: pr.id,
      latitude: pr.latitude,
      longitude: pr.longitude,
      type: 'provider',
      title: pr.profiles?.full_name ?? 'Service Provider',
      subtitle: pr.service_categories?.name ?? 'Services',
      linkHref: '#',
    })),
  ], [properties, providers]);
}
