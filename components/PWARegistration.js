
'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('PWA Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('PWA Service Worker registration failed:', error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
}
