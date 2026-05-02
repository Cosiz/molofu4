import type { Task, TaskType } from '../types';
import { colors, typography, spacing } from '../theme';

const taskTypeSteps: Record<TaskType, string[]> = {
  pickup: ['pending', 'accepted', 'in_progress', 'arrived', 'done'],
  dropoff: ['pending', 'accepted', 'in_progress', 'arrived', 'done'],
  homework: ['pending', 'accepted', 'in_progress', 'done'],
  errand: ['pending', 'accepted', 'in_progress', 'done'],
  tuition: ['pending', 'accepted', 'in_progress', 'done'],
  meal: ['pending', 'accepted', 'in_progress', 'done'],
  shopping: ['pending', 'accepted', 'in_progress', 'done'],
};

const stepLabels: Record<string, string> = {
  pending: 'Created',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  arrived: 'Arrived',
  done: 'Completed',
};

interface StatusStepperProps {
  task: Task;
}

export function StatusStepper({ task }: StatusStepperProps) {
  const steps = taskTypeSteps[task.task_type] || taskTypeSteps.pickup;
  const currentIndex = steps.indexOf(task.status);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${spacing.md} 0`,
      overflowX: 'auto',
    }}>
      {steps.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: i <= currentIndex ? colors.primary : colors.border,
            color: i <= currentIndex ? colors.card : colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...typography.small,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {i < currentIndex ? '✓' : i + 1}
          </div>
          <div style={{
            marginLeft: 4,
            ...typography.small,
            color: i <= currentIndex ? colors.primary : colors.textSecondary,
            whiteSpace: 'nowrap',
          }}>
            {stepLabels[step]}
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1,
              height: 2,
              background: i < currentIndex ? colors.primary : colors.border,
              margin: `0 ${spacing.sm}`,
              minWidth: 20,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
