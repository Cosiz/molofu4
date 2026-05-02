import { useStore } from '../store';
import type { Task } from '../types';

interface Props {
  conflicts: Array<{ tasks: Task[]; date: string }>;
  onDismiss: () => void;
  onReassign: (taskId: string) => void;
}

export function ConflictModal({ conflicts, onDismiss, onReassign }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2>⚠️ Scheduling Conflicts</h2>
        <p style={{ fontSize: 14, color: '#57534E', marginBottom: 20 }}>
          These tasks overlap. Consider reassigning one.
        </p>
        {conflicts.map(({ tasks, date }) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A8A29E', marginBottom: 8, textTransform: 'uppercase' }}>
              {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            {tasks.map(task => (
              <div key={task.id} style={{
                background: '#FEF3C7',
                border: '1.5px solid #F59E0B',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 8,
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{task.title}</div>
                <div style={{ fontSize: 13, color: '#57534E' }}>
                  ⏰ {task.dueTime} · 👤 {task.assigneeName}
                </div>
                <button
                  onClick={() => onReassign(task.id)}
                  style={{
                    marginTop: 8,
                    background: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reassign
                </button>
              </div>
            ))}
          </div>
        ))}
        <button onClick={onDismiss} className="btn-primary" style={{ marginTop: 8 }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
