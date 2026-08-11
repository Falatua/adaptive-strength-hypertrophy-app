# ForgePath Private Alpha 0.38.0

ForgePath is a local-first adaptive strength and hypertrophy coach built from JB's Obsidian Build Bible. It keeps selected strength anchors progressing while allocating recoverable hypertrophy work around real time, equipment, readiness, joint response, and the training actually completed.

The private repository includes a [complete product-specification snapshot](docs/product/README.md) containing the Build Bible, all 367 requirements, traceability matrix, verified implementation status, cross-device and functional UX audits, hosting contract, exercise-library and recommendation specification, cloud-sync and backend specification, and pixel training-adventure specification. Obsidian remains the editable source of truth.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite. The app can be installed as a PWA and persists private-alpha state in browser storage.

The working interface name is ForgePath. It remains a private-alpha label until JB approves the final product name.

The current PWA is responsive on phone and laptop and now contains the first authenticated cloud foundation. Until a dedicated ForgePath Supabase project is provisioned and the remote gates pass, each browser still has an independent local data store. Explicit cloud save, conflict preservation, and reviewed restore are implemented in code; automatic entity merging and workout handoff remain governed by [Build Bible Chapter 68](docs/product/BUILD_BIBLE.md#68-phone-laptop-and-cloud-synchronization) and [Chapter 78](docs/product/BUILD_BIBLE.md#78-private-cloud-foundation-and-activation-contract).

## Hosted preview

Every push to the private source repository's `main` runs the deterministic checks, all desktop and mobile browser journeys, and a GitHub Pages-specific PWA build before publishing only the compiled artifact to the public `Falatua/adaptive-strength-hypertrophy-app-pages` repository. A failed gate blocks the release. The hosted preview lives at `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`.

The Pages URL is a public preview, even though the source repository is private. Each browser keeps its own local data and receives a neutral demo seed on first use. With no dedicated Supabase project configured, the app clearly shows `Dedicated project pending` and no account or shared workout database is active. Once configured, only invited private-alpha accounts can request a sign-in link. Cross-device handoff is not yet enabled. Export a backup before clearing site data.

## Verify

```bash
npm run check
npm run test:e2e
npm run check:pages
```

## Current architecture

- React and TypeScript
- Vite and PWA service worker
- Zustand local persistence
- Supabase Auth and Postgres client foundation with Row Level Security migrations
- Deterministic domain engine separated from UI
- Recharts for progress views
- No AI dependency; training decisions remain deterministic and usable without Supabase

## Current verification

- 195 deterministic domain and cloud-boundary tests
- fifty-six desktop and phone browser journeys, including truthful cloud-project status with intact local backup, cross-destination vertical rhythm, modal typography, real Library category and filter piping, touch-safe workout reasoning, active-workout leave and resume with logged-set conservation, real next-session priority mutation, predictable destination context, first-viewport phone task actions, active-workout hierarchy, an original synthesized sound pack with persisted opt-in and quiet-mode precedence, an evidence-backed Training Field Guide, accessible route-note opening, auditable missed-opportunity rebuilding, source-backed records, linked calendar and exact exposure history, explainable athlete placement, athlete-reviewed exact-history evidence, plan-route and exact-movement criterion exits, equipment-aware route generation, productive placement verification, pain-aware start gating, validated CSV history import, in-workout achievement feedback, quiet controls, equipment-aware substitutions, operational survey preferences, optional deferred feedback, quarterly analytics, planned-dose reconciliation, individual muscle-dose provenance, governed catalog edits, grouped duplicate cleanup, location persistence, console integrity, and horizontal containment
- automated UI boundary QC for original game-inspired expression, the technique-video exclusion, readable typography, focus and reduced-motion support, compact mobile coverage, and required product-design context
- lint clean
- production PWA build clean
- 320 px phone, 390 px phone, 768 px tablet, 844 by 390 landscape, and 1440 px desktop layouts checked
- production Lighthouse scores: desktop 100 performance, 100 accessibility, 100 best practices; mobile 98 performance, 100 accessibility, 100 best practices
- reload persistence, survey skip paths, substitutions, partial sessions, and progress updates verified
- versioned backup export, validation, restore, malformed-file rejection, and one-step restore undo verified
- daily, weekly, rolling 28-day, calendar-month, calendar-quarter, yearly, and all-time analytics reconcile to completed source sets
- editable mesocycles generate a preview before applying and version every objective, constraint, and reason for change
- plan revisions preserve completed and partial session truth while replacing future planned work only
- version 24 backup and restore includes source-backed priority-region dose, missed-opportunity equipment and readiness decisions, athlete-reviewed plan-route and exact-movement criterion-exit decisions, self-contained replayable assessments, exact-history placement evidence, per-movement placement, equipment-aware route-generation snapshots, productive verification events, source-linked first-set evidence, recovery responses, equipment profiles, plan history, ledgers, survey evidence, and safely migrates versions 1 through 23
- placement-v3 separates experience, continuity, global movement skill, intensity tolerance, volume tolerance, schedule stability, and evidence confidence before selecting an introductory, reacclimation, bridge, base, hypertrophy, powerbuilding, strength, power, event-specific, or pain-aware cycle route
- movement-placement-v2 separately records skill, heavy-work tolerance, evidence confidence, family context, reasons, unknowns, accepted exact-history review, and an effective starting route for every protected exact movement
- placement-history-v1 summarizes only the exact movement's recent completed sets, exposure dates, source type, RIR availability, quality confirmation, latest exposure, bounded confidence and tolerance suggestions, limitations, and source-set IDs
- history suggestions never apply automatically: the athlete accepts evidence confidence or tolerance separately, any manual score change clears that field's accepted provenance, and skill, pain, recovery, or neighboring variations are never inferred
- every onboarding section is skippable; unknown inputs reduce confidence, Quick Start remains explicitly unconfirmed, and the recommendation explains why lower and higher routes were not selected
- athletes can confirm the route, choose a more conservative route, request faster submaximal verification, correct or import history, or change the goal without losing existing training data
- pain-modified placement is not treated as medical clearance and pauses automatic workout starts until the athlete reassesses the restriction state
- the first one to three productive sessions per exact protected movement can capture an optional warm-up response, the first completed primary work set, completion, effort, technique, pain, time fit, and recovery without requiring a maximum attempt
- placement checks resolve as route-supporting, evidence-incomplete, review-suggested, or reassessment-required; the app never silently changes the athlete's route
- placement-exit-v1 joins only productive checks from the exact placement version and matching plan route, evaluates resolved evidence, repeated support, pain boundaries, and recovery, and discloses any different movement-lane checks it excludes
- the athlete must explicitly keep the current route, open a versioned reassessment, or defer with a reason; pain-changing evidence cannot be confirmed as safe to continue and no checkpoint silently rewrites placement or programming
- movement-placement-exit-v1 independently replays only the exact movement lane's one-to-three checks, excludes every neighboring movement and plan-route shortcut, and evaluates resolved evidence, repeated support, pain boundaries, and recovery for that identity alone
- movement-placement-exit-review-v1 requires an athlete-authored keep, reassess, or defer decision; an earned lane prompt remains visible after the workout queue advances, and reassessment creates a future placement and plan version instead of mutating the current prescription
- changing a protected primary cancels that session's active check for the original exact movement; the replacement keeps its own completed history and substitution evidence, while the original movement loses neither a verification opportunity nor receives borrowed confirmation
- calendar-exposure-v1 keeps planned dates, actual completed dates, moved or stopped opportunities, exact source-set volume, imported or unlinked activity, per-movement exposure order, calendar gaps, and explicit fixed-event countdowns separate but linked
- the calendar never converts an empty day into missed-work debt, while exposure order uses only the selected canonical movement and describes load, repetition, set, or volume changes without authorizing progression
- missed-opportunity-v5 preserves equipment-safe and readiness-aware priority, then uses schedule-priority-dose-v1 only to break otherwise equal choices from completed sets across athlete-declared priority regions in a rolling 28-day window; pins, executable protected primaries, fully executable sessions, and exact-primary recency stay stronger, while no catch-up volume or neglect claim is created
- one miss may defer and time-fit the highest-value exact exposure; repeated misses rebuild the open sequence and remove optional fatigue; ongoing illness, pain, or a longer interruption requests reacclimation without diagnosing the athlete
- completed, partial, expired, and stopped sessions remain in the ledger; reported but unlogged training earns no credit; current plans move to the new date while the original missed date remains visible in Progress
- painful verification pauses the next automatic workout start, while skipped warm-up, survey, or recovery answers remain unknown and never erase completed training
- route-session-v3 lets each protected anchor use its own introductory, reacclimation, bridge, base-building, hypertrophy, powerbuilding, strength, power, or event-specific primary prescription inside the global cycle goal
- the selected anchor lane controls that session's primary, secondary, accessory, repetition, RIR, intensity, rest, warm-up, and dose rules while retaining the global plan route separately
- the selected training location filters secondary and accessory work before generation, while protected anchors remain visible with exact missing-equipment warnings instead of being silently replaced
- generated loads use the selected profile's barbell, dumbbell, cable, machine, or other increment and preserve the complete profile snapshot that shaped the queue
- onboarding rebuilds only future planned or deferred work from the selected route; completed, partial, stopped, and expired sessions retain their original plan and prescription truth
- generated sessions store the exact placement identity, route, rule version, strategy, and reasons; pain-aware placement creates no automatic queue until the athlete reassesses movement restrictions
- exact completed movement history is the first load source, an existing exact prescription is second, and an unfamiliar exact movement remains a zero-load calibration instead of borrowing a related variation's weight
- named commercial, home, travel, hotel, bodyweight, and custom training-location profiles persist exact available equipment, constraints, units, and separate barbell, dumbbell, cable, machine, and other load increments
- Today exposes equipment conflicts before starting, Workout blocks unavailable logging until the athlete substitutes, and Library can filter by active-location availability with exact missing-item explanations
- substitution candidates are filtered against the active profile, chosen replacements retain the location in their evidence ledger, and workout-start targets round to real executable load jumps
- source-set corrections, deletions, duplicate exercise merges, catalog edits, and latest-change undo preserve and replay the correct source state
- custom movements can be renamed and recategorized while retaining a stable canonical ID; built-in taxonomy is protected while athlete aliases remain editable
- exact name and alias collisions are blocked before save, likely related variations remain reviewable, and historical completed-set names are never silently rewritten
- exact duplicate creation requires a meaningful distinction before a separate identity can be saved
- connected duplicate pairs become one review group, allowing several accidental copies to retire into one athlete-selected canonical identity in a single reversible event
- completed-history CSV import previews every row, auto-maps only exact names or aliases, requires athlete review of uncertain identities, converts units visibly, preserves source provenance, skips occurrence-aware re-import duplicates, keeps imported quality unverified, and supports one-step undo
- criterion-based exposure-round review supports hold, progress, extension, recovery, completion, and pivot into a new plan version without rewriting completed work
- PR v2 separates absolute load, repetitions at load, load for repetitions, exact set schemes, estimated strength, exact-movement session volume, and workout volume
- deterministic achievement replay reveals personal records, micro wins, baselines, quality wins, return wins, and consistency without adding work to the prescription
- skipped technique or pain feedback preserves the completed number but labels it numeric-only instead of silently declaring a validated PR
- planned-target opportunities, provisional in-workout feedback, a source-linked Progress ledger, quiet mode, celebration level, haptics, reduced motion, optional pixel confetti, and original low-volume synthesized cues are athlete-controlled
- reason-aware exercise substitutions show ranked evidence, preserved purpose, tradeoffs, exact-history familiarity, and a replacement-specific prescription; protected primary anchors require explicit confirmation
- completed substitutions retain original and selected movement identities, source sets, outcomes, and available post-session feedback in a visible Library ledger
- full, quick, minimal, ask-each-time, and off preferences now govern the real pre- and post-session flow independently
- untouched, skipped, not-sure, and prefer-not responses remain explicit unknowns; only deliberate answers contribute to readiness confidence or PR quality validation
- “Remind me later” finishes and credits the workout immediately, keeps one quiet optional follow-up for 24 hours, never blocks the next session, and replays quality-dependent records only from explicit later answers
- exact-movement mix shows selected-period volume, set, repetition, session, and share evidence without relabeling tonnage as muscle stimulus or enjoyment
- completed-only priority attention distinguishes represented, outside-window, and no-history evidence without declaring a body part neglected from absence alone
- plan-versus-completed dose-v1 compares dated stored-session set targets with source sets linked to those sessions, preserves unknown planned loads, and keeps completed history with no stored plan separate instead of fabricating compliance
- region status can report below plan, within plan, above plan, unplanned completed, or no dose, but one below-plan window is never called neglect or converted into catch-up volume
- muscle-dose-v1 gives every built-in exercise an explicit conservative mapping, separates 1.0 direct from 0.5 secondary set credit, gives stabilizers no credit, and leaves custom or unknown movements visibly unmapped
- individual-muscle rows expose exact exercise and source-set provenance; upper, lower, arms, trunk, and whole-body parents conserve each source set at its highest child credit while cross-muscle totals remain explicitly non-additive
- custom movements can receive an optional athlete-reviewed mapping with one direct muscle and up to eight distinct secondary muscles; the review source, rule version, and timestamp survive backup, catalog edits, audit history, and one-step undo
- mapping choices are never inferred from a custom movement's body-part label, and built-in mappings remain protected product rules
- muscle-plan-dose-v1 compares mapped intended set credit with completed source sets linked to the exact stored session; repeated raw planned-set IDs remain distinct by exercise slot, unmapped plan gaps stay visible, and unlinked history remains separate
- planned muscle status is descriptive evidence only: it never labels a muscle neglected, fabricates stimulus from tonnage, or prescribes catch-up work

Read [docs/BUILD_REFERENCE.md](docs/BUILD_REFERENCE.md) before changing product behavior.
