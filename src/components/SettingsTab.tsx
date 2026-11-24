import React from 'react';
import { LogOut, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { Task, ThemeMode, UserProfile } from '../types';
import { Avatar } from './Avatar';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsTabProps {
  profile: UserProfile | null;
  tasks: Task[];
  theme: ThemeMode;
  showCompleted: boolean;
  onChangeTheme: (theme: ThemeMode) => Promise<void>;
  onToggleShowCompleted: () => void;
  onSignOut: () => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  tasks,
  theme,
  showCompleted,
  onChangeTheme,
  onToggleShowCompleted,
  onSignOut,
}) => {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  return (
    <div className="space-y-5">
      {/* User Profile Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 flex items-center gap-4">
        <Avatar
          src={profile?.photoURL}
          name={profile?.displayName || 'Корбар'}
          size="lg"
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
            {profile?.displayName || 'Корбар'}
          </h2>
          {profile?.email && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {profile.email}
            </p>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {totalCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ҳамагӣ</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 tabular-nums">
            {activeCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Фаъол</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {completedCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Анҷомшуда</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {/* Theme Setting */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Намуди зоҳирӣ
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ҳолати рӯзона ё шабонаро интихоб кунед
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => onChangeTheme('light')}
              className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Равшан</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('dark')}
              className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Торик</span>
            </button>
          </div>
        </div>

        {/* Show Completed Setting */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Вазифаҳои анҷомшуда
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Намоиш додани вазифаҳои иҷрошуда дар рӯйхат
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleShowCompleted}
            className={`min-h-[42px] px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showCompleted
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {showCompleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{showCompleted ? 'Нишон дода шавад' : 'Пинҳон карда шавад'}</span>
          </button>
        </div>
      </div>

      {/* Android / PWA Install Button */}
      <PWAInstallButton />

      {/* Sign Out */}
      <button
        type="button"
        onClick={onSignOut}
        className="w-full min-h-[50px] rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Баромадан аз ҳисоб</span>
      </button>
    </div>
  );
};
