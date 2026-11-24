import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowDown, Minus, Plus, X } from 'lucide-react';
import {
  Category,
  CategoryColor,
  PRIORITY_LABELS,
  Task,
  TaskPriority,
  VALIDATION_LIMITS,
  Workspace,
} from '../types';
import { TaskInput } from '../services/firestoreService';
import { getTodayISO, getTomorrowISO } from '../utils/tajikDate';

interface TaskSheetProps {
  open: boolean;
  editingTask: Task | null;
  defaultDate: string;
  workspace: Workspace;
  currentUserId: string;
  categories: Category[];
  onClose: () => void;
  onSave: (input: TaskInput, taskId?: string) => Promise<void>;
  onQuickCreateCategory: (name: string, color: CategoryColor) => Promise<Category>;
}

export const TaskSheet: React.FC<TaskSheetProps> = ({
  open,
  editingTask,
  defaultDate,
  workspace,
  currentUserId,
  categories,
  onClose,
  onSave,
  onQuickCreateCategory,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState('personal');
  const [dueDate, setDueDate] = useState(defaultDate);
  const [dueTime, setDueTime] = useState('');
  const [assignee, setAssignee] = useState('both');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setShowNewCat(false);
    setNewCatName('');
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setPriority(editingTask.priority);
      setCategoryId(editingTask.categoryId);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime);
      setAssignee(editingTask.assignee);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategoryId(categories[0]?.id || 'personal');
      setDueDate(defaultDate || getTodayISO());
      setDueTime('');
      setAssignee('both');
    }
  }, [open, editingTask, defaultDate, categories]);

  if (!open) return null;

  const todayIso = getTodayISO();
  const tomorrowIso = getTomorrowISO();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Лутфан сарлавҳаи вазифаро ворид кунед.');
      return;
    }
    const selectedCategory =
      categories.find((c) => c.id === categoryId) || categories[0];

    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          title: trimmed,
          description: description.trim(),
          priority,
          categoryId: selectedCategory?.id || 'personal',
          categoryName: selectedCategory?.name || 'Шахсӣ',
          dueDate: dueDate || todayIso,
          dueTime,
          assignee,
        },
        editingTask?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сабти вазифа анҷом нашуд.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    const clean = newCatName.trim();
    if (!clean || creatingCat) return;
    setCreatingCat(true);
    try {
      const created = await onQuickCreateCategory(clean, 'teal');
      setCategoryId(created.id);
      setNewCatName('');
      setShowNewCat(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Гурӯҳ сохта нашуд.');
    } finally {
      setCreatingCat(false);
    }
  };

  const hasPartner = Boolean(workspace.partnerId);
  const myLabel =
    currentUserId === workspace.ownerId ? workspace.ownerName : workspace.partnerName || 'Ман';
  const partnerLabel =
    currentUserId === workspace.ownerId ? workspace.partnerName : workspace.ownerName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-sheet-title"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Android bottom sheet drag handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="task-sheet-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {editingTask ? 'Таҳрири вазифа' : 'Вазифаи нав'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Пӯшидан"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Сарлавҳа
            </label>
            <input
              id="task-title"
              type="text"
              required
              autoFocus
              maxLength={VALIDATION_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Масалан: Харидани маҳсулот барои шом"
              className="w-full min-h-[48px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-desc"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Тавсиф (ихтиёрӣ)
            </label>
            <textarea
              id="task-desc"
              rows={2}
              maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Тафсилоти иловагӣ ё рӯйхати кӯтоҳ..."
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Афзалият
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => {
                const active = priority === p;
                const Icon = p === 'high' ? AlertCircle : p === 'medium' ? Minus : ArrowDown;
                const activeClasses =
                  p === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
                    : p === 'medium'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300'
                      : 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300';

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? activeClasses
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{PRIORITY_LABELS[p]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Гурӯҳ
              </span>
              <button
                type="button"
                onClick={() => setShowNewCat((prev) => !prev)}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Гурӯҳи нав</span>
              </button>
            </div>

            {showNewCat && (
              <div className="mb-2.5 flex gap-2">
                <input
                  type="text"
                  maxLength={VALIDATION_LIMITS.CATEGORY_NAME_MAX}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Номи гурӯҳи нав..."
                  className="flex-1 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCat || !newCatName.trim()}
                  className="min-h-[44px] px-4 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Илова
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-teal-700 border-teal-700 text-white'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deadline Date & Time */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Мӯҳлат (сана ва вақт)
            </span>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setDueDate(todayIso)}
                className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  dueDate === todayIso
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Имрӯз
              </button>
              <button
                type="button"
                onClick={() => setDueDate(tomorrowIso)}
                className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  dueDate === tomorrowIso
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Пагоҳ
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                required
                aria-label="Санаи мӯҳлат"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[46px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <input
                type="time"
                aria-label="Вақти мӯҳлат"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full min-h-[46px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ба кӣ супорида шавад?
            </span>
            <div className={`grid gap-2 ${hasPartner ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <button
                type="button"
                onClick={() => setAssignee('both')}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold truncate cursor-pointer ${
                  assignee === 'both'
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Барои ҳарду
              </button>
              <button
                type="button"
                onClick={() => setAssignee(currentUserId)}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold truncate cursor-pointer ${
                  assignee === currentUserId
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {myLabel}
              </button>
              {hasPartner && (
                <button
                  type="button"
                  onClick={() =>
                    setAssignee(
                      currentUserId === workspace.ownerId
                        ? workspace.partnerId
                        : workspace.ownerId
                    )
                  }
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold truncate cursor-pointer ${
                    assignee !== 'both' && assignee !== currentUserId
                      ? 'bg-teal-700 border-teal-700 text-white'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {partnerLabel}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Sticky Sheet Footer */}
        <div className="px-5 py-3.5 pb-safe border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold whitespace-nowrap cursor-pointer"
          >
            Бекор кардан
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={saving}
            className="flex-1 min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer"
          >
            {saving ? 'Дар ҳоли сабт...' : editingTask ? 'Навсозӣ кардан' : 'Сабт кардан'}
          </button>
        </div>
      </div>
    </div>
  );
};
