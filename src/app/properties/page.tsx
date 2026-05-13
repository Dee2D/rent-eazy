import { Suspense } from 'react';
import type { Metadata } from 'next';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyFilters from '@/components/property/PropertyFilters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getFilteredPropertiesPaginated, PROPERTIES_PAGE_SIZE } from '@/lib/supabase/properties';
import type { PropertyFilters as Filters, PropertyType } from '@/types';
import Link from 'next/link';

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
  q?: string;
  district?: string;
  area_name?: string;
  min_price?: string;
  max_price?: string;
  bedrooms?: string;
  property_type?: string;
  page?: string;
}

function buildPageUrl(searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (searchParams.q)             params.set('q', searchParams.q);
  if (searchParams.district)      params.set('district', searchParams.district);
  if (searchParams.area_name)     params.set('area_name', searchParams.area_name);
  if (searchParams.min_price)     params.set('min_price', searchParams.min_price);
  if (searchParams.max_price)     params.set('max_price', searchParams.max_price);
  if (searchParams.bedrooms)      params.set('bedrooms', searchParams.bedrooms);
  if (searchParams.property_type) params.set('property_type', searchParams.property_type);
  if (page > 1)                   params.set('page', String(page));
  const qs = params.toString();
  return `/properties${qs ? `?${qs}` : ''}`;
}

async function PropertyGrid({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const filters: Filters = {
    q: searchParams.q,
    district: searchParams.district,
    area_name: searchParams.area_name,
    min_price: searchParams.min_price ? Number(searchParams.min_price) : undefined,
    max_price: searchParams.max_price ? Number(searchParams.max_price) : undefined,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    property_type: searchParams.property_type as PropertyType | undefined,
  };

  let properties: Awaited<ReturnType<typeof getFilteredPropertiesPaginated>>['properties'] = [];
  let total = 0;
  let fetchError: string | null = null;

  try {
    const result = await getFilteredPropertiesPaginated(filters, page);
    properties = result.properties;
    total = result.total;
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

  const totalPages = Math.ceil(total / PROPERTIES_PAGE_SIZE);
  const from = (page - 1) * PROPERTIES_PAGE_SIZE + 1;
  const to = Math.min(page * PROPERTIES_PAGE_SIZE, total);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-slate-500">
        <span className="text-6xl mb-4">🏚️</span>
        <p className="text-lg font-medium">No properties found</p>
        <p className="text-sm mt-1">Try adjusting your filters or search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Result summary */}
      <p className="text-sm text-stone-500 dark:text-slate-400">
        Showing <strong className="text-stone-700 dark:text-slate-200">{from}–{to}</strong> of{' '}
        <strong className="text-stone-700 dark:text-slate-200">{total}</strong> properties
        {searchParams.q && (
          <> for <span className="italic">&ldquo;{searchParams.q}&rdquo;</span></>
        )}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 ? (
            <Link
              href={buildPageUrl(searchParams, page - 1)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-slate-600 text-stone-700 dark:text-slate-300 hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              ← Previous
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-100 dark:border-slate-700 text-stone-300 dark:text-slate-600 cursor-not-allowed">
              ← Previous
            </span>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i < 6 ? i + 1 : totalPages;
              } else if (page >= totalPages - 3) {
                p = i === 0 ? 1 : totalPages - 5 + i;
              } else {
                const mid = [1, page - 1, page, page + 1, totalPages];
                p = [1, page - 1, page, page + 1, totalPages][Math.min(i, 4)];
                if (i >= mid.length) return null;
              }
              return (
                <Link
                  key={p}
                  href={buildPageUrl(searchParams, p)}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-xl transition-colors ${
                    p === page
                      ? 'bg-orange-500 text-white'
                      : 'border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-500'
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>

          {page < totalPages ? (
            <Link
              href={buildPageUrl(searchParams, page + 1)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-slate-600 text-stone-700 dark:text-slate-300 hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              Next →
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-100 dark:border-slate-700 text-stone-300 dark:text-slate-600 cursor-not-allowed">
              Next →
            </span>
          )}
        </div>
      )}
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
