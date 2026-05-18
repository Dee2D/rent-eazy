import type { AvailabilityStatus } from '@/types';

const CONFIG: Record<AvailabilityStatus, { label: string; dot: string; text: string; bg: string }> = {
  available: {
    label: 'Available',
    dot:  'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    bg:   'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  },
  busy: {
    label: 'Busy',
    dot:  'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg:   'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
  offline: {
    label: 'Offline',
    dot:  'bg-stone-400 dark:bg-slate-500',
    text: 'text-stone-500 dark:text-slate-400',
    bg:   'bg-stone-50 dark:bg-slate-700 border-stone-200 dark:border-slate-600',
  },
};

interface Props {
  status: AvailabilityStatus;
  size?: 'sm' | 'md';
}

export default function AvailabilityBadge({ status, size = 'md' }: Props) {
  const c = CONFIG[status] ?? CONFIG.offline;
  const dotSize  = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold ${c.bg} ${c.text} ${textSize}`}>
      <span className={`${dotSize} rounded-full ${c.dot} ${status === 'available' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}
