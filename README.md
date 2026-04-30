# Discipleship Class Manager

A clean, mobile-friendly web app for managing a discipleship class —
attendance, assignments, and student progress notes.

---

## Folder Structure

```
discipleship-app/
├── server/                    # Express + MongoDB backend
│   ├── index.js               # Entry point
│   ├── seed.js                # Sample data loader
│   ├── models/
│   │   ├── Student.js
│   │   ├── Attendance.js
│   │   ├── Assignment.js
│   │   └── Note.js
│   └── routes/
│       ├── students.js        # GET/POST/PUT/DELETE + dashboard stats
│       ├── attendance.js      # Sessions + per-student toggle
│       ├── assignments.js     # Assignments + submission toggle
│       └── notes.js           # Progress notes per student
│
└── client/                    # React frontend
    ├── public/index.html
    └── src/
        ├── App.js             # Router + sidebar nav
        ├── index.css          # All styles (design tokens, components)
        ├── utils/
        │   ├── api.js         # All API calls in one place
        │   └── toast.js       # Notification context
        └── pages/
            ├── Dashboard.js   # Stats + student progress table
            ├── Students.js    # Add/edit/delete students
            ├── StudentDetail.js  # Individual student + progress notes
            ├── Attendance.js  # Weekly sessions + present/absent toggles
            └── Assignments.js # Assignments + submitted/pending toggles
```

---

## Prerequisites

- **Node.js** 18 or newer — https://nodejs.org
- **MongoDB Community** — https://www.mongodb.com/try/download/community

### Install MongoDB on Mac (easiest via Homebrew)

```bash
brew tap mongodb/brew
brew install mongodb-community
```

---

## Running Locally

### 1. Start MongoDB

```bash
brew services start mongodb-community
```

Check it's running:
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
# Should print: { ok: 1 }
```

### 2. Set up the server

```bash
cd discipleship-app/server
npm install
```

Optional — create a `.env` file (defaults work without it):
```bash
echo "PORT=5000\nMONGO_URI=mongodb://127.0.0.1:27017/discipleship" > .env
```

Load sample data (5 students, 4 sessions, 3 assignments, 7 notes):
```bash
npm run seed
```

Start the server:
```bash
npm run dev
# Server running on http://localhost:5000
```

### 3. Set up the client (new terminal tab)

```bash
cd discipleship-app/client
npm install
npm start
# Opens http://localhost:3000
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/students` | All students |
| POST | `/students` | Create student |
| PUT | `/students/:id` | Update student |
| DELETE | `/students/:id` | Delete student + their data |
| GET | `/students/dashboard/stats` | Dashboard summary |
| GET | `/attendance` | All sessions |
| POST | `/attendance` | Create session |
| PATCH | `/attendance/:sessionId/record/:studentId` | Toggle present/absent |
| DELETE | `/attendance/:id` | Delete session |
| GET | `/assignments` | All assignments |
| POST | `/assignments` | Create assignment |
| PATCH | `/assignments/:assignmentId/submission/:studentId` | Toggle submitted |
| DELETE | `/assignments/:id` | Delete assignment |
| GET | `/notes/student/:studentId` | Notes for a student |
| POST | `/notes` | Add a note |
| DELETE | `/notes/:id` | Delete a note |

---

## Sample Data (loaded by `npm run seed`)

**Students:** James Okonkwo, Miriam Tadesse, David Park, Esther Nguyen, Samuel Osei

**Sessions:** 4 weekly sessions (Week 1–4) with varied attendance

**Assignments:** 3 assignments with partial submissions

**Notes:** 7 progress notes across students

---

## Tips

- **Mobile use during class:** The sidebar collapses to a hamburger menu on small screens. Attendance toggles are large enough for thumb taps.
- **Attendance flow:** Create a session → toggles auto-populate with all current students as Absent → tap to mark Present.
- **New student:** Adding a student automatically adds them to all existing sessions and assignments as absent/pending.
- **Progress notes:** On any student's detail page, use ⌘+Enter to quickly save a note.
