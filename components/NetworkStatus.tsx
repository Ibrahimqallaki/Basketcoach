import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
        px-6 py-3 rounded-full
        flex items-center gap-3
        text-sm font-bold
        shadow-xl backdrop-blur-xl
        transition-all duration-300
        ${isOnline 
          ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
          : 'bg-rose-500/20 border border-rose-500/30 text-rose-400 animate-pulse'
        }
      `}
    >
      {isOnline ? (
        <>
          <Wifi size={18} className="text-emerald-500" />
          <span>Ansluten igen</span>
        </>
      ) : (
        <>
          <WifiOff size={18} className="text-rose-500" />
          <span>Ingen internetanslutning</span>
        </>
      )}
    </div>
  );
};

export default NetworkStatus;
