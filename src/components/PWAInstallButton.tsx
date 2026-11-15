import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { isInstallable: !!deferredPrompt, isInstalled, isIOS, install };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOnline;
}

export const CanvaIconSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="2.1" fill="currentColor" fillOpacity="0.16" />
    <path d="M2 4H22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 16V20M8.5 20H15.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M7.5 12V10M12 12V8.5M16.5 12V7.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
  </svg>
);

export const PWAInstallButton: React.FC = () => {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* View Slide Deck Direct Link with Canva Icon */}
      <a
        href="https://canva.link/ddh7tcyekbmjkw0"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View slide deck"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] hover:brightness-110 px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition cursor-pointer shrink-0 min-h-[44px]"
      >
        <CanvaIconSvg className="w-4 h-4 shrink-0" />
        <span>View slide deck</span>
      </a>

      {/* View Github Direct Link */}
      <a
        href="https://github.com/vibecoder0715/aegis"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View Github"
        className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] hover:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition cursor-pointer shrink-0 min-h-[44px]"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
          aria-hidden="true"
          className="w-4 h-4 text-white shrink-0"
        >
          <path d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.01-1.04-0.015-2.04-3.338 0.724-4.042-1.61-4.042-1.61-0.546-1.385-1.335-1.755-1.335-1.755-1.087-0.744 0.084-0.729 0.084-0.729 1.205 0.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495 0.998 0.108-0.776 0.417-1.305 0.76-1.605-2.665-0.3-5.466-1.332-5.466-5.93 0-1.31 0.465-2.38 1.235-3.22-0.135-0.303-0.54-1.523 0.105-3.176 0 0 1.005-0.322 3.3 1.23 0.96-0.267 1.98-0.399 3-0.405 1.02 0.006 2.04 0.138 3 0.405 2.28-1.552 3.285-1.23 3.285-1.23 0.645 1.653 0.24 2.873 0.12 3.176 0.765 0.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92 0.42 0.36 0.81 1.096 0.81 2.22 0 1.606-0.015 2.896-0.015 3.286 0 0.315 0.21 0.69 0.825 0.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
        <span>View Github</span>
      </a>
    </div>
  );
};

export const OfflineIndicator: React.FC<{ simulatedOffline?: boolean }> = ({
  simulatedOffline = false,
}) => {
  const isOnline = useOnlineStatus();
  if (isOnline && !simulatedOffline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 shadow-lg border border-amber-300">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Watch Mode Active</span>
    </div>
  );
};
