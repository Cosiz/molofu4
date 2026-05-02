export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return formatDate(dateStr);
}

export function isOverdue(task: { due_date: string; sla_minutes: number; status: string }): boolean {
  if (task.status === 'done') return false;
  const due = new Date(task.due_date);
  const now = new Date();
  const slaMs = task.sla_minutes * 60 * 1000;
  return now.getTime() > due.getTime() + slaMs;
}

export function calculateSLA(task: { due_date: string; sla_minutes: number }): { elapsed: number; remaining: number; percentage: number } {
  const due = new Date(task.due_date);
  const now = new Date();
  const slaMs = task.sla_minutes * 60 * 1000;
  const elapsed = now.getTime() - (due.getTime() - slaMs);
  const remaining = slaMs - elapsed;
  const percentage = Math.max(0, Math.min(100, (elapsed / slaMs) * 100));
  return { elapsed, remaining, percentage };
}

export function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr.startsWith(today);
}

export function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
}

export function getDayNumber(dateStr: string): number {
  return new Date(dateStr).getDate();
}
