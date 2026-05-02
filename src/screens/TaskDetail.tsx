import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { tasks, completeTask, addNote } = useStore();
  const navigate = useNavigate();
  const [note, setNote] = useState('');

  const task = tasks.find((t) => t.id === id);
  if (!task) return null;

  const isHelper = useStore.getState().currentUser?.role === 'helper';
  const isObserver = useStore.getState().currentUser?.role === 'observer';

  const statusLabels: Record<string, string> = {
    pending: '○ Pending',
    in_progress: '→ In progress',
    completed: '✓ Completed',
    needs_help: '⚠️ Needs help',
  };

  function handleComplete() {
    completeTask(task.id);
    navigate(-1);
  }

  function handleAddNote() {
    if (!note.trim()) return;
    addNote(task.id, note.trim());
    setNote('');
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <div>
            <h1 style={{ fontSize: 18 }}>Task Detail</h1>
            <p style={{ fontSize: 13, opacity: 0.8 }}>Tap to go back</p>
          </div>
        </div>
      </div>
      <div className="dash-body">
        <div className="dash-card">
          <div style={{ marginBottom: 12 }}>
            <span className={`status-badge badge-${task.status}`}>{statusLabels[task.status]}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{task.title}</div>
          {task.description && (
            <div style={{ marginTop: 10, fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.5 }}>{task.description}</div>
          )}
        </div>

        <div className="dash-card">
          <div className="detail-section">
            <div className="detail-label">Who</div>
            <div className="detail-value">👤 {task.assigneeName}</div>
          </div>
          <div className="detail-section">
            <div className="detail-label">When</div>
            <div className="detail-value">⏰ {task.dueTime}</div>
          </div>
          {task.location && (
            <div className="detail-section">
              <div className="detail-label">Where</div>
              <div className="detail-value location">📍 {task.location}</div>
            </div>
          )}
          {task.contact && (
            <div className="detail-section">
              <div className="detail-label">Contact</div>
              <div className="detail-value">📞 {task.contact}</div>
            </div>
          )}
        </div>

        {task.notes.length > 0 && (
          <div className="dash-card">
            <div className="section-title">Notes</div>
            {task.notes.map((n) => (
              <div key={n.id} className="task-notes">
                <div className="task-note">
                  <span className="task-note-author">{n.authorName}:</span> {n.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isObserver && task.status !== 'completed' && (
          <>
            <button className="complete-btn" onClick={handleComplete}>
              ✓ Mark as Complete
            </button>
            <div className="note-input-wrap">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ask a question or leave a note..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button className="note-send-btn" onClick={handleAddNote}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
