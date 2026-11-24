import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, Users, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  pendingInviteCode?: string | null;
  errorMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignIn,
  pendingInviteCode,
  errorMessage,
}) => {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onSignIn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] dark:bg-slate-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Visual Hero Card */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
            {!imgError ? (
              <img
                src="/src/assets/images/lifetasks_welcome_duo_1795379558719.jpg"
                alt="Нақшабандии муштараки вазифаҳо барои ду нафар"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full aspect-[4/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-teal-700/10 via-slate-100 to-emerald-600/10 dark:from-teal-900/30 dark:via-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-teal-700 dark:text-teal-400 mb-3" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  LifeTasks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Auth & Value Copy */}
        <div className="lg:col-span-6 order-2 lg:order-1 flex flex-col">
          <div className="mb-3">
            <span className="text-sm font-semibold tracking-tight text-teal-700 dark:text-teal-400">
              LifeTasks
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4 [text-wrap:balance]">
            Вазифаҳои рӯзмарраро якҷоя ва ором идора кунед
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-xl">
            Барномаи қулай барои ду нафар — вазифаҳо, муҳлатҳо, афзалиятҳо ва нақшаҳои рӯзона, ҳафтаина ва моҳонаро дар вақти воқеӣ ҳамоҳанг созед.
          </p>

          {pendingInviteCode && (
            <div className="mb-6 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-4 py-3.5 text-sm text-teal-900 dark:text-teal-200">
              Шумо бо рамзи даъвати <span className="font-mono font-semibold">{pendingInviteCode}</span> даъват шудаед. Пас аз воридшавӣ пайваст шудан мумкин аст.
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-[0.99] disabled:opacity-60 text-white font-semibold text-base px-6 py-3.5 transition-all shadow-sm cursor-pointer"
          >
            <span>{loading ? 'Дар ҳоли воридшавӣ...' : 'Воридшавӣ бо Google'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Unboxed key capabilities */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-teal-700 dark:text-teal-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                <span className="block font-semibold text-slate-900 dark:text-slate-200 mb-0.5">
                  Барои 2 нафар
                </span>
                Ҳамоҳангсозии фаврӣ бо шарик
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays className="w-4 h-4 text-teal-700 dark:text-teal-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                <span className="block font-semibold text-slate-900 dark:text-slate-200 mb-0.5">
                  Се намуди намоиш
                </span>
                Рӯзона, ҳафтаина ва моҳона
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                <span className="block font-semibold text-slate-900 dark:text-slate-200 mb-0.5">
                  Тартиб ва мӯҳлат
                </span>
                Афзалиятҳо ва гурӯҳҳои равшан
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
