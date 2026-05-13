import { getActiveProperties } from '@/lib/supabase/properties';
import { getVisibleProviders } from '@/lib/supabase/providers';
import type { MapMarker, Property } from '@/types';
import IntroCarousel from '@/components/home/IntroCarousel';
import MapPanel from '@/components/home/MapPanel';
import HomeLayout from '@/components/home/HomeLayout';

export default async function HomePage() {
  let properties: Property[] = [];
  let providerMarkers: MapMarker[] = [];

  try {
    const [fetchedProperties, providers] = await Promise.all([
      getActiveProperties(),
      getVisibleProviders(),
    ]);

    properties = fetchedProperties;

    providerMarkers = providers.map((pr) => ({
      id: pr.id,
      latitude: pr.latitude,
      longitude: pr.longitude,
      type: 'provider' as const,
      title: pr.profiles?.full_name ?? 'Service Provider',
      subtitle: pr.service_categories?.name ?? 'Services',
      linkHref: '/services',
    }));
  } catch {
    // DB not configured — show empty map
  }

  const stats = {
    properties: properties.length,
    providers: providerMarkers.length,
  };

  return (
    <HomeLayout
      carousel={<IntroCarousel stats={stats} />}
      map={<MapPanel initialProperties={properties} providerMarkers={providerMarkers} />}
    />
  );
}
