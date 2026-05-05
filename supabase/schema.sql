-- Easy Rent Uganda — Complete Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLES ───────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant','landlord','provider','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_ugx INTEGER NOT NULL,
  payment_period TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_period IN ('monthly','6_months','yearly')),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment','house','bedsitter')),
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  district TEXT NOT NULL,
  area_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE property_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false
);

CREATE TABLE service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO service_categories (name) VALUES
  ('Plumbing'),('Electrical'),('Cleaning'),('Security'),
  ('Painting'),('Carpentry'),('Moving & Delivery'),('Gardening');

CREATE TABLE service_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES service_categories(id) NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount_ugx INTEGER NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('listing','subscription')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  reference TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_properties_active ON properties(is_active, expires_at);
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_price ON properties(price_ugx);
CREATE INDEX idx_providers_visible ON service_providers(is_visible);
CREATE INDEX idx_payments_user ON payments(user_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- properties: anyone reads active; landlords CRUD their own
CREATE POLICY "properties_select_active" ON properties FOR SELECT USING (is_active = true OR auth.uid() = landlord_id);
CREATE POLICY "properties_insert_own" ON properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "properties_update_own" ON properties FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "properties_delete_own" ON properties FOR DELETE USING (auth.uid() = landlord_id);

-- property_images: public read; landlords insert for their properties
CREATE POLICY "property_images_select" ON property_images FOR SELECT USING (true);
CREATE POLICY "property_images_insert" ON property_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.landlord_id = auth.uid())
);

-- service_categories: public read
CREATE POLICY "service_categories_select" ON service_categories FOR SELECT USING (true);

-- service_providers: anyone reads visible; providers CRUD their own
CREATE POLICY "service_providers_select" ON service_providers FOR SELECT USING (is_visible = true OR auth.uid() = profile_id);
CREATE POLICY "service_providers_insert" ON service_providers FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "service_providers_update" ON service_providers FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "service_providers_delete" ON service_providers FOR DELETE USING (auth.uid() = profile_id);

-- payments: users read their own only
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (auth.uid() = user_id);

-- subscriptions: providers read their own
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.profile_id = auth.uid())
);
