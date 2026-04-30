import React, { useEffect, useState, useMemo } from "react";
import { api } from "../utils/api";

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const EVENT_TYPES = [
  { value: "fellowship", label: "🤝 Fellowship",      color: "fellowship" },
  { value: "prayer",     label: "🙏 Prayer Night",    color: "prayer" },
  { value: "speaker",    label: "🎤 Guest Speaker",   color: "speaker" },
  { value: "session",    label: "📖 Class Session",   color: "session" },
  { value: "assignment", label: "📝 Assignment Due",  color: "assignment" },
  { value: "other",      label: "📌 Other",           color: "other" },
];

const STORAGE_KEY = "discipleship_calendar_v2";
function load()     { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function save(evs)  { localStorage.setItem(STORAGE_KEY, JSON.stringify(evs)); }

function fmtDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
}
function fmtShort(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

// ── Add Event Modal ──────────────────────────────
function AddEventModal({ date, onClose, onSave }) {
  const [form, setForm] = useState({ title:"", type:"fellowship", time:"", location:"", description:"" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <h3>Add Event</h3>
        <p className="modal-date-label">📅 {fmtDate(date)}</p>

        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Event Title *</label>
            <input className="form-control" value={form.title} onChange={set("title")}
              placeholder="e.g. Friday Fellowship Night" autoFocus />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Time</label>
            <input className="form-control" type="time" value={form.time} onChange={set("time")} />
          </div>
        </div>

        <div className="form-group">
          <label>Event Type</label>
          <select className="form-control" value={form.type} onChange={set("type")}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input className="form-control" value={form.location} onChange={set("location")}
            placeholder="e.g. Church Hall, Room 204, Zoom…" />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" value={form.description} onChange={set("description")}
            placeholder="Any details, notes, or agenda items…" style={{ minHeight: 72 }} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.title.trim() && onSave({ ...form, date, id: Date.now().toString() })}
            disabled={!form.title.trim()}>Save Event</button>
        </div>
      </div>
    </div>
  );
}

// ── Day Detail Modal ─────────────────────────────
function DayDetailModal({ date, events, onClose, onDelete, onAdd }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <h3 style={{ marginBottom: 4 }}>📅 {fmtDate(date)}</h3>
        <p className="modal-date-label">{events.length} event{events.length !== 1 ? "s" : ""}</p>

        <div style={{ display:"flex", flexDirection:"column", gap: 8, marginBottom: 16 }}>
          {events.map((ev, i) => {
            const t = EVENT_TYPES.find(x => x.value === ev.type) || EVENT_TYPES[EVENT_TYPES.length-1];
            return (
              <div key={i} className="event-card" style={{ borderLeft: `3px solid` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 8 }}>
                  <div style={{ flex:1 }}>
                    <div className="event-card-title">{ev.label || ev.title}</div>
                    <div className="event-card-meta">
                      {ev.time     && <span>🕐 {ev.time}</span>}
                      {ev.location && <span>📍 {ev.location}</span>}
                    </div>
                    {ev.description && (
                      <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>{ev.description}</p>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <span className={`badge badge-${
                        ev.type === "fellowship" ? "orange" :
                        ev.type === "prayer"     ? "green"  :
                        ev.type === "speaker"    ? "red"    :
                        ev.type === "session"    ? "coral"  :
                        ev.type === "assignment" ? "warn"   : "gray"
                      }`} style={{ fontSize:"0.65rem" }}>{t.label}</span>
                    </div>
                  </div>
                  {ev.custom && (
                    <button className="btn btn-ghost btn-sm" onClick={() => onDelete(ev.id)}
                      style={{ color:"var(--rose)", padding:"2px 6px", flexShrink:0 }}>✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onAdd(date); }}>+ Add Another</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar ────────────────────────────────
export default function Calendar() {
  const [sessions,    setSessions]    = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [custom,      setCustom]      = useState(load);
  const [today]  = useState(new Date());
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [addModal,    setAddModal]    = useState(null);
  const [detailDate,  setDetailDate]  = useState(null);

  useEffect(() => {
    api.getSessions().then(setSessions);
    api.getAssignments().then(setAssignments);
  }, []);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  // Build event map
  const eventMap = useMemo(() => {
    const map = {};
    const add = (date, ev) => { if (!date) return; const k = date.slice(0,10); map[k] = [...(map[k]||[]), ev]; };
    sessions.forEach(s    => add(s.date,    { type:"session",    label: s.label||"Class Session", custom:false }));
    assignments.forEach(a => a.dueDate && add(a.dueDate, { type:"assignment", label: a.title, custom:false }));
    custom.forEach(e      => add(e.date,    { ...e, label: e.title, custom:true }));
    return map;
  }, [sessions, assignments, custom]);

  // Grid
  const cells = useMemo(() => {
    const { year, month } = cur;
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();
    const out = [];
    for (let i = firstDay-1; i >= 0; i--) out.push({ day: daysInPrev-i, current:false, date:null });
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ day:d, current:true, date:`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` });
    }
    while (out.length < 42) out.push({ day: out.length-firstDay-daysInMonth+1, current:false, date:null });
    return out;
  }, [cur]);

  const handleDayClick = date => {
    if (!date) return;
    const evs = eventMap[date] || [];
    if (evs.length > 0) setDetailDate(date);
    else setAddModal(date);
  };

  const handleSave = form => {
    const updated = [...custom, form];
    setCustom(updated); save(updated); setAddModal(null);
  };

  const handleDelete = id => {
    const updated = custom.filter(e => e.id !== id);
    setCustom(updated); save(updated);
    // close detail if empty
    if (detailDate && (eventMap[detailDate]||[]).filter(e=>e.id!==id).length === 0)
      setDetailDate(null);
  };

  // Upcoming
  const upcoming = useMemo(() => {
    const evs = [];
    sessions.forEach(s    => s.date >= todayStr    && evs.push({ date:s.date,    type:"session",    label: s.label||"Class Session" }));
    assignments.forEach(a => a.dueDate >= todayStr && evs.push({ date:a.dueDate, type:"assignment", label: a.title }));
    custom.forEach(e      => e.date >= todayStr    && evs.push({ date:e.date,    type:e.type,       label: e.title, time:e.time, location:e.location }));
    return evs.sort((a,b) => a.date.localeCompare(b.date)).slice(0,12);
  }, [sessions, assignments, custom, todayStr]);

  const prev = () => setCur(c => c.month===0 ? {year:c.year-1,month:11} : {...c,month:c.month-1});
  const next = () => setCur(c => c.month===11 ? {year:c.year+1,month:0} : {...c,month:c.month+1});

  return (
    <div>
      {addModal && <AddEventModal date={addModal} onClose={() => setAddModal(null)} onSave={handleSave} />}
      {detailDate && (
        <DayDetailModal
          date={detailDate}
          events={eventMap[detailDate]||[]}
          onClose={() => setDetailDate(null)}
          onDelete={handleDelete}
          onAdd={d => setAddModal(d)}
        />
      )}

      <div className="page-header">
        <div>
          <h2>Calendar</h2>
          <p>Click any day to add events — Fellowship, Prayer Night, Guest Speakers & more</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModal(todayStr)}>+ Add Event</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 272px", gap: 20, alignItems:"start" }}>
        {/* ── Main Grid ── */}
        <div className="card">
          <div className="cal-nav">
            <h3>{MONTHS[cur.month]} {cur.year}</h3>
            <button className="cal-nav-btn" onClick={prev}>‹</button>
            <button className="cal-nav-btn" onClick={() => setCur({year:today.getFullYear(),month:today.getMonth()})}>Today</button>
            <button className="cal-nav-btn" onClick={next}>›</button>
          </div>

          <div className="calendar-grid" style={{ marginBottom:4 }}>
            {DAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
          </div>
          <div className="calendar-grid">
            {cells.map((cell, i) => {
              const evs = cell.date ? (eventMap[cell.date]||[]) : [];
              return (
                <div key={i}
                  className={`cal-day ${!cell.current?"other-month":""} ${cell.date===todayStr?"today":""} ${cell.current?"clickable":""}`}
                  onClick={() => handleDayClick(cell.date)}
                >
                  <div className="cal-day-num">{cell.day}</div>
                  {evs.slice(0,2).map((ev,j) => (
                    <div key={j} className={`cal-event ${ev.type||"other"}`}>{ev.label||ev.title}</div>
                  ))}
                  {evs.length > 2 && <div style={{fontSize:"0.6rem",color:"var(--text-light)",marginTop:1}}>+{evs.length-2} more</div>}
                  {cell.current && evs.length===0 && <div className="cal-add-hint">+</div>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:12, marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)", flexWrap:"wrap" }}>
            {EVENT_TYPES.map(t => (
              <div key={t.value} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div className={`cal-event ${t.color}`} style={{ margin:0, width:10, height:10, borderRadius:3, padding:0, flexShrink:0 }} />
                <span style={{ fontSize:"0.68rem", color:"var(--text-muted)" }}>{t.label.split(" ").slice(1).join(" ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Upcoming ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card">
            <div className="section-header" style={{ marginBottom:14 }}>
              <h3>Upcoming Events</h3>
              <span style={{ fontSize:"0.72rem", color:"var(--text-light)" }}>{upcoming.length}</span>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:"var(--text-muted)", fontSize:"0.85rem" }}>Nothing coming up!</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {upcoming.map((ev, i) => (
                  <div key={i} style={{
                    padding:"10px 12px", borderRadius:"var(--radius)",
                    background:"var(--surface-2)", border:"1px solid var(--border)",
                    borderLeft:`3px solid ${
                      ev.type==="fellowship"?"var(--orange)":
                      ev.type==="prayer"    ?"var(--emerald)":
                      ev.type==="speaker"   ?"var(--rose)":
                      ev.type==="session"   ?"var(--indigo)":
                      ev.type==="assignment"?"var(--amber)":"var(--sky)"
                    }`,
                  }}>
                    <div style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--text)" }}>{ev.label}</div>
                    <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginTop:3, display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span>📅 {fmtShort(ev.date)}</span>
                      {ev.time     && <span>🕐 {ev.time}</span>}
                      {ev.location && <span>📍 {ev.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ background:"var(--indigo-dim)", border:"1px solid rgba(99,102,241,0.18)" }}>
            <p style={{ fontSize:"0.77rem", color:"var(--indigo)", fontWeight:600, marginBottom:4 }}>💡 How it works</p>
            <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", lineHeight:1.6 }}>
              Click any day to add a Fellowship night, Prayer session, Guest speaker, or any custom event. Sessions and assignments you create elsewhere appear here automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
