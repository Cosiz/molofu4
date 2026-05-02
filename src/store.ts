import { create } from 'zustand';
import type { User, Task, TaskStatus } from './types';

const SARAH: User = { id: 'u1', name: 'Sarah Chen', role: 'commander' };
const MARIA: User = { id: 'u2', name: 'Maria Santos', role: 'helper' };
const DAVID: User = { id: 'u3', name: 'David Chen', role: 'observer' };

const FAMILY = { id: 'f1', name: 'Chen Family', members: [SARAH, MARIA, DAVID] };

const today = new Date().toISOString().split('T')[0];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Pick up Tim from basketball',
    description: 'Practice ends at 5pm. Gate B — blue cubby has his gear bag.',
    assigneeId: 'u2',
    assigneeName: 'Maria Santos',
    dueTime: '17:00',
    dueDate: today,
    location: 'Kowloon Cricket Club, Gate B',
    contact: 'Coach Wei: 9123 4567',
    status: 'pending',
    completedAt: '',
    notes: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    createdBy: 'u1',
  },
  {
    id: 't2',
    title: 'Buy groceries for dinner',
    description: 'Stir-fry: choy sum, beef, ginger. Wet market opens 8am.',
    assigneeId: 'u2',
    assigneeName: 'Maria Santos',
    dueTime: '09:00',
    dueDate: today,
    location: 'Kowloon Wet Market',
    contact: '',
    status: 'completed',
    completedAt: new Date(Date.now() - 3600000).toISOString(),
    notes: [],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    createdBy: 'u1',
  },
  {
    id: 't3',
    title: 'Wake kids for school',
    description: '',
    assigneeId: 'u2',
    assigneeName: 'Maria Santos',
    dueTime: '07:00',
    dueDate: today,
    location: 'Home',
    contact: '',
    status: 'completed',
    completedAt: new Date(Date.now() - 1800000).toISOString(),
    notes: [],
    createdAt: new Date(Date.now() - 54000000).toISOString(),
    createdBy: 'u1',
  },
  {
    id: 't4',
    title: 'Take Lily to piano lesson',
    description: 'Grade 3 exam prep — bring sight-reading book.',
    assigneeId: 'u2',
    assigneeName: 'Maria Santos',
    dueTime: '16:00',
    dueDate: today,
    location: "Mrs. Lam Piano Studio, 3/F, 42 Java Rd",
    contact: 'Mrs. Lam: 6555 1234',
    status: 'needs_help',
    completedAt: '',
    notes: [
      {
        id: 'n1',
        authorId: 'u2',
        authorName: 'Maria Santos',
        content: 'Traffic looks bad — may be 10 min late. Is that OK?',
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'u1',
  },
];

interface Store {
  currentUser: User | null;
  family: typeof FAMILY;
  tasks: Task[];
  setUser: (user: User) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'notes' | 'completedAt'>) => void;
  completeTask: (taskId: string) => void;
  updateStatus: (taskId: string, status: TaskStatus) => void;
  addNote: (taskId: string, content: string) => void;
  myTasks: () => Task[];
  todaysTasks: () => Task[];
  tasksForDate: (date: string) => Task[];
  tasksForWeek: (startDate: string) => Task[];
}

export const useStore = create<Store>((set, get) => ({
  currentUser: null,
  family: FAMILY,
  tasks: INITIAL_TASKS,

  setUser: (user) => set({ currentUser: user }),

  addTask: (task) =>
    set((s) => ({
      tasks: [
        ...s.tasks,
        {
          ...task,
          id: 't' + Date.now(),
          createdAt: new Date().toISOString(),
          notes: [],
          completedAt: '',
        },
      ],
    })),

  completeTask: (taskId) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
          : t
      ),
    })),

  updateStatus: (taskId, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    })),

  addNote: (taskId, content) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              notes: [
                ...t.notes,
                {
                  id: 'n' + Date.now(),
                  authorId: currentUser.id,
                  authorName: currentUser.name,
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : t
      ),
    }));
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

  tasksForDate: (date: string) => {
    return get().tasks.filter((t) => t.dueDate === date);
  },

  tasksForWeek: (startDate: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const endStr = end.toISOString().split('T')[0];
    return get().tasks.filter((t) => t.dueDate >= startDate && t.dueDate < endStr);
  },
}));
