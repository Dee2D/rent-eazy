import { getActiveProperties } from '@/lib/supabase/properties';
import { getVisibleProviders } from '@/lib/supabase/providers';
import type { MapMarker, Property } from '@/types';
import IntroCarousel from '@/components/home/IntroCarousel';
import MapPanel from '@/components/home/MapPanel';

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
      linkHref: '#',
    }));
  } catch {
    // DB not configured — show empty map
  }

  const stats = {
    properties: properties.length,
    providers: providerMarkers.length,
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left: Intro carousel (40%) ── */}
      <div className="w-full md:w-[40%] shrink-0 overflow-hidden border-r border-stone-100 shadow-lg z-10">
        <IntroCarousel stats={stats} />
      </div>

      {/* ── Right: Map (60%) ── */}
      <div className="w-full md:flex-1 relative min-h-[55vw] md:min-h-0">
        <MapPanel initialProperties={properties} providerMarkers={providerMarkers} />
      </div>
    </div>
  );
}
