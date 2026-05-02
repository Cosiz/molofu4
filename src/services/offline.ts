import { openDB, type IDBPDatabase } from 'idb';
import { supabase, FAMILY_ID } from './supabase';

const DB_NAME = 'molofu4-offline';
const DB_VERSION = 1;

interface SyncQueueItem {
  id?: number;
  type: 'complete_task' | 'update_status' | 'add_note' | 'create_task' | 'log_location';
  payload: Record<string, unknown>;
  createdAt: string;
}

let dbInstance: IDBPDatabase | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('task_notes')) {
        db.createObjectStore('task_notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return dbInstance;
}

// ── Task cache ──────────────────────────────────────────────────
export async function cacheTasks(tasks: Array<Record<string, unknown>>) {
  const db = await getDB();
  const tx = db.transaction('tasks', 'readwrite');
  await Promise.all([
    ...tasks.map(t => tx.store.put(t)),
    tx.done,
  ]);
}

export async function getCachedTasks(): Promise<Array<Record<string, unknown>>> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function cacheTask(task: Record<string, unknown>) {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function getCachedTask(id: string): Promise<Record<string, unknown> | undefined> {
  const db = await getDB();
  return db.get('tasks', id);
}

// ── Sync queue ──────────────────────────────────────────────────
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>) {
  const db = await getDB();
  await db.add('sync_queue', { ...item, createdAt: new Date().toISOString() } as SyncQueueItem);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll('sync_queue');
}

export async function removeSyncQueueItem(id: number) {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count('sync_queue');
}

// ── Background sync ──────────────────────────────────────────────
export async function processSync() {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      if (item.type === 'complete_task') {
        await supabase.from('tasks').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', item.payload.taskId as string);
      } else if (item.type === 'update_status') {
        await supabase.from('tasks').update({
          status: item.payload.status as string,
          updated_at: new Date().toISOString(),
        }).eq('id', item.payload.taskId as string);
      } else if (item.type === 'add_note') {
        await supabase.from('task_notes').insert({
          task_id: item.payload.taskId as string,
          author_id: item.payload.authorId as string,
          author_name: item.payload.authorName as string,
          content: item.payload.content as string,
        });
      } else if (item.type === 'log_location') {
        await supabase.from('locations').insert({
          task_id: item.payload.taskId as string | undefined,
          user_id: item.payload.userId as string,
          lat: item.payload.lat as number,
          lng: item.payload.lng as number,
          accuracy: item.payload.accuracy as number | undefined,
        });
      }
      if (item.id !== undefined) {
        await removeSyncQueueItem(item.id);
      }
    } catch (err) {
      console.error('[Sync] Failed to process item:', item, err);
      break; // stop on first error, retry next time
    }
  }
}

// ── Online listener ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Sync] Back online — processing queue');
    processSync();
  });
}
