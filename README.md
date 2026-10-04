# True Vine Classes — React + Supabase

A simple student tracker for Discipleship, Foundations, and Ministry Empowerment: student profiles, weekly attendance, assignment submission statuses, dated progress notes, dashboard metrics, and CSV exports.

React runs the interface. Supabase provides PostgreSQL, authentication, a REST API, and Row Level Security (RLS). Render serves the frontend as a static site. There is no Express server or MongoDB service to maintain in this version.

## Live app

The TVM app is deployed at https://tvm-discipleship.onrender.com/ from the `tvm-supabase` GitHub branch. The old `main` branch and app remain separate. Teammates use their own approved application accounts.

## Owner setup

1. Use a **new, dedicated Supabase project** on the Free plan. The schema uses common table names and is intended for a new project, not an unrelated existing app.
2. Run `supabase/schema.sql`, then `supabase/church-classes.sql` in that project's SQL Editor. It creates the tables, roster triggers, and approved-team policies. The SQL is transactional and will fail if these tables already exist; do not rerun it against an existing class without reviewing a migration.
3. In Authentication settings, enable email/password sign-in and disable public sign-up.
4. Create your own application user under Authentication → Users using the email/password you want to use in the TVM app. Your Supabase dashboard account is separate and is not automatically an application user.
5. Run `supabase/approve-member.sql`, replacing both example-email occurrences with that user's exact email. Verify the result shows the approved email. This sends no invitation email.
6. Configure invitation emails and auth redirects as described below. Invite each teammate under Authentication → Users → Add user → Invite user, then approve their exact email using `supabase/approve-member.sql`. They choose their own password from the invitation link. Teammates do not need ChatGPT, Render, or Supabase dashboard accounts.
7. Existing application users can use **Forgot password?** on the app's sign-in page. Public sign-up remains disabled.
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

See `HOST_ON_RENDER.md`. `render.yaml` now defines a static site, so there is no backend server to deploy. Set the two Supabase environment values before building. Everyone opens the same HTTPS website and signs in with their own email/password; their assigned classes control which records they can access.

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

- Church administrators can access all classes. Class leaders and team members can read/edit records only in their assigned classes. Leaders manage members for their class; only church administrators appoint class leaders.
- Approval is maintained in `ministry_members`, with church-wide administrator access in `church_admins`. Guarded membership RPCs enforce leader/admin permissions; ordinary members cannot grant access. `team_members` remains only as migration history and no longer authorizes access.
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

Local PostgreSQL tests verified schema constraints, atomic roster capture, status updates, note timestamps, cascading deletion, anonymous/outsider denial, prevention of self-approval, and access revocation. Browser checks cover the sample workflows and Supabase login/data integration using a controlled test API. The owner has verified live login. Invitation and reset delivery additionally require the SMTP configuration below. Controlled browser checks verify invitation/recovery link handling, password confirmation, password update, and membership denial; they do not send real email.

The previous Express/MongoDB implementation remains in the Git tag `express-mongo-mvp` and in the earlier source archive.

## Team meeting notes

Open **Team meetings** to save a title, meeting date, and notes for each meeting. Approved teammates can view, edit, or delete these shared entries. Line breaks are preserved, and the meeting history can be exported as CSV. Each record also stores its creation timestamp.

New projects use `supabase/schema.sql`, which includes meeting notes. To upgrade an existing TVM database, apply `supabase/team-meetings.sql` once before deploying the updated frontend. Do not re-run the full schema on an existing project.

## Invitation and password-reset setup

1. In Supabase Authentication → URL Configuration, set **Site URL** to `https://tvm-discipleship.onrender.com/`. Add the exact redirect URL `https://tvm-discipleship.onrender.com/?auth=setup` to the redirect allowlist. If testing locally, separately allow `http://127.0.0.1:5173/?auth=setup`.
2. Configure **custom SMTP** under Authentication → Emails → SMTP Settings, using an email provider's sender address, host, port, username, and password. Keep all credentials in Supabase settings. The built-in service only sends to Supabase organization team addresses; adding classmates as app users does not make them eligible. Do not add classmates as Supabase organization administrators to work around this restriction.
3. Use Authentication → Users → Add user → **Invite user** for new teammates. This sends an email and creates their app account without you assigning their password. For an existing app user, use the site's **Forgot password?** flow instead.
4. Approve the invited user's exact email with `supabase/approve-member.sql`. Sending an invitation alone does not grant access to class records.
5. The teammate opens the link, enters and confirms their new password (at least 8 characters), then signs in normally. Supabase stores the credentials. Expired links show a clear recovery message; request a fresh invitation/reset link.

Keep the default invite/recovery templates' `{{ .ConfirmationURL }}` links, which verify the email before returning to this app. No service-role key or admin invitation API is exposed in the browser. Invitations are sent by the project owner through Supabase, not by ordinary class members.

Reference: https://supabase.com/docs/guides/auth/auth-smtp

## Team directory

Open **Team & settings** (on mobile, tap **TV** in the top-right corner) to see the **Team members** directory. It lists the selected class’s teammates' email addresses, class roles, and approval dates, marks your own account, and refreshes on demand or when you return to the app. Invited accounts appear after class-access approval, even before their first sign-in.

For an existing database, apply `supabase/team-directory.sql` once before deploying this update. New projects use the full schema. A caller-checked private function returns only email, user ID, and approval date; anonymous and unapproved accounts cannot retrieve the directory. Passwords and other authentication details are not returned. Account invitations and approval remain managed by the project owner in Supabase.

## Church classes upgrade

For an existing TVM database, apply `supabase/church-classes.sql` once after the team-directory migration. It creates the three class spaces, keeps every existing record in Discipleship, preserves existing team approvals there. The project owner then approves the intended church administrator with the owner-only SQL below. Other teammates remain Discipleship members. No one is automatically added to Foundations or Ministry Empowerment.

For a new installation, run the base schema and church upgrade before using the frontend. Create your first app user, then have the project owner approve the intended church administrator in the SQL Editor:

```sql
insert into public.church_admins(user_id)
select id from auth.users where lower(email)=lower('YOUR-OWNER-EMAIL');
```

Only the Supabase project owner can edit `church_admins`. In the app, choose a class at the top, open **Team & settings**, and add an already-invited email as **Team member** or **Class leader**. Class leaders can add/remove members only in their own class; they cannot promote users or modify another leader. Removing class access does not delete the user or student records.

Assignments have a **Section / topic** field. Pick Devotional, Monthly Topic, General, or type a custom name such as `October: Prayer`. Filter the assignment list by that section, or edit an existing assignment to move it into a section. Existing assignments stay in General. CSV exports include the section. No extra modules or church-wide information feed are introduced.
