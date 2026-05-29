import { getActiveProperties } from '@/lib/supabase/properties';
import { getVisibleProviders } from '@/lib/supabase/providers';
import type { MapMarker, Property } from '@/types';
import HeroSection from '@/components/home/HeroSection';
import LiveStatsBar from '@/components/home/LiveStatsBar';
import MapSection from '@/components/home/MapSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import HowItWorks from '@/components/home/HowItWorks';
import LandlordCTA from '@/components/home/LandlordCTA';

// Always server-render so live listings and stats are never stale
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let properties: Property[] = [];
  let providerMarkers: MapMarker[] = [];

  const [propsResult, providersResult] = await Promise.allSettled([
    getActiveProperties(),
    getVisibleProviders(),
  ]);

  if (propsResult.status === 'fulfilled') properties = propsResult.value;

  if (providersResult.status === 'fulfilled') {
    providerMarkers = providersResult.value.map((pr) => ({
      id: pr.id,
      latitude: pr.latitude,
      longitude: pr.longitude,
      type: 'provider' as const,
      title: pr.profiles?.full_name ?? 'Service Provider',
      subtitle: pr.service_categories?.name ?? 'Services',
      linkHref: '/services',
    }));
  }

  const stats = { properties: properties.length, providers: providerMarkers.length };
  const featuredProperties = properties.slice(0, 6);

  return (
    <>
      <HeroSection />
      <LiveStatsBar stats={stats} />
      <MapSection initialProperties={properties} providerMarkers={providerMarkers} />
      <FeaturedProperties properties={featuredProperties} />
      <HowItWorks />
      <LandlordCTA />
    </>
  );
}
