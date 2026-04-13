'use client';

import { useEffect, useState } from 'react';

export default function PWARegistration() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered:', reg.scope);
          // Reload when a new service worker takes over
          reg.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        })
        .catch((err) => {
          console.error('PWA Service Worker registration failed:', err);
        });
    }

    // Capture the install prompt for Android/Chrome
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Hide banner if user already installed
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setInstallPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: '420px',
      backgroundColor: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 9999,
    }}>
      <img src="/icon-192.png" alt="Lini HRIS" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>Install Lini HRIS</p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Tambahkan ke layar utama untuk akses cepat</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={() => setShowBanner(false)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', background: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}
        >
          Nanti
        </button>
        <button
          onClick={handleInstall}
          style={{ padding: '0.5rem 0.875rem', backgroundColor: '#00AEEF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
