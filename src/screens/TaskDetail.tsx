import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { supabase } from '../services/supabase';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { tasks, completeTask, addNote, updateStatus } = useStore();
  const navigate = useNavigate();
  const [note, setNote] = useState('');

  const task = tasks.find((t) => t.id === id);
  if (!task) return null;

  const currentUser = useStore.getState().currentUser;
  const isHelper = currentUser?.role === 'helper';
  const isObserver = currentUser?.role === 'observer';
  const isCommander = currentUser?.role === 'commander';

  const statusLabels: Record<string, string> = {
    pending: '○ Pending',
    in_progress: '→ In progress',
    completed: '✓ Completed',
    needs_help: '⚠️ Needs help',
  };

  async function handleComplete() {
    await completeTask(task.id);
    navigate(-1);
  }

  async function handleNeedsHelp() {
    await updateStatus(task.id, 'needs_help');
  }

  async function handleReassign(newAssigneeId: string) {
    await supabase.rpc('reassign_task', { task_id: task.id, new_assignee_id: newAssigneeId }).catch(() => {});
    navigate(-1);
  }

  function handleAddNote() {
    if (!note.trim()) return;
    addNote(task.id, note.trim());
    setNote('');
  }

  const FAMILY_MEMBERS = [
    { id: '00000000-0000-0000-0000-000000000001', name: 'Sarah Chen' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Maria Santos' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'David Chen' },
  ];

  // Map thumbnail via OSM
  const mapUrl = task.gps_lat && task.gps_lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${task.gps_lng - 0.005},${task.gps_lat - 0.003},${task.gps_lng + 0.005},${task.gps_lat + 0.003}&layer=mapnik&marker=${task.gps_lat},${task.gps_lng}`
    : null;

  const mapsUrl = task.gps_lat && task.gps_lng
    ? `https://www.google.com/maps?q=${task.gps_lat},${task.gps_lng}`
    : null;

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
          {mapUrl && (
            <div className="detail-section">
              <div className="detail-label">Map</div>
              <div style={{ borderRadius: 8, overflow: 'hidden', marginTop: 4 }}>
                <iframe
                  title="Location map"
                  width="100%"
                  height="160"
                  src={mapUrl}
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                />
              </div>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 13, color: '#3B82F6', fontWeight: 600 }}>
                  📍 Open in Maps
                </a>
              )}
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

        {task.status !== 'completed' && (
          <>
            {(isCommander || isHelper || isObserver) && (
              <>
                <div className="note-input-wrap">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ask a question or leave a note..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button className="note-send-btn" onClick={handleAddNote}>Send</button>
                </div>

                {(isCommander || isHelper) && (
                  <button className="complete-btn" onClick={handleComplete}>
                    ✓ Mark as Complete
                  </button>
                )}

                {isHelper && (
                  <button
                    className="complete-btn"
                    style={{ background: '#F59E0B', marginTop: 8 }}
                    onClick={handleNeedsHelp}
                  >
                    🆘 Flag Needs Help
                  </button>
                )}
              </>
            )}
          </>
        )}

        {isObserver && task.status !== 'completed' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#57534E', marginBottom: 8 }}>Reassign to:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FAMILY_MEMBERS.filter(m => m.id !== currentUser?.id).map(m => (
                <button
                  key={m.id}
                  onClick={() => handleReassign(m.id)}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1.5px solid #E7E5E4',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  👤 {m.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
