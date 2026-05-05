export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString('en-UG')}`;
}

export function formatPeriod(period: string): string {
  const map: Record<string, string> = {
    monthly: '/mo',
    '6_months': '/6mo',
    yearly: '/yr',
  };
  return map[period] ?? '';
}

export function generatePaymentReference(): string {
  return `ERU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function isPropertyActive(property: {
  is_active: boolean;
  expires_at: string | null;
}): boolean {
  if (!property.is_active) return false;
  if (!property.expires_at) return false;
  return new Date(property.expires_at) > new Date();
}
