# Fieldnotes

A private study workspace with cloud-saved editing, personal answers and notes, revision history and portable exports. The application is public; workspace data is not included in this repository or its build.

## Development

Node 24. Copy `.env.example` to `.env.local` and set the project's Supabase URL and **publishable** key. Never use a service-role or secret key in a `VITE_` variable.

```text
npm ci
npm run dev
npm test
npm run build
npm run test:security
```

`VITE_BASE_PATH` defaults to `/interview-prep/`. Navigation uses stable hash links so GitHub Pages needs no server fallback.

## Database and authentication

Apply `supabase/migrations/001_workspace.sql` through Supabase migrations. Create the intended account in Supabase Authentication, then add its UUID to `prep_private.owners` using an administrator connection. Disable new-user signups and anonymous sign-ins. Do not grant membership from the client or put the owner's email or private seed in this repository.

`prep_records` stores versioned sections and practice records; `prep_revisions` retains snapshots. Authenticated clients can read only their own records when also on the owner allowlist. Direct client writes are revoked. `save_prep_record` verifies ownership and payload, serializes the record and compares the expected version in one transaction. A stale write raises `VERSION_CONFLICT`; every successful write appends history.

The frontend uses a publishable key and the signed-in user's session. It does not require an administrative key, Edge Function or paid editor service. All display HTML is sanitised. New sections receive UUID-based IDs that survive renaming and reordering.

## Sync and recovery

Edits first create an owner-scoped recovery draft, then autosave after a short pause. Only a successful server response produces Saved. Failed saves remain pending. Opening the app, focusing it or a 15-second background refresh retrieves saved content. Local drafts remain visible until saved or explicitly discarded. Conflicting versions require a visible choice; history restoration creates a new revision.

Device preview is explicitly local and uses separate storage. It cannot prove cloud synchronisation. Sign out on shared devices; recovery drafts remain in that browser when there is pending work.

## Exports

JSON exports include all sections, personal practice and current drafts. Import validates the complete file before mutation and offers add-missing or explicit replacement. Exporting experience produces Markdown. Print / PDF includes only sections marked for the core guide, in their print order. Personal answers and notes are excluded from the core printout. Longer user edits can add pages.

## Publication

GitHub Pages publishes only `dist`. Set repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Use the public publishable key, not a privileged key. Enable Pages with GitHub Actions and push the `main` branch. The workflow runs tests, type checking, a build and a private-data scan before deployment.

Private seeds, source documents, PDF exports and professional records must stay outside this checkout. Import privately after access controls are verified. Republishing application code does not reseed or replace database records.

## Free service limits

Uses the provider subdomains and no paid APIs or editor extensions. Free Supabase projects may pause after inactivity; resume the project in its dashboard. An unavailable backend must never be represented as a successfully loaded empty workspace. Export backups periodically; revision history in the same database is not an independent backup.

## Boundaries

This is a single-owner preparation tool, not a collaborative team editor. It has no file uploads, public registration, analytics, AI calls, factory connections or embedded lab server.
