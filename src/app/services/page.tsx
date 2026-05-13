import { getVisibleProviders, getServiceCategories } from '@/lib/supabase/providers';
import type { ServiceProvider, ServiceCategory } from '@/types';
import ServicesClient from './ServicesClient';

export const metadata = { title: 'Services — Rent Eazy' };

export default async function ServicesPage() {
  let providers: ServiceProvider[] = [];
  let categories: ServiceCategory[] = [];

  try {
    [providers, categories] = await Promise.all([
      getVisibleProviders(),
      getServiceCategories(),
    ]);
  } catch {
    // DB not configured
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white">Service Providers</h1>
        <p className="text-stone-500 dark:text-slate-400 text-sm mt-1">
          {providers.length} trusted provider{providers.length !== 1 ? 's' : ''} available across Uganda
        </p>
      </div>

      <ServicesClient providers={providers} categories={categories} />
    </div>
  );
}
