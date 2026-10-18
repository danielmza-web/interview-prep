# 18 October 2026 — robotics vocabulary capacity

- Expanded the shared glossary limit from 200 to 240 in editing, validation/import and the existing protected save contract.
- Added regression coverage for plural acronyms and full names split by formatting in comparison cells. Reading behaviour, saved notes and route progress are unchanged.
- 56 public application tests; private teaching tables remain outside this repository.

# 18 October 2026

- Added five application-defined diagrams with responsive layouts and theme-aware SVG. Editor, reading, search, Markdown, backup and history preserve their stable IDs and textual explanations.
- Added explicit chapter-end review/practice actions and progress guidance, retaining ordinary navigation and the ability to unmark.
- Preserved schema-1 HTML compatibility and limited graphic rendering to recognized IDs; no new dependency or database field.
- Stable graphic markup preserves the reading position during background refreshes; diagrams stay compact in the reading column.
- Recoverable editor loading errors keep the workspace and notes visible when a stale tab needs to reload after publication.
- Validation: 38 frontend tests, TypeScript build and public artifact privacy scan.

# Changes

## 17 October 2026 — guided preparation

Four-entry navigation, explicit four-session route and saved resume position. Canonical visible Q&A grouped by preparation priority and topic; answers reused in modules and rehearsal. Legacy links resolve to their new destinations. Administrative tools are secondary; a persistent Next action supports long reading pages.

Added validated optional metadata and dedicated print summaries while retaining schema-1 backup compatibility, version-checked saves, offline drafts, conflicts and history. Added 8 route/UI tests; all 24 frontend tests and the public-data scan pass. Private content and document exports remain outside this repository.
# 2026-10-17 — Soft night and preparation review

- Added a blue-grey soft-night default and persistent optional light theme, including login, editor, tables, histories and readable question answers. Print remains white.
- Put the ten-minute cue sheet before detailed interview-day support.
- Corrected queued-save status, malformed hashes and archived route/resume handling.
- Added regression coverage for theme preference, offline status, stale route positions and simultaneous editor opening; 27 application tests pass.
- Initialise visual editors after mounting so lazy fields cannot access a destroyed editor during opening.

## 17 October 2026 — complete teaching and optional depth

Added validated optional deepBody with visual editing, search, history, conflict comparison and schema-1 backup compatibility. The main lesson remains visible; one optional expansion holds advanced examples. Search opens matching optional content. Session times total 230 minutes plus a ten-minute review. All 29 tests pass, including optional-depth UI and compatibility checks. Test workers are capped for reliable cold editor loading.
