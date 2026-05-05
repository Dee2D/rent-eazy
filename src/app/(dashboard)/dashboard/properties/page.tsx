import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLandlordProperties } from '@/lib/supabase/properties';
import PropertiesClient from './PropertiesClient';

export default async function MyPropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let properties: Awaited<ReturnType<typeof getLandlordProperties>> = [];
  try {
    properties = await getLandlordProperties(user.id);
  } catch {
    // DB not configured
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-6">My Properties</h1>
      <PropertiesClient properties={properties} userId={user.id} />
    </div>
  );
}
