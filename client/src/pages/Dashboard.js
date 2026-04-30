import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";

function ProgressBar({ pct }) {
  const cls = pct === null ? "" : pct >= 75 ? "mint" : pct >= 50 ? "warn" : "danger";
  return (
    <div className="progress-bar">
      <div className={`progress-bar-fill ${cls}`} style={{ width: `${pct ?? 0}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboardStats().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading…</div>;
  if (!data) return null;

  const avgAttendance = data.students.length > 0
    ? Math.round(data.students.reduce((s, x) => s + (x.attendancePct ?? 0), 0) / data.students.length)
    : 0;

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* ── Hero ── */}
      <div className="page-hero">
        <h2>{greet()}, Amanuel 👋</h2>
        <p>Here's what's happening with your discipleship class</p>
        <div className="page-hero-actions">
          <button className="btn btn-white" onClick={() => navigate("/students")}>+ Add Student</button>
          <button className="btn" style={{ background:"rgba(255,255,255,0.15)", color:"#fff" }} onClick={() => navigate("/attendance")}>Take Attendance</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        <div className="stat-card violet">
          <div className="stat-card-icon violet">👥</div>
          <div className="stat-value">{data.totalStudents}</div>
          <div className="stat-label">Students</div>
          <div className="stat-change">Enrolled</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-card-icon teal">📅</div>
          <div className="stat-value">{data.totalSessions ?? 0}</div>
          <div className="stat-label">Sessions</div>
          <div className="stat-change">Held this term</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-card-icon pink">📝</div>
          <div className="stat-value">{data.totalAssignments}</div>
          <div className="stat-label">Assignments</div>
          <div className="stat-change">Created</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-icon amber">📊</div>
          <div className="stat-value">{avgAttendance}%</div>
          <div className="stat-label">Avg Attendance</div>
          <div className="stat-change">Class average</div>
        </div>
      </div>

      {/* ── Student progress ── */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1rem", fontWeight:700 }}>Student Progress</h3>
          <Link to="/students" style={{ fontSize:"0.78rem", color:"var(--violet)", fontWeight:600 }}>View all →</Link>
        </div>
        {data.students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No students yet. Add some to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student</th><th>Attendance</th><th>Assignments</th><th></th></tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--violet-bg)", color:"var(--violet)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.8rem", flexShrink:0 }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight:600 }}>{s.name}</div>
                          {s.email && <div style={{ fontSize:"0.72rem", color:"var(--text-light)" }}>{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <ProgressBar pct={s.attendancePct} />
                        <span style={{ fontSize:"0.78rem", color:"var(--text-muted)", minWidth:36 }}>
                          {s.attendancePct !== null ? `${s.attendancePct}%` : "—"}
                        </span>
                      </div>
                      <div style={{ fontSize:"0.7rem", color:"var(--text-light)", marginTop:3 }}>{s.attendanceLabel} sessions</div>
                    </td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <ProgressBar pct={s.assignmentPct} />
                        <span style={{ fontSize:"0.78rem", color:"var(--text-muted)", minWidth:36 }}>
                          {s.assignmentPct !== null ? `${s.assignmentPct}%` : "—"}
                        </span>
                      </div>
                      <div style={{ fontSize:"0.7rem", color:"var(--text-light)", marginTop:3 }}>{s.assignmentLabel} submitted</div>
                    </td>
                    <td><Link to={`/students/${s._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
