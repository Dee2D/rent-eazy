export type UserRole = 'tenant' | 'landlord' | 'provider' | 'admin';
export type PaymentPeriod = 'monthly' | '6_months' | 'yearly';
export type PropertyType = 'apartment' | 'house' | 'bedsitter';
export type ListingType = 'landlord' | 'broker' | 'agent';
export type MobileMoneyProvider = 'mtn' | 'airtel';

// Matches the DB CHECK constraint (see migration: production_hardening)
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'expired';
export type PaymentType = 'listing' | 'subscription';

export type AuditAction =
  | 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.refunded'
  | 'listing.activated' | 'listing.deactivated' | 'listing.deleted' | 'listing.renewed'
  | 'provider.subscribed' | 'provider.deactivated'
  | 'trial.activated' | 'trial.expired'
  | 'user.role_changed' | 'user.deactivated' | 'user.reactivated' | 'user.banned'
  | 'report.submitted' | 'report.resolved' | 'report.dismissed'
  | 'login.success' | 'login.failed' | 'login.blocked'
  | 'phone.verified' | 'phone.otp_sent'
  | 'admin.2fa_verified' | 'admin.ip_blocked' | 'admin.ip_unblocked'
  | 'admin.action';

export interface Profile {
  id: string;
  full_name: string;
  phone_number: string | null;
  phone_verified: boolean;
  role: UserRole;
  created_at: string;
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_trial_active: boolean;
  accepted_terms: boolean;
  accepted_terms_at: string | null;
}

export interface LoginLog {
  id: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  type: 'fake_listing' | 'abusive_provider' | 'other';
  target_id: string;
  target_type: 'property' | 'provider';
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  title: string;
  description: string | null;
  price_ugx: number;
  payment_period: PaymentPeriod;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  district: string;
  area_name: string;
  latitude: number;
  longitude: number;
  listing_type: ListingType;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  view_count: number;
  property_images?: PropertyImage[];
  profiles?: Profile;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
}

export interface ServiceProvider {
  id: string;
  profile_id: string;
  category_id: string;
  description: string | null;
  latitude: number;
  longitude: number;
  district: string;
  area_name: string;
  is_visible: boolean;
  slug: string | null;
  profiles?: Profile;
  service_categories?: ServiceCategory;
}

export interface Subscription {
  id: string;
  provider_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Payment {
  id: string;
  user_id: string;
  amount_ugx: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  reference: string | null;
  reference_id: string | null;
  phone_number: string | null;
  mobile_provider: MobileMoneyProvider | null;
  verified_at: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PropertyFilters {
  q?: string;
  district?: string;
  area_name?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: PropertyType;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  type: 'property' | 'provider';
  title: string;
  subtitle: string;
  linkHref: string;
}
