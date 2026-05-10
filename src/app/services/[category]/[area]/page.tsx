import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Phone, ArrowLeft, Users } from 'lucide-react';
import {
  getProvidersByCategoryAndArea,
  getDistinctCategoryAreaCombos,
} from '@/lib/supabase/providers';
import { slugToCategory, categoryToSlug, slugifyText, areaSlugToName } from '@/lib/utils';

export const dynamicParams = true;

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

export async function generateStaticParams() {
  try {
    const combos = await getDistinctCategoryAreaCombos();
    return combos.map(({ category, area_name }) => ({
      category: categoryToSlug(category),
      area: slugifyText(area_name),
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; area: string }>;
}): Promise<Metadata> {
  const { category: catSlug, area: areaSlug } = await params;
  const categoryName = slugToCategory(catSlug) ?? areaSlugToName(catSlug);
  const areaName     = areaSlugToName(areaSlug);

  const titleStr = `${categoryName} in ${areaName} | Find Local Providers | Rent Eazy`;
  const description = `Find trusted ${categoryName.toLowerCase()} providers in ${areaName}, Uganda. Browse profiles, compare services, and contact directly through Rent Eazy.`;

  return {
    title: { absolute: titleStr },
    description,
    openGraph: {
      title: titleStr,
      description,
      type: 'website',
      locale: 'en_UG',
      siteName: 'Rent Eazy',
      url: `${APP_URL}/services/${catSlug}/${areaSlug}`,
    },
    twitter: { card: 'summary', title: titleStr, description },
    alternates: { canonical: `${APP_URL}/services/${catSlug}/${areaSlug}` },
  };
}

export default async function CategoryAreaPage({
  params,
}: {
  params: Promise<{ category: string; area: string }>;
}) {
  const { category: catSlug, area: areaSlug } = await params;
  const categoryName = slugToCategory(catSlug) ?? areaSlugToName(catSlug);
  const areaName     = areaSlugToName(areaSlug);
  const icon         = CATEGORY_ICONS[categoryName] ?? '🔧';

  let providers: Awaited<ReturnType<typeof getProvidersByCategoryAndArea>> = [];
  try {
    providers = await getProvidersByCategoryAndArea(categoryName, areaSlug);
  } catch {
    providers = [];
  }

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryName} Providers in ${areaName}`,
    description: `List of trusted ${categoryName.toLowerCase()} service providers in ${areaName}, Uganda`,
    url: `${APP_URL}/services/${catSlug}/${areaSlug}`,
    numberOfItems: providers.length,
    itemListElement: providers.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: p.profiles?.full_name ?? 'Provider',
        url: p.slug ? `${APP_URL}/providers/${p.slug}` : undefined,
        areaServed: p.area_name,
      },
    })),
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
            All Services
          </Link>
          <span>/</span>
          <span className="text-stone-600 dark:text-slate-300 capitalize">{categoryName}</span>
          <span>/</span>
          <span className="text-stone-600 dark:text-slate-300">{areaName}</span>
        </nav>

        {/* Hero */}
        <div className="text-center py-10 px-4">
          <div className="w-20 h-20 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm">
            {icon}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
            Best {categoryName} in {areaName}
          </h1>
          <p className="text-stone-500 dark:text-slate-400 mt-3 text-base max-w-xl mx-auto">
            Find trusted, verified {categoryName.toLowerCase()} providers serving {areaName} and nearby areas in Uganda.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-stone-400 dark:text-slate-500">
            <Users size={14} />
            <span>
              {providers.length > 0
                ? `${providers.length} provider${providers.length !== 1 ? 's' : ''} available`
                : 'No providers listed yet'}
            </span>
          </div>
        </div>

        {/* Provider list */}
        {providers.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">{icon}</div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-white">
              No {categoryName} Providers in {areaName} Yet
            </h2>
            <p className="text-stone-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              We don&apos;t have any verified {categoryName.toLowerCase()} providers listed in {areaName} yet.
              Check back soon or browse all providers.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Browse All Providers
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p) => {
              const pName  = p.profiles?.full_name ?? 'Service Provider';
              const pPhone = p.profiles?.phone_number;
              const whatsapp = pPhone
                ? `https://wa.me/${pPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${pName}, I found you on Rent Eazy and need ${categoryName.toLowerCase()} services in ${areaName}.`)}`
                : null;

              return (
                <article
                  key={p.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-3xl shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-stone-900 dark:text-white text-base leading-tight">
                        {pName}
                      </h2>
                      <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-slate-500 mt-1">
                        <MapPin size={11} />
                        <span>{p.area_name}, {p.district}</span>
                      </div>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-sm text-stone-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto pt-3 border-t border-stone-100 dark:border-slate-700">
                    {p.slug && (
                      <Link
                        href={`/providers/${p.slug}`}
                        className="flex-1 text-center text-sm font-medium bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 py-2.5 rounded-xl transition-colors"
                      >
                        View Profile
                      </Link>
                    )}
                    {whatsapp && (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl transition-colors"
                      >
                        <Phone size={13} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* SEO footer text */}
        <div className="bg-stone-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-stone-100 dark:border-slate-700">
          <h2 className="font-semibold text-stone-900 dark:text-white mb-2">
            Hiring a {categoryName} in {areaName}?
          </h2>
          <p className="text-sm text-stone-500 dark:text-slate-400 leading-relaxed">
            Rent Eazy connects residents in {areaName} with verified local {categoryName.toLowerCase()} professionals.
            All providers are vetted and reachable directly via WhatsApp — no middlemen, no hidden fees.
            Whether you need emergency {categoryName.toLowerCase()} services or a routine job done in {areaName},
            our directory has you covered.
          </p>
        </div>
      </div>
    </>
  );
}
