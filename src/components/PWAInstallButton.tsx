import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="w-full min-h-[48px] rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 px-4 transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Насб кардан дар телефон (Android)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="w-full min-h-[48px] rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold inline-flex items-center justify-center gap-2 px-4 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Насб кардан дар экрани асосӣ</span>
        </button>

        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Насб дар экрани асосӣ
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Пӯшидан"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                1. Дар браузери Safari тугмаи <strong>Мубодила (Share)</strong>-ро пахш кунед.
                <br />
                2. Банди <strong>Ба экрани асосӣ (Add to Home Screen)</strong>-ро интихоб кунед.
              </p>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-teal-700 text-white text-sm font-semibold cursor-pointer"
              >
                Фаҳмо
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-36 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 rounded-2xl bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Пайвасти интернет нест — тағйирот пас аз пайвастшавӣ сабт мешавад</span>
    </div>
  );
};
