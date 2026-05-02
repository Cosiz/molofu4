import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const FAMILY_ID = '00000000-0000-0000-0000-000000000001';

// ── Auth helpers ────────────────────────────────────────────────
export async function signInAs(role: 'commander' | 'helper' | 'observer') {
  const emailMap = {
    commander: 'sarah@molofu.com',
    helper: 'maria@molofu.com',
    observer: 'david@molofu.com',
  };
  const { data, error } = await supabase.auth.signInWithOtp({
    email: emailMap[role],
    options: { shouldCreateUser: false },
  });
  return { data, error };
}

// ── Tasks ──────────────────────────────────────────────────────
export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, task_notes(*), assignee_id, assignee_name, due_date, due_time, location, contact')
    .eq('family_id', FAMILY_ID)
    .order('due_date', { ascending: true })
    .order('due_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(task: {
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  dueTime?: string;
  location?: string;
  contact?: string;
  status?: string;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const createdBy = sessionData?.session?.user?.id;
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, family_id: FAMILY_ID, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeTask(taskId: string) {
  return updateTask(taskId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

export async function addNote(taskId: string, content: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();
  const { data, error } = await supabase
    .from('task_notes')
    .insert({ task_id: taskId, author_id: userId, author_name: profile?.name ?? 'Unknown', content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchLocations(userId?: string) {
  let query = supabase
    .from('locations')
    .select('*')
    .order('updated_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateLocation(userId: string, lat: number, lng: number, taskId?: string) {
  const { data, error } = await supabase
    .from('locations')
    .upsert({ user_id: userId, latitude: lat, longitude: lng, task_id: taskId, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
