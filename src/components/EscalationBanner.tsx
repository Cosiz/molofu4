import { useNavigate } from 'react-router-dom';
import type { Escalation, Task } from '../types';
import { colors, typography, spacing } from '../theme';

interface EscalationBannerProps {
  escalations: Escalation[];
  tasks: Task[];
}

export function EscalationBanner({ escalations, tasks }: EscalationBannerProps) {
  const navigate = useNavigate();
  const active = escalations.filter(e => !e.resolved);

  if (active.length === 0) return null;

  const critical = active.filter(e => e.severity === 'critical');
  const warning = active.filter(e => e.severity === 'warning');

  return (
    <div style={{
      background: critical.length > 0 ? colors.alert : colors.warning,
      padding: `${spacing.sm} ${spacing.md}`,
      marginBottom: spacing.md,
      borderRadius: 8,
      cursor: 'pointer',
    }}
    onClick={() => {
      if (critical.length > 0) {
        const task = tasks.find(t => t.id === critical[0].task_id);
        if (task) navigate(`/tasks/${task.id}`);
      }
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ ...typography.subheading, color: colors.card }}>
            {critical.length > 0 ? `${critical.length} Critical Alert${critical.length > 1 ? 's' : ''}` : `${warning.length} Warning${warning.length > 1 ? 's' : ''}`}
          </div>
          <div style={{ ...typography.small, color: colors.card + 'CC' }}>
            {critical.length > 0
              ? `Task${critical.length > 1 ? 's' : ''} overdue — tap to view`
              : `Task${warning.length > 1 ? 's' : ''} approaching deadline`
            }
          </div>
        </div>
        <span style={{ fontSize: 20, color: colors.card }}>›</span>
      </div>
    </div>
  );
}
