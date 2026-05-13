export interface TrialStatus {
  isOnTrial: boolean;
  daysLeft: number;
  endDate: Date | null;
}

export function checkTrialStatus(trialEndDate: string | null | undefined): TrialStatus {
  if (!trialEndDate) {
    return { isOnTrial: false, daysLeft: 0, endDate: null };
  }

  const now = new Date();
  const endDate = new Date(trialEndDate);
  const isOnTrial = endDate > now;
  const daysLeft = isOnTrial
    ? Math.ceil((endDate.getTime() - now.getTime()) / 86400000)
    : 0;

  return { isOnTrial, daysLeft, endDate };
}
