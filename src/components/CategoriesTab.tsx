import React, { useState } from 'react';
import { FolderPlus, Trash2, ArrowRight } from 'lucide-react';
import {
  CATEGORY_COLOR_META,
  Category,
  CategoryColor,
  Task,
  VALIDATION_LIMITS,
} from '../types';

interface CategoriesTabProps {
  categories: Category[];
  tasks: Task[];
  onCreateCategory: (name: string, color: CategoryColor) => Promise<Category>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onOpenCategoryTasks: (categoryId: string) => void;
}

const COLOR_OPTIONS: CategoryColor[] = [
  'teal',
  'amber',
  'rose',
  'sky',
  'indigo',
  'emerald',
  'slate',
];

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  tasks,
  onCreateCategory,
  onDeleteCategory,
  onOpenCategoryTasks,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<CategoryColor>('teal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setSaving(true);
    setError(null);
    try {
      await onCreateCategory(clean, color);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Гурӯҳ сохта нашуд.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Add Category Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
          Гурӯҳи нав сохтан
        </h2>

        {error && (
          <div className="mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              maxLength={VALIDATION_LIMITS.CATEGORY_NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Масалан: Сафар, Молия, Варзиш..."
              className="flex-1 min-h-[48px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="min-h-[48px] px-5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{saving ? 'Дар ҳоли сохтан...' : 'Илова кардан'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
              Ранг:
            </span>
            {COLOR_OPTIONS.map((c) => {
              const meta = CATEGORY_COLOR_META[c];
              const selected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={meta.label}
                  className={`min-h-[36px] px-2.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.dotClass}`} />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </form>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const catTasks = tasks.filter((t) => t.categoryId === cat.id);
          const activeCount = catTasks.filter((t) => !t.completed).length;
          const colorMeta = CATEGORY_COLOR_META[cat.color] || CATEGORY_COLOR_META.slate;

          return (
            <div
              key={cat.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => onOpenCategoryTasks(cat.id)}
                className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${colorMeta.bgSoftClass} flex items-center justify-center shrink-0`}
                >
                  <span className={`w-3 h-3 rounded-full ${colorMeta.dotClass}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {cat.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {activeCount} фаъол · {catTasks.length} ҳамагӣ
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {!cat.isDefault && (
                  <>
                    {confirmDeleteId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteCategory(cat.id);
                            setConfirmDeleteId(null);
                          }}
                          className="min-h-[36px] px-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Ҳазф
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[36px] px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
                        >
                          Не
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(cat.id)}
                        aria-label={`Ҳазфи гурӯҳи ${cat.name}`}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onOpenCategoryTasks(cat.id)}
                  aria-label={`Дидани вазифаҳои ${cat.name}`}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
