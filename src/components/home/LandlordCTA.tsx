import Link from 'next/link';
import { Building2, Wrench } from 'lucide-react';

export default function LandlordCTA() {
  return (
    <section className="relative overflow-hidden bg-stone-900 dark:bg-slate-950 py-14 md:py-20">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'url(/patterns/bg-pattern.svg)', backgroundSize: '200px 200px' }}
        aria-hidden
      />
      {/* Orange accent top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-sky-500 to-orange-500" />

      <div className="relative max-w-7xl mx-auto px-4">

        <div className="text-center mb-10 md:mb-12">
          <h2
            className="text-3xl md:text-4xl font-extrabold text-white leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ready to grow with Rent Eazy?
          </h2>
          <p className="text-stone-400 text-base md:text-lg mt-3 max-w-xl mx-auto">
            Whether you have space to let or a skill to offer — get in front of thousands of Ugandans today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">

          {/* Landlords card */}
          <div className="relative overflow-hidden bg-white/5 hover:bg-white/8 border border-white/10 hover:border-orange-500/40 rounded-2xl p-8 transition-all group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-5">
              <Building2 size={22} className="text-orange-400" />
            </div>
            <span className="inline-block text-[11px] font-bold text-orange-400 tracking-widest uppercase mb-3">
              For Landlords
            </span>
            <h3
              className="text-xl font-extrabold text-white mb-3 leading-snug"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              List your property and let faster
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-6">
              Reach thousands of tenants searching for homes across Uganda. Add photos, pin your location, and go live in minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm shadow-lg shadow-orange-500/20"
            >
              List a Property
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Service Providers card */}
          <div className="relative overflow-hidden bg-white/5 hover:bg-white/8 border border-white/10 hover:border-sky-500/40 rounded-2xl p-8 transition-all group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center mb-5">
              <Wrench size={22} className="text-sky-400" />
            </div>
            <span className="inline-block text-[11px] font-bold text-sky-400 tracking-widest uppercase mb-3">
              For Service Providers
            </span>
            <h3
              className="text-xl font-extrabold text-white mb-3 leading-snug"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Offer your services and grow your business
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-6">
              Plumbers, electricians, cleaners, painters — list your services, appear on the map, and get discovered by customers near you.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm shadow-lg shadow-sky-500/20"
            >
              Join as a Provider
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
