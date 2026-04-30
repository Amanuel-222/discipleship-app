// In production the React app is served by the same Express server
// so all API calls are relative. In development CRA proxy handles it.
const BASE = "";

async function req(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getStudents:      ()        => req("GET",    "/students"),
  getStudent:       (id)      => req("GET",    `/students/${id}`),
  createStudent:    (body)    => req("POST",   "/students", body),
  updateStudent:    (id, body)=> req("PUT",    `/students/${id}`, body),
  deleteStudent:    (id)      => req("DELETE", `/students/${id}`),
  getDashboardStats:()        => req("GET",    "/students/dashboard/stats"),

  getSessions:      ()        => req("GET",    "/attendance"),
  createSession:    (body)    => req("POST",   "/attendance", body),
  markAttendance:   (sid, stid, present) => req("PATCH", `/attendance/${sid}/record/${stid}`, { present }),
  deleteSession:    (id)      => req("DELETE", `/attendance/${id}`),

  getAssignments:   ()        => req("GET",    "/assignments"),
  createAssignment: (body)    => req("POST",   "/assignments", body),
  updateAssignment: (id, body)=> req("PUT",    `/assignments/${id}`, body),
  markSubmission:   (aid, stid, submitted) => req("PATCH", `/assignments/${aid}/submission/${stid}`, { submitted }),
  deleteAssignment: (id)      => req("DELETE", `/assignments/${id}`),

  getNotes:         (studentId)       => req("GET",    `/notes/student/${studentId}`),
  addNote:          (studentId, text) => req("POST",   "/notes", { studentId, text }),
  deleteNote:       (id)              => req("DELETE", `/notes/${id}`),
};
