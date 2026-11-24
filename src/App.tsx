import React, { useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  CheckSquare,
  FolderKanban,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import {
  AppTab,
  Category,
  CategoryColor,
  DEFAULT_CATEGORIES,
  PRIORITY_LABELS,
  Task,
  TaskPriority,
  ThemeMode,
  UserProfile,
  ViewMode,
  Workspace,
} from './types';
import {
  bootstrapUserAndWorkspace,
  createCategory,
  createTask,
  deleteCategory,
  deleteTask,
  joinWorkspaceByCode,
  regenerateInviteCode,
  removePartnerOrLeave,
  syncWorkspaceMemberIds,
  TaskInput,
  toggleTaskCompletion,
  updateTask,
  updateUserTheme,
  updateWorkspaceName,
} from './services/firestoreService';
import { getTodayISO } from './utils/tajikDate';
import { LoginScreen } from './components/LoginScreen';
import { DailyView, MonthlyView, WeeklyView } from './components/TaskViews';
import { TaskSheet } from './components/TaskSheet';
import { CategoriesTab } from './components/CategoriesTab';
import { PartnerTab } from './components/PartnerTab';
import { SettingsTab } from './components/SettingsTab';
import { Avatar } from './components/Avatar';
import { OfflineIndicator } from './components/PWAInstallButton';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [bootstrapping, setBootstrapping] = useState(false);

  const [activeTab, setActiveTab] = useState<AppTab>('tasks');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayISO());

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'both' | 'mine' | 'partner'>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sheetDefaultDate, setSheetDefaultDate] = useState<string>(() => getTodayISO());

  const [theme, setTheme] = useState<ThemeMode>('light');
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    return code ? code.trim().toUpperCase() : null;
  });
  const [joiningPending, setJoiningPending] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (!user) {
        setProfile(null);
        setWorkspaceId(null);
        setWorkspace(null);
        setTasks([]);
        setCustomCategories([]);
        return;
      }

      setBootstrapping(true);
      setAuthError(null);
      try {
        const wsId = await bootstrapUserAndWorkspace(user);
        setWorkspaceId(wsId);
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Ҳангоми омодасозии ҳисоб хатогӣ рух дод.'
        );
      } finally {
        setBootstrapping(false);
      }
    });
    return () => unsub();
  }, []);

  // Listen to current user's profile
  useEffect(() => {
    if (!authReady || !currentUser) return;
    const path = `users/${currentUser.uid}`;
    const unsub = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile(data);
          if (data.workspaceId && data.workspaceId !== workspaceId) {
            setWorkspaceId(data.workspaceId);
          }
          if (data.theme === 'dark' || data.theme === 'light') {
            setTheme(data.theme);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return () => unsub();
  }, [authReady, currentUser, workspaceId]);

  // Listen to active workspace
  useEffect(() => {
    if (!authReady || !currentUser || !workspaceId) return;
    const path = `workspaces/${workspaceId}`;
    const unsub = onSnapshot(
      doc(db, 'workspaces', workspaceId),
      (snap) => {
        if (snap.exists()) {
          setWorkspace(snap.data() as Workspace);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return () => unsub();
  }, [authReady, currentUser, workspaceId]);

  // Listen to workspace tasks
  useEffect(() => {
    if (!authReady || !currentUser || !workspaceId) return;
    const path = `workspaces/${workspaceId}/tasks`;
    const q = query(
      collection(db, 'workspaces', workspaceId, 'tasks'),
      where('memberIds', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Task[] = snap.docs.map((d) => d.data() as Task);
        items.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
          if (PRIORITY_WEIGHT[a.priority] !== PRIORITY_WEIGHT[b.priority]) {
            return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
          }
          if (a.dueTime !== b.dueTime) {
            if (!a.dueTime) return 1;
            if (!b.dueTime) return -1;
            return a.dueTime.localeCompare(b.dueTime);
          }
          return a.title.localeCompare(b.title);
        });
        setTasks(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, [authReady, currentUser, workspaceId]);

  // Listen to workspace custom categories
  useEffect(() => {
    if (!authReady || !currentUser || !workspaceId) return;
    const path = `workspaces/${workspaceId}/categories`;
    const q = query(
      collection(db, 'workspaces', workspaceId, 'categories'),
      where('memberIds', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Category[] = snap.docs.map((d) => d.data() as Category);
        items.sort((a, b) => a.name.localeCompare(b.name));
        setCustomCategories(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, [authReady, currentUser, workspaceId]);

  // Automatically synchronize memberIds on tasks/categories when a partner joins or leaves
  useEffect(() => {
    if (!workspace || !currentUser) return;
    const memberKey = workspace.memberIds.join(',');
    const needsSync =
      tasks.some((t) => t.memberIds.join(',') !== memberKey) ||
      customCategories.some((c) => c.memberIds.join(',') !== memberKey);

    if (needsSync) {
      void syncWorkspaceMemberIds(workspace, tasks, customCategories);
    }
  }, [workspace, tasks, customCategories, currentUser]);

  const allCategories: Category[] = useMemo(() => {
    const defaults: Category[] = DEFAULT_CATEGORIES.map((c) => ({
      id: c.id,
      workspaceId: workspaceId || '',
      memberIds: workspace?.memberIds || [],
      name: c.name,
      color: c.color,
      createdBy: 'system',
      isDefault: true,
    }));
    return [...defaults, ...customCategories];
  }, [customCategories, workspaceId, workspace?.memberIds]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!showCompleted && task.completed) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && task.categoryId !== categoryFilter) return false;
      if (assigneeFilter === 'both' && task.assignee !== 'both') return false;
      if (assigneeFilter === 'mine' && currentUser && task.assignee !== currentUser.uid) {
        return false;
      }
      if (
        assigneeFilter === 'partner' &&
        currentUser &&
        (task.assignee === 'both' || task.assignee === currentUser.uid)
      ) {
        return false;
      }
      if (q) {
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchCat = task.categoryName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [
    tasks,
    showCompleted,
    priorityFilter,
    categoryFilter,
    assigneeFilter,
    searchQuery,
    currentUser,
  ]);

  const hasActiveFilters =
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    Boolean(searchQuery.trim());

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setAuthError(msg);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleOpenCreateSheet = (dateIso?: string) => {
    setEditingTask(null);
    setSheetDefaultDate(dateIso || selectedDate || getTodayISO());
    setSheetOpen(true);
  };

  const handleOpenEditSheet = (task: Task) => {
    setEditingTask(task);
    setSheetDefaultDate(task.dueDate);
    setSheetOpen(true);
  };

  const handleSaveTask = async (input: TaskInput, taskId?: string) => {
    if (!workspace || !currentUser) return;
    if (taskId) {
      await updateTask(workspace.id, taskId, input);
    } else {
      await createTask(workspace, currentUser, input);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!workspace || !currentUser) return;
    await toggleTaskCompletion(workspace.id, task, currentUser);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!workspace) return;
    await deleteTask(workspace.id, taskId);
  };

  const handleCreateCategory = async (name: string, color: CategoryColor): Promise<Category> => {
    if (!workspace || !currentUser) {
      throw new Error('Фазои корӣ омода нест.');
    }
    const id = await createCategory(workspace, currentUser, name, color);
    return {
      id,
      workspaceId: workspace.id,
      memberIds: workspace.memberIds,
      name,
      color,
      createdBy: currentUser.uid,
    };
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!workspace) return;
    await deleteCategory(workspace.id, categoryId);
    if (categoryFilter === categoryId) {
      setCategoryFilter('all');
    }
  };

  const handleThemeChange = async (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    if (currentUser) {
      await updateUserTheme(currentUser.uid, nextTheme);
    }
  };

  const handleJoinPendingInvite = async () => {
    if (!currentUser || !pendingInviteCode || joiningPending) return;
    setJoiningPending(true);
    setBannerError(null);
    try {
      const nextWsId = await joinWorkspaceByCode(currentUser, pendingInviteCode);
      setWorkspaceId(nextWsId);
      setPendingInviteCode(null);
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Пайвастшавӣ анҷом нашуд.');
    } finally {
      setJoiningPending(false);
    }
  };

  const clearPendingInvite = () => {
    setPendingInviteCode(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Loading state while auth initializes
  if (!authReady || (currentUser && bootstrapping && !workspace)) {
    return (
      <div className="min-h-screen bg-[#F6F8F7] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 rounded-2xl border-2 border-teal-700 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          LifeTasks омода мешавад...
        </p>
      </div>
    );
  }

  // Unauthenticated view
  if (!currentUser) {
    return (
      <LoginScreen
        onSignIn={handleSignIn}
        pendingInviteCode={pendingInviteCode}
        errorMessage={authError}
      />
    );
  }

  // Still waiting for workspace doc
  if (!workspace) {
    return (
      <div className="min-h-screen bg-[#F6F8F7] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 rounded-2xl border-2 border-teal-700 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Боргирии фазои корӣ...
        </p>
      </div>
    );
  }

  const hasPartner = Boolean(workspace.partnerId);
  const partnerName =
    currentUser.uid === workspace.ownerId ? workspace.partnerName : workspace.ownerName;
  const partnerPhoto =
    currentUser.uid === workspace.ownerId ? workspace.partnerPhoto : workspace.ownerPhoto;

  const navItems: Array<{ id: AppTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'tasks', label: 'Вазифаҳо', icon: CheckSquare },
    { id: 'categories', label: 'Гурӯҳҳо', icon: FolderKanban },
    { id: 'partner', label: 'Шарик', icon: Users },
    { id: 'profile', label: 'Профил', icon: Settings },
  ];

  const todayIso = getTodayISO();
  const todayPendingCount = tasks.filter((t) => t.dueDate === todayIso && !t.completed).length;

  return (
    <div className="min-h-screen bg-[#F6F8F7] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Compact Top App Bar (52px) */}
      <header className="lg:hidden sticky top-0 z-30 h-[52px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between gap-3">
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
          LifeTasks
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {activeTab === 'tasks' && (
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Ҷустуҷӯ"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Ҳолати торик' : 'Ҳолати равшан'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('partner')}
            aria-label="Шарик"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl cursor-pointer"
          >
            {hasPartner ? (
              <Avatar src={partnerPhoto} name={partnerName || 'Шарик'} size="sm" />
            ) : (
              <Avatar
                src={currentUser.photoURL || ''}
                name={profile?.displayName || currentUser.displayName || 'Ман'}
                size="sm"
              />
            )}
          </button>
        </div>
      </header>

      {/* Main Responsive Container */}
      <div className="max-w-6xl mx-auto lg:px-6 lg:py-6 lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Desktop Left Navigation Rail */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-5 sticky top-6 self-start">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                LifeTasks
              </span>
              <button
                type="button"
                onClick={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')}
                aria-label="Ивази мавзӯъ"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateSheet()}
              className="w-full min-h-[48px] rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Вазифаи нав</span>
            </button>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'tasks' && todayPendingCount > 0 && (
                      <span className="text-xs font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                        {todayPendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Workspace Partner Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Фазои корӣ
              </p>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                {workspace.memberIds.length}/2
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {workspace.name}
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <Avatar src={workspace.ownerPhoto} name={workspace.ownerName} size="sm" />
              {hasPartner ? (
                <>
                  <Avatar
                    src={workspace.partnerPhoto}
                    name={workspace.partnerName || 'Шарик'}
                    size="sm"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {partnerName}
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('partner')}
                  className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  + Даъвати шарик
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <main className="lg:col-span-9 px-4 pt-4 pb-28 lg:p-0 space-y-4">
          {/* Pending Invite Banner */}
          {pendingInviteCode && !hasPartner && (
            <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-teal-900 dark:text-teal-200">
                Рамзи даъват омода аст:{' '}
                <span className="font-mono font-bold">{pendingInviteCode}</span>
                {bannerError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{bannerError}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleJoinPendingInvite}
                  disabled={joiningPending}
                  className="min-h-[40px] px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  {joiningPending ? 'Пайвастшавӣ...' : 'Пайваст шудан'}
                </button>
                <button
                  type="button"
                  onClick={clearPendingInvite}
                  className="min-h-[40px] px-3 rounded-xl text-xs font-medium text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 cursor-pointer"
                >
                  Пинҳон
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Top Workspace Toolbar: View Switcher + Desktop Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Segmented View Switcher: Daily / Weekly / Monthly */}
                <div className="grid grid-cols-3 sm:inline-flex p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  {(
                    [
                      { id: 'daily', label: 'Рӯзона' },
                      { id: 'weekly', label: 'Ҳафтаина' },
                      { id: 'monthly', label: 'Моҳона' },
                    ] as Array<{ id: ViewMode; label: string }>
                  ).map((mode) => {
                    const active = viewMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setViewMode(mode.id)}
                        className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Search Input */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ҷустуҷӯи вазифа..."
                      className="w-64 min-h-[42px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-9 pr-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Expandable Search */}
              {searchOpen && (
                <div className="lg:hidden">
                  <input
                    type="search"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ҷустуҷӯи вазифа ё гурӯҳ..."
                    className="w-full min-h-[46px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              )}

              {/* Priority, Category & Assignee Filter Controls */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {/* Priority Selector */}
                <select
                  aria-label="Филтри афзалият"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
                  className="min-h-[40px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 shrink-0 cursor-pointer"
                >
                  <option value="all">Афзалият: Ҳама</option>
                  <option value="high">Афзалият: {PRIORITY_LABELS.high}</option>
                  <option value="medium">Афзалият: {PRIORITY_LABELS.medium}</option>
                  <option value="low">Афзалият: {PRIORITY_LABELS.low}</option>
                </select>

                {/* Category Selector */}
                <select
                  aria-label="Филтри гурӯҳ"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="min-h-[40px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 shrink-0 cursor-pointer"
                >
                  <option value="all">Гурӯҳ: Ҳама</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {/* Assignee Selector (when paired or anytime) */}
                {hasPartner && (
                  <select
                    aria-label="Филтри масъул"
                    value={assigneeFilter}
                    onChange={(e) =>
                      setAssigneeFilter(
                        e.target.value as 'all' | 'both' | 'mine' | 'partner'
                      )
                    }
                    className="min-h-[40px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 shrink-0 cursor-pointer"
                  >
                    <option value="all">Масъул: Ҳар кас</option>
                    <option value="both">Барои ҳарду</option>
                    <option value="mine">Танҳо барои ман</option>
                    <option value="partner">Барои {partnerName || 'шарик'}</option>
                  </select>
                )}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPriorityFilter('all');
                      setCategoryFilter('all');
                      setAssigneeFilter('all');
                    }}
                    className="min-h-[40px] px-3 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Тоза кардан
                  </button>
                )}
              </div>

              {/* Active Calendar View */}
              {viewMode === 'daily' && (
                <DailyView
                  tasks={filteredTasks}
                  workspace={workspace}
                  currentUserId={currentUser.uid}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={handleOpenEditSheet}
                  onDeleteTask={handleDeleteTask}
                  onQuickAdd={(iso) => handleOpenCreateSheet(iso)}
                />
              )}

              {viewMode === 'weekly' && (
                <WeeklyView
                  tasks={filteredTasks}
                  workspace={workspace}
                  currentUserId={currentUser.uid}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={handleOpenEditSheet}
                  onDeleteTask={handleDeleteTask}
                  onQuickAdd={(iso) => handleOpenCreateSheet(iso)}
                />
              )}

              {viewMode === 'monthly' && (
                <MonthlyView
                  tasks={filteredTasks}
                  workspace={workspace}
                  currentUserId={currentUser.uid}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={handleOpenEditSheet}
                  onDeleteTask={handleDeleteTask}
                  onQuickAdd={(iso) => handleOpenCreateSheet(iso)}
                />
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              categories={allCategories}
              tasks={tasks}
              onCreateCategory={handleCreateCategory}
              onDeleteCategory={handleDeleteCategory}
              onOpenCategoryTasks={(catId) => {
                setCategoryFilter(catId);
                setActiveTab('tasks');
              }}
            />
          )}

          {activeTab === 'partner' && (
            <PartnerTab
              workspace={workspace}
              currentUserId={currentUser.uid}
              pendingInviteCode={pendingInviteCode}
              onUpdateWorkspaceName={(name) => updateWorkspaceName(workspace.id, name)}
              onRegenerateCode={() => regenerateInviteCode(workspace, currentUser)}
              onJoinByCode={async (code) => {
                const nextWsId = await joinWorkspaceByCode(currentUser, code);
                setWorkspaceId(nextWsId);
              }}
              onRemoveOrLeave={async () => {
                const nextWsId = await removePartnerOrLeave(workspace, currentUser);
                setWorkspaceId(nextWsId);
              }}
              onClearPendingInvite={clearPendingInvite}
            />
          )}

          {activeTab === 'profile' && (
            <SettingsTab
              profile={profile}
              tasks={tasks}
              theme={theme}
              showCompleted={showCompleted}
              onChangeTheme={handleThemeChange}
              onToggleShowCompleted={() => setShowCompleted((prev) => !prev)}
              onSignOut={handleSignOut}
            />
          )}
        </main>
      </div>

      {/* Android Mobile Floating Action Button (Thumb Zone) */}
      {activeTab === 'tasks' && (
        <button
          type="button"
          onClick={() => handleOpenCreateSheet()}
          aria-label="Вазифаи нав"
          className="lg:hidden fixed bottom-20 right-4 z-40 h-14 px-5 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-[0.97] text-white font-semibold text-sm shadow-lg shadow-teal-900/20 inline-flex items-center gap-2 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Вазифаи нав</span>
        </button>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (64px) */}
      <nav
        aria-label="Навигатсияи асосӣ"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-4 h-16 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  active
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-[22px] h-[22px]" />
                <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Add / Edit Task Bottom Sheet */}
      <TaskSheet
        open={sheetOpen}
        editingTask={editingTask}
        defaultDate={sheetDefaultDate}
        workspace={workspace}
        currentUserId={currentUser.uid}
        categories={allCategories}
        onClose={() => setSheetOpen(false)}
        onSave={handleSaveTask}
        onQuickCreateCategory={handleCreateCategory}
      />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
