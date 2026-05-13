export type UserRole = 'tenant' | 'landlord' | 'provider' | 'admin';
export type PaymentPeriod = 'monthly' | '6_months' | 'yearly';
export type PropertyType = 'apartment' | 'house' | 'bedsitter';
export type ListingType = 'landlord' | 'broker' | 'agent';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentType = 'listing' | 'subscription';

export interface Profile {
  id: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  created_at: string;
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_trial_active: boolean;
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
  created_at: string;
}

export interface PropertyFilters {
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
