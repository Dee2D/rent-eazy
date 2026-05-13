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
  accepted_terms: boolean;
  accepted_terms_at: string | null;
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
    .select('id, full_name, phone_number, role, created_at, accepted_terms, accepted_terms_at')
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

export interface TrialStats {
  usersOnTrial: number;
  trialExpired: number;
  trialConversions: number;
}

export async function getTrialStats(): Promise<TrialStats> {
  const supabase = await createServiceRoleClient();
  const now = new Date().toISOString();

  const [
    { count: usersOnTrial },
    { count: trialExpired },
    { data: expiredUsers },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_end_date', 'is', null)
      .gt('trial_end_date', now),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_end_date', 'is', null)
      .lte('trial_end_date', now),
    supabase
      .from('profiles')
      .select('id')
      .not('trial_end_date', 'is', null)
      .lte('trial_end_date', now),
  ]);

  let trialConversions = 0;
  if (expiredUsers && expiredUsers.length > 0) {
    const expiredIds = expiredUsers.map((u: { id: string }) => u.id);
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .in('user_id', expiredIds)
      .eq('status', 'completed');
    trialConversions = count ?? 0;
  }

  return {
    usersOnTrial: usersOnTrial ?? 0,
    trialExpired: trialExpired ?? 0,
    trialConversions,
  };
}

export interface AdminReport {
  id: string;
  type: string;
  target_id: string;
  target_type: string;
  reason: string;
  status: string;
  created_at: string;
}

export async function getRecentReports(limit = 5): Promise<AdminReport[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('reports')
    .select('id, type, target_id, target_type, reason, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as AdminReport[]) ?? [];
}

// ── Security dashboard ────────────────────────────────────────────────────────

export interface SecurityStats {
  failedLoginsLast24h: number;
  totalLoginLogs: number;
  blockedIPs: number;
  suspiciousIPs: SuspiciousIP[];
}

export interface SuspiciousIP {
  ip_address: string;
  failure_count: number;
  last_attempt: string;
  distinct_emails: number;
}

export interface LoginLogEntry {
  id: string;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

export interface BlockedIPEntry {
  id: string;
  ip_address: string;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  blocked_by_profile: { full_name: string } | null;
}

export async function getSecurityStats(): Promise<SecurityStats> {
  const supabase = await createServiceRoleClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since1h  = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [
    { count: failedLoginsLast24h },
    { count: totalLoginLogs },
    { count: blockedIPs },
    { data: recentFailures },
  ] = await Promise.all([
    supabase.from('login_logs').select('*', { count: 'exact', head: true }).eq('success', false).gte('created_at', since24h),
    supabase.from('login_logs').select('*', { count: 'exact', head: true }),
    supabase.from('blocked_ips').select('*', { count: 'exact', head: true }),
    supabase.from('login_logs').select('ip_address, email, created_at').eq('success', false).gte('created_at', since1h),
  ]);

  // Aggregate suspicious IPs from recent failures
  const ipMap = new Map<string, { count: number; emails: Set<string>; last: string }>();
  for (const row of (recentFailures ?? [])) {
    const key = row.ip_address ?? 'unknown';
    const existing = ipMap.get(key) ?? { count: 0, emails: new Set(), last: row.created_at };
    existing.count++;
    if (row.email) existing.emails.add(row.email);
    if (row.created_at > existing.last) existing.last = row.created_at;
    ipMap.set(key, existing);
  }

  const suspiciousIPs: SuspiciousIP[] = Array.from(ipMap.entries())
    .filter(([, v]) => v.count >= 3)
    .map(([ip, v]) => ({
      ip_address: ip,
      failure_count: v.count,
      last_attempt: v.last,
      distinct_emails: v.emails.size,
    }))
    .sort((a, b) => b.failure_count - a.failure_count)
    .slice(0, 20);

  return {
    failedLoginsLast24h: failedLoginsLast24h ?? 0,
    totalLoginLogs: totalLoginLogs ?? 0,
    blockedIPs: blockedIPs ?? 0,
    suspiciousIPs,
  };
}

export async function getRecentLoginLogs(limit = 50): Promise<LoginLogEntry[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('login_logs')
    .select('id, email, ip_address, user_agent, success, failure_reason, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as unknown as LoginLogEntry[]) ?? [];
}

export async function getBlockedIPs(): Promise<BlockedIPEntry[]> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('blocked_ips')
    .select('id, ip_address, reason, expires_at, created_at')
    .order('created_at', { ascending: false });
  return (data as BlockedIPEntry[]) ?? [];
}

export async function blockIP(
  ipAddress: string,
  reason: string,
  adminId: string,
  expiresAt?: string
): Promise<void> {
  const supabase = await createServiceRoleClient();
  await supabase.from('blocked_ips').upsert({
    ip_address: ipAddress,
    reason,
    blocked_by: adminId,
    expires_at: expiresAt ?? null,
  }, { onConflict: 'ip_address' });
}

export async function unblockIP(ipAddress: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  await supabase.from('blocked_ips').delete().eq('ip_address', ipAddress);
}
