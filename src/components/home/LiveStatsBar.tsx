import Link from 'next/link';
import { Building2, Users, MapPin } from 'lucide-react';

interface LiveStatsBarProps {
  stats: { properties: number; providers: number };
}

export default function LiveStatsBar({ stats }: LiveStatsBarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-stone-100 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">

          <Link href="/properties" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
              <Building2 size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-stone-900 dark:text-white leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                {stats.properties}+
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">Active Listings</p>
            </div>
          </Link>

          <div className="h-8 w-px bg-stone-100 dark:bg-slate-700 hidden md:block" />

          <Link href="/services" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors">
              <Users size={18} className="text-sky-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-stone-900 dark:text-white leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                {stats.providers}+
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">Service Providers</p>
            </div>
          </Link>

          <div className="h-8 w-px bg-stone-100 dark:bg-slate-700 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <MapPin size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-stone-900 dark:text-white leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                All Uganda
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">Nationwide Coverage</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
