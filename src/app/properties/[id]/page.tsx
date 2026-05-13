import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 300;
export const dynamicParams = true; // on-demand render unknown IDs, then cache

export async function generateStaticParams() {
  const { createPublicClient } = await import('@/lib/supabase/server');
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('properties')
    .select('id')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());
  return (data ?? []).map((p: { id: string }) => ({ id: p.id }));
}
import Link from 'next/link';
import { Bed, Bath, MapPin, Home, Phone } from 'lucide-react';
import { getPropertyById } from '@/lib/supabase/properties';
import { getProvidersNearProperty } from '@/lib/supabase/providers';
import { formatUGX, formatPeriod } from '@/lib/utils';
import type { MapMarker } from '@/types';
import MapViewClient from '@/components/map/MapViewClient';
import PropertyImageGallery from '@/components/property/PropertyImageGallery';
import PropertyViewTracker from '@/components/property/PropertyViewTracker';
import ShareButton from '@/components/property/ShareButton';
import SaveButton from '@/components/property/SaveButton';

const CATEGORY_ICONS: Record<string, string> = {
  Plumbing:           '🔧',
  Electrical:         '⚡',
  Cleaning:           '🧹',
  Security:           '🔒',
  Painting:           '🎨',
  Carpentry:          '🪵',
  'Moving & Delivery':'🚚',
  Gardening:          '🌿',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const property = await getPropertyById(id);
    if (!property) return { title: 'Property Not Found — Rent Eazy' };
    const desc =
      property.description ??
      `${property.bedrooms}-bedroom ${property.property_type} in ${property.area_name}, ${property.district}. ${formatUGX(property.price_ugx)}${formatPeriod(property.payment_period)}.`;
    return {
      title: `${property.title} — Rent Eazy`,
      description: desc,
      openGraph: {
        title: `${property.title} — Rent Eazy`,
        description: desc,
        type: 'website',
        images: property.property_images?.[0]
          ? [{ url: property.property_images[0].image_url }]
          : [],
      },
    };
  } catch {
    return { title: 'Property — Rent Eazy' };
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let property;

  try {
    property = await getPropertyById(id);
  } catch {
    property = null;
  }

  if (!property) notFound();

  let nearbyProviders: Awaited<ReturnType<typeof getProvidersNearProperty>> = [];
  try {
    nearbyProviders = await getProvidersNearProperty(property.district, property.area_name, 4);
  } catch {
    nearbyProviders = [];
  }

  const whatsappUrl = property.profiles?.phone_number
    ? `https://wa.me/${property.profiles.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your listing on Rent Eazy')}`
    : null;

  const marker: MapMarker = {
    id: property.id,
    latitude: property.latitude,
    longitude: property.longitude,
    type: 'property',
    title: property.title,
    subtitle: `${formatUGX(property.price_ugx)}${formatPeriod(property.payment_period)}`,
    linkHref: `/properties/${property.id}`,
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rent-eazy.vercel.app';
  const pageUrl = `${appUrl}/properties/${property.id}`;
  const primaryImage = property.property_images?.[0]?.image_url;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description ?? `${property.bedrooms}-bedroom ${property.property_type} in ${property.area_name}, ${property.district}.`,
    url: pageUrl,
    ...(primaryImage && { image: primaryImage }),
    offers: {
      '@type': 'Offer',
      price: property.price_ugx,
      priceCurrency: 'UGX',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.area_name,
      addressRegion: property.district,
      addressCountry: 'UG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    },
    numberOfRooms: property.bedrooms,
    floorSize: undefined,
    accommodationCategory: property.property_type,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* JSON-LD structured data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Client-side view tracker — fires once per page visit even on ISR cache hits */}
      <PropertyViewTracker propertyId={property.id} />

      <div className="mb-5">
        <PropertyImageGallery
          images={property.property_images ?? []}
          title={property.title}
        />
      </div>

      <div className="space-y-4">
        {/* Title + Price row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white leading-snug">{property.title}</h1>
            <div className="flex items-center gap-1 text-stone-400 dark:text-slate-500 text-sm mt-1">
              <MapPin size={13} />
              <span className="truncate">{property.area_name}, {property.district}</span>
            </div>
          </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-2">
            <div>
              <p className="text-xl font-bold text-orange-500">{formatUGX(property.price_ugx)}</p>
              <p className="text-stone-400 dark:text-slate-500 text-xs">{formatPeriod(property.payment_period)}</p>
            </div>
            <div className="flex items-center gap-2">
              <SaveButton propertyId={property.id} initialSaved={false} checkOnMount={true} />
              <ShareButton title={property.title} url={pageUrl} />
            </div>
          </div>
        </div>

        {/* Property details chips */}
        <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5 bg-stone-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            <Bed size={15} /> {property.bedrooms} Bed{property.bedrooms > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 bg-stone-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            <Bath size={15} /> {property.bathrooms} Bath{property.bathrooms > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 bg-stone-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl capitalize">
            <Home size={15} /> {property.property_type}
          </span>
        </div>

        {property.description && (
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-white mb-2">Description</h2>
            <p className="text-stone-600 dark:text-slate-400 text-sm leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* Desktop WhatsApp button (inline) */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            💬 Contact on WhatsApp
          </a>
        )}
      </div>

      {/* Mobile sticky WhatsApp bar */}
      {whatsappUrl && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-20 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-stone-100 dark:border-slate-800">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            💬 Contact on WhatsApp
          </a>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-semibold text-stone-900 dark:text-white mb-3">Location</h2>
        <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden">
          <MapViewClient markers={[marker]} interactive={false} />
        </div>
      </div>

      {nearbyProviders.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900 dark:text-white">
              Service Providers Near {property.area_name}
            </h2>
            <Link href="/services" className="text-sm text-orange-500 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearbyProviders.map((p) => {
              const pName  = p.profiles?.full_name ?? 'Provider';
              const pPhone = p.profiles?.phone_number;
              const cat    = p.service_categories?.name ?? 'Services';
              const whatsapp = pPhone
                ? `https://wa.me/${pPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${pName}, I found you on Rent Eazy.`)}`
                : null;

              return (
                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-2xl shrink-0">
                    {CATEGORY_ICONS[cat] ?? '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 dark:text-white text-sm leading-tight truncate">{pName}</p>
                    <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{cat} · {p.area_name}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {p.slug && (
                      <Link
                        href={`/providers/${p.slug}`}
                        className="text-xs bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Profile
                      </Link>
                    )}
                    {whatsapp && (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Phone size={11} />
                        WA
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
