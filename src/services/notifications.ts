import { supabase } from './supabase';
import type { Notification } from '../types';

export interface NotificationPayload {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'task_needs_help' | 'message_received';
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    userId: n.user_id as string,
    type: n.type as Notification['type'],
    payload: n.payload as Record<string, unknown>,
    read: n.read as boolean,
    createdAt: n.created_at as string,
  }));
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
}

export function subscribeToNotifications(
  userId: string,
  onNew: (n: Notification) => void
) {
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
      (payload) => {
        const n = payload.new as Record<string, unknown>;
        onNew({
          id: n.id as string,
          userId: n.user_id as string,
          type: n.type as Notification['type'],
          payload: n.payload as Record<string, unknown>,
          read: n.read as boolean,
          createdAt: n.created_at as string,
        });
      }
    )
    .subscribe();
}
