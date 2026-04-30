import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../utils/toast";

function StudentModal({ student, onClose, onSave }) {
  const [form, setForm] = useState(student || { name:"", email:"", notes:"" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{student ? "Edit Student" : "Add Student"}</h3>
        <div className="form-group"><label>Name *</label><input className="form-control" value={form.name} onChange={set("name")} placeholder="Full name" autoFocus /></div>
        <div className="form-group"><label>Email</label><input className="form-control" value={form.email} onChange={set("email")} placeholder="email@example.com" /></div>
        <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={set("notes")} placeholder="General notes…" /></div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()}>Save</button>
        </div>
      </div>
    </div>
  );
}

const COLORS = ["violet","pink","teal","amber","blue","emerald"];
const colorMap = { violet:"var(--violet)", pink:"var(--pink)", teal:"var(--teal)", amber:"var(--amber)", blue:"var(--blue)", emerald:"var(--emerald)" };
const bgMap    = { violet:"var(--violet-bg)", pink:"var(--pink-bg)", teal:"var(--teal-bg)", amber:"var(--amber-bg)", blue:"var(--blue-bg)", emerald:"var(--emerald-bg)" };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const toast = useToast();

  const load = () => api.getStudents().then(setStudents).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    try {
      if (modal === "add") { await api.createStudent(form); toast("Student added ✓"); }
      else { await api.updateStudent(modal._id, form); toast("Student updated ✓"); }
      setModal(null); load();
    } catch(e) { toast("Error: " + e.message); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    await api.deleteStudent(s._id); toast(`${s.name} removed`); load();
  };

  if (loading) return <div className="loading">Loading students…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>{students.length} enrolled in your class</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>+ Add Student</button>
      </div>

      {modal && <StudentModal student={modal==="add"?null:modal} onClose={() => setModal(null)} onSave={handleSave} />}

      {students.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👥</div><p>No students yet. Add your first one!</p></div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:16 }}>
          {students.map((s, i) => {
            const clr = COLORS[i % COLORS.length];
            return (
              <div key={s._id} style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-lg)", padding:20, transition:"all var(--t)", boxShadow:"var(--shadow-sm)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colorMap[clr]; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:bgMap[clr], color:colorMap[clr], display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.1rem", flexShrink:0 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"0.95rem" }}>{s.name}</div>
                    <div style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{s.email || "No email"}</div>
                  </div>
                </div>
                {s.notes && <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginBottom:14, lineHeight:1.5, borderLeft:`3px solid ${colorMap[clr]}`, paddingLeft:10 }}>{s.notes}</p>}
                <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
                  <Link to={`/students/${s._id}`} className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:"center" }}>View Profile</Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(s)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
