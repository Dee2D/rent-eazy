'use client';

import { useEffect, useRef } from 'react';

interface Props {
  providerId: string;
  eventType: 'profile_view' | 'whatsapp_click' | 'call_click';
}

// Fires a single analytics event on mount — fire-and-forget, no UI.
export default function AnalyticsTracker({ providerId, eventType }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    fetch('/api/provider/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, eventType }),
    }).catch(() => {});
  }, [providerId, eventType]);

  return null;
}
