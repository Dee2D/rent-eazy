import Link from 'next/link';
import PropertyCard from '@/components/property/PropertyCard';
import type { Property } from '@/types';

interface FeaturedPropertiesProps {
  properties: Property[];
}

export default function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
  if (properties.length === 0) return null;

  return (
    <section className="bg-stone-50 dark:bg-slate-900/50 py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex items-end justify-between mb-7">
          <div>
            <h2
              className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Latest Listings
            </h2>
            <p className="text-stone-500 dark:text-slate-400 text-sm mt-1">
              Freshly added properties across Uganda
            </p>
          </div>
          <Link
            href="/properties"
            className="hidden sm:flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-semibold text-sm transition-colors"
          >
            View All
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        <div className="mt-7 text-center sm:hidden">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            View All Properties
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
