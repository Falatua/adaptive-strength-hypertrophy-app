# ForgePath Private Alpha 0.6.0

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
npm run test:e2e
```

## Current architecture

- React and TypeScript
- Vite and PWA service worker
- Zustand local persistence
- Deterministic domain engine separated from UI
- Recharts for progress views
- No Supabase or AI dependency in the private alpha

## Current verification

- 49 deterministic domain tests
- four desktop and phone browser journeys for source-backed records, in-workout achievement feedback, quiet controls, persistence, console integrity, and horizontal containment
- lint clean
- production PWA build clean
- desktop and 390 px phone browser journeys checked
- reload persistence, survey skip paths, substitutions, partial sessions, and progress updates verified
- versioned backup export, validation, restore, malformed-file rejection, and one-step restore undo verified
- daily, weekly, rolling 28-day, calendar-month, yearly, and all-time analytics reconcile to completed source sets
- editable mesocycles generate a preview before applying and version every objective, constraint, and reason for change
- plan revisions preserve completed and partial session truth while replacing future planned work only
- version 6 backup and restore includes expanded record definitions, celebration preferences, plan history, the correction ledger, and cycle-review decisions and safely migrates versions 1 through 5
- source-set corrections, deletions, duplicate exercise merges, and latest-change undo replay volume and validated records
- criterion-based exposure-round review supports hold, progress, extension, recovery, completion, and pivot into a new plan version without rewriting completed work
- PR v2 separates absolute load, repetitions at load, load for repetitions, exact set schemes, estimated strength, exact-movement session volume, and workout volume
- deterministic achievement replay reveals personal records, micro wins, baselines, quality wins, return wins, and consistency without adding work to the prescription
- planned-target opportunities, provisional in-workout feedback, a source-linked Progress ledger, quiet mode, celebration level, haptics, reduced motion, and optional pixel confetti are athlete-controlled

Read [docs/BUILD_REFERENCE.md](docs/BUILD_REFERENCE.md) before changing product behavior.
