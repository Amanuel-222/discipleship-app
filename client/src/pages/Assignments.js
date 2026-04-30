import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useToast } from "../utils/toast";

function AssignmentModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>New Assignment</h3>
        <div className="form-group">
          <label>Title *</label>
          <input className="form-control" value={form.title} onChange={set("title")}
            placeholder="Assignment title" autoFocus />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" value={form.description} onChange={set("description")}
            placeholder="What do students need to do?" />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" className="form-control" value={form.dueDate} onChange={set("dueDate")} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.title.trim() && onSave(form)}
            disabled={!form.title.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    const data = await api.getAssignments();
    setAssignments(data);
    setActiveId((prev) => prev || data[0]?._id || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (form) => {
    try {
      const a = await api.createAssignment(form);
      setShowModal(false); toast("Assignment created ✓");
      await load(); setActiveId(a._id);
    } catch (e) { toast("Error: " + e.message); }
  };

  const toggle = async (assignmentId, studentId, current) => {
    try {
      const updated = await api.markSubmission(assignmentId, studentId, !current);
      setAssignments((prev) => prev.map((a) => a._id === assignmentId ? updated : a));
    } catch { toast("Error saving submission"); }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    await api.deleteAssignment(id); toast("Assignment deleted");
    const remaining = assignments.filter((a) => a._id !== id);
    setAssignments(remaining); setActiveId(remaining[0]?._id || null);
  };

  const current = assignments.find((a) => a._id === activeId);
  const submittedCount = current ? current.submissions.filter((s) => s.submitted).length : 0;

  if (loading) return <div className="loading">Loading assignments…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Assignments</h2>
          <p>{assignments.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Assignment</button>
      </div>

      {showModal && <AssignmentModal onClose={() => setShowModal(false)} onSave={create} />}

      {assignments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>No assignments yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Assignment sidebar */}
          <div style={{ width: 210, flexShrink: 0 }}>
            {assignments.map((a) => {
              const cnt = a.submissions.filter((s) => s.submitted).length;
              return (
                <div key={a._id} className={`session-item ${activeId === a._id ? "active" : ""}`}
                  onClick={() => setActiveId(a._id)}>
                  <div className="si-title">{a.title}</div>
                  {a.dueDate && <div className="si-sub">Due {a.dueDate}</div>}
                  <div className="si-sub" style={{ marginTop: 4 }}>{cnt}/{a.submissions.length} submitted</div>
                </div>
              );
            })}
          </div>

          {/* Submission sheet */}
          {current ? (
            <div className="card" style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>{current.title}</h3>
                  {current.description && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 5, maxWidth: 420, lineHeight: 1.5 }}>
                      {current.description}
                    </p>
                  )}
                  {current.dueDate && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Due: {current.dueDate}</p>
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <span className="badge badge-green">{submittedCount} submitted</span>
                    <span className="badge badge-gray">{current.submissions.length - submittedCount} pending</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteAssignment(current._id)}>Delete</button>
              </div>

              {current.submissions.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No students found. Add students first.</p>
              ) : (
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Student</th><th>Submitted</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {current.submissions.map((sub) => (
                      <tr key={sub._id}>
                        <td style={{ fontWeight: 500 }}>{sub.student?.name || "—"}</td>
                        <td>
                          <label className="toggle">
                            <input type="checkbox" checked={sub.submitted}
                              onChange={() => toggle(current._id, sub.student?._id, sub.submitted)} />
                            <span className="toggle-slider" />
                          </label>
                        </td>
                        <td>
                          <span className={`badge ${sub.submitted ? "badge-green" : "badge-gray"}`}>
                            {sub.submitted ? "Submitted" : "Pending"}
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
                <div className="empty-icon">📝</div>
                <p>Select an assignment to view submissions.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
