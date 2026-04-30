// Central API helper — all requests go through here
const BASE = "";  // CRA proxy handles /students, /attendance, etc.

async function req(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Students
  getStudents: () => req("GET", "/students"),
  getStudent: (id) => req("GET", `/students/${id}`),
  createStudent: (body) => req("POST", "/students", body),
  updateStudent: (id, body) => req("PUT", `/students/${id}`, body),
  deleteStudent: (id) => req("DELETE", `/students/${id}`),
  getDashboardStats: () => req("GET", "/students/dashboard/stats"),

  // Attendance
  getSessions: () => req("GET", "/attendance"),
  createSession: (body) => req("POST", "/attendance", body),
  markAttendance: (sessionId, studentId, present) =>
    req("PATCH", `/attendance/${sessionId}/record/${studentId}`, { present }),
  deleteSession: (id) => req("DELETE", `/attendance/${id}`),

  // Assignments
  getAssignments: () => req("GET", "/assignments"),
  createAssignment: (body) => req("POST", "/assignments", body),
  updateAssignment: (id, body) => req("PUT", `/assignments/${id}`, body),
  markSubmission: (assignmentId, studentId, submitted) =>
    req("PATCH", `/assignments/${assignmentId}/submission/${studentId}`, { submitted }),
  deleteAssignment: (id) => req("DELETE", `/assignments/${id}`),

  // Notes
  getNotes: (studentId) => req("GET", `/notes/student/${studentId}`),
  addNote: (studentId, text) => req("POST", "/notes", { studentId, text }),
  deleteNote: (id) => req("DELETE", `/notes/${id}`),
};
