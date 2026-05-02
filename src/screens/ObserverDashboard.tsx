import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../services/supabase';
import { OfflineBanner } from '../components/OfflineBanner';

export function ObserverDashboard() {
  const { setUser, todaysTasks, loadTasks } = useStore();
  const [msgText, setMsgText] = useState('');
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    setUser({ id: '00000000-0000-0000-0000-000000000003', name: 'David Chen', role: 'observer' });
    loadTasks();
  }, []);

  const tasks = todaysTasks();
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const needsHelp = tasks.filter((t) => t.status === 'needs_help').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'pending').length;

  async function handleSendMsg() {
    if (!msgText.trim()) return;
    const { error } = await supabase.rpc('send_message', {
      to_user_id: '00000000-0000-0000-0000-000000000001',
      content: msgText.trim(),
    }).catch(() => null);
    if (!error) {
      setMsgSent(true);
      setMsgText('');
      setTimeout(() => setMsgSent(false), 3000);
    }
  }

  return (
    <div className="dashboard">
      <div className="dash-header observer">
        <h1>Hi David</h1>
        <p>Chen Family — You're traveling ✈️</p>
        <div className="badge">Observer</div>
      </div>
      <div className="dash-body">
        <OfflineBanner />

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
              <div className="stat-num" style={{ color: needsHelp > 0 ? '#DC2626' : 'inherit' }}>{needsHelp}</div>
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
          {tasks.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📋</span>
              <h3>No tasks today</h3>
              <p>Check back later</p>
            </div>
          ) : tasks.map((task) => (
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
            {msgSent ? (
              <div style={{ padding: '8px 0', color: '#16A34A', fontWeight: 600, fontSize: 14 }}>
                ✓ Message sent!
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="msg-input"
                  placeholder="e.g. I can pick up Tim tomorrow..."
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMsg()}
                />
                <button className="msg-send" onClick={handleSendMsg}>Send</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
