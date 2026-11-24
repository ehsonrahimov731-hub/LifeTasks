export type TaskPriority = 'high' | 'medium' | 'low';

export type CategoryColor = 'teal' | 'amber' | 'rose' | 'sky' | 'indigo' | 'emerald' | 'slate';

export type ViewMode = 'daily' | 'weekly' | 'monthly';

export type AppTab = 'tasks' | 'categories' | 'partner' | 'profile';

export type ThemeMode = 'light' | 'dark';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  workspaceId: string;
  theme: ThemeMode;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto: string;
  partnerId: string;
  partnerName: string;
  partnerPhoto: string;
  memberIds: string[];
  inviteCode: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkspaceInvite {
  code: string;
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  createdAt?: unknown;
}

export interface Task {
  id: string;
  workspaceId: string;
  memberIds: string[];
  title: string;
  description: string;
  priority: TaskPriority;
  categoryId: string;
  categoryName: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // "" or HH:MM
  assignee: string; // "both" or member uid
  completed: boolean;
  completedBy: string;
  completedByName: string;
  createdBy: string;
  createdByName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  workspaceId: string;
  memberIds: string[];
  name: string;
  color: CategoryColor;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDefault?: boolean;
}

// Validation constants synchronized with firebase-blueprint.json
export const VALIDATION_LIMITS = {
  TITLE_MAX: 120,
  DESCRIPTION_MAX: 500,
  CATEGORY_NAME_MAX: 40,
  WORKSPACE_NAME_MAX: 60,
  DISPLAY_NAME_MAX: 80,
  INVITE_CODE_MIN: 6,
  INVITE_CODE_MAX: 12,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  INVITE_CODE_PATTERN: /^[A-Z0-9]+$/,
  DUE_DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  DUE_TIME_PATTERN: /^([0-2][0-9]:[0-5][0-9])?$/,
} as const;

export const DEFAULT_CATEGORIES: Array<{ id: string; name: string; color: CategoryColor }> = [
  { id: 'work', name: 'Кор', color: 'teal' },
  { id: 'home', name: 'Хона', color: 'amber' },
  { id: 'shopping', name: 'Харид', color: 'rose' },
  { id: 'health', name: 'Саломатӣ', color: 'emerald' },
  { id: 'study', name: 'Омӯзиш', color: 'indigo' },
  { id: 'personal', name: 'Шахсӣ', color: 'sky' },
];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Баланд',
  medium: 'Миёна',
  low: 'Паст',
};

export const CATEGORY_COLOR_META: Record<
  CategoryColor,
  { label: string; dotClass: string; textClass: string; bgSoftClass: string }
> = {
  teal: {
    label: 'Фирӯзаӣ',
    dotClass: 'bg-teal-600',
    textClass: 'text-teal-700 dark:text-teal-400',
    bgSoftClass: 'bg-teal-50 dark:bg-teal-950/50',
  },
  amber: {
    label: 'Каҳрабоӣ',
    dotClass: 'bg-amber-600',
    textClass: 'text-amber-700 dark:text-amber-400',
    bgSoftClass: 'bg-amber-50 dark:bg-amber-950/50',
  },
  rose: {
    label: 'Гулгун',
    dotClass: 'bg-rose-600',
    textClass: 'text-rose-700 dark:text-rose-400',
    bgSoftClass: 'bg-rose-50 dark:bg-rose-950/50',
  },
  sky: {
    label: 'Осмонӣ',
    dotClass: 'bg-sky-600',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgSoftClass: 'bg-sky-50 dark:bg-sky-950/50',
  },
  indigo: {
    label: 'Нилгун',
    dotClass: 'bg-indigo-600',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    bgSoftClass: 'bg-indigo-50 dark:bg-indigo-950/50',
  },
  emerald: {
    label: 'Зумуррадӣ',
    dotClass: 'bg-emerald-600',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    bgSoftClass: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  slate: {
    label: 'Хокистарӣ',
    dotClass: 'bg-slate-600',
    textClass: 'text-slate-700 dark:text-slate-300',
    bgSoftClass: 'bg-slate-100 dark:bg-slate-800/70',
  },
};
