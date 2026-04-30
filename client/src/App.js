import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ToastProvider } from "./utils/toast";
import Dashboard    from "./pages/Dashboard";
import Students     from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Attendance   from "./pages/Attendance";
import Assignments  from "./pages/Assignments";
import Calendar     from "./pages/Calendar";

const NAV = [
  { to: "/",            icon: "⊞", label: "Home" },
  { to: "/students",    icon: "◎", label: "Students" },
  { to: "/attendance",  icon: "✓", label: "Attendance" },
  { to: "/assignments", icon: "≡", label: "Tasks" },
  { to: "/calendar",    icon: "▦", label: "Calendar" },
];

function Dock() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="dock-container">
      <div className="dock">
        {NAV.map((n) => {
          const isActive = n.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(n.to);
          return (
            <button
              key={n.to}
              className={`dock-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(n.to)}
              title={n.label}
            >
              <span className="dock-icon">{n.icon}</span>
              <span className="dock-label">{n.label}</span>
              {isActive && <span className="dock-pip" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Shell() {
  return (
    <div className="app-shell">
      <main className="main-content">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/students"     element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/attendance"   element={<Attendance />} />
          <Route path="/assignments"  element={<Assignments />} />
          <Route path="/calendar"     element={<Calendar />} />
        </Routes>
      </main>
      <Dock />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider><Shell /></ToastProvider>
    </BrowserRouter>
  );
}
