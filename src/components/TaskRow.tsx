import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  Check,
  Clock,
  Minus,
  Pencil,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { PRIORITY_LABELS, Task, Workspace } from '../types';
import { formatTajikDeadline, isTaskOverdue } from '../utils/tajikDate';

interface TaskRowProps {
  task: Task;
  workspace: Workspace;
  currentUserId: string;
  onToggleComplete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  showDateInMeta?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  workspace,
  currentUserId,
  onToggleComplete,
  onEdit,
  onDelete,
  showDateInMeta = true,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const overdue = isTaskOverdue(task.dueDate, task.dueTime, task.completed);

  const assigneeLabel = (() => {
    if (task.assignee === 'both') return 'Барои ҳарду';
    if (task.assignee === currentUserId) return 'Ман';
    if (task.assignee === workspace.ownerId) return workspace.ownerName;
    if (task.assignee === workspace.partnerId && workspace.partnerName) return workspace.partnerName;
    return 'Шарик';
  })();

  const priorityMeta = {
    high: {
      icon: AlertCircle,
      textClass: 'text-rose-600 dark:text-rose-400 font-semibold',
    },
    medium: {
      icon: Minus,
      textClass: 'text-amber-600 dark:text-amber-400 font-medium',
    },
    low: {
      icon: ArrowDown,
      textClass: 'text-sky-600 dark:text-sky-400 font-medium',
    },
  }[task.priority];

  const PriorityIcon = priorityMeta.icon;

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onToggleComplete(task);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(task.id);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className={`group rounded-2xl bg-white dark:bg-slate-900 border-2 px-3 py-3 sm:px-4 transition-colors duration-150 ${task.completed ? 'border-emerald-500 dark:border-emerald-400 opacity-70' : task.priority === 'high' ? 'border-rose-500 dark:border-rose-400' : task.priority === 'medium' ? 'border-amber-400 dark:border-amber-400' : 'border-white dark:border-white'}`}
    >
      <div className="flex items-start gap-2.5">
        {/* 44x44px minimum touch hitbox for checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy}
          aria-label={task.completed ? 'Вазифаро нотамом кардан' : 'Вазифаро анҷом додан'}
          className="min-w-[44px] min-h-[44px] -ml-1.5 -mt-1 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
        >
          <span
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 ${
              task.completed
                ? 'bg-teal-700 border-teal-700 text-white'
                : task.priority === 'high'
                  ? 'border-rose-500 dark:border-rose-400 bg-transparent'
                  : 'border-slate-300 dark:border-slate-600 bg-transparent'
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
        </button>

        {/* Task Content */}
        <div
          onClick={() => onEdit(task)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdit(task);
            }
          }}
          className="flex-1 min-w-0 pt-0.5 text-left cursor-pointer"
        >
          <p
            className={`text-[15px] font-semibold leading-snug break-words ${
              task.completed
                ? 'line-through text-slate-500 dark:text-slate-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Unboxed inline metadata separated by · (Zero-Pill Discipline) */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {task.categoryName}
            </span>

            <span aria-hidden="true">·</span>

            <span className={`inline-flex items-center gap-1 ${priorityMeta.textClass}`}>
              <PriorityIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{PRIORITY_LABELS[task.priority]}</span>
            </span>

            {(showDateInMeta || task.dueTime) && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={`inline-flex items-center gap-1 tabular-nums ${
                    overdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {showDateInMeta
                      ? formatTajikDeadline(task.dueDate, task.dueTime)
                      : task.dueTime}
                    {overdue ? ' (Гузашта)' : ''}
                  </span>
                </span>
              </>
            )}

            <span aria-hidden="true">·</span>

            <span className="inline-flex items-center gap-1">
              {task.assignee === 'both' ? (
                <Users className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{assigneeLabel}</span>
            </span>

            {task.completed && task.completedByName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-teal-700 dark:text-teal-400">
                  Анҷом: {task.completedByName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center shrink-0 -mr-1.5 -mt-1">
          {!confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label="Таҳрир кардан"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Ҳазф кардан"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={busy}
                className="min-h-[40px] px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Ҳазф
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[40px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap cursor-pointer"
              >
                Не
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
