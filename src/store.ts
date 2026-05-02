import { create } from 'zustand';
import type { User, Task, TaskStatus } from './types';
import { supabase, FAMILY_ID, fetchTasks, createTask, completeTask, addNote as dbAddNote } from './services/supabase';
import { cacheTasks, addToSyncQueue } from './services/offline';

const FAMILY_MEMBERS: User[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Sarah Chen', role: 'commander' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Maria Santos', role: 'helper' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'David Chen', role: 'observer' },
];

async function dbUpdateTask(taskId: string, updates: Record<string, unknown>) {
  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
  if (error) throw error;
}

interface Store {
  currentUser: User | null;
  family: { id: string; name: string; members: User[] };
  tasks: Task[];
  loading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'notes' | 'completedAt'>) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  updateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  addNote: (taskId: string, content: string) => Promise<void>;
  myTasks: () => Task[];
  todaysTasks: () => Task[];
  tasksForDate: (date: string) => Task[];
  tasksForWeek: (startDate: string) => Task[];
  detectConflicts: (startDate: string) => Array<{ date: string; tasks: Task[] }>;
  updateTask: (taskId: string, updates: Record<string, unknown>) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  currentUser: null,
  family: { id: FAMILY_ID, name: 'Chen Family', members: FAMILY_MEMBERS },
  tasks: [],
  loading: false,
  error: null,

  setUser: (user) => set({ currentUser: user }),

  loadTasks: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await fetchTasks();
      const tasks: Task[] = rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        title: r.title as string,
        description: (r.description as string) ?? '',
        assigneeId: (r.assignee_id as string) ?? '',
        assigneeName: (r.assignee_name as string) ?? '',
        dueTime: (r.due_time as string) ?? '',
        dueDate: (r.due_date as string) ?? '',
        location: (r.location_text as string) ?? (r.location as string) ?? '',
        contact: (r.contact as string) ?? '',
        status: (r.status as TaskStatus) ?? 'pending',
        completedAt: (r.completed_at as string) ?? '',
        notes: ((r.task_notes as Array<Record<string, unknown>>) ?? []).map((n) => ({
          id: n.id as string,
          authorId: (n.author_id as string) ?? '',
          authorName: (n.author_name as string) ?? '',
          content: n.content as string,
          createdAt: (n.created_at as string) ?? '',
        })),
        createdAt: (r.created_at as string) ?? '',
        createdBy: (r.created_by as string) ?? '',
        gps_lat: r.gps_lat as number | undefined,
        gps_lng: r.gps_lng as number | undefined,
      }));
      set({ tasks, loading: false });
      // Cache for offline use
      try {
        await cacheTasks(rows as Array<Record<string, unknown>>);
      } catch {}
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const created = await createTask({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId || undefined,
        assigneeName: task.assigneeName || undefined,
        dueDate: task.dueDate || undefined,
        dueTime: task.dueTime || undefined,
        location: task.location || undefined,
        contact: task.contact || undefined,
        status: task.status || 'pending',
      });
      const newTask: Task = {
        id: created.id,
        title: created.title,
        description: created.description ?? '',
        assigneeId: created.assignee_id ?? '',
        assigneeName: created.assignee_name ?? '',
        dueTime: created.due_time ?? '',
        dueDate: created.due_date ?? '',
        location: created.location_text ?? created.location ?? '',
        contact: created.contact ?? '',
        status: created.status as TaskStatus ?? 'pending',
        completedAt: '',
        notes: [],
        createdAt: created.created_at ?? new Date().toISOString(),
        createdBy: created.created_by ?? '',
      };
      set((s) => ({ tasks: [...s.tasks, newTask], loading: false }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  completeTask: async (taskId) => {
    const isOnline = navigator.onLine;
    if (!isOnline) {
      await addToSyncQueue({ type: 'complete_task', payload: { taskId } });
    }
    try {
      if (isOnline) {
        await completeTask(taskId);
      }
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: 'completed' as TaskStatus, completedAt: new Date().toISOString() }
            : t
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  updateStatus: async (taskId, status) => {
    const isOnline = navigator.onLine;
    if (!isOnline) {
      await addToSyncQueue({ type: 'update_status', payload: { taskId, status } });
    }
    try {
      if (isOnline) {
        await dbUpdateTask(taskId, { status });
      }
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  addNote: async (taskId, content) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const isOnline = navigator.onLine;
    if (!isOnline) {
      await addToSyncQueue({
        type: 'add_note',
        payload: { taskId, authorId: currentUser.id, authorName: currentUser.name, content },
      });
    }
    try {
      const note = isOnline
        ? await dbAddNote(taskId, content)
        : { id: `offline-${Date.now()}`, content, author_id: currentUser.id, author_name: currentUser.name, created_at: new Date().toISOString() };
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                notes: [
                  ...t.notes,
                  {
                    id: note.id,
                    authorId: note.author_id ?? currentUser.id,
                    authorName: note.author_name ?? currentUser.name,
                    content: note.content,
                    createdAt: note.created_at ?? new Date().toISOString(),
                  },
                ],
              }
            : t
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  myTasks: () => {
    const { currentUser, tasks } = get();
    if (!currentUser) return [];
    return tasks.filter((t) => t.assigneeId === currentUser.id);
  },

  todaysTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter((t) => t.dueDate === today);
  },

  tasksForDate: (date) => get().tasks.filter((t) => t.dueDate === date),

  tasksForWeek: (startDate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const endStr = end.toISOString().split('T')[0];
    return get().tasks.filter((t) => t.dueDate >= startDate && t.dueDate < endStr);
  },

  detectConflicts: (startDate) => {
    const weekTasks = get().tasksForWeek(startDate);
    const conflicts: Array<{ date: string; tasks: Task[] }> = [];
    const byDate: Record<string, Task[]> = {};
    for (const t of weekTasks) {
      byDate[t.dueDate] = byDate[t.dueDate] ?? [];
      byDate[t.dueDate].push(t);
    }
    for (const [date, dayTasks] of Object.entries(byDate)) {
      // Group by assignee
      const byAssignee: Record<string, Task[]> = {};
      for (const t of dayTasks) {
        if (t.status === 'completed') continue;
        byAssignee[t.assigneeId] = byAssignee[t.assigneeId] ?? [];
        byAssignee[t.assigneeId].push(t);
      }
      for (const [, tasks] of Object.entries(byAssignee)) {
        if (tasks.length < 2) continue;
        // Check time overlap (within 60 min)
        const sorted = [...tasks].sort((a, b) => a.dueTime.localeCompare(b.dueTime));
        for (let i = 0; i < sorted.length - 1; i++) {
          const t1 = sorted[i];
          const t2 = sorted[i + 1];
          const [h1, m1] = t1.dueTime.split(':').map(Number);
          const [h2, m2] = t2.dueTime.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff < 60) {
            const existing = conflicts.find(c => c.date === date);
            if (existing) {
              for (const t of tasks) {
                if (!existing.tasks.find(et => et.id === t.id)) existing.tasks.push(t);
              }
            } else {
              conflicts.push({ date, tasks: [...tasks] });
            }
            break;
          }
        }
      }
    }
    return conflicts;
  },

  updateTask: async (taskId, updates) => {
    const isOnline = navigator.onLine;
    try {
      if (isOnline) {
        await dbUpdateTask(taskId, updates);
      }
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));

async function updateStatus(taskId: string, updates: Record<string, unknown>) {
  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
  if (error) throw error;
}
