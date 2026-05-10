import type { MetadataRoute } from 'next';
import { getActiveProperties } from '@/lib/supabase/properties';
import { getAllProvidersForSitemap, getDistinctCategoryAreaCombos } from '@/lib/supabase/providers';
import { categoryToSlug, slugifyText } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://renteazy.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL,               lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${APP_URL}/services`, lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${APP_URL}/properties`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  let propertyRoutes: MetadataRoute.Sitemap = [];
  let providerRoutes: MetadataRoute.Sitemap = [];
  let areaRoutes:     MetadataRoute.Sitemap = [];

  try {
    const [properties, providerSlugs, combos] = await Promise.all([
      getActiveProperties(),
      getAllProvidersForSitemap(),
      getDistinctCategoryAreaCombos(),
    ]);

    propertyRoutes = properties.map((p) => ({
      url: `${APP_URL}/properties/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    providerRoutes = providerSlugs.map(({ slug }) => ({
      url: `${APP_URL}/providers/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    areaRoutes = combos.map(({ category, area_name }) => ({
      url: `${APP_URL}/services/${categoryToSlug(category)}/${slugifyText(area_name)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch {
    // DB unavailable during build — return static routes only
  }

  return [...staticRoutes, ...propertyRoutes, ...providerRoutes, ...areaRoutes];
}
