import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Phone, MapPin, Star, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getProviderBySlug, getRelatedProviders } from '@/lib/supabase/providers';
import { categoryToSlug, slugifyText } from '@/lib/utils';
import type { MapMarker } from '@/types';
import MapViewClient from '@/components/map/MapViewClient';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://renteazy.com';

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  Plumbing:           { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-400',   ring: 'ring-blue-200 dark:ring-blue-800' },
  Electrical:         { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', ring: 'ring-yellow-200 dark:ring-yellow-800' },
  Cleaning:           { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400', ring: 'ring-green-200 dark:ring-green-800' },
  Security:           { bg: 'bg-slate-50 dark:bg-slate-700/50',   text: 'text-slate-700 dark:text-slate-300', ring: 'ring-slate-200 dark:ring-slate-600' },
  Painting:           { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800' },
  Carpentry:          { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800' },
  'Moving & Delivery':{ bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' },
  Gardening:          { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
};

const DEFAULT_COLOR = { bg: 'bg-stone-50 dark:bg-slate-700', text: 'text-stone-700 dark:text-slate-300', ring: 'ring-stone-200 dark:ring-slate-600' };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const provider = await getProviderBySlug(slug);
    if (!provider) return { title: 'Provider Not Found | Rent Eazy' };

    const name     = provider.profiles?.full_name ?? 'Service Provider';
    const category = provider.service_categories?.name ?? 'Services';
    const area     = provider.area_name;
    const district = provider.district;

    const titleStr = `${category} in ${area} | ${name} | Rent Eazy`;
    const description = provider.description
      ? `${provider.description} Serving ${area}, ${district}. Contact ${name} directly through Rent Eazy.`
      : `Find trusted ${category.toLowerCase()} services in ${area}, ${district}. Contact ${name} directly through Rent Eazy.`;

    return {
      title: { absolute: titleStr },
      description,
      openGraph: {
        title: titleStr,
        description,
        type: 'website',
        locale: 'en_UG',
        siteName: 'Rent Eazy',
        url: `${APP_URL}/providers/${slug}`,
      },
      twitter: { card: 'summary', title: titleStr, description },
      alternates: { canonical: `${APP_URL}/providers/${slug}` },
    };
  } catch {
    return { title: 'Service Provider | Rent Eazy' };
  }
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let provider;
  try {
    provider = await getProviderBySlug(slug);
  } catch {
    provider = null;
  }

  if (!provider) notFound();

  const name       = provider.profiles?.full_name ?? 'Service Provider';
  const phone      = provider.profiles?.phone_number ?? null;
  const category   = provider.service_categories?.name ?? 'Services';
  const icon       = CATEGORY_ICONS[category]   ?? '🔧';
  const colors     = CATEGORY_COLORS[category]  ?? DEFAULT_COLOR;
  const areaName   = provider.area_name;
  const district   = provider.district;
  const catSlug    = categoryToSlug(category);
  const areaSlug   = slugifyText(areaName);

  const whatsapp = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${name}, I found you on Rent Eazy and would like to inquire about your ${category.toLowerCase()} services.`)}`
    : null;

  let relatedProviders: Awaited<ReturnType<typeof getRelatedProviders>> = [];
  try {
    relatedProviders = await getRelatedProviders(provider.id, provider.category_id, district, 3);
  } catch {
    relatedProviders = [];
  }

  const marker: MapMarker = {
    id: provider.id,
    latitude: provider.latitude,
    longitude: provider.longitude,
    type: 'provider',
    title: name,
    subtitle: category,
    linkHref: `/providers/${slug}`,
  };

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${APP_URL}/providers/${slug}`,
    name: `${name} — ${category} Services`,
    description: provider.description ?? `${category} services in ${areaName}, ${district}, Uganda.`,
    areaServed: { '@type': 'Place', name: areaName },
    address: {
      '@type': 'PostalAddress',
      addressLocality: areaName,
      addressRegion: district,
      addressCountry: 'UG',
    },
    ...(phone ? { telephone: phone } : {}),
    url: `${APP_URL}/providers/${slug}`,
    priceRange: '$$',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 dark:text-slate-500">
          <Link href="/services" className="flex items-center gap-1 hover:text-orange-500 transition-colors">
            <ArrowLeft size={14} />
            Service Providers
          </Link>
          <span>/</span>
          <Link href={`/services/${catSlug}/${areaSlug}`} className="hover:text-orange-500 transition-colors capitalize">
            {category} in {areaName}
          </Link>
        </nav>

        {/* Hero Card */}
        <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-3xl overflow-hidden shadow-xl">
          {/* subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url(/patterns/bg-pattern.svg)',
              backgroundSize: '120px',
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 p-8">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl shadow-lg shrink-0">
              {icon}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {icon} {category}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {name}
              </h1>
              <p className="text-orange-100 mt-2 text-sm font-medium">
                Best {category} in {areaName}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 text-orange-100 text-sm">
                <MapPin size={14} />
                <span>{areaName}, {district}</span>
              </div>
            </div>

            {/* Verified badge */}
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full self-start">
              <CheckCircle2 size={13} />
              Verified
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {provider.description && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
                <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-3">About</h2>
                <p className="text-stone-600 dark:text-slate-400 text-sm leading-relaxed">
                  {provider.description}
                </p>
              </section>
            )}

            {/* Services Offered */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-4">Services Offered</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[category, `${category} Repairs`, `Emergency ${category}`, `${category} Consultation`].map((svc) => (
                  <div key={svc} className="flex items-center gap-2.5 text-sm text-stone-600 dark:text-slate-400">
                    <span className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center text-base shrink-0`}>
                      {icon}
                    </span>
                    {svc}
                  </div>
                ))}
              </div>
            </section>

            {/* Available In */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-3">Service Area</h2>
              <div className="flex flex-wrap gap-2">
                {[areaName, district, 'Greater Kampala'].map((loc) => (
                  <span
                    key={loc}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}
                  >
                    <MapPin size={11} />
                    {loc}
                  </span>
                ))}
              </div>
              <p className="text-xs text-stone-400 dark:text-slate-500 mt-3">
                Primarily serving {areaName} and surrounding areas in {district}
              </p>
            </section>

            {/* Location Map */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-4">
                {category} Location — {areaName}
              </h2>
              <div className="rounded-xl overflow-hidden">
                <MapViewClient markers={[marker]} height="280px" interactive={false} />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Contact Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-semibold text-stone-900 dark:text-white mb-4">Contact {name}</h2>

              {/* Rating placeholder */}
              <div className="flex items-center gap-1.5 mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className={s <= 4 ? 'fill-orange-400 text-orange-400' : 'text-stone-200 dark:text-slate-600'} />
                ))}
                <span className="text-sm text-stone-500 dark:text-slate-400 ml-1">4.0 · New provider</span>
              </div>

              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm mb-3"
                >
                  <Phone size={16} />
                  Chat on WhatsApp
                </a>
              ) : null}

              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="flex items-center justify-center gap-2 w-full bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  <Phone size={14} />
                  {phone}
                </a>
              )}

              {!phone && !whatsapp && (
                <p className="text-sm text-stone-400 dark:text-slate-500 text-center py-2">
                  Contact info not available
                </p>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-stone-900 dark:text-white">Quick Info</h2>
              {[
                { label: 'Service', value: category, icon },
                { label: 'Area', value: areaName, icon: '📍' },
                { label: 'District', value: district, icon: '🗺️' },
                { label: 'Status', value: 'Available', icon: '✅' },
              ].map(({ label, value, icon: ico }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-stone-500 dark:text-slate-400">{label}</span>
                  <span className="font-medium text-stone-800 dark:text-white flex items-center gap-1.5">
                    <span>{ico}</span>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* SEO link to area/category page */}
            <Link
              href={`/services/${catSlug}/${areaSlug}`}
              className="flex items-center justify-between gap-2 w-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-medium text-sm px-5 py-4 rounded-2xl transition-colors border border-orange-100 dark:border-orange-900/40"
            >
              <span>All {category} providers in {areaName}</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* Related Providers */}
        {relatedProviders.length > 0 && (
          <section>
            <h2 className="font-semibold text-stone-900 dark:text-white text-xl mb-4">
              Other {category} Providers in {district}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProviders.map((rp) => {
                const rpName  = rp.profiles?.full_name ?? 'Provider';
                const rpPhone = rp.profiles?.phone_number;
                const rpWA = rpPhone
                  ? `https://wa.me/${rpPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${rpName}, I found you on Rent Eazy.`)}`
                  : null;

                return (
                  <div key={rp.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-2xl shrink-0">
                        {icon}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-white text-sm leading-tight">{rpName}</p>
                        <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{rp.area_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      {rp.slug && (
                        <Link
                          href={`/providers/${rp.slug}`}
                          className="flex-1 text-center text-xs font-medium bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 py-2 rounded-xl transition-colors"
                        >
                          View Profile
                        </Link>
                      )}
                      {rpWA && (
                        <a
                          href={rpWA}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center text-xs font-medium bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl transition-colors"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
