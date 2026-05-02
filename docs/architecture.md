# Molofu4 — Technical Architecture (Phase 3a)

**Date:** 2026-05-02
**Phase:** 3a — Architecture
**Product:** Molofu4
**Brownfield origin:** molofu3 (React 18 + Vite + Zustand + React Router v6)

---

## 1. Overview

Molofu4 is a family coordination app for HK working families. It replaces molofu3's mock data layer with a real Supabase backend, adds offline-first architecture, GPS tracking, and a co-parent role.

**Tech stack:**
- **Frontend:** React 19 + TypeScript + Vite
- **Routing:** React Router v7 (breaking change from v6 — see §11)
- **State:** Zustand (in-memory) + IndexedDB (offline cache) + Supabase (persistence)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Offline:** IndexedDB via `idb` library + background sync on reconnect
- **Deployment:** Vercel (frontend) + Supabase Cloud (managed backend)

---

## 2. Blocking Dependency Audit

| Dependency | Category | Status | Notes |
|------------|----------|--------|-------|
| Supabase project (project ref + anon key) | **BLOCKER** | Must exist before Phase 4 coding | Already flagged in state.json blockers |
| Browser Geolocation API | **BLOCKER** | Available in all target browsers | Graceful degradation if denied |
| IndexedDB (idb library) | **BLOCKER** | Available via npm | No service worker complexity for MVP |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars | **BLOCKER** | Must be in `.env` before build | Loaded via `import.meta.env` |
| Hong Kong Observatory Typhoon API | NICE-TO-HAVE | Not available in MVP | Commander manual flag only |

---

## 3. Data Model

### 3.1 Supabase Tables

#### `families`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL
invite_code     TEXT UNIQUE NOT NULL  -- 6-char uppercase code
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `users` (profile rows linked to Supabase Auth UID)
```sql
id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
family_id       UUID NOT NULL REFERENCES families(id)
name            TEXT NOT NULL
role            TEXT NOT NULL CHECK (role IN ('commander', 'helper', 'observer'))
avatar_url      TEXT
phone           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `tasks`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
family_id       UUID NOT NULL REFERENCES families(id)
title           TEXT NOT NULL
description     TEXT DEFAULT ''
assignee_id     UUID NOT NULL REFERENCES users(id)
due_date        DATE NOT NULL
due_time        TIME NOT NULL
location_text   TEXT
contact         TEXT
status          TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'needs_help', 'completed'))
created_by      UUID NOT NULL REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
completed_at    TIMESTAMPTZ
gps_lat         DOUBLE PRECISION
gps_lng         DOUBLE PRECISION
sync_pending    BOOLEAN DEFAULT false  -- for offline sync tracking
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `task_notes`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
author_id       UUID NOT NULL REFERENCES users(id)
content         TEXT NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `notifications`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id)
type            TEXT NOT NULL
                CHECK (type IN ('task_assigned', 'task_completed', 'task_needs_help', 'message_received'))
payload         JSONB DEFAULT '{}'
read            BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `messages` (Observer → Commander direct messages)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
family_id       UUID NOT NULL REFERENCES families(id)
from_user_id    UUID NOT NULL REFERENCES users(id)
to_user_id      UUID NOT NULL REFERENCES users(id)
content         TEXT NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
read            BOOLEAN DEFAULT false
```

#### `locations` (GPS location log per user per task)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
user_id         UUID NOT NULL REFERENCES users(id)
lat             DOUBLE PRECISION NOT NULL
lng             DOUBLE PRECISION NOT NULL
accuracy        DOUBLE PRECISION
logged_at       TIMESTAMPTZ DEFAULT now()
```

### 3.2 TypeScript Interfaces

```typescript
interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

