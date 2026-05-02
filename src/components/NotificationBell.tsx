import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { fetchNotifications, subscribeToNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from '../services/notifications';

export function NotificationBell() {
  const { currentUser } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications(currentUser.id).then(setNotifications).catch(console.error);

    const sub = subscribeToNotifications(currentUser.id, (n) => {
      setNotifications(prev => [n, ...prev]);
    });
    return () => { sub.unsubscribe(); };
  }, [currentUser]);

  useEffect(() => {
    setUnread(notifications.filter(n => !n.read).length);
  }, [notifications]);

  function handleOpen() {
    setOpen(o => !o);
  }

  async function handleMarkAll() {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  async function handleItem(id: string) {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(u => Math.max(0, u - 1));
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  }

  function notifMessage(n: Notification): string {
    const p = n.payload as Record<string, unknown>;
    if (n.type === 'task_assigned') return `Assigned: "${p.task_title as string}"`;
    if (n.type === 'task_completed') return `Completed: "${p.task_title as string}"`;
    if (n.type === 'task_needs_help') return `Needs help: "${p.task_title as string}"`;
    if (n.type === 'message_received') return `Message: ${p.content as string}`;
    return 'New notification';
  }

  const icons: Record<string, string> = {
    task_assigned: '📋',
    task_completed: '✅',
    task_needs_help: '🆘',
    message_received: '💬',
  };

  if (!currentUser) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        aria-label={`${unread} unread notifications`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 22,
          position: 'relative',
          padding: '4px 8px',
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#EF4444',
            color: 'white',
            borderRadius: '50%',
            width: 16,
            height: 16,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: 320,
          maxHeight: 420,
          overflowY: 'auto',
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 300,
          marginTop: 8,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #E7E5E4',
          }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#3B82F6',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#A8A29E', fontSize: 14 }}>
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleItem(n.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F3F4F6',
                  cursor: 'pointer',
                  background: n.read ? 'white' : '#F0F9FF',
                  fontWeight: n.read ? 400 : 600,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>{icons[n.type] ?? '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>{notifMessage(n)}</div>
                    <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>{formatTime(n.createdAt)}</div>
                  </div>
                  {!n.read && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
