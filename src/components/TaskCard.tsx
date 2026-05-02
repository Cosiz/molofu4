import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import { colors, typography, spacing, borderRadius, shadow, statusColors, priorityColors, taskTypeLabels } from '../theme';
import { formatTime, timeAgo } from '../utils/time';

interface TaskCardProps {
  task: Task;
  showActions?: boolean;
  onAction?: (action: string) => void;
}

export function TaskCard({ task, showActions, onAction }: TaskCardProps) {
  const navigate = useNavigate();
  const statusColor = statusColors[task.status] || colors.textSecondary;
  const priorityColor = priorityColors[task.priority] || colors.textSecondary;

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      style={{
        background: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        boxShadow: shadow.card,
        cursor: 'pointer',
        borderLeft: `4px solid ${statusColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...typography.subheading, marginBottom: 4 }}>{task.title}</div>
          <div style={{ ...typography.small, color: colors.textSecondary }}>
            {taskTypeLabels[task.task_type]} • Due {formatTime(task.due_date)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <span style={{
            ...typography.small,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.sm,
            background: priorityColor + '20',
            color: priorityColor,
            fontWeight: 600,
          }}>{task.priority}</span>
          <span style={{
            ...typography.small,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.sm,
            background: statusColor + '20',
            color: statusColor,
            fontWeight: 600,
          }}>{task.status.replace('_', ' ')}</span>
        </div>
      </div>
      {showActions && onAction && (
        <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
          {task.status === 'pending' && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction('accept'); }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                background: colors.primary,
                color: colors.card,
                border: 'none',
                ...typography.button,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >Accept</button>
          )}
          {task.status === 'accepted' && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction('start'); }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                background: colors.primary,
                color: colors.card,
                border: 'none',
                ...typography.button,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >Start</button>
          )}
          {(task.status === 'in_progress' || task.status === 'arrived') && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction('done'); }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                background: colors.secondary,
                color: colors.card,
                border: 'none',
                ...typography.button,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >Done</button>
          )}
        </div>
      )}
    </div>
  );
}
