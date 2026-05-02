import { useEffect } from 'react';
import { useStore } from '../store';

export function ObserverDashboard() {
  const { setUser, todaysTasks } = useStore();
  useEffect(() => { setUser({ id: 'u3', name: 'David Chen', role: 'observer' }); }, []);

  const tasks = todaysTasks();
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const needsHelp = tasks.filter((t) => t.status === 'needs_help').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'pending').length;

  return (
    <div className="dashboard">
      <div className="dash-header observer">
        <h1>Hi David</h1>
        <p>Chen Family — You're traveling ✈️</p>
        <div className="badge">Observer</div>
      </div>
      <div className="dash-body">
        <div className="dash-card">
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-num" style={{ color: '#16A34A' }}>{completed}</div>
              <div className="stat-label">Tasks done</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{inProgress}</div>
              <div className="stat-label">In progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: needsHelp > 0 ? 'var(--primary)' : 'inherit' }}>{needsHelp}</div>
              <div className="stat-label">Needs help</div>
            </div>
          </div>
        </div>

        <div className="dash-card">
          {needsHelp > 0 ? (
            <div className="alert-banner">
              <div className="alert-title">⚠️ {needsHelp} task{needsHelp > 1 ? 's' : ''} need your help</div>
              <div className="alert-sub">Sarah may need support — consider reaching out</div>
            </div>
          ) : (
            <div className="alert-banner ok">
              <div className="alert-title">✓ Family is on track</div>
              <div className="alert-sub">Everything is running smoothly today</div>
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="section-title">Task Summary</div>
          {tasks.map((task) => (
            <div key={task.id} className={`observer-task-row ${task.status === 'completed' ? 'done' : ''}`}>
              <span>
                {task.status === 'completed' ? '✓' : task.status === 'needs_help' ? '⚠️' : task.status === 'in_progress' ? '→' : '○'}
              </span>
              <span style={{ flex: 1 }}>{task.title}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.assigneeName.split(' ')[0]}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.dueTime}</span>
            </div>
          ))}
        </div>

        <div className="dash-card">
          <div className="section-title">Message Sarah</div>
          <div className="msg-box">
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="msg-input" placeholder="e.g. I can pick up Tim tomorrow..." />
              <button className="msg-send">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
