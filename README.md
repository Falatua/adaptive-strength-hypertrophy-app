# ForgePath Private Alpha 0.8.0

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

- 62 deterministic domain tests
- eight desktop and phone browser journeys for source-backed records, in-workout achievement feedback, quiet controls, explainable substitutions, operational survey preferences, persistence, console integrity, and horizontal containment
- lint clean
- production PWA build clean
- desktop and 390 px phone browser journeys checked
- reload persistence, survey skip paths, substitutions, partial sessions, and progress updates verified
- versioned backup export, validation, restore, malformed-file rejection, and one-step restore undo verified
- daily, weekly, rolling 28-day, calendar-month, yearly, and all-time analytics reconcile to completed source sets
- editable mesocycles generate a preview before applying and version every objective, constraint, and reason for change
- plan revisions preserve completed and partial session truth while replacing future planned work only
- version 8 backup and restore includes expanded record definitions, celebration preferences, plan history, the correction ledger, cycle-review decisions, the substitution-learning ledger, and survey evidence provenance and safely migrates versions 1 through 7
- source-set corrections, deletions, duplicate exercise merges, and latest-change undo replay volume and validated records
- criterion-based exposure-round review supports hold, progress, extension, recovery, completion, and pivot into a new plan version without rewriting completed work
- PR v2 separates absolute load, repetitions at load, load for repetitions, exact set schemes, estimated strength, exact-movement session volume, and workout volume
- deterministic achievement replay reveals personal records, micro wins, baselines, quality wins, return wins, and consistency without adding work to the prescription
- skipped technique or pain feedback preserves the completed number but labels it numeric-only instead of silently declaring a validated PR
- planned-target opportunities, provisional in-workout feedback, a source-linked Progress ledger, quiet mode, celebration level, haptics, reduced motion, and optional pixel confetti are athlete-controlled
- reason-aware exercise substitutions show ranked evidence, preserved purpose, tradeoffs, exact-history familiarity, and a replacement-specific prescription; protected primary anchors require explicit confirmation
- completed substitutions retain original and selected movement identities, source sets, outcomes, and available post-session feedback in a visible Library ledger
- full, quick, minimal, ask-each-time, and off preferences now govern the real pre- and post-session flow independently
- untouched, skipped, not-sure, and prefer-not responses remain explicit unknowns; only deliberate answers contribute to readiness confidence or PR quality validation

Read [docs/BUILD_REFERENCE.md](docs/BUILD_REFERENCE.md) before changing product behavior.
