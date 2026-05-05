-- Run this in the Supabase SQL Editor

-- Add listing_type to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'landlord'
CHECK (listing_type IN ('landlord', 'broker', 'agent'));

-- Create storage bucket for property images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "property_images_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

-- Allow public read
CREATE POLICY "property_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow owners to delete their own files
CREATE POLICY "property_images_delete_own"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
