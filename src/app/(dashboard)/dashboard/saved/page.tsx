import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PropertyCard from '@/components/property/PropertyCard';
import SaveButton from '@/components/property/SaveButton';
import type { Property } from '@/types';
import { Heart } from 'lucide-react';

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rows } = await supabase
    .from('saved_properties')
    .select('property_id, properties(*, property_images(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const properties = (rows ?? [])
    .map((r: { property_id: string; properties: unknown }) => r.properties)
    .filter(Boolean) as Property[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={22} className="text-orange-500 fill-orange-500" />
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Saved Properties</h1>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 text-stone-400 dark:text-slate-500">
          <Heart size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No saved properties yet</p>
          <p className="text-sm mt-1">Tap the heart icon on any listing to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <div key={property.id} className="relative">
              <PropertyCard property={property} />
              <div className="absolute top-3 right-3">
                <SaveButton propertyId={property.id} initialSaved={true} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
