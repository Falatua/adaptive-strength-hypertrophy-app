# ForgePath Private Alpha 0.13.0

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

- 78 deterministic domain tests
- eighteen desktop and phone browser journeys for source-backed records, in-workout achievement feedback, quiet controls, explainable substitutions, operational survey preferences, optional deferred feedback, quarterly analytics, planned-dose reconciliation, governed catalog edits, grouped duplicate cleanup, persistence, console integrity, and horizontal containment
- lint clean
- production PWA build clean
- desktop and 390 px phone browser journeys checked
- reload persistence, survey skip paths, substitutions, partial sessions, and progress updates verified
- versioned backup export, validation, restore, malformed-file rejection, and one-step restore undo verified
- daily, weekly, rolling 28-day, calendar-month, calendar-quarter, yearly, and all-time analytics reconcile to completed source sets
- editable mesocycles generate a preview before applying and version every objective, constraint, and reason for change
- plan revisions preserve completed and partial session truth while replacing future planned work only
- version 10 backup and restore includes expanded record definitions, celebration preferences, plan history, the history and catalog ledger, cycle-review decisions, the substitution-learning ledger, survey evidence, and deferred-feedback provenance and safely migrates versions 1 through 9
- source-set corrections, deletions, duplicate exercise merges, catalog edits, and latest-change undo preserve and replay the correct source state
- custom movements can be renamed and recategorized while retaining a stable canonical ID; built-in taxonomy is protected while athlete aliases remain editable
- exact name and alias collisions are blocked before save, likely related variations remain reviewable, and historical completed-set names are never silently rewritten
- exact duplicate creation requires a meaningful distinction before a separate identity can be saved
- connected duplicate pairs become one review group, allowing several accidental copies to retire into one athlete-selected canonical identity in a single reversible event
- criterion-based exposure-round review supports hold, progress, extension, recovery, completion, and pivot into a new plan version without rewriting completed work
- PR v2 separates absolute load, repetitions at load, load for repetitions, exact set schemes, estimated strength, exact-movement session volume, and workout volume
- deterministic achievement replay reveals personal records, micro wins, baselines, quality wins, return wins, and consistency without adding work to the prescription
- skipped technique or pain feedback preserves the completed number but labels it numeric-only instead of silently declaring a validated PR
- planned-target opportunities, provisional in-workout feedback, a source-linked Progress ledger, quiet mode, celebration level, haptics, reduced motion, and optional pixel confetti are athlete-controlled
- reason-aware exercise substitutions show ranked evidence, preserved purpose, tradeoffs, exact-history familiarity, and a replacement-specific prescription; protected primary anchors require explicit confirmation
- completed substitutions retain original and selected movement identities, source sets, outcomes, and available post-session feedback in a visible Library ledger
- full, quick, minimal, ask-each-time, and off preferences now govern the real pre- and post-session flow independently
- untouched, skipped, not-sure, and prefer-not responses remain explicit unknowns; only deliberate answers contribute to readiness confidence or PR quality validation
- “Remind me later” finishes and credits the workout immediately, keeps one quiet optional follow-up for 24 hours, never blocks the next session, and replays quality-dependent records only from explicit later answers
- exact-movement mix shows selected-period volume, set, repetition, session, and share evidence without relabeling tonnage as muscle stimulus or enjoyment
- completed-only priority attention distinguishes represented, outside-window, and no-history evidence without declaring a body part neglected from absence alone
- plan-versus-completed dose-v1 compares dated stored-session set targets with source sets linked to those sessions, preserves unknown planned loads, and keeps completed history with no stored plan separate instead of fabricating compliance
- region status can report below plan, within plan, above plan, unplanned completed, or no dose, but one below-plan window is never called neglect or converted into catch-up volume

Read [docs/BUILD_REFERENCE.md](docs/BUILD_REFERENCE.md) before changing product behavior.
