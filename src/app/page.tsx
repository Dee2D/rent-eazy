import { getActiveProperties } from '@/lib/supabase/properties';
import { getVisibleProviders } from '@/lib/supabase/providers';
import type { MapMarker, Property } from '@/types';
import HeroSection from '@/components/home/HeroSection';
import LiveStatsBar from '@/components/home/LiveStatsBar';
import MapSection from '@/components/home/MapSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import HowItWorks from '@/components/home/HowItWorks';
import LandlordCTA from '@/components/home/LandlordCTA';

// Revalidate every 5 minutes so stats and featured listings stay fresh
export const revalidate = 300;

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
    // DB not configured — show empty sections
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
