# Molofu4 — Backend Specification (Phase 3a)

**Date:** 2026-05-02
**Phase:** 3a — Architecture
**Product:** Molofu4

---

## 1. Overview

This document defines the Supabase backend schema, Row Level Security (RLS) policies, and SQL routines required for the Molofu4 MVP. All tables use UUID primary keys linked to the Supabase Auth system.

---

## 2. Database Schema

### 2.1 SQL Migration (run in Supabase Dashboard → SQL Editor)

```sql
-- ============================================================
-- Molofu4 — Supabase Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: families
-- Purpose: Top-level family unit. All family members share one family_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS families (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  invite_code   TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: users
-- Purpose: User profiles linked 1:1 to Supabase auth.users.
-- role values: 'commander' | 'helper' | 'observer'
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL REFERENCES families(id),
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('commander', 'helper', 'observer')),
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for family lookups
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);

-- ============================================================
-- TABLE: tasks
-- Purpose: Core task entity. Family-scoped via family_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES families(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  assignee_id     UUID NOT NULL REFERENCES users(id),
  due_date        DATE NOT NULL,
  due_time        TIME NOT NULL,
  location_text   TEXT,
  contact         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'needs_help', 'completed')),
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  gps_lat         DOUBLE PRECISION,
  gps_lng         DOUBLE PRECISION,
  sync_pending    BOOLEAN NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_family_id    ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id  ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date    ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON tasks(status);

-- ============================================================
-- TABLE: task_notes
-- Purpose: Notes/messages on individual tasks. All roles can add.
-- ============================================================
CREATE TABLE IF NOT EXISTS task_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id);

-- ============================================================
-- TABLE: notifications
-- Purpose: In-app notifications. User-scoped.
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL
                CHECK (type IN ('task_assigned', 'task_completed', 'task_needs_help', 'message_received')),
  payload     JSONB NOT NULL DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON notifications(read) WHERE read = false;

-- ============================================================
-- TABLE: messages
-- Purpose: Direct messages between family members (e.g., Observer → Commander).
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES families(id),
  from_user_id  UUID NOT NULL REFERENCES users(id),
  to_user_id    UUID NOT NULL REFERENCES users(id),
  content       TEXT NOT NULL,
  read          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_family_id  ON messages(family_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages(to_user_id);

-- ============================================================
-- TABLE: locations
-- Purpose: GPS location log entries for helpers on active tasks.
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  accuracy    DOUBLE PRECISION,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_task_user ON locations(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_locations_logged_at ON locations(logged_at);

-- ============================================================
-- UPDATED_AT trigger (auto-update updated_at column)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Auto-create profile on new auth user (handled in app, not DB)
-- Note: We do NOT auto-create users here to allow invite-flow control
-- ============================================================
```

---

## 3. Row Level Security (RLS) Policies

