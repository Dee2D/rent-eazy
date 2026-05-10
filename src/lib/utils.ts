export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/[ -]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateProviderSlug(name: string, category: string, area: string): string {
  return slugifyText(`${name} ${category} ${area}`);
}

export function categoryToSlug(category: string): string {
  return slugifyText(category);
}

const CATEGORY_SLUG_MAP: Record<string, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleaning: 'Cleaning',
  security: 'Security',
  painting: 'Painting',
  carpentry: 'Carpentry',
  'moving-delivery': 'Moving & Delivery',
  gardening: 'Gardening',
};

export function slugToCategory(slug: string): string | null {
  return CATEGORY_SLUG_MAP[slug] ?? null;
}

export function areaSlugToName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

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
