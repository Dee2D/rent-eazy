import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, ArrowLeft, CheckCircle2, Clock, Briefcase, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  getProviderBySlug,
  getRelatedProviders,
  getProviderReviews,
} from '@/lib/supabase/providers';
import { categoryToSlug, slugifyText } from '@/lib/utils';
import type { MapMarker } from '@/types';
import MapViewClient from '@/components/map/MapViewClient';
import AvailabilityBadge from '@/components/provider/AvailabilityBadge';
import ProviderGallery from '@/components/provider/ProviderGallery';
import ProviderReviews from '@/components/provider/ProviderReviews';
import AnalyticsTracker from '@/components/provider/AnalyticsTracker';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rent-eazy.vercel.app';

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string; grad: string }> = {
  Plumbing:           { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-400',    ring: 'ring-blue-200 dark:ring-blue-800',    grad: 'from-blue-600 to-sky-500' },
  Electrical:         { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', ring: 'ring-yellow-200 dark:ring-yellow-800', grad: 'from-yellow-500 to-amber-400' },
  Cleaning:           { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',  ring: 'ring-green-200 dark:ring-green-800',   grad: 'from-green-600 to-emerald-500' },
  Security:           { bg: 'bg-slate-50 dark:bg-slate-700/50',   text: 'text-slate-700 dark:text-slate-300',  ring: 'ring-slate-200 dark:ring-slate-600',   grad: 'from-slate-600 to-slate-500' },
  Painting:           { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800', grad: 'from-purple-600 to-violet-500' },
  Carpentry:          { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',  ring: 'ring-amber-200 dark:ring-amber-800',   grad: 'from-amber-600 to-orange-500' },
  'Moving & Delivery':{ bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800', grad: 'from-orange-600 to-amber-500' },
  Gardening:          { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', grad: 'from-emerald-600 to-green-500' },
};

const DEFAULT_COLOR = {
  bg: 'bg-stone-50 dark:bg-slate-700', text: 'text-stone-700 dark:text-slate-300',
  ring: 'ring-stone-200 dark:ring-slate-600', grad: 'from-orange-600 to-amber-500',
};

export async function generateStaticParams() {
  const { getAllProvidersForSitemap } = await import('@/lib/supabase/providers');
  try {
    const providers = await getAllProvidersForSitemap();
    return providers.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

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

    const title = provider.seo_title
      ?? `${name} — ${category} in ${area}, ${district} | Rent Eazy`;
    const description = provider.seo_description
      ?? provider.provider_bio
      ?? provider.description
      ?? `Trusted ${category.toLowerCase()} in ${area}, ${district}. Contact ${name} directly on Rent Eazy Uganda.`;

    const imageUrl = provider.profile_image ?? provider.gallery_images?.[0] ?? null;

    return {
      title: { absolute: title },
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'en_UG',
        siteName: 'Rent Eazy',
        url: `${APP_URL}/services/provider/${slug}`,
        ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: title }] } : {}),
      },
      twitter: { card: 'summary_large_image', title, description, ...(imageUrl ? { images: [imageUrl] } : {}) },
      alternates: { canonical: `${APP_URL}/services/provider/${slug}` },
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

  const [providerResult, authResult] = await Promise.allSettled([
    getProviderBySlug(slug),
    (async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    })(),
  ]);

  const provider = providerResult.status === 'fulfilled' ? providerResult.value : null;
  if (!provider) notFound();

  const user = authResult.status === 'fulfilled' ? authResult.value : null;

  const [reviews, relatedProviders] = await Promise.all([
    getProviderReviews(provider.id, 10).catch(() => []),
    getRelatedProviders(provider.id, provider.category_id, provider.district, 3).catch(() => []),
  ]);

  const name     = provider.profiles?.full_name ?? 'Service Provider';
  const phone    = provider.profiles?.phone_number ?? null;
  const category = provider.service_categories?.name ?? 'Services';
  const icon     = CATEGORY_ICONS[category] ?? '🔧';
  const colors   = CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
  const catSlug  = categoryToSlug(category);
  const areaSlug = slugifyText(provider.area_name);

  const whatsapp = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hi ${name}, I found you on Rent Eazy and would like to enquire about your ${category.toLowerCase()} services.`
      )}`
    : null;

  const marker: MapMarker = {
    id: provider.id,
    latitude: provider.latitude,
    longitude: provider.longitude,
    type: 'provider',
    title: name,
    subtitle: category,
    linkHref: `/services/provider/${slug}`,
  };

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${APP_URL}/services/provider/${slug}`,
    name: `${name} — ${category} Services`,
    description:
      provider.provider_bio ??
      provider.description ??
      `${category} services in ${provider.area_name}, ${provider.district}, Uganda.`,
    areaServed: [
      { '@type': 'Place', name: provider.area_name },
      { '@type': 'Place', name: provider.district },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: provider.area_name,
      addressRegion: provider.district,
      addressCountry: 'UG',
    },
    ...(phone ? { telephone: phone } : {}),
    url: `${APP_URL}/services/provider/${slug}`,
    ...(provider.profile_image ? { image: provider.profile_image } : {}),
    ...(provider.review_count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: provider.rating_average.toFixed(1),
            reviewCount: provider.review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(provider.years_active
      ? { foundingDate: String(new Date().getFullYear() - provider.years_active) }
      : {}),
    priceRange: '$$',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      {/* Client-side analytics ping — fires once on mount, no UI */}
      <AnalyticsTracker providerId={provider.id} eventType="profile_view" />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 dark:text-slate-500">
          <Link href="/services" className="flex items-center gap-1 hover:text-orange-500 transition-colors">
            <ArrowLeft size={14} />
            Services
          </Link>
          <span>/</span>
          <Link
            href={`/services/${catSlug}/${areaSlug}`}
            className="hover:text-orange-500 transition-colors capitalize"
          >
            {category} in {provider.area_name}
          </Link>
          <span>/</span>
          <span className="text-stone-600 dark:text-slate-300 truncate max-w-[160px]">{name}</span>
        </nav>

        {/* Hero Card */}
        <div className={`relative bg-gradient-to-br ${colors.grad} rounded-3xl overflow-hidden shadow-xl`}>
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'url(/patterns/bg-pattern.svg)', backgroundSize: '120px' }}
          />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 p-7 sm:p-8">
            {/* Avatar / Profile Image */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm shadow-lg shrink-0 flex items-center justify-center">
              {provider.profile_image ? (
                <Image
                  src={provider.profile_image}
                  alt={name}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-5xl">{icon}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              {provider.headline && (
                <p className="text-white/80 text-xs font-semibold tracking-wide uppercase mb-1">
                  {provider.headline}
                </p>
              )}
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
                {icon} {category}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-white/80 text-sm">
                <MapPin size={13} />
                <span>{provider.area_name}, {provider.district}</span>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 flex-wrap">
                <AvailabilityBadge status={provider.availability_status} />
                {provider.review_count > 0 && (
                  <span className="text-white/80 text-xs font-medium">
                    ★ {provider.rating_average.toFixed(1)} ({provider.review_count} review{provider.review_count !== 1 ? 's' : ''})
                  </span>
                )}
                {provider.years_active && (
                  <span className="text-white/80 text-xs font-medium flex items-center gap-1">
                    <Briefcase size={11} />
                    {provider.years_active}yr{provider.years_active !== 1 ? 's' : ''} experience
                  </span>
                )}
              </div>
            </div>

            {/* Verification badge */}
            {provider.verification_status !== 'unverified' && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full self-start shrink-0">
                <CheckCircle2 size={13} />
                {provider.verification_status === 'featured' ? 'Featured' : 'Verified'}
              </div>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio / About */}
            {(provider.provider_bio || provider.description) && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
                <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-3">About</h2>
                <p className="text-stone-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                  {provider.provider_bio ?? provider.description}
                </p>
              </section>
            )}

            {/* Service Tags */}
            {provider.service_tags.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
                <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-4">Services Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.service_tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}
                    >
                      {icon} {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Service Locations */}
            {provider.service_locations.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
                <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-3">Service Area</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.service_locations.map((loc) => (
                    <span
                      key={loc}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}
                    >
                      <MapPin size={11} />
                      {loc}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {provider.gallery_images.length > 0 && (
              <ProviderGallery images={provider.gallery_images} providerName={name} />
            )}

            {/* Map */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-semibold text-stone-900 dark:text-white text-lg mb-4">
                {category} Location — {provider.area_name}
              </h2>
              <div className="relative h-56 md:h-64 rounded-xl overflow-hidden">
                <MapViewClient markers={[marker]} interactive={false} />
              </div>
            </section>

            {/* Reviews */}
            <ProviderReviews
              providerId={provider.id}
              reviews={reviews}
              isAuthenticated={!!user}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Contact Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-semibold text-stone-900 dark:text-white mb-4">Contact {name}</h2>

              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => fetch('/api/provider/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ providerId: provider.id, eventType: 'whatsapp_click' }),
                  })}
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm mb-3"
                >
                  <Phone size={16} />
                  Chat on WhatsApp
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  onClick={() => fetch('/api/provider/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ providerId: provider.id, eventType: 'call_click' }),
                  })}
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

              {provider.response_time_hours && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-stone-400 dark:text-slate-500 mt-3">
                  <Clock size={11} />
                  Responds within {provider.response_time_hours < 24
                    ? `${provider.response_time_hours}h`
                    : `${Math.round(provider.response_time_hours / 24)} day${provider.response_time_hours >= 48 ? 's' : ''}`}
                </p>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-stone-900 dark:text-white">Quick Info</h2>
              {[
                { label: 'Service', value: category, icon },
                { label: 'Area', value: provider.area_name, icon: '📍' },
                { label: 'District', value: provider.district, icon: '🗺️' },
                ...(provider.years_active ? [{ label: 'Experience', value: `${provider.years_active} years`, icon: '🏆' }] : []),
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

            {/* Area/Category SEO link */}
            <Link
              href={`/services/${catSlug}/${areaSlug}`}
              className={`flex items-center justify-between gap-2 w-full ${colors.bg} hover:opacity-80 ${colors.text} font-medium text-sm px-5 py-4 rounded-2xl transition-opacity border ring-1 ${colors.ring}`}
            >
              <span>All {category} in {provider.area_name}</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* Related Providers */}
        {relatedProviders.length > 0 && (
          <section>
            <h2 className="font-semibold text-stone-900 dark:text-white text-xl mb-4">
              Other {category} Providers in {provider.district}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedProviders.map((rp) => {
                const rpName  = rp.profiles?.full_name ?? 'Provider';
                const rpPhone = rp.profiles?.phone_number;
                const rpWA    = rpPhone
                  ? `https://wa.me/${rpPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${rpName}, I found you on Rent Eazy.`)}`
                  : null;

                return (
                  <div key={rp.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        {rp.profile_image ? (
                          <Image
                            src={rp.profile_image}
                            alt={rpName}
                            width={44}
                            height={44}
                            className="object-cover w-full h-full"
                          />
                        ) : icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 dark:text-white text-sm leading-tight truncate">{rpName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-stone-400 dark:text-slate-500">{rp.area_name}</p>
                          {rp.rating_average > 0 && (
                            <span className="text-xs text-orange-500 font-medium">★ {rp.rating_average.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {rp.headline && (
                      <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2">{rp.headline}</p>
                    )}
                    <div className="flex gap-2 mt-auto">
                      {rp.slug && (
                        <Link
                          href={`/services/provider/${rp.slug}`}
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
