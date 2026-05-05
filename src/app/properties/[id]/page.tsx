import { notFound } from 'next/navigation';
import { Bed, Bath, MapPin, Home } from 'lucide-react';
import { getPropertyById } from '@/lib/supabase/properties';
import { formatUGX, formatPeriod } from '@/lib/utils';
import type { MapMarker } from '@/types';
import MapViewClient from '@/components/map/MapViewClient';
import PropertyImageGallery from '@/components/property/PropertyImageGallery';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let property;

  try {
    property = await getPropertyById(id);
  } catch {
    property = null;
  }

  if (!property) notFound();

  const whatsappUrl = property.profiles?.phone_number
    ? `https://wa.me/${property.profiles.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your listing on Rent Eazy')}`
    : null;

  const marker: MapMarker = {
    id: property.id,
    latitude: property.latitude,
    longitude: property.longitude,
    type: 'property',
    title: property.title,
    subtitle: `${formatUGX(property.price_ugx)}${formatPeriod(property.payment_period)}`,
    linkHref: `/properties/${property.id}`,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <PropertyImageGallery
          images={property.property_images ?? []}
          title={property.title}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{property.title}</h1>
            <div className="flex items-center gap-1 text-stone-400 text-sm mt-1">
              <MapPin size={14} />
              <span>{property.area_name}, {property.district}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-orange-500">{formatUGX(property.price_ugx)}</span>
            <span className="text-stone-400 text-sm">{formatPeriod(property.payment_period)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-stone-600 flex-wrap">
          <span className="flex items-center gap-1.5"><Bed size={16} /> {property.bedrooms} Bedroom{property.bedrooms > 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1.5"><Bath size={16} /> {property.bathrooms} Bathroom{property.bathrooms > 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1.5 capitalize"><Home size={16} /> {property.property_type}</span>
        </div>

        {property.description && (
          <div>
            <h2 className="font-semibold text-stone-900 mb-2">Description</h2>
            <p className="text-stone-600 text-sm leading-relaxed">{property.description}</p>
          </div>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            💬 Contact on WhatsApp
          </a>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-stone-900 mb-3">Location</h2>
        <div className="rounded-2xl overflow-hidden">
          <MapViewClient markers={[marker]} height="300px" interactive={false} />
        </div>
      </div>
    </div>
  );
}
