-- Migration: add columns that were missing from the initial schema.sql
-- Run this in the Supabase SQL Editor if your database was created from the original schema.sql

-- Add listing_type to properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS listing_type TEXT NOT NULL DEFAULT 'landlord'
    CHECK (listing_type IN ('landlord','broker','agent'));

-- Add is_taken to properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_taken BOOLEAN NOT NULL DEFAULT false;

-- Add district and area_name to service_providers
ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS area_name TEXT NOT NULL DEFAULT '';
