# TVM Discipleship — React + Supabase

A small class-management app for True Vine Ministry: student profiles, weekly attendance, assignment submission statuses, dated progress notes, dashboard metrics, and CSV exports.

React runs the interface. Supabase provides PostgreSQL, authentication, a REST API, and Row Level Security (RLS). Render serves the frontend as a static site. There is no Express server or MongoDB service to maintain in this version.

## Status

The Supabase integration and SQL setup are prepared and tested locally. A live Supabase project must still be selected/configured and the static frontend deployed before this becomes a shared app. Installing the Supabase connection in ChatGPT does not by itself connect the deployed frontend.

The existing Sites preview remains a fictional sample-data preview until a live project is configured. Browser sample data is not automatically migrated into Supabase.

## Owner setup

1. Use a **new, dedicated Supabase project** on the Free plan. The schema uses common table names and is intended for a new project, not an unrelated existing app.
2. Run `supabase/schema.sql` in that project's SQL Editor. It creates the tables, roster triggers, and approved-team policies. The SQL is transactional and will fail if these tables already exist; do not rerun it against an existing class without reviewing a migration.
3. In Authentication settings, enable email/password sign-in and disable public sign-up.
4. Create your own application user under Authentication → Users using the email/password you want to use in the TVM app. Your Supabase dashboard account is separate and is not automatically an application user.
5. Run `supabase/approve-member.sql`, replacing both example-email occurrences with that user's exact email. Verify the result shows the approved email. This sends no invitation email.
6. For each teammate, create an application user and approve it the same way. Share their login credentials privately. Teammates do not need ChatGPT, Render, or Supabase dashboard accounts.
7. For password resets, use the project owner's user-management workflow. This MVP has no public sign-up, email-invitation flow, or self-service password-reset screen.
8. Get the project URL and **publishable key** from the project's Connect panel/API settings. A legacy `anon` key also works. Never use a `service_role` key or `sb_secret_...` key in the React frontend.

## Run locally on your Mac

Install Node.js 22–24. In the project directory:

```bash
npm install
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Then:

```bash
npm run dev
```

Open `http://127.0.0.1:5173`. Sign in with an approved **application user**, not your Supabase dashboard login. Restart Vite after changing environment values.

For a local production-build check:

```bash
npm run build
npm run preview
```

## Host outside ChatGPT

See `HOST_ON_RENDER.md`. `render.yaml` now defines a static site, so there is no backend server to deploy. Set the two Supabase environment values before building. Everyone opens the same normal HTTPS website and signs in with their own approved email/password.

## Sample data

- `frontend/src/sample.js`: fictional data used only in the explicitly labeled preview.
- `supabase/sample-data.sql`: optional fictional data for an **empty test project**. It refuses a nonempty class database. Do not run it for a real class.

A sample frontend build without a Supabase connection:

```bash
VITE_DEMO=true npm run build
```

For a live build, leave `VITE_DEMO` unset or set it to `false`. Configured Supabase values take precedence over demo mode. A non-demo build with missing configuration shows a setup message instead of pretending to save real data.

## Folder structure

```text
tvm-discipleship/
  package.json / package-lock.json
  render.yaml
  README.md / HOST_ON_RENDER.md
  frontend/
    .env.local.example
    index.html / vite.config.js
    src/
      main.jsx          Screens, forms, profiles, individual login
      styles.css        Responsive UI
      supabase.js       Supabase client, login, team access check
      api.js            Data adapter and explicit sample-mode adapter
      metrics.js        Attendance/completion calculations and CSV
      sample.js         Fictional browser preview data
  supabase/
    schema.sql          Tables, triggers, RLS, optional live updates
    approve-member.sql  Owner-controlled access approval/revocation
    sample-data.sql     Optional fictional test data
  tests/
    metrics.test.js
```

## Access and data rules

- All approved team members can read and edit this one class. No separate admin/member roles inside the app.
- Approval is maintained in `team_members` by the project owner. Application users cannot grant themselves membership.
- Anonymous users and logged-in but unapproved users cannot read class data. RLS protects every business table.
- Sessions and assignments capture the current student roster atomically. Later students appear in future rosters only.
- Attendance starts unmarked. Percentage = Present / (Present + Absent); unmarked sessions are excluded.
- Assignment completion = submitted / assigned roster records. This tracks submission status, not uploaded files.
- Notes receive database timestamps by default. The browser displays local time.
- Deleting a student cascades to their attendance, submissions, and notes.
- Live changes refresh the interface when Supabase Realtime is enabled. Returning focus to the app also reloads shared data.
- Export CSV backups regularly. The Free plan has limits, inactivity pausing, and no automatic database backups included.

## Verification

```bash
npm test
npm run build
```

Local PostgreSQL tests verified schema constraints, atomic roster capture, status updates, note timestamps, cascading deletion, anonymous/outsider denial, prevention of self-approval, and access revocation. Browser checks cover the sample workflows and Supabase login/data integration using a controlled test API. Live authentication, RLS, and multi-device persistence still need verification against your configured Supabase project before launch.

The previous Express/MongoDB implementation remains in the Git tag `express-mongo-mvp` and in the earlier source archive.
