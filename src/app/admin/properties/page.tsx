import { getAllProperties } from '@/lib/supabase/admin';
import PropertiesClient from './PropertiesClient';

export const metadata = { title: 'Properties — Admin' };

export default async function AdminPropertiesPage() {
  const properties = await getAllProperties();
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Properties</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">{properties.length} total listings</p>
      </div>
      <PropertiesClient properties={properties} />
    </div>
  );
}
