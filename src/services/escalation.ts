import type { Task, Escalation } from '../types';

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startEscalationPoll(
  getTasks: () => Task[],
  onEscalation: (escalation: Escalation) => void
): void {
  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(() => {
    const tasks = getTasks();
    const now = new Date();

    tasks.forEach(task => {
      if (task.status === 'done') return;

      const due = new Date(task.due_date);
      const slaMs = task.sla_minutes * 60 * 1000;
      const deadline = due.getTime() - slaMs;

      if (now.getTime() > deadline) {
        const escalation: Escalation = {
          id: `esc-${task.id}-${now.getTime()}`,
          task_id: task.id,
          triggered_at: now.toISOString(),
          reason: 'overdue',
          severity: now.getTime() > due.getTime() ? 'critical' : 'warning',
          resolved: false,
        };
        onEscalation(escalation);
      }
    });
  }, 30000); // Poll every 30 seconds
}

export function stopEscalationPoll(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

export function checkOverdueTasks(tasks: Task[]): Escalation[] {
  const escalations: Escalation[] = [];
  const now = new Date();

  tasks.forEach(task => {
    if (task.status === 'done') return;

    const due = new Date(task.due_date);
    const slaMs = task.sla_minutes * 60 * 1000;
    const deadline = due.getTime() - slaMs;

    if (now.getTime() > deadline) {
      escalations.push({
        id: `esc-${task.id}`,
        task_id: task.id,
        triggered_at: now.toISOString(),
        reason: 'overdue',
        severity: now.getTime() > due.getTime() ? 'critical' : 'warning',
        resolved: false,
      });
    }
  });

  return escalations;
}
