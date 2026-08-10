# ForgePath Private Alpha 0.5.0

ForgePath is a local-first adaptive strength and hypertrophy coach built from JB's Obsidian Build Bible. It keeps selected strength anchors progressing while allocating recoverable hypertrophy work around real time, equipment, readiness, joint response, and the training actually completed.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite. The app can be installed as a PWA and persists private-alpha state in browser storage.

The working interface name is ForgePath. It remains a private-alpha label until JB approves the final product name.

## Verify

```bash
npm run check
```

## Current architecture

- React and TypeScript
- Vite and PWA service worker
- Zustand local persistence
- Deterministic domain engine separated from UI
- Recharts for progress views
- No Supabase or AI dependency in the private alpha

## Current verification

- 31 deterministic domain tests
- lint clean
- production PWA build clean
- desktop and 390 px phone browser journeys checked
- reload persistence, survey skip paths, substitutions, partial sessions, and progress updates verified
- versioned backup export, validation, restore, malformed-file rejection, and one-step restore undo verified
- daily, weekly, rolling 28-day, calendar-month, yearly, and all-time analytics reconcile to completed source sets
- editable mesocycles generate a preview before applying and version every objective, constraint, and reason for change
- plan revisions preserve completed and partial session truth while replacing future planned work only
- version 5 backup and restore includes plan history, the correction ledger, and cycle-review decisions and safely migrates versions 1 through 4
- source-set corrections, deletions, duplicate exercise merges, and latest-change undo replay volume and validated records
- criterion-based exposure-round review supports hold, progress, extension, recovery, completion, and pivot into a new plan version without rewriting completed work

Read [docs/BUILD_REFERENCE.md](docs/BUILD_REFERENCE.md) before changing product behavior.
