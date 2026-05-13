'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function TurnstileWidget({ onVerify, onExpire, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef  = useRef<string | null>(null);

  const render = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey:           SITE_KEY,
      callback:          onVerify,
      'expired-callback': onExpire  ?? (() => {}),
      'error-callback':   onError   ?? (() => {}),
      theme: 'light',
      size: 'normal',
    });
  }, [onVerify, onExpire, onError]);

  // Pass a placeholder token immediately when Turnstile is not configured
  useEffect(() => {
    if (!SITE_KEY) {
      onVerify('no-captcha-configured');
      return;
    }

    if (window.turnstile) {
      render();
      return;
    }

    // Load Cloudflare Turnstile script once
    let script = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id  = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', render);

    return () => {
      script?.removeEventListener('load', render);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [render, onVerify]);

  if (!SITE_KEY) return null;

  return (
    <div ref={containerRef} className="flex justify-center" />
  );
}