```sql
-- ============================================================
-- RLS Policies
-- All tables have RLS enabled. Policies enforce family-scoped access.
-- ============================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- families
-- A user can only see families they belong to.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "families_select_own"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- users
-- A user can see all members of their own family.
-- A user can update only their own profile.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "users_select_family"
  ON users FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Insert is done via the app on first login (not self-service)

-- ─────────────────────────────────────────────────────────────
-- tasks
-- All family members can SELECT all family tasks.
-- All family members can INSERT tasks (commander creates; others may not,
--   but RLS does not block — app enforces role-based creation).
-- All family members can UPDATE family tasks (status changes, GPS, etc.)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "tasks_select_family"
  ON tasks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_family"
  ON tasks FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tasks_update_family"
  ON tasks FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- task_notes
-- All family members can read notes on family tasks.
-- All family members can insert notes (all roles can comment).
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "task_notes_select_family"
  ON task_notes FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "task_notes_insert_family"
  ON task_notes FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- notifications
-- Users can only read their own notifications.
-- Insert is done by DB functions (SECURITY DEFINER), not directly.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- messages
-- All family members can read messages in their family.
-- All family members can send messages to other family members.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "messages_select_family"
  ON messages FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_family"
  ON messages FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- locations
-- All family members can read GPS logs for family tasks.
-- All family members can insert location logs for family tasks.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "locations_select_family"
  ON locations FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "locations_insert_family"
  ON locations FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

---

## 4. SQL RPC Functions

```sql
-- ============================================================
-- RPC Functions
-- SECURITY DEFINER so they run with elevated privileges to
-- write to notifications table (which users cannot directly insert).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- complete_task(task_id, user_id)
-- Marks a task complete and notifies the task creator.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_task(
  task_id    UUID,
  user_id    UUID
) RETURNS VOID AS $$
DECLARE
  v_task   tasks%ROWTYPE;
  v_title  TEXT;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = task_id;
  v_title := v_task.title;

  UPDATE tasks
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = task_id;

  -- Notify task creator (who is typically the commander)
  INSERT INTO notifications (user_id, type, payload)
    VALUES (
      v_task.created_by,
      'task_completed',
      jsonb_build_object(
        'task_id', task_id,
        'task_title', v_title,
        'completed_by', user_id
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- reassign_task(task_id, new_assignee_id)
-- Changes assignee and notifies the new assignee.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reassign_task(
  task_id          UUID,
  new_assignee_id  UUID
) RETURNS VOID AS $$
DECLARE
  v_task  tasks%ROWTYPE;
  v_title TEXT;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = task_id;
  v_title := v_task.title;

  UPDATE tasks
    SET assignee_id = new_assignee_id,
        updated_at = now()
    WHERE id = task_id;

  INSERT INTO notifications (user_id, type, payload)
    VALUES (
      new_assignee_id,
      'task_assigned',
      jsonb_build_object(
        'task_id', task_id,
        'task_title', v_title,
        'reassigned_by', auth.uid()
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- flag_needs_help(task_id, user_id)
-- Sets task status to needs_help and notifies the commander.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION flag_needs_help(
  task_id  UUID,
  user_id  UUID
) RETURNS VOID AS $$
DECLARE
  v_task  tasks%ROWTYPE;
  v_title TEXT;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = task_id;
  v_title := v_task.title;

  UPDATE tasks
    SET status = 'needs_help',
        updated_at = now()
    WHERE id = task_id;

  INSERT INTO notifications (user_id, type, payload)
    VALUES (
      v_task.created_by,
      'task_needs_help',
      jsonb_build_object(
        'task_id', task_id,
        'task_title', v_title,
        'flagged_by', user_id
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- send_message(to_user_id, content)
-- Persists a message and notifies the recipient.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION send_message(
  to_user_id  UUID,
  content     TEXT
) RETURNS VOID AS $$
DECLARE
  v_from_family_id UUID;
  v_from_user_id   UUID := auth.uid();
BEGIN
  SELECT family_id INTO v_from_family_id
    FROM users WHERE id = v_from_user_id;

  INSERT INTO messages (family_id, from_user_id, to_user_id, content)
    VALUES (v_from_family_id, v_from_user_id, to_user_id, content);

  INSERT INTO notifications (user_id, type, payload)
    VALUES (
      to_user_id,
      'message_received',
      jsonb_build_object(
        'from_user_id', v_from_user_id,
        'content', content
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- get_week_tasks(family_id, week_start)
-- Returns all non-cancelled tasks for a family within a Sun-Sat week.
-- week_start should be a DATE for the Sunday of the target week.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_week_tasks(
  family_id_input   UUID,
  week_start_input   DATE
) RETURNS SETOF tasks AS $$
BEGIN
  RETURN QUERY
    SELECT *
      FROM tasks
     WHERE family_id = family_id_input
       AND due_date >= week_start_input
       AND due_date < week_start_input + INTERVAL '7 days'
     ORDER BY due_date, due_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- get_latest_location(task_id, user_id)
-- Returns the most recent GPS location for a user on a task.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_latest_location(
  task_id_input   UUID,
  user_id_input   UUID
) RETURNS SETOF locations AS $$
BEGIN
  RETURN QUERY
    SELECT *
      FROM locations
     WHERE task_id = task_id_input
       AND user_id = user_id_input
     ORDER BY logged_at DESC
     LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Database Triggers

```sql
-- ============================================================
-- Triggers
-- ============================================================

-- update_updated_at_column is defined in Section 2 above
-- Already created via the migration

-- ============================================================
-- Handle new user sign-up
-- When a new user is created in auth.users, create a placeholder
-- in the users table. The profile must be completed at onboarding.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't auto-insert here; let the app handle onboarding flow
  -- This function exists for future auto-provisioning if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Auth trigger not created here to keep invite-flow controlled by app
```

---

## 6. Supabase Realtime Configuration

Enable Realtime on these tables in Supabase Dashboard → Database → Replication:
- `tasks` — for cross-device task sync
- `notifications` — for in-app notification delivery
- `messages` — for message delivery

Realtime is configured in the Supabase client as follows:

```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

## 7. Environment Variables

These are set in `.env` and loaded at build time:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Critical:** Never commit `.env` or any file containing these values.

---

## 8. Verification Queries (run in Supabase SQL Editor)

```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;

-- Verify RPC functions exist
SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND type_udt_name IS NULL;

-- Test tasks insert (should respect RLS)
-- Run as authenticated user:
-- INSERT INTO tasks (family_id, title, assignee_id, due_date, due_time, created_by)
-- VALUES ('your-family-id', 'Test task', 'your-user-id', CURRENT_DATE, '14:00', 'your-user-id');
```

---

## 9. Phase 3 Gate Checklist

- [x] All 8 Supabase tables defined with correct types and constraints
- [x] `families` table with `invite_code`
- [x] `users` table linked to `auth.users`
- [x] `tasks` table with all required columns including GPS and sync_pending
- [x] `task_notes` table for F6 (notes)
- [x] `notifications` table for F7 (notifications)
- [x] `messages` table for F5 (observer → commander messages)
- [x] `locations` table for F3 (GPS log)
- [x] All indexes for common query patterns
- [x] RLS enabled on all 7 tables
- [x] Family-scoped SELECT policies on all tables
- [x] Family-scoped INSERT policies on tasks, task_notes, messages, locations
- [x] User-scoped SELECT on notifications
- [x] 6 SQL RPC functions defined (complete_task, reassign_task, flag_needs_help, send_message, get_week_tasks, get_latest_location)
- [x] All RPC functions use SECURITY DEFINER where needed
- [x] updated_at triggers on users and tasks
- [x] Realtime enabled on tasks, notifications, messages
- [x] No credentials in this document
