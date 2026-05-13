import { checkTrialStatus } from '@/lib/supabase/trial';
import type { Profile } from '@/types';

interface Props {
  profile: Profile | null;
}

export default function TrialBanner({ profile }: Props) {
  const trial = checkTrialStatus(profile?.trial_end_date);

  if (!profile?.trial_end_date) return null;

  if (trial.isOnTrial) {
    const endDateStr = trial.endDate?.toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🎉</span>
        <div>
          <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
            Free 3-Month Trial Active
          </p>
          <p className="text-green-700 dark:text-green-400 text-sm mt-0.5">
            Enjoy free property listings until <strong>{endDateStr}</strong>.{' '}
            <span className="font-medium">{trial.daysLeft} day{trial.daysLeft !== 1 ? 's' : ''} remaining.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl px-5 py-4 flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">⏰</span>
      <div>
        <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">
          Your free trial has ended
        </p>
        <p className="text-orange-700 dark:text-orange-400 text-sm mt-0.5">
          New listings now require a payment of UGX 10,000 per property.
        </p>
      </div>
    </div>
  );
}
