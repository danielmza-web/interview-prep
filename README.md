# Fieldnotes

A private study workspace with cloud-saved editing, personal answers and notes, revision history and portable exports. The application is public; workspace data is not included in this repository or its build.

The four-hour route uses complete visible foundations and one optional deeper explanation per lesson. Optional content is editable, searchable, backed up and included in revision/conflict views. Older schema-1 backups remain compatible.

Five versioned diagrams explain responsibilities, network layers, one-host containers, cluster containment and message distribution. Private HTML stores recognized diagram IDs only; the application renders its own responsive SVG. Text and captions remain editable. Imported SVG/scripts and unknown diagram IDs cannot become executable graphics. Search and Markdown include the diagram explanation; old backups need no new fields.

Study progress counts explicit review/practice confirmations. The chapter-end action marks and continues; ordinary Next only navigates. Existing notes and reviewed flags remain independent of content updates.

Soft night is the default theme. Resources and tools offers a light-mode switch, saved in this browser only. Print exports always use a white page. Navigation skips archived route steps; malformed old hashes fall back to the start. Queued online changes show Saving, while offline or failed saves remain Pending connection until acknowledged.

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

JSON exports include all sections, personal practice and current drafts. Import validates the complete file before mutation and offers add-missing or explicit replacement. Exporting experience produces Markdown. Study guide PDF uses each core section’s optional printBody (falling back to answer/body), in print order. Interview-day PDF uses the two explicit parts of the final-review record. Personal answers and notes are excluded from the core printout. Longer user edits can add pages.

## Publication

GitHub Pages publishes only `dist`. Set repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Use the public publishable key, not a privileged key. Enable Pages with GitHub Actions and push the `main` branch. The workflow runs tests, type checking, a build and a private-data scan before deployment.

Private seeds, source documents, PDF exports and professional records must stay outside this checkout. Import privately after access controls are verified. Republishing application code does not reseed or replace database records.

## Free service limits

Uses the provider subdomains and no paid APIs or editor extensions. Free Supabase projects may pause after inactivity; resume the project in its dashboard. An unavailable backend must never be represented as a successfully loaded empty workspace. Export backups periodically; revision history in the same database is not an independent backup.

## Boundaries

This is a single-owner preparation tool, not a collaborative team editor. It has no file uploads, public registration, analytics, AI calls, factory connections or embedded lab server.

## Guided preparation model

Four main entries: Your route, Learn, Interview Q&A and My Experience. Sources and administrative controls are secondary. src/preparation.ts defines the explicit route, session boundaries and old-hash aliases independently of record order. practice_route stores an optional resumeSectionId using the same versioned save path as notes.

Question sections retain their stable IDs and can add questionPriority, questionTopic and questionIds. Canonical answers render visibly in the bank and wherever referenced. Optional printBody keeps extended online explanations independent of concise print summaries. Schema-1 JSON backups accept the optional fields; malformed metadata is rejected by client/import and the save RPC. validation-contract.sql records the current function contract applied through the Supabase migration tool; older applied migration files remain immutable.

The route includes a local-lab instruction record. The public application contains no personal seed, tutorials copied from private documents, local script execution or automatic synchronization of lab state. Private sources supply those records to the protected workspace.

24 automated tests cover route boundaries, aliases, resume/backward compatibility, metadata validation, all 66 visible answers/group counts, canonical reuse, offline draft recovery, conflicts, in-flight writes, owner isolation and HTML sanitization. Browser review also checks desktop/mobile reading and actual cloud persistence. Generated PDF/Word snapshots live outside this repository.


## Quick explanations and four sessions

The route totals 270 minutes (75 + 70 + 60 + 65), plus a ten-minute final review. Dotted terms open one concise explanation by pointer, keyboard or tap. Essential definitions stay in the chapter. Chapters, related answers and the full bank share help once per concept in each paragraph, cell, list item or heading, including inline code.

The private ref-glossary section supplies optional glossaryTerms entries (stable id, term, aliases, definition, purpose, example). Up to 200 entries are editable through Resources and tools. There is no public seed or extra database column. Client/import and migrations 003/004 validate entries and the 200-entry limit; the owner check, version guard and revision history remain in the existing save RPC. HTML annotations are display-only and never enter the editor or stored source. Glossary changes participate in backups, recovery drafts, conflicts, history and search. Older schema-1 backups remain compatible.

55 web tests cover the existing workspace plus term boundaries, ambiguity, sanitization, 300 ms hover, keyboard/touch dismissal, unchanged refreshes, source preservation, editing, search and restoration. The local lab remains separate.


## Code reading and visual explanations

Highlight.js 11.11.1 is pinned and bundled with only the supported grammars. Reading uses explicit language classes on code inside pre; unknown or absent metadata stays plain text. The sanitizer keeps only the allowed language class and strips imported token styling. Colours and language labels are generated after sanitization, never saved; source text is unchanged. The editor remains plain and offers a language selector when its cursor enters a code block. Markdown preserves the language hint.

The diagram registry now has eight safe IDs, including mission lifecycle, rolling/canary comparison and message recovery. Desktop and mobile variants share text equivalents. Private teaching content and its coverage matrix remain outside this public repository. The local private-fixture audit is ignored by Git and is not included in the public CI test count.
