import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../utils/toast";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" });
}

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [notes, setNotes]     = useState([]);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const loadNotes = useCallback(() => api.getNotes(id).then(setNotes), [id]);
  useEffect(() => { api.getStudent(id).then(setStudent); loadNotes(); }, [id, loadNotes]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    try { await api.addNote(id, newNote.trim()); setNewNote(""); await loadNotes(); toast("Note added ✓"); }
    catch(e) { toast("Error: " + e.message); }
    finally { setSubmitting(false); }
  };

  const deleteNote = async (nid) => {
    if (!window.confirm("Delete this note?")) return;
    await api.deleteNote(nid); await loadNotes(); toast("Note deleted");
  };

  if (!student) return <div className="loading">Loading…</div>;

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom:24 }}>
        <Link to="/students" style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.6)", display:"inline-block", marginBottom:12 }}>← All Students</Link>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.5rem", color:"#fff", flexShrink:0 }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize:"1.7rem" }}>{student.name}</h2>
            {student.email && <p><a href={`mailto:${student.email}`} style={{ color:"rgba(255,255,255,0.75)" }}>{student.email}</a></p>}
          </div>
        </div>
      </div>

      {student.notes && (
        <div className="card card-violet" style={{ marginBottom:20 }}>
          <div style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--violet)", marginBottom:6 }}>General Notes</div>
          <p style={{ fontSize:"0.9rem", color:"var(--text-muted)", lineHeight:1.6 }}>{student.notes}</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.05rem", fontWeight:700, marginBottom:18 }}>Progress Notes</h3>

        <div style={{ background:"var(--bg-2)", borderRadius:"var(--radius)", padding:16, marginBottom:20, border:"1.5px solid var(--border)" }}>
          <textarea className="form-control" style={{ minHeight:70, marginBottom:10, background:"var(--surface)" }}
            placeholder='Add a progress note… e.g. "More engaged this week, asked great questions."'
            value={newNote} onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => { if ((e.ctrlKey||e.metaKey) && e.key==="Enter") addNote(); }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"0.72rem", color:"var(--text-light)" }}>⌘ + Enter to save</span>
            <button className="btn btn-primary btn-sm" onClick={addNote} disabled={submitting || !newNote.trim()}>
              {submitting ? "Saving…" : "Add Note"}
            </button>
          </div>
        </div>

        {notes.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0", color:"var(--text-muted)", fontSize:"0.88rem" }}>No progress notes yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {notes.map(n => (
              <div key={n._id} className="note-item">
                <div style={{ flex:1 }}>
                  <p>{n.text}</p>
                  <time>{formatDate(n.createdAt)}</time>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteNote(n._id)} style={{ color:"var(--rose)", flexShrink:0, padding:"2px 6px" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
