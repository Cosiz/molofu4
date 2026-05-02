import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export function CommanderDashboard() {
  const { setUser, todaysTasks, tasksForDate, addTask } = useStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('u2');
  const [dueTime, setDueTime] = useState('17:00');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // weekStart stored in state so prev/next navigate correctly
  const [weekStart, setWeekStart] = useState(() => {
    const s = new Date();
    s.setDate(s.getDate() - s.getDay());
    return s.toISOString().split('T')[0];
  });

  useEffect(() => { setUser({ id: 'u1', name: 'Sarah Chen', role: 'commander' }); }, []);

  const today = new Date().toISOString().split('T')[0];
  const tasks = selectedDate === today ? todaysTasks() : tasksForDate(selectedDate);

  // Build 7-day strip from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  function prevWeek() {
    const s = new Date(weekStart);
    s.setDate(s.getDate() - 7);
    setWeekStart(s.toISOString().split('T')[0]);
    setSelectedDate(s.toISOString().split('T')[0]);
  }
  function nextWeek() {
    const s = new Date(weekStart);
    s.setDate(s.getDate() + 7);
    setWeekStart(s.toISOString().split('T')[0]);
    setSelectedDate(s.toISOString().split('T')[0]);
  }
  function selectDay(d: string) {
    setSelectedDate(d);
    // Snap weekStart to the week containing the selected day
    const sd = new Date(d);
    sd.setDate(sd.getDate() - sd.getDay());
    setWeekStart(sd.toISOString().split('T')[0]);
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function formatDayLabel(d: string) {
    const date = new Date(d);
    return { label: dayLabels[date.getDay()], num: date.getDate() };
  }

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const needsHelp = tasks.filter((t) => t.status === 'needs_help').length;
  const pending = tasks.filter((t) => t.status !== 'completed').length;

  const sorted = [...tasks].sort((a, b) => {
    const o: Record<string, number> = { needs_help: 0, in_progress: 1, pending: 2, completed: 3 };
    return o[a.status] - o[b.status];
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description: description.trim(),
      assigneeId: assignee,
      assigneeName: assignee === 'u2' ? 'Maria Santos' : 'David Chen',
      dueTime,
      dueDate: selectedDate,
      location,
      contact: '',
      status: 'pending',
      createdBy: 'u1',
    });
    setTitle(''); setDescription(''); setDueTime('17:00'); setLocation('');
    setShowCreate(false);
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h1>Good morning, Sarah</h1>
        <p>Chen Family</p>
        <div className="badge">Commander</div>
      </div>
      <div className="dash-body">
        <div className="dash-card">
          <div className="week-strip">
            <button className="week-nav-btn" onClick={prevWeek}>‹</button>
            {weekDays.map((d) => {
              const { label, num } = formatDayLabel(d);
              const isSelected = d === selectedDate;
              const isToday = d === today;
              return (
                <button
                  key={d}
                  className={`week-day ${isSelected ? 'week-day-selected' : ''} ${isToday ? 'week-day-today' : ''}`}
                  onClick={() => selectDay(d)}
                >
                  <span className="week-day-label">{label}</span>
                  <span className="week-day-num">{num}</span>
                </button>
              );
            })}
            <button className="week-nav-btn" onClick={nextWeek}>›</button>
          </div>
        </div>

        <div className="dash-card">
          <div className="gps-banner">
            📍 GPS tracking — <span className="gps-coming-soon">coming soon</span>
          </div>
        </div>

        <div className="dash-card">
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-num">{completed}/{tasks.length}</div>
              <div className="stat-label">Done today</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{pending}</div>
              <div className="stat-label">In progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: needsHelp > 0 ? 'var(--primary)' : 'inherit' }}>{needsHelp}</div>
              <div className="stat-label">Needs help</div>
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="section-title">Today's Tasks</div>
          <div className="scroll-list">
            {sorted.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">📋</span>
                <h3>No tasks yet</h3>
                <p>Tap + to assign your first task</p>
              </div>
            ) : sorted.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.status === 'completed' ? 'task-done' : ''}`}
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="task-top">
                  <div className={`task-status-dot dot-${task.status}`} />
                  <div className="task-title">{task.title}</div>
                  <span className={`status-badge badge-${task.status}`}>
                    {task.status === 'needs_help' ? '⚠️ Help' : task.status === 'completed' ? '✓ Done' : task.status === 'in_progress' ? '→ Active' : '○ Pending'}
                  </span>
                </div>
                <div className="task-meta">
                  <span className="task-meta-item">⏰ {task.dueTime}</span>
                  <span className="task-meta-item">👤 {task.assigneeName}</span>
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
      </div>

      <button className="fab" onClick={() => setShowCreate(true)}>+</button>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2>New Task</h2>
            <form onSubmit={submit}>
              <div className="form-group">
                <label>What needs to be done?</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pick up Tim from basketball" autoFocus required />
              </div>
              <div className="form-group">
                <label>Details (optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Gate B, blue cubby has his bag..." rows={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign to</label>
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                    <option value="u2">Maria Santos</option>
                    <option value="u3">David Chen</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due time</label>
                  <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Location (optional)</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kowloon Cricket Club, Gate B" />
              </div>
              <button type="submit" className="btn-primary">
                Send to {assignee === 'u2' ? 'Maria' : 'David'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
