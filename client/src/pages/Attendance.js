import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useToast } from "../utils/toast";

function NewSessionModal({ onClose, onSave }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ date: today, label: "" });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>New Session</h3>
        <div className="form-group">
          <label>Date</label>
          <input type="date" className="form-control" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Label (optional)</label>
          <input className="form-control" placeholder='e.g. "Week 5 — Spiritual Disciplines"'
            value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.date && onSave(form)}
            disabled={!form.date}>Create</button>
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    const data = await api.getSessions();
    setSessions(data);
    setActiveId((prev) => prev || data[0]?._id || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createSession = async (form) => {
    try {
      const s = await api.createSession(form);
      setShowModal(false); toast("Session created ✓");
      await load(); setActiveId(s._id);
    } catch (e) { toast("Error: " + e.message); }
  };

  const toggle = async (sessionId, studentId, current) => {
    try {
      const updated = await api.markAttendance(sessionId, studentId, !current);
      setSessions((prev) => prev.map((s) => s._id === sessionId ? updated : s));
    } catch { toast("Error saving attendance"); }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    await api.deleteSession(id); toast("Session deleted");
    const remaining = sessions.filter((s) => s._id !== id);
    setSessions(remaining); setActiveId(remaining[0]?._id || null);
  };

  const current = sessions.find((s) => s._id === activeId);
  const presentCount = current ? current.records.filter((r) => r.present).length : 0;

  if (loading) return <div className="loading">Loading attendance…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p>{sessions.length} sessions recorded</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Session</button>
      </div>

      {showModal && <NewSessionModal onClose={() => setShowModal(false)} onSave={createSession} />}

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No sessions yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Session list */}
          <div style={{ width: 210, flexShrink: 0 }}>
            {sessions.map((s) => {
              const cnt = s.records.filter((r) => r.present).length;
              return (
                <div key={s._id} className={`session-item ${activeId === s._id ? "active" : ""}`}
                  onClick={() => setActiveId(s._id)}>
                  <div className="si-title">{s.label || s.date}</div>
                  {s.label && <div className="si-sub">{s.date}</div>}
                  <div className="si-sub" style={{ marginTop: 4 }}>{cnt}/{s.records.length} present</div>
                </div>
              );
            })}
          </div>

          {/* Attendance sheet */}
          {current ? (
            <div className="card" style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
                    {current.label || current.date}
                  </h3>
                  {current.label && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>{current.date}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <span className="badge badge-green">{presentCount} present</span>
                    <span className="badge badge-red">{current.records.length - presentCount} absent</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteSession(current._id)}>Delete</button>
              </div>

              {current.records.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  No students found. Add students first.
                </p>
              ) : (
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Student</th><th>Present</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {current.records.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 500 }}>{r.student?.name || "—"}</td>
                        <td>
                          <label className="toggle">
                            <input type="checkbox" checked={r.present}
                              onChange={() => toggle(current._id, r.student?._id, r.present)} />
                            <span className="toggle-slider" />
                          </label>
                        </td>
                        <td>
                          <span className={`badge ${r.present ? "badge-green" : "badge-red"}`}>
                            {r.present ? "Present" : "Absent"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="card" style={{ flex: 1 }}>
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>Select a session to take attendance.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
