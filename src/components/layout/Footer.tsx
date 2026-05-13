import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-stone-900 dark:bg-slate-950 text-stone-300 dark:text-slate-400 py-10 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-extrabold text-xl mb-1" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            Rent <span className="text-orange-400">Eazy</span>
          </h3>
          <p className="text-xs text-orange-400/70 font-medium tracking-widest uppercase mb-2">Find. Rent. Live Easy.</p>
          <p className="text-sm text-stone-400 dark:text-slate-500">Find your perfect home or service provider across Uganda.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/properties" className="hover:text-orange-400 transition-colors">Browse Properties</Link>
            <Link href="/login" className="hover:text-orange-400 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-orange-400 transition-colors">Register</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">For Landlords</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/register" className="hover:text-orange-400 transition-colors">List a Property</Link>
            <Link href="/dashboard" className="hover:text-orange-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-stone-700 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-slate-600">
        <span>© {new Date().getFullYear()} Rent Eazy. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-orange-400 transition-colors">Terms &amp; Conditions</Link>
          <Link href="/privacy-policy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link>
          <Link href="/report" className="hover:text-orange-400 transition-colors">Report Abuse</Link>
        </div>
      </div>
    </footer>
  );
}
