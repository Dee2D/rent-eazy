import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'orange' | 'blue' | 'green' | 'red' | 'purple';
  subtitle?: string;
}

const colorMap: Record<NonNullable<StatsCardProps['color']>, string> = {
  orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  blue:   'text-blue-500   bg-blue-50   dark:bg-blue-900/20',
  green:  'text-green-500  bg-green-50  dark:bg-green-900/20',
  red:    'text-red-500    bg-red-50    dark:bg-red-900/20',
  purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
};

export default function StatsCard({ title, value, icon: Icon, color = 'orange', subtitle }: StatsCardProps) {
  const cls = colorMap[color];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stone-400 dark:text-slate-500 font-medium uppercase tracking-wide">{title}</p>
        <div className={`p-2 rounded-xl ${cls.split(' ').slice(1).join(' ')}`}>
          <Icon size={16} className={cls.split(' ')[0]} />
        </div>
      </div>
      <p className="text-3xl font-bold text-stone-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-stone-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
