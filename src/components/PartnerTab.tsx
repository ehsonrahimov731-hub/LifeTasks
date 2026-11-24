import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Link2,
  RefreshCw,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { VALIDATION_LIMITS, Workspace } from '../types';
import { Avatar } from './Avatar';

interface PartnerTabProps {
  workspace: Workspace;
  currentUserId: string;
  pendingInviteCode?: string | null;
  onUpdateWorkspaceName: (name: string) => Promise<void>;
  onRegenerateCode: () => Promise<string>;
  onJoinByCode: (code: string) => Promise<void>;
  onRemoveOrLeave: () => Promise<void>;
  onClearPendingInvite: () => void;
}

export const PartnerTab: React.FC<PartnerTabProps> = ({
  workspace,
  currentUserId,
  pendingInviteCode,
  onUpdateWorkspaceName,
  onRegenerateCode,
  onJoinByCode,
  onRemoveOrLeave,
  onClearPendingInvite,
}) => {
  const [wsName, setWsName] = useState(workspace.name);
  const [savingName, setSavingName] = useState(false);
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const [joinCode, setJoinCode] = useState(pendingInviteCode || '');
  const [joining, setJoining] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setWsName(workspace.name);
  }, [workspace.name]);

  useEffect(() => {
    if (pendingInviteCode) {
      setJoinCode(pendingInviteCode);
    }
  }, [pendingInviteCode]);

  const isOwner = workspace.ownerId === currentUserId;
  const hasPartner = Boolean(workspace.partnerId);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = wsName.trim();
    if (!trimmed || trimmed === workspace.name) return;
    setSavingName(true);
    setMessage(null);
    try {
      await onUpdateWorkspaceName(trimmed);
      setMessage({ type: 'success', text: 'Номи фазои корӣ навсозӣ шуд.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ном навсозӣ нашуд.',
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleCopy = async (type: 'code' | 'link') => {
    const value =
      type === 'code'
        ? workspace.inviteCode
        : `${window.location.origin}/?invite=${workspace.inviteCode}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Нусхабардорӣ имконнопазир буд.' });
    }
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    setMessage(null);
    try {
      await onRegenerateCode();
      setMessage({ type: 'success', text: 'Рамзи нави даъват сохта шуд.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Рамзи нав сохта нашуд.',
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    setMessage(null);
    try {
      await onJoinByCode(joinCode);
      setJoinCode('');
      onClearPendingInvite();
      setMessage({ type: 'success', text: 'Шумо бо муваффақият ба фазои муштарак пайваст шудед!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Пайвастшавӣ анҷом нашуд.',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleUnlink = async () => {
    if (unlinking) return;
    setUnlinking(true);
    setMessage(null);
    try {
      await onRemoveOrLeave();
      setConfirmUnlink(false);
      setMessage({
        type: 'success',
        text: isOwner ? 'Шарик аз фазо ҷудо карда шуд.' : 'Шумо аз фазои муштарак баромадед.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Амалиёт анҷом нашуд.',
      });
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-5">
      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl px-4 py-3 text-sm border ${
            message.type === 'success'
              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Workspace Members Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Иштирокчиёни фазо
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {workspace.memberIds.length} аз 2 нафар пайваст аст
            </p>
          </div>
          <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />
        </div>

        {/* Workspace Name Edit (Owner) */}
        {isOwner && (
          <form onSubmit={handleSaveName} className="flex gap-2">
            <input
              type="text"
              maxLength={VALIDATION_LIMITS.WORKSPACE_NAME_MAX}
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              aria-label="Номи фазои корӣ"
              className="flex-1 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              disabled={savingName || !wsName.trim() || wsName.trim() === workspace.name}
              className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-40 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Сабт
            </button>
          </form>
        )}

        {/* Two Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* User 1 (Owner) */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3.5 flex items-center gap-3">
            <Avatar src={workspace.ownerPhoto} name={workspace.ownerName} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {workspace.ownerName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Соҳиби фазо{workspace.ownerId === currentUserId ? ' · Шумо' : ''}
              </p>
            </div>
          </div>

          {/* User 2 (Partner) */}
          {hasPartner ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3.5 flex items-center gap-3">
              <Avatar src={workspace.partnerPhoto} name={workspace.partnerName || 'Шарик'} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {workspace.partnerName || 'Шарик'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Шарик{workspace.partnerId === currentUserId ? ' · Шумо' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ҷои шарик холӣ аст
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Рамзи даъватро ба шахси дуюм фиристед
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Unlink / Leave Action */}
        {hasPartner && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isOwner
                ? 'Метавонед шарикро аз фазо ҷудо кунед'
                : 'Метавонед ба фазои шахсии худ баргардед'}
            </span>
            {!confirmUnlink ? (
              <button
                type="button"
                onClick={() => setConfirmUnlink(true)}
                className="min-h-[40px] px-3.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <UserMinus className="w-4 h-4" />
                <span>{isOwner ? 'Ҷудо кардан' : 'Баромадан аз фазо'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="min-h-[40px] px-3.5 rounded-xl bg-rose-600 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  {unlinking ? 'Интизор...' : 'Тасдиқ'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmUnlink(false)}
                  className="min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Бекор
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Partner Card (Shown for owner when unpaired, or always visible as code reference) */}
      {isOwner && !hasPartner && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Даъвати шарики дуюм
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ин рамз ё истинодро ба шарики худ фиристед, то вазифаҳоро якҷоя идора кунед.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-3">
            <span className="font-mono text-2xl font-bold tracking-widest text-teal-800 dark:text-teal-300 tabular-nums select-all">
              {workspace.inviteCode}
            </span>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              aria-label="Сохтани рамзи нав"
              className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Рамзи нав</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleCopy('code')}
              className="min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {copiedType === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === 'code' ? 'Рамз нусха шуд' : 'Нусхабардории рамз'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy('link')}
              className="min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {copiedType === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              <span>{copiedType === 'link' ? 'Истинод нусха шуд' : 'Нусхаи истинод'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Join another workspace by code (only when currently solo) */}
      {!hasPartner && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Бо рамзи даъват пайваст шудан
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Агар шарики шумо рамзи 6-рақама фиристода бошад, онро дар поён ворид кунед.
            </p>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              maxLength={VALIDATION_LIMITS.INVITE_CODE_MAX}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Масалан: K7M9P2"
              className="flex-1 min-h-[48px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 font-mono text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              disabled={joining || joinCode.trim().length < 6}
              className="min-h-[48px] px-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-40 text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              {joining ? 'Пайвастшавӣ...' : 'Пайваст шудан'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