interface User {
  id: string;
  family_id: string;
  name: string;
  role: 'commander' | 'helper' | 'observer';
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

interface Task {
  id: string;
  family_id: string;
  title: string;
  description: string;
  assignee_id: string;
  due_date: string;       // ISO date YYYY-MM-DD
  due_time: string;       // HH:MM
  location_text?: string;
  contact?: string;
  status: 'pending' | 'in_progress' | 'needs_help' | 'completed';
  created_by: string;
  created_at: string;
  completed_at?: string;
  gps_lat?: number;
  gps_lng?: number;
  sync_pending?: boolean;
  updated_at: string;
}

interface TaskNote {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_completed' | 'task_needs_help' | 'message_received';
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

interface Message {
  id: string;
  family_id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface LocationLog {
  id: string;
  task_id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  logged_at: string;
}
```

---

## 4. API Design

### 4.1 Supabase Client Initialization

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
```

### 4.2 Typed RPC Functions

```typescript
// src/lib/rpc.ts
import { supabase } from './supabase';

// RPC: Mark task complete and create notification
async function rpc_complete_task(task_id: string, user_id: string) {
  return supabase.rpc('complete_task', { task_id, user_id });
}

// RPC: Reassign task to another family member
async function rpc_reassign_task(task_id: string, new_assignee_id: string) {
  return supabase.rpc('reassign_task', { task_id, new_assignee_id });
}

// RPC: Flag task as needs_help
async function rpc_flag_needs_help(task_id: string, user_id: string) {
  return supabase.rpc('flag_needs_help', { task_id, user_id });
}

// RPC: Send message from observer to commander
async function rpc_send_message(to_user_id: string, content: string) {
  return supabase.rpc('send_message', { to_user_id, content });
}

// RPC: Get tasks for a specific week (Sun-Sat)
async function rpc_get_week_tasks(family_id: string, week_start: string) {
  return supabase.rpc('get_week_tasks', { family_id, week_start });
}

// RPC: Get latest location for a user on a task
async function rpc_get_latest_location(task_id: string, user_id: string) {
  return supabase.rpc('get_latest_location', { task_id, user_id });
}
```

### 4.3 Supabase SQL RPC Functions (to be created in Supabase dashboard)

```sql
-- complete_task: marks task complete + creates notification for commander
CREATE OR REPLACE FUNCTION complete_task(task_id UUID, user_id UUID)
RETURNS void AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_title TEXT;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = task_id;
  UPDATE tasks SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = task_id;
  INSERT INTO notifications (user_id, type, payload)
    VALUES (v_task.created_by, 'task_completed',
            jsonb_build_object('task_id', task_id, 'task_title', v_task.title));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- reassign_task: changes assignee + notifies new assignee
CREATE OR REPLACE FUNCTION reassign_task(task_id UUID, new_assignee_id UUID)
RETURNS void AS $$
DECLARE
  v_task tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = task_id;
  UPDATE tasks SET assignee_id = new_assignee_id, updated_at = now() WHERE id = task_id;
  INSERT INTO notifications (user_id, type, payload)
    VALUES (new_assignee_id, 'task_assigned',
            jsonb_build_object('task_id', task_id, 'task_title', v_task.title));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- flag_needs_help: sets status + notifies commander
CREATE OR REPLACE FUNCTION flag_needs_help(task_id UUID, user_id UUID)
RETURNS void AS $$
DECLARE
  v_task tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = task_id;
  UPDATE tasks SET status = 'needs_help', updated_at = now() WHERE id = task_id;
  INSERT INTO notifications (user_id, type, payload)
    VALUES (v_task.created_by, 'task_needs_help',
            jsonb_build_object('task_id', task_id, 'task_title', v_task.title));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- send_message: persists message + creates notification for recipient
CREATE OR REPLACE FUNCTION send_message(to_user_id UUID, content TEXT)
RETURNS void AS $$
DECLARE
  v_from_id UUID := auth.uid();
BEGIN
  INSERT INTO messages (family_id, from_user_id, to_user_id, content)
    SELECT family_id, v_from_id, to_user_id, content FROM users WHERE id = v_from_id;
  INSERT INTO notifications (user_id, type, payload)
    VALUES (to_user_id, 'message_received',
            jsonb_build_object('from_user_id', v_from_id, 'content', content));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_week_tasks: returns all tasks for a family within a Sun-Sat week
CREATE OR REPLACE FUNCTION get_week_tasks(family_id_input UUID, week_start_input DATE)
RETURNS SETOF tasks AS $$
BEGIN
  RETURN QUERY SELECT * FROM tasks
    WHERE family_id = family_id_input
      AND due_date >= week_start_input
      AND due_date < week_start_input + INTERVAL '7 days'
    ORDER BY due_date, due_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_latest_location: returns most recent GPS log for a user on a task
CREATE OR REPLACE FUNCTION get_latest_location(task_id_input UUID, user_id_input UUID)
RETURNS SETOF locations AS $$
BEGIN
  RETURN QUERY SELECT * FROM locations
    WHERE task_id = task_id_input AND user_id = user_id_input
    ORDER BY logged_at DESC LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Auth Flow

### 5.1 Magic Link Email (Primary)

1. User enters email on `/auth` screen
2. `supabase.auth.signInWithOtp({ email })` → Supabase sends email with 6-char code
3. User enters code → `supabase.auth.verifyOtp({ email, token })` → session created
4. On first login, if no `users` profile row exists → redirect to onboarding to create profile
5. Session persisted in `supabase.auth.getSession()` → stored in Zustand

### 5.2 JWT / Session Management

```typescript
// src/lib/auth.ts
import { supabase } from './supabase';
import type { User } from '@/types';

export async function getProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function createProfile(
  userId: string,
  profile: { name: string; role: 'commander' | 'helper' | 'observer'; family_id: string }
): Promise<void> {
  await supabase.from('users').insert({ id: userId, ...profile });
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
```

### 5.3 Family Join Flow

- Commander creates family → gets 6-char `invite_code`
- Helper/Observer joins via invite code → `supabase.from('families').select()` filtered by code
- On join: user's `family_id` set to matched family's ID

---

## 6. Offline Sync Strategy

### 6.1 IndexedDB Schema (via `idb` library)

```
Database: molofu4-offline
  Store: tasks       (keyPath: id)
  Store: task_notes  (keyPath: id)
  Store: sync_queue (keyPath: id, autoIncrement)
```

### 6.2 Sync Flow

```
[Online]
  Supabase (source of truth)
    ↓ fetch tasks
  Zustand (in-memory state)
    ↓ write
  IndexedDB (persistent cache)

[Offline]
  IndexedDB (read-only cache)
    ↓ read
  Zustand (in-memory state)
    ↓ write (optimistic)
  IndexedDB sync_queue (pending writes)

[Reconnect]
  IndexedDB sync_queue
    ↓ drain oldest first
  Supabase (write each pending change)
    ↓ on success
  Remove from sync_queue
  Refresh Zustand from Supabase
```

### 6.3 Conflict Resolution

- **Strategy:** Last-write-wins (Supabase `updated_at` timestamp)
- **Offline writes** carry local `updated_at`; server accepts if newer
- **Conflict UI:** None for MVP — conflicts silently resolved

### 6.4 Online/Offline Detection

```typescript
// src/hooks/useOnlineStatus.ts
import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### 6.5 Background Sync on Reconnect

```typescript
// src/lib/sync.ts
import { openDB } from 'idb';
import { supabase } from './supabase';

async function getSyncQueue() {
  const db = await openDB('molofu4-offline', 1, {
    upgrade(db) {
      db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
    },
  });
  return db.getAll('sync_queue');
}

async function processSync() {
  const queue = await getSyncQueue();
  for (const item of queue) {
    const { type, payload } = item;
    if (type === 'complete_task') {
      await supabase.from('tasks').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', payload.task_id);
    }
    // ... handle other types
    await removeFromQueue(item.id);
  }
}

// Listen for reconnect
window.addEventListener('online', () => {
  processSync();
});
```

---

## 7. RLS Policies (Family-Scoped Row Access)

```sql
-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Families: users can only see their own family
CREATE POLICY "Users can see own family"
  ON families FOR SELECT
  USING (id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Users: users can only see members of their own family
CREATE POLICY "Users can see own family members"
  ON users FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Tasks: family-scoped read/write
CREATE POLICY "Family members can read all family tasks"
  ON tasks FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Family members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Family members can update family tasks"
  ON tasks FOR UPDATE
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Task notes: family-scoped (via task join)
CREATE POLICY "Family can read task notes"
  ON task_notes FOR SELECT
  USING (task_id IN (
    SELECT id FROM tasks WHERE family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Family members can insert task notes"
  ON task_notes FOR INSERT
  WITH CHECK (task_id IN (
    SELECT id FROM tasks WHERE family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  ));

-- Notifications: user-scoped
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Messages: family-scoped
CREATE POLICY "Family can read family messages"
  ON messages FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Family members can send messages"
  ON messages FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Locations: family-scoped
CREATE POLICY "Family can read locations"
  ON locations FOR SELECT
  USING (task_id IN (
    SELECT id FROM tasks WHERE family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Family members can insert locations"
  ON locations FOR INSERT
  WITH CHECK (task_id IN (
    SELECT id FROM tasks WHERE family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  ));
```

---

## 8. GPS Data Flow

### 8.1 Capture GPS on Task Creation

```typescript
// src/components/CreateTaskModal.tsx
async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),  // Graceful degradation
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}
```

### 8.2 Helper Location Sharing (Commander View)

1. Helper opens task → app calls `navigator.geolocation.getCurrentPosition()` every 30s while task is `in_progress`
2. Location written to Supabase `locations` table
3. Commander opens task detail → RPC `get_latest_location(task_id, helper_id)` returns latest lat/lng
4. Map thumbnail renders static OSM image with marker

```typescript
// src/lib/gps.ts
import { supabase } from './supabase';

export async function logLocation(taskId: string, userId: string, lat: number, lng: number, accuracy?: number) {
  await supabase.from('locations').insert({
    task_id: taskId,
    user_id: userId,
    lat,
    lng,
    accuracy,
    logged_at: new Date().toISOString(),
  });
}

export async function getLatestLocation(taskId: string, userId: string) {
  const { data } = await supabase.rpc('get_latest_location', { task_id_input: taskId, user_id_input: userId });
  return data;
}
```

### 8.3 Map Thumbnail (OSM)

```
https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=16&l=map&size=400,200
```
OR OpenStreetMap:
```
https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005},${lat-0.003},${lng+0.005},${lat+0.003}
```

### 8.4 Open in Maps Deep Links

```typescript
function openInMaps(lat: number, lng: number) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const url = isIOS
    ? `https://maps.apple.com/?ll=${lat},${lng}`
    : `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, '_blank');
}
```

---

## 9. Notification Delivery

### 9.1 Strategy: Supabase Realtime (Primary) + Polling (Fallback)

**Primary:** Supabase Realtime subscription on `notifications` table filtered by `user_id = auth.uid()`.

```typescript
// src/lib/notifications.ts
import { supabase } from './supabase';
import type { Notification } from '@/types';

export function subscribeToNotifications(userId: string, onNew: (n: Notification) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as Notification)
    )
    .subscribe();
}
```

**Fallback (MVP):** Polling every 60 seconds on app focus.

```typescript
// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useNotificationPolling(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      await supabase.from('notifications').select('*').eq('user_id', userId).eq('read', false);
    }, 60_000);
    return () => clearInterval(interval);
  }, [userId]);
}
```

### 9.2 Notification Types

| type | Trigger | Recipient |
|------|---------|-----------|
| `task_assigned` | Task created or reassigned | New assignee |
| `task_completed` | Helper marks task done | Task creator (commander) |
| `task_needs_help` | Helper/Observer flags needs_help | Task creator |
| `message_received` | Observer sends message to commander | Commander |

---

## 10. Conflict Detection (Date-Based)

### 10.1 Conflict Detection Algorithm

```typescript
// src/lib/conflictDetection.ts
import type { Task } from '@/types';

interface Conflict {
  date: string;
  assignee_id: string;
  tasks: Task[];
  suggested_assignee_id?: string;
}

export function detectConflicts(tasks: Task[]): Conflict[] {
  // Group tasks by (assignee_id, due_date)
  const byAssigneeDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.status === 'completed') continue;
    const key = `${task.assignee_id}:${task.due_date}`;
    if (!byAssigneeDate.has(key)) byAssigneeDate.set(key, []);
    byAssigneeDate.get(key)!.push(task);
  }

  const conflicts: Conflict[] = [];
  for (const [key, groupTasks] of byAssigneeDate) {
    if (groupTasks.length < 2) continue;
    // Sort by time
    groupTasks.sort((a, b) => a.due_time.localeCompare(b.due_time));
    // Check for 30-min overlaps
    for (let i = 0; i < groupTasks.length - 1; i++) {
      const t1 = groupTasks[i];
      const t2 = groupTasks[i + 1];
      const diff = timeDiffMinutes(t1.due_time, t2.due_time);
      if (diff < 30) {
        conflicts.push({
          date: t1.due_date,
          assignee_id: t1.assignee_id,
          tasks: [t1, t2],
          suggested_assignee_id: findAlternativeAssignee(t1, tasks),
        });
      }
    }
  }
  return conflicts;
}

function timeDiffMinutes(t1: string, t2: string): number {
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function findAlternativeAssignee(task: Task, allTasks: Task[]): string | undefined {
  // Find another family member who doesn't have a task at the same time
  const familyMembers = allTasks.filter(t => t.assignee_id !== task.assignee_id);
  const available = familyMembers.filter(t => t.due_date !== task.due_date || t.due_time !== task.due_time);
  return available[0]?.assignee_id;
}
```

### 10.2 Typhoon Day Handling

- Commander sets `typhoon_mode: true` manually (no HK Observatory API in MVP)
- When active: tasks for the typhoon day marked as `cancelled` (new status)
- Conflicts for the day suppressed (cancelled tasks don't conflict)
- Typhoon banner shown on dashboard

```typescript
// src/store/typhoonStore.ts
import { create } from 'zustand';

interface TyphoonState {
  typhoonMode: boolean;
  typhoonDate: string | null;
  setTyphoonMode(active: boolean, date?: string): void;
}
```

---

## 11. React Router v7 Breaking Change

### What Changed from v6 → v7

React Router v7 introduces a flat config format and changes how `createBrowserRouter` works. The molofu3 `App.tsx` used `Routes` + `Route` component syntax; this must be migrated.

### Migration

```typescript
// src/App.tsx (molofu4 - React Router v7)
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { CommanderDashboard } from './screens/CommanderDashboard';
import { HelperDashboard } from './screens/HelperDashboard';
import { ObserverDashboard } from './screens/ObserverDashboard';
import { AuthScreen } from './screens/AuthScreen';
import { ProtectedRoute } from './components/ProtectedRoute';

// v7 flat config
export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthScreen />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/commander" replace /> },
      {
        path: 'commander',
        element: <CommanderDashboard />,
      },
      {
        path: 'helper',
        element: <HelperDashboard />,
      },
      {
        path: 'observer',
        element: <ObserverDashboard />,
      },
    ],
  },
]);
```

**Other v7 changes affecting molofu4:**
- `useNavigate` → `useNavigate()` (no change to API)
- `useParams` → no change
- `LoaderFunction` / `ActionFunction` replaces `loader`/`action` as plain async functions in v7 flat config
- `RouterProvider` replaces `<Router>` component

---

## 12. Feature → Architecture Mapping (F1–F8)

| Feature | Architecture Coverage |
|---------|----------------------|
| **F1: Real Supabase Backend** | §3 (data model), §4 (API design), §5 (auth), §6 (sync), §7 (RLS) |
| **F2: Week View** | §4.3 (`rpc_get_week_tasks`), §10 (conflict detection), Zustand `currentWeekSunday` state |
| **F3: GPS Location** | §8 (GPS data flow: capture, log, display, open-in-maps) |
| **F4: Offline/IndexedDB** | §6 (offline sync strategy, idb schema, sync queue, reconnect) |
| **F5: Co-Parent Role** | §3 (`users.role = observer`), §4.3 (`rpc_reassign_task`, `rpc_flag_needs_help`, `rpc_send_message`), §7 (RLS allows observer writes) |
| **F6: Notes** | §3 (`task_notes` table), §4.3 (notes read/write via Supabase client) |
| **F7: Notifications** | §9 (Realtime + polling, 4 notification types, §4.3 RPC for server-side insert) |
| **F8: Conflict Detection** | §10 (date-based algorithm, 30-min window, suggested reassign) |

---

## 13. Zustand Store Structure (molofu4)

```typescript
// src/store.ts
import { create } from 'zustand';
import type { Task, User, Notification, TaskNote } from './types';

interface AppState {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;

  // Week view
  currentWeekSunday: Date;
  selectedDay: Date;
  setCurrentWeekSunday: (date: Date) => void;
  setSelectedDay: (date: Date) => void;

  // Offline
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
  syncPending: boolean;
  setSyncPending: (v: boolean) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;

  // Typhoon
  typhoonMode: boolean;
  setTyphoonMode: (active: boolean, date?: string) => void;

  // Notes (local cache)
  taskNotes: Record<string, TaskNote[]>;
  addNote: (taskId: string, note: TaskNote) => void;
}
```

---

## 14. Edge Cases and Failure Modes

| Scenario | Handling |
|----------|----------|
| GPS denied | Task creates without GPS coords; location text shown, map hidden; no error to user |
| Offline task creation | Write to IndexedDB with `sync_pending: true`; show pending badge; sync on reconnect |
| Offline task completion | Write to sync_queue; Supabase updated on reconnect; no data loss |
| Supabase realtime disconnect | Polling fallback every 60s; no data loss |
| Magic link OTP expired | Resend flow; 5-min expiry; clear error message |
| Family invite code invalid | Inline validation error; retry allowed |
| Network drops mid-sync | Sync queue persists; retry on next online event |
| Two devices update same task | Last-write-wins via `updated_at`; no conflict UI for MVP |
| Observer without family | Redirect to create/join family flow |

---

## 15. Test Strategy

| Layer | What to Test |
|-------|-------------|
| Unit | Conflict detection algorithm, time diff calculations, GPS coordinate capture |
| Integration | Supabase CRUD for each table, RPC functions, RLS policy enforcement |
| E2E (Playwright) | Full user flows: create task → appears in week view → mark complete → notification delivered |
| Offline | Go offline → complete task → go online → verify Supabase updated |
| Auth | Magic link → OTP verify → session persists across page refresh |

---

## 16. Files to Create (Phase 3b checklist)

- [ ] `src/lib/supabase.ts` — Supabase client initialization
- [ ] `src/lib/auth.ts` — Auth helpers (getProfile, createProfile, signOut)
- [ ] `src/lib/rpc.ts` — Typed RPC wrappers
- [ ] `src/lib/sync.ts` — IndexedDB sync engine
- [ ] `src/lib/gps.ts` — GPS logging and retrieval
- [ ] `src/lib/conflictDetection.ts` — Conflict algorithm
- [ ] `src/hooks/useOnlineStatus.ts` — Online/offline detection
- [ ] `src/hooks/useNotifications.ts` — Notification polling hook
- [ ] `src/store.ts` — Zustand store (updated from molofu3)
- [ ] `src/App.tsx` — React Router v7 migration
- [ ] Supabase SQL migration file with all tables + RLS + RPC functions
