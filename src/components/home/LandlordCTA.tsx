import Link from 'next/link';

export default function LandlordCTA() {
  return (
    <section className="relative overflow-hidden bg-stone-900 dark:bg-slate-950 py-14 md:py-20">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'url(/patterns/bg-pattern.svg)', backgroundSize: '200px 200px' }}
        aria-hidden
      />
      {/* Orange accent top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
      {/* Warm glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <span className="inline-block bg-orange-500/20 text-orange-400 text-[11px] font-bold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase border border-orange-500/30">
          For Landlords
        </span>
        <h2
          className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Ready to let your property?
        </h2>
        <p className="text-stone-400 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Reach thousands of tenants searching for homes across Uganda. List in minutes and let faster.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
          >
            Start for Free
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/properties"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-7 py-3.5 rounded-xl border border-white/20 hover:border-white/30 transition-all text-base"
          >
            Browse Properties First
          </Link>
        </div>
      </div>
    </section>
  );
}
