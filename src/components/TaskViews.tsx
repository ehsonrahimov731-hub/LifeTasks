import React from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarCheck2 } from 'lucide-react';
import { Task, Workspace } from '../types';
import {
  addDaysISO,
  formatTajikFullDate,
  getMonthGrid,
  getTajikMonthYear,
  getTajikWeekRange,
  getTodayISO,
  getWeekDays,
  isTaskOverdue,
  parseISODate,
  TAJIK_DAYS_SHORT_MON_FIRST,
} from '../utils/tajikDate';
import { TaskRow } from './TaskRow';

interface SharedViewProps {
  tasks: Task[];
  workspace: Workspace;
  currentUserId: string;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onQuickAdd: (dateIso: string) => void;
}

export const DailyView: React.FC<SharedViewProps> = ({
  tasks,
  workspace,
  currentUserId,
  selectedDate,
  onSelectDate,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onQuickAdd,
}) => {
  const todayIso = getTodayISO();
  const weekDays = getWeekDays(selectedDate);

  const dayTasks = tasks.filter((t) => t.dueDate === selectedDate);
  const overdueTasks =
    selectedDate === todayIso
      ? tasks.filter(
          (t) => t.dueDate < todayIso && isTaskOverdue(t.dueDate, t.dueTime, t.completed)
        )
      : [];

  const completedCount = dayTasks.filter((t) => t.completed).length;
  const totalCount = dayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Horizontal 7-Day Android Date Scroller */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {formatTajikFullDate(selectedDate)}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedDate !== todayIso && (
              <button
                type="button"
                onClick={() => onSelectDate(todayIso)}
                className="min-h-[36px] px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Имрӯз
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectDate(addDaysISO(selectedDate, -7))}
              aria-label="Ҳафтаи гузашта"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(addDaysISO(selectedDate, 7))}
              aria-label="Ҳафтаи оянда"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const isSelected = day.iso === selectedDate;
            const count = tasks.filter((t) => t.dueDate === day.iso && !t.completed).length;

            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => onSelectDate(day.iso)}
                className={`min-h-[60px] rounded-2xl flex flex-col items-center justify-center gap-1 py-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white'
                    : day.isToday
                      ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span
                  className={`text-[11px] font-medium ${
                    isSelected ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day.shortDay}
                </span>
                <span className="text-sm font-bold tabular-nums">{day.dayNum}</span>
                <span
                  className={`h-1 w-4 rounded-full ${
                    count > 0
                      ? isSelected
                        ? 'bg-white/90'
                        : 'bg-teal-600 dark:bg-teal-400'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Daily Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-teal-600 dark:bg-teal-500 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
              {completedCount} аз {totalCount} анҷом ёфт
            </span>
          </div>
        )}
      </div>

      {/* Overdue Section (only when viewing Today and overdue incomplete tasks exist) */}
      {overdueTasks.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Муҳлаташ гузашта
            </h3>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
              {overdueTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                workspace={workspace}
                currentUserId={currentUserId}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                showDateInMeta
              />
            ))}
          </div>
        </section>
      )}

      {/* Selected Day Tasks */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Вазифаҳои ин рӯз
          </h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            {dayTasks.length}
          </span>
        </div>

        {dayTasks.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Барои ин рӯз вазифае нест
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Вазифаи нав илова кунед, то нақшаи рӯзатон равшан бошад.
            </p>
            <button
              type="button"
              onClick={() => onQuickAdd(selectedDate)}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Вазифа илова кардан</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                workspace={workspace}
                currentUserId={currentUserId}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                showDateInMeta={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const WeeklyView: React.FC<SharedViewProps> = ({
  tasks,
  workspace,
  currentUserId,
  selectedDate,
  onSelectDate,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onQuickAdd,
}) => {
  const todayIso = getTodayISO();
  const weekDays = getWeekDays(selectedDate);
  const weekRangeLabel = getTajikWeekRange(selectedDate);

  const weekSet = new Set(weekDays.map((d) => d.iso));
  const weekTotal = tasks.filter((t) => weekSet.has(t.dueDate)).length;
  const weekDone = tasks.filter((t) => weekSet.has(t.dueDate) && t.completed).length;

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {weekRangeLabel}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {weekDone} аз {weekTotal} вазифа анҷом ёфт
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onSelectDate(todayIso)}
            className="min-h-[36px] px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            Имрӯз
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(addDaysISO(selectedDate, -7))}
            aria-label="Ҳафтаи гузашта"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(addDaysISO(selectedDate, 7))}
            aria-label="Ҳафтаи оянда"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Stacked List */}
      <div className="space-y-3">
        {weekDays.map((day) => {
          const dayTasks = tasks.filter((t) => t.dueDate === day.iso);

          return (
            <div
              key={day.iso}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={() => onSelectDate(day.iso)}
                  className="flex items-center gap-2 text-left cursor-pointer"
                >
                  <span
                    className={`text-sm font-bold ${
                      day.isToday
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {day.fullDay}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {day.dayNum} {day.monthShort}
                    {day.isToday ? ' · Имрӯз' : ''}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {dayTasks.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQuickAdd(day.iso)}
                    aria-label={`Илова ба ${day.fullDay}`}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-700 hover:text-white text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {dayTasks.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-1">
                  Вазифае ба нақша гирифта нашудааст
                </p>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      workspace={workspace}
                      currentUserId={currentUserId}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      showDateInMeta={false}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MonthlyView: React.FC<SharedViewProps> = ({
  tasks,
  workspace,
  currentUserId,
  selectedDate,
  onSelectDate,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onQuickAdd,
}) => {
  const todayIso = getTodayISO();
  const parsed = parseISODate(selectedDate);
  const year = parsed.getFullYear();
  const monthIndex = parsed.getMonth();

  const cells = getMonthGrid(year, monthIndex);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1, 12, 0, 0, 0);
    const nextIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
    onSelectDate(nextIso);
  };

  const selectedDayTasks = tasks.filter((t) => t.dueDate === selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Calendar Card */}
      <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {getTajikMonthYear(year, monthIndex)}
          </h2>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelectDate(todayIso)}
              className="min-h-[36px] px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Имрӯз
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Моҳи гузашта"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Моҳи оянда"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {TAJIK_DAYS_SHORT_MON_FIRST.map((dayName) => (
            <div
              key={dayName}
              className="text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 py-1"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const cellTasks = tasks.filter((t) => t.dueDate === cell.iso);
            const activeCount = cellTasks.filter((t) => !t.completed).length;
            const hasHigh = cellTasks.some((t) => !t.completed && t.priority === 'high');
            const isSelected = cell.iso === selectedDate;

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => onSelectDate(cell.iso)}
                className={`min-h-[52px] rounded-2xl p-1 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white'
                    : cell.isToday
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                      : cell.inMonth
                        ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold tabular-nums">
                  {cell.dayNum}
                </span>
                {cellTasks.length > 0 ? (
                  <span
                    className={`text-[10px] font-semibold tabular-nums leading-none ${
                      isSelected
                        ? 'text-teal-100'
                        : hasHigh
                          ? 'text-rose-600 dark:text-rose-400'
                          : activeCount > 0
                            ? 'text-teal-700 dark:text-teal-400'
                            : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {activeCount > 0 ? activeCount : cellTasks.length}
                  </span>
                ) : (
                  <span className="h-[10px]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {formatTajikFullDate(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {selectedDayTasks.length} вазифа
            </p>
          </div>
          <button
            type="button"
            onClick={() => onQuickAdd(selectedDate)}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Вазифа</span>
          </button>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Дар ин сана вазифае нест
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Тугмаи «Вазифа»-ро пахш кунед, то ба ин рӯз нақша илова шавад.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                workspace={workspace}
                currentUserId={currentUserId}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                showDateInMeta={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
