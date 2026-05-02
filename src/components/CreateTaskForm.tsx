import { useState } from 'react';
import { useStore } from '../store';
import type { Task, TaskType, Priority } from '../types';
import { colors, typography, spacing, borderRadius, shadow } from '../theme';

interface CreateTaskFormProps {
  onClose: () => void;
}

const taskTypes: { value: TaskType; label: string; defaultPriority: Priority; defaultSla: number }[] = [
  { value: 'pickup', label: 'Pickup', defaultPriority: 'high', defaultSla: 15 },
  { value: 'dropoff', label: 'Dropoff', defaultPriority: 'high', defaultSla: 15 },
  { value: 'homework', label: 'Homework', defaultPriority: 'medium', defaultSla: 30 },
  { value: 'errand', label: 'Errand', defaultPriority: 'medium', defaultSla: 45 },
  { value: 'tuition', label: 'Tuition', defaultPriority: 'high', defaultSla: 10 },
  { value: 'meal', label: 'Meal', defaultPriority: 'medium', defaultSla: 30 },
  { value: 'shopping', label: 'Shopping', defaultPriority: 'low', defaultSla: 60 },
];

export function CreateTaskForm({ onClose }: CreateTaskFormProps) {
  const { currentUser, tasks, addTask } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('user-2');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 16));
  const [priority, setPriority] = useState<Priority>('medium');
  const [taskType, setTaskType] = useState<TaskType>('pickup');
  const [location, setLocation] = useState('');

  const handleTypeChange = (type: TaskType) => {
    setTaskType(type);
    const info = taskTypes.find(t => t.value === type);
    if (info) {
      setPriority(info.defaultPriority);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      assigned_to: assignee,
      created_by: currentUser?.id || 'user-1',
      status: 'pending',
      priority,
      due_date: new Date(dueDate).toISOString(),
      location: location.trim() || undefined,
      task_type: taskType,
      sla_minutes: taskTypes.find(t => t.value === taskType)?.defaultSla || 30,
      created_at: new Date().toISOString(),
    };

    addTask(newTask);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 200,
    }}
    onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.card,
          borderRadius: `${borderRadius.lg} ${borderRadius.lg} 0 0`,
          padding: spacing.lg,
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: shadow.elevated,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <h2 style={{ ...typography.heading }}>New Task</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: colors.textSecondary,
          }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <label style={{ ...typography.body }}>
            Title *
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Pick up Ethan from school"
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.border}`,
                ...typography.body,
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ ...typography.body }}>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Details, instructions..."
              rows={2}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.border}`,
                ...typography.body,
                marginTop: 4,
                resize: 'vertical',
              }}
            />
          </label>

          <label style={{ ...typography.body }}>
            Task Type
            <select
              value={taskType}
              onChange={e => handleTypeChange(e.target.value as TaskType)}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.border}`,
                ...typography.body,
                marginTop: 4,
                background: colors.card,
              }}
            >
              {taskTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label style={{ ...typography.body }}>
            Assign To
            <select
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.border}`,
                ...typography.body,
                marginTop: 4,
                background: colors.card,
              }}
            >
              <option value="user-2">Maria Santos (Helper)</option>
            </select>
          </label>

          <label style={{ ...typography.body }}>
            Due Date & Time
            <input
              type="datetime-local"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.border}`,
                ...typography.body,
                marginTop: 4,
              }}
            />
          </label>

          <label style={{ ...typography.body }}>
            Priority
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.border}`,
                ...typography.body,
                marginTop: 4,
                background: colors.card,
              }}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label style={{ ...typography.body }}>
            Location (optional)
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g., HKIS, Happy Valley"
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.border}`,
                ...typography.body,
                marginTop: 4,
              }}
            />
          </label>

          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.sm,
              background: title.trim() ? colors.primary : colors.textLight,
              color: colors.card,
              border: 'none',
              ...typography.button,
              minHeight: 48,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              marginTop: spacing.sm,
            }}
          >Create Task</button>
        </div>
      </div>
    </div>
  );
}
