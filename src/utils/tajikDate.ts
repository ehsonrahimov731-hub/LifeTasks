// Tajik Cyrillic calendar & date formatting helpers (Monday-first weeks)

export const TAJIK_DAYS_FULL = [
  'Якшанбе',
  'Душанбе',
  'Сешанбе',
  'Чоршанбе',
  'Панҷшанбе',
  'Ҷумъа',
  'Шанбе',
] as const;

export const TAJIK_DAYS_SHORT = ['Як', 'Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шб'] as const;

export const TAJIK_DAYS_MON_FIRST = [
  'Душанбе',
  'Сешанбе',
  'Чоршанбе',
  'Панҷшанбе',
  'Ҷумъа',
  'Шанбе',
  'Якшанбе',
] as const;

export const TAJIK_DAYS_SHORT_MON_FIRST = ['Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шб', 'Як'] as const;

export const TAJIK_MONTHS = [
  'Январ',
  'Феврал',
  'Март',
  'Апрел',
  'Май',
  'Июн',
  'Июл',
  'Август',
  'Сентябр',
  'Октябр',
  'Ноябр',
  'Декабр',
] as const;

export const TAJIK_MONTHS_SHORT = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
] as const;

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISODate(d);
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function formatTajikDate(iso: string): string {
  const today = getTodayISO();
  const tomorrow = addDaysISO(today, 1);
  const yesterday = addDaysISO(today, -1);

  if (iso === today) return 'Имрӯз';
  if (iso === tomorrow) return 'Пагоҳ';
  if (iso === yesterday) return 'Дирӯз';

  const d = parseISODate(iso);
  return `${d.getDate()} ${TAJIK_MONTHS[d.getMonth()]}`;
}

export function formatTajikFullDate(iso: string): string {
  const d = parseISODate(iso);
  const dayName = TAJIK_DAYS_FULL[d.getDay()];
  const monthName = TAJIK_MONTHS[d.getMonth()];
  return `${dayName}, ${d.getDate()} ${monthName}`;
}

export function formatTajikDeadline(iso: string, time: string): string {
  const base = formatTajikDate(iso);
  return time ? `${base}, ${time}` : base;
}

export interface WeekDayInfo {
  iso: string;
  shortDay: string;
  fullDay: string;
  dayNum: number;
  monthShort: string;
  isToday: boolean;
}

export function getWeekStartISO(anchorIso: string): string {
  const d = parseISODate(anchorIso);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return toISODate(d);
}

export function getWeekDays(anchorIso: string): WeekDayInfo[] {
  const mondayIso = getWeekStartISO(anchorIso);
  const todayIso = getTodayISO();
  const result: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const iso = addDaysISO(mondayIso, i);
    const d = parseISODate(iso);
    result.push({
      iso,
      shortDay: TAJIK_DAYS_SHORT_MON_FIRST[i],
      fullDay: TAJIK_DAYS_MON_FIRST[i],
      dayNum: d.getDate(),
      monthShort: TAJIK_MONTHS_SHORT[d.getMonth()],
      isToday: iso === todayIso,
    });
  }
  return result;
}

export function getTajikWeekRange(anchorIso: string): string {
  const days = getWeekDays(anchorIso);
  const first = parseISODate(days[0].iso);
  const last = parseISODate(days[6].iso);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${TAJIK_MONTHS[last.getMonth()]}`;
  }
  return `${first.getDate()} ${TAJIK_MONTHS_SHORT[first.getMonth()]} – ${last.getDate()} ${TAJIK_MONTHS_SHORT[last.getMonth()]}`;
}

export interface MonthCell {
  iso: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
}

export function getMonthGrid(year: number, monthIndex: number): MonthCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const dayOfWeek = firstOfMonth.getDay(); // 0 Sun..6 Sat
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
  const gridStart = new Date(year, monthIndex, 1 - offset, 12, 0, 0, 0);

  const lastOfMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0, 0);
  const totalDaysNeeded = offset + lastOfMonth.getDate();
  const totalCells = totalDaysNeeded <= 35 ? 35 : 42;

  const todayIso = getTodayISO();
  const cells: MonthCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      iso: toISODate(d),
      dayNum: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
      isToday: toISODate(d) === todayIso,
    });
  }
  return cells;
}

export function getTajikMonthYear(year: number, monthIndex: number): string {
  return `${TAJIK_MONTHS[monthIndex]} ${year}`;
}

export function isTaskOverdue(dueDate: string, dueTime: string, completed: boolean): boolean {
  if (completed) return false;
  const now = new Date();
  const todayIso = toISODate(now);
  if (dueDate < todayIso) return true;
  if (dueDate > todayIso) return false;
  if (!dueTime) return false;
  const [hh, mm] = dueTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dueMinutes = (hh || 0) * 60 + (mm || 0);
  return currentMinutes > dueMinutes;
}
