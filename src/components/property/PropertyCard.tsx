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

  const whatsappUrl = property.profiles?.phone_number
    ? `https://wa.me/${property.profiles.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your listing on Rent Eazy and I\'m interested.')}`
    : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-44 sm:h-48 bg-orange-100 dark:bg-slate-700">
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
        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg capitalize">
          {property.property_type}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-stone-900 dark:text-white text-sm leading-snug line-clamp-1">{property.title}</h3>
        <div className="flex items-center gap-1 text-stone-400 dark:text-slate-400 text-xs mt-1">
          <MapPin size={12} />
          <span className="truncate">{property.area_name}, {property.district}</span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-stone-500 dark:text-slate-400 text-xs">
          <span className="flex items-center gap-1"><Bed size={13} /> {property.bedrooms} bed</span>
          <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} bath</span>
        </div>

        <div className="mt-3">
          <p className="text-orange-500 font-bold text-sm mb-2">
            {formatUGX(property.price_ugx)}<span className="text-stone-400 dark:text-slate-500 font-normal">{formatPeriod(property.payment_period)}</span>
          </p>
          <div className="flex gap-2">
            <Link
              href={`/properties/${property.id}`}
              className="flex-1 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors min-h-[44px]"
            >
              View Details
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact on WhatsApp"
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors min-h-[44px] min-w-[44px]"
              >
                💬
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
