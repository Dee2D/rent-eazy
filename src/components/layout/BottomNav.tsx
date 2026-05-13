'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Wrench, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/properties', label: 'Browse', icon: Building2 },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/dashboard', label: 'Account', icon: User },
];

const HIDDEN_PATHS = ['/admin', '/login', '/register', '/forgot-password'];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-stone-200 dark:border-slate-800">
      <div className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const finalHref = href === '/dashboard' && !user ? '/login' : href;
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={finalHref}
              className={`flex flex-col items-center justify-center gap-1 h-16 transition-colors active:bg-orange-50 dark:active:bg-orange-900/10 ${
                isActive
                  ? 'text-orange-500'
                  : 'text-stone-400 dark:text-slate-500'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold leading-none tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
