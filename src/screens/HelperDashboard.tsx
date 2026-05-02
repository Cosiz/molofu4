import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export function HelperDashboard() {
  const { setUser, myTasks, completeTask } = useStore();
  const navigate = useNavigate();

  useEffect(() => { setUser({ id: 'u2', name: 'Maria Santos', role: 'helper' }); }, []);

  const tasks = myTasks().filter((t) => t.status !== 'completed');
  const sorted = [...tasks].sort((a, b) => {
    const o: Record<string, number> = { needs_help: 0, in_progress: 1, pending: 2 };
    return o[a.status] - o[b.status];
  });

  return (
    <div className="dashboard">
      <div className="dash-header helper">
        <h1>Good morning, Maria</h1>
        <p>Chen Family</p>
        <div className="badge">Helper</div>
      </div>
      <div className="dash-body">
        <div className="dash-card">
          <div className="section-title">Your Tasks — {tasks.length} remaining</div>
          <div className="scroll-list">
            {sorted.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">☕</span>
                <h3>All done!</h3>
                <p>Enjoy your day, Maria</p>
              </div>
            ) : sorted.map((task) => (
              <div key={task.id} className="task-card" onClick={() => navigate(`/task/${task.id}`)}>
                <div className="task-top">
                  <div className={`task-status-dot dot-${task.status}`} />
                  <div className="task-title">{task.title}</div>
                  <span className={`status-badge badge-${task.status}`}>
                    {task.status === 'needs_help' ? '⚠️ Help' : task.status === 'in_progress' ? '→ Active' : '○ Pending'}
                  </span>
                </div>
                <div className="task-meta">
                  <span className="task-meta-item">⏰ {task.dueTime}</span>
                </div>
                {task.location && <div className="task-location">📍 {task.location}</div>}
                {task.notes.length > 0 && (
                  <div className="task-notes">
                    {task.notes.map((n) => (
                      <div key={n.id} className="task-note">
                        <span className="task-note-author">{n.authorName}:</span> {n.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="dash-card">
            <div className="section-title">Quick Complete</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map((task) => (
                <button
                  key={task.id}
                  className="quick-action-btn"
                  onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                >
                  <span>✓</span>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 14 }}>{task.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.dueTime}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
