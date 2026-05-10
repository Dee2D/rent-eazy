import { createServiceRoleClient } from './server';

export interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  activeListings: number;
  expiredListings: number;
  totalRevenue: number;
}

export interface AdminProperty {
  id: string;
  title: string;
  district: string;
  area_name: string;
  price_ugx: number;
  property_type: string;
  is_active: boolean;
  is_taken: boolean;
  expires_at: string | null;
  created_at: string;
  profiles: { id: string; full_name: string } | null;
}

export interface AdminUser {
  id: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  created_at: string;
}

export interface AdminPayment {
  id: string;
  amount_ugx: number;
  payment_type: string;
  status: string;
  reference: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

export interface ChartPoint {
  date: string;
  value: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createServiceRoleClient();

  const [
    { count: totalUsers },
    { count: totalProperties },
    { count: activeListings },
    { count: expiredListings },
    { data: payments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString()),
    supabase.from('payments').select('amount_ugx').eq('status', 'completed'),
  ]);

  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount_ugx ?? 0), 0) ?? 0;

  return {
    totalUsers: totalUsers ?? 0,
    totalProperties: totalProperties ?? 0,
    activeListings: activeListings ?? 0,
    expiredListings: expiredListings ?? 0,
    totalRevenue,
  };
}

export async function getRecentListings(limit = 6): Promise<AdminProperty[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('properties')
    .select('id, title, district, area_name, price_ugx, property_type, is_active, is_taken, expires_at, created_at, profiles(id, full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return ((data as unknown as AdminProperty[]) ?? []).map((p) => ({ ...p, is_taken: p.is_taken ?? false }));
}

export async function getRecentPayments(limit = 6): Promise<AdminPayment[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('payments')
    .select('id, amount_ugx, payment_type, status, reference, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as unknown as AdminPayment[]) ?? [];
}

export async function getListingsChartData(): Promise<ChartPoint[]> {
  const supabase = await createServiceRoleClient();
  const since = new Date();
  since.setDate(since.getDate() - 29);

  const { data } = await supabase
    .from('properties')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (!data) return [];

  const grouped: Record<string, number> = {};
  data.forEach((p) => {
    const d = new Date(p.created_at);
    const key = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    grouped[key] = (grouped[key] ?? 0) + 1;
  });

  return Object.entries(grouped).map(([date, value]) => ({ date, value }));
}

export async function getRevenueChartData(): Promise<ChartPoint[]> {
  const supabase = await createServiceRoleClient();
  const since = new Date();
  since.setDate(since.getDate() - 29);

  const { data } = await supabase
    .from('payments')
    .select('created_at, amount_ugx')
    .eq('status', 'completed')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (!data) return [];

  const grouped: Record<string, number> = {};
  data.forEach((p) => {
    const d = new Date(p.created_at);
    const key = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    grouped[key] = (grouped[key] ?? 0) + (p.amount_ugx ?? 0);
  });

  return Object.entries(grouped).map(([date, value]) => ({ date, value }));
}

export async function getAllProperties(): Promise<AdminProperty[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('properties')
    .select('id, title, district, area_name, price_ugx, property_type, is_active, is_taken, expires_at, created_at, profiles(id, full_name)')
    .order('created_at', { ascending: false });
  return ((data as unknown as AdminProperty[]) ?? []).map((p) => ({ ...p, is_taken: p.is_taken ?? false }));
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role, created_at')
    .order('created_at', { ascending: false });
  return (data as AdminUser[]) ?? [];
}

export async function getAllPayments(): Promise<AdminPayment[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('payments')
    .select('id, amount_ugx, payment_type, status, reference, created_at, profiles(full_name)')
    .order('created_at', { ascending: false });
  return (data as unknown as AdminPayment[]) ?? [];
}
