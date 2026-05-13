'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, Users, CreditCard, Shield, Monitor, Flag, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Properties',  icon: Building2 },
  { href: '/admin/users',      label: 'Users',       icon: Users },
  { href: '/admin/payments',   label: 'Payments',    icon: CreditCard },
  { href: '/admin/security',   label: 'Security',    icon: Shield },
  { href: '/admin/fraud',      label: 'Fraud',       icon: Flag },
  { href: '/admin/system',     label: 'System',      icon: Monitor },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const navContent = (
    <>
      <div className="p-6 border-b border-stone-800">
        <p className="text-xl font-bold tracking-tight">
          Rent <span className="text-orange-500">Eazy</span>
        </p>
        <p className="text-xs text-stone-500 mt-0.5 uppercase tracking-widest">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 w-full transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-stone-900 text-white flex-col shrink-0">
        {navContent}
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-stone-900 text-white flex items-center justify-between px-4 py-3 shadow-md">
        <p className="text-lg font-bold">
          Rent <span className="text-orange-500">Eazy</span>{' '}
          <span className="text-stone-400 text-xs font-normal">Admin</span>
        </p>
        <button onClick={() => setMobileOpen((v) => !v)} className="text-stone-300 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <aside className="w-72 max-w-[80vw] bg-stone-900 text-white flex flex-col pt-14 shadow-2xl">
            {navContent}
          </aside>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
