'use client';

import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      suppressHydrationWarning
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-9 h-9 shrink-0 rounded-full border border-stone-200 dark:border-slate-600 flex items-center justify-center text-base hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
