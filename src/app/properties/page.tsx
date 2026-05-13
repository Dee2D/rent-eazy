import { Suspense } from 'react';
import type { Metadata } from 'next';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyFilters from '@/components/property/PropertyFilters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getFilteredProperties } from '@/lib/supabase/properties';
import type { PropertyFilters as Filters, PropertyType } from '@/types';

export const revalidate = 300; // revalidate every 5 minutes

export const metadata: Metadata = {
  title: 'Browse Properties — Rent Eazy',
  description: 'Find rental apartments, houses, and bedsitters across Uganda. Filter by district, price, and bedrooms on Rent Eazy.',
  openGraph: {
    title: 'Browse Properties — Rent Eazy',
    description: 'Find rental apartments, houses, and bedsitters across Uganda.',
    type: 'website',
  },
};

interface SearchParams {
  district?: string;
  area_name?: string;
  min_price?: string;
  max_price?: string;
  bedrooms?: string;
  property_type?: string;
}

async function PropertyGrid({ searchParams }: { searchParams: SearchParams }) {
  const filters: Filters = {
    district: searchParams.district,
    area_name: searchParams.area_name,
    min_price: searchParams.min_price ? Number(searchParams.min_price) : undefined,
    max_price: searchParams.max_price ? Number(searchParams.max_price) : undefined,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    property_type: searchParams.property_type as PropertyType | undefined,
  };

  let properties: Awaited<ReturnType<typeof getFilteredProperties>> = [];
  let fetchError: string | null = null;

  try {
    properties = await getFilteredProperties(filters);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load properties';
  }

  if (fetchError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm">
        {fetchError}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-slate-500">
        <span className="text-6xl mb-4">🏚️</span>
        <p className="text-lg font-medium">No properties found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white mb-4 md:mb-6">Browse Properties</h1>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <aside className="w-full md:w-72 shrink-0">
          <Suspense fallback={null}>
            <PropertyFilters />
          </Suspense>
        </aside>
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <PropertyGrid searchParams={params} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
