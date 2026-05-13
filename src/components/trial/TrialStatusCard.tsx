import { checkTrialStatus } from '@/lib/supabase/trial';
import type { Profile } from '@/types';

interface Props {
  profile: Profile | null;
}

export default function TrialStatusCard({ profile }: Props) {
  const trial = checkTrialStatus(profile?.trial_end_date);

  if (!trial.isOnTrial || !profile?.trial_end_date) return null;

  const endDateStr = trial.endDate?.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 text-xs font-semibold px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Free Trial Active
        </span>
      </div>
      <p className="text-sm text-green-700 dark:text-green-400">
        Your provider subscription is free during the 3-month trial.
        Expires <strong>{endDateStr}</strong>.
      </p>
      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
        {trial.daysLeft} day{trial.daysLeft !== 1 ? 's' : ''} remaining in your free trial
      </p>
    </div>
  );
}
