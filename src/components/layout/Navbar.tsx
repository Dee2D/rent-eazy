'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-stone-100 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-extrabold tracking-tight"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          <span className="text-stone-900 dark:text-white">Rent</span>
          <span className="text-orange-500">Eazy</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-stone-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm font-medium">Home</Link>
          <Link href="/properties" className="text-stone-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm font-medium">Properties</Link>
          <Link href="/services" className="text-stone-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm font-medium">Services</Link>
        </div>

        {/* Auth area + theme toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {loading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                  {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                {profile?.full_name?.split(' ')[0]}
                <ChevronDown size={14} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-12 bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-xl shadow-lg w-48 py-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link
                    href="/dashboard/saved"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Heart size={14} /> Saved Properties
                  </Link>
                  <button
                    onClick={() => { signOut(); setDropdownOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-stone-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="text-stone-600 dark:text-slate-300"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-stone-100 dark:border-slate-800 px-4 py-4 flex flex-col gap-3">
          <Link href="/" className="text-stone-700 dark:text-slate-200 font-medium" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/properties" className="text-stone-700 dark:text-slate-200 font-medium" onClick={() => setMenuOpen(false)}>Properties</Link>
          <Link href="/services" className="text-stone-700 dark:text-slate-200 font-medium" onClick={() => setMenuOpen(false)}>Services</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-stone-700 dark:text-slate-200 font-medium" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="text-left text-red-500 font-medium">Sign Out</button>
            </>
          ) : (
            <Link href="/login" className="text-orange-500 font-semibold" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
