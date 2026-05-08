import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = { title: 'Admin — Rent Eazy' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Use service role to bypass RLS — role check must be authoritative
  const adminSupabase = await createServiceRoleClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
