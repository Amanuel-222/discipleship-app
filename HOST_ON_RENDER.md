# Host the Supabase version on Render

This version uses a **Render static site** for React and **Supabase** for the database and authentication. Teammates only need the app's HTTPS link and their own approved application login.

## Before deployment

1. Follow the Supabase project/schema/team-user setup in `README.md`.
2. Put this source in a Git repository connected to your Render account (GitHub, GitLab, or Bitbucket).
3. The current private ChatGPT Sites Git repository cannot be cloned by Render without separate access. The source archive is included for transfer to your own repository.

## Render configuration

Use `render.yaml` as a Blueprint, or create a **Static Site** manually:

- Build command: `npm ci --include=dev && npm run build`
- Publish directory: `dist`
- Environment:
  - `VITE_SUPABASE_URL`: your Supabase project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: the publishable key (legacy anon key also supported)
  - `VITE_DEMO`: `false`
- SPA rewrite: `/*` → `/index.html`

Do not create a Node Web Service for this version. Do not provide a MongoDB URI or team-wide password. There is no backend start command.

These Supabase values are build-time frontend configuration. The publishable key is intentionally visible to the browser; RLS restricts access. **Never use a secret or service_role key.** Rebuild/redeploy after changing either value.

The Render static site has a free tier subject to bandwidth/build quotas. Supabase's Free plan is separate and has its own database, authentication, egress, and inactivity limits. No paid resources are requested by the configuration.

## Launch checks

1. Open the generated HTTPS URL and confirm you see email/password login, not sample data.
2. Confirm an unapproved user cannot open class data.
3. Sign in as an approved user, create a student, and verify it appears after reopening the app and on a second device.
4. Mark attendance and an assignment; add a note; verify metrics and CSV output.
5. Verify team changes arrive on another signed-in browser (or after refocusing it).
6. Share the app link and provisioned credentials privately with approved team members.

No ChatGPT/Supabase dashboard/Render accounts are required for your teammates. Project owners still need their hosting-provider accounts for administration.

Official references:

- React + Supabase: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase pricing: https://supabase.com/pricing
- Render static sites: https://render.com/docs/static-sites
- Render Blueprint schema: https://render.com/docs/blueprint-spec
