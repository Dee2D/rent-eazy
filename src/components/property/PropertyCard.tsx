import Link from 'next/link';
import Image from 'next/image';
import { Bed, Bath, MapPin } from 'lucide-react';
import { formatUGX, formatPeriod } from '@/lib/utils';
import type { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.property_images?.find((img) => img.is_primary) ?? property.property_images?.[0];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-orange-100 dark:bg-slate-700">
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-orange-300 text-5xl">🏠</div>
        )}
        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-lg capitalize">
          {property.property_type}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-stone-900 dark:text-white text-sm line-clamp-1">{property.title}</h3>
        <div className="flex items-center gap-1 text-stone-400 dark:text-slate-400 text-xs mt-1">
          <MapPin size={12} />
          <span>{property.area_name}, {property.district}</span>
        </div>

        <div className="flex items-center gap-3 mt-3 text-stone-500 dark:text-slate-400 text-xs">
          <span className="flex items-center gap-1"><Bed size={13} /> {property.bedrooms} bed</span>
          <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} bath</span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-orange-500 font-bold text-sm">
            {formatUGX(property.price_ugx)}<span className="text-stone-400 dark:text-slate-500 font-normal">{formatPeriod(property.payment_period)}</span>
          </p>
          <Link
            href={`/properties/${property.id}`}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
