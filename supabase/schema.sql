-- Molofu4 Supabase Schema (v2 — infinite recursion fix)
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste and Run
-- Project: cadihxuwjrfzvjinvmfm

-- ============================================================
-- FUNCTIONS (must be defined before RLS policies that use them)
-- ============================================================

-- SECURITY DEFINER bypasses RLS — used only for auth checks inside RLS policies
-- This avoids the infinite recursion problem where a policy on `users` queries `users`
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT family_id FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'helper' CHECK (role IN ('commander', 'helper', 'observer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assignee_id UUID REFERENCES public.users(id),
  assignee_name TEXT,
  due_date DATE,
  due_time TIME,
  location TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'needs_help')),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id),
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_family ON public.tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_notes_task ON public.task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_user ON public.locations(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Families: any authenticated user in the family can read it
CREATE POLICY "family_read" ON public.families
  FOR SELECT USING (
    id = public.get_user_family_id()
  );

-- Users: any authenticated family member can read family roster
-- Uses SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "users_read" ON public.users
  FOR SELECT USING (
    family_id = public.get_user_family_id()
  );

-- Tasks: family members can read/write tasks in their family
CREATE POLICY "tasks_all" ON public.tasks
  FOR ALL USING (
    family_id = public.get_user_family_id()
  );

-- Task notes: family members can read/write notes on family tasks
CREATE POLICY "notes_all" ON public.task_notes
  FOR ALL USING (
    task_id IN (SELECT id FROM public.tasks WHERE family_id = public.get_user_family_id())
  );

-- Notifications: users can read their own, write their own
CREATE POLICY "notifications_read" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Locations: family members can see each other's locations
CREATE POLICY "locations_read" ON public.locations
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE family_id = public.get_user_family_id())
  );

CREATE POLICY "locations_write" ON public.locations
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- SEED DATA: Chen Family
-- ============================================================

INSERT INTO public.families (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Chen Family')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, family_id, name, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sarah Chen', 'sarah@molofu.com', 'commander'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Maria Santos', 'maria@molofu.com', 'helper'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'David Chen', 'david@molofu.com', 'observer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, family_id, title, description, assignee_id, assignee_name, due_date, due_time, location, contact, status, created_by) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Pick up Tim from basketball', 'Practice ends at 5pm. Gate B — blue cubby has his gear bag.', '00000000-0000-0000-0000-000000000002', 'Maria Santos', CURRENT_DATE, '17:00', 'Kowloon Cricket Club, Gate B', 'Coach Wei: 9123 4567', 'pending', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Buy groceries for dinner', 'Stir-fry: choy sum, beef, ginger. Wet market opens 8am.', '00000000-0000-0000-0000-000000000002', 'Maria Santos', CURRENT_DATE, '09:00', 'Kowloon Wet Market', '', 'completed', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Wake kids for school', '', '00000000-0000-0000-0000-000000000002', 'Maria Santos', CURRENT_DATE, '07:00', 'Home', '', 'completed', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Take Lily to piano lesson', 'Grade 3 exam prep — bring sight-reading book.', '00000000-0000-0000-0000-000000000002', 'Maria Santos', CURRENT_DATE, '16:00', 'Mrs. Lam Piano Studio, 3/F, 42 Java Rd', 'Mrs. Lam: 6555 1234', 'needs_help', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.task_notes (id, task_id, author_id, author_name, content) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Maria Santos', 'Traffic looks bad — may be 10 min late. Is that OK?')
ON CONFLICT (id) DO NOTHING;
