# ForgePath Private Alpha 0.72.0

ForgePath is an athlete-controlled adaptive strength and hypertrophy coach built from JB's Obsidian Build Bible. It keeps selected strength anchors progressing while allocating recoverable hypertrophy work around real time, equipment, readiness, joint response, and the training actually completed. The hosted private alpha uses Supabase as the authoritative training store; local development keeps a browser-only test mode.

Private alpha 0.72.0 makes the Plan screen calmer on phones and high-frequency schedules. Every blueprint day is independently collapsible, with Day 1 open for orientation and every later day reduced to a labeled summary of time, movements, and sets. The upcoming-session queue and the long life-aware explanation are collapsed until requested. Keyboard, touch, and screen-reader controls expose the same state, and no training plan, movement choice, completed history, Supabase contract, backup schema, or Home Gym preference changes.

The public source repository includes a [complete product-specification snapshot](docs/product/README.md) containing the Build Bible, all 463 requirements, traceability matrix, verified implementation status, cross-device and functional UX audits, hosting contract, exercise-library and recommendation specification, cloud-sync and backend specification, longitudinal product simulation audit, and pixel training-adventure specification. Obsidian remains the editable source of truth.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite. The app can be installed as a PWA and persists private-alpha state in browser storage.

The working interface name is ForgePath. It remains a private-alpha label until JB approves the final product name.

The current PWA is responsive on phone and laptop and runs an invite-only, Supabase-authoritative cloud release. The dedicated ForgePath Supabase project, checksum-locked migration ledger, forced Row Level Security, snapshot RPC, account reset, and server-only account deletion have passed live transactional and security acceptance. Public signup and anonymous data access are disabled. Invited athletes enter only their email and press `Log in with email`. A new or signed-out browser receives one private confirmation link. Opening it in the same normal browser profile, not Incognito or an email-app preview, creates a durable, automatically renewed Supabase session that survives refreshes and app updates until the athlete signs out or clears that browser's site data. Phone users may submit login and Home Screen codes with the keyboard action key, and the sixty-second send cooldown survives refreshes and browser restarts. Because iOS does not copy browser local storage into a newly installed Home Screen web app, ForgePath provides a server-mediated five-minute, single-use code after the default browser verifies the email link. An athlete already signed in in that browser can reopen the transfer page without requesting another email. The installed app redeems the code into its own durable session without copying access or refresh tokens. Rate-limit messages distinguish temporary email delivery throttling from an account lock. There is no athlete-facing password path, and knowledge of an invited address alone never creates an authenticated session. Permanent account actions require a link opened within five minutes and are independently checked by Supabase. Exact deployed-source checks, cloud save, conflict preservation, reviewed restore, old-schema snapshot migration, save-before-sign-out, and durable interrupted-save recovery are implemented. When a newer build is published, every open page checks immediately, once per minute while visible, and again after focus or reconnection. A persistent Update ready notice saves pending training changes before its refresh action and remains visible until the athlete updates. The release gate runs the complete interface suite in desktop Chromium, Android-style mobile Chromium, and an iPhone WebKit engine because iPhone Chrome uses the iOS browser platform. Automatic entity merging and active-workout handoff remain governed by [Build Bible Chapter 68](docs/product/BUILD_BIBLE.md#68-phone-laptop-and-cloud-synchronization), [Chapter 78](docs/product/BUILD_BIBLE.md#78-private-cloud-foundation-and-activation-contract), and [Chapter 80](docs/product/BUILD_BIBLE.md#80-supabase-reliability-and-release-evidence-contract).

For repeatable personal testing, You now includes a true clean-data reset. It removes every local completed set, session, plan, survey, note, record, feedback item, correction, and testing event from the current browser, then restarts onboarding. It retains only the canonical exercise catalog and equipment templates required to create a new plan. It does not alter Supabase or another browser.

The built-in exercise catalog now contains 251 canonical movements. Traps is separate from Back in Library browsing, athlete priorities, direct muscle dose, and programming, with barbell, dumbbell, trap-bar, cable, machine, chest-supported, lower-trap, and carry options. The Home Gym profile includes the Freak Athlete Hyper Pro, ABX bench, and Leg Developer as explicit capabilities. ABX chest-supported dumbbell rows, leg extensions, single-leg extensions, and lying hamstring curls are searchable and eligible for home programming. Incline presses and supported rows offer all ABX back-pad presets while retaining any 0 to 90 degree value and comparing progress only at the same recorded angle. Workout substitutions show six educated matches first and also provide a searchable full-library path. Every selected movement keeps its own exact history and receives conservative load calibration when no prior exposure exists.

## Hosted preview

Every push to the public source repository's `main` runs the deterministic checks, all desktop and mobile browser journeys, and a GitHub Pages-specific PWA build before publishing only the compiled artifact to the public `Falatua/adaptive-strength-hypertrophy-app-pages` repository. A failed gate blocks the release. The hosted preview lives at `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`.

The source repository and Pages URL are both public, but the hosted app opens only for invited private-alpha accounts. Supabase remains the system of record. The browser retains the signed-in session, account-scoped device/version metadata, and only the newest unconfirmed recovery snapshot while a cloud save is pending or interrupted. A confirmed save removes that local recovery payload. The compiled browser key is publishable and constrained by invite-only Auth, grants, and Row Level Security. GitHub project sites share their parent browser origin, so this URL remains limited to the owner-controlled test group; ForgePath requires a dedicated origin before any external athlete is invited. Automatic entity merging and active-workout handoff are not yet enabled. A real invited-athlete phone-to-laptop acceptance drill remains required before broadening the release.

## Verify

```bash
npm run check
npm run test:e2e
npm run check:pages
```

## Current architecture

- React and TypeScript
- Vite and PWA service worker
- Zustand local test persistence plus an account-scoped interrupted-save recovery outbox
- Supabase Auth and Postgres client foundation with Row Level Security migrations
- Deterministic domain engine separated from UI
- Recharts for progress views
- No AI dependency; training decisions remain deterministic and usable without Supabase

## Current verification

- deterministic domain and cloud-boundary tests, including corrupted outbox, network retry, pending-state replay, stale conflict, response tampering, and restore acceptance
- 138 desktop Chromium, Android-style mobile Chromium, and iPhone WebKit journeys covering Freak Athlete Home Gym search and ABX presets, direct exact-movement past-performance entry, editable training-block blueprints, exact angle persistence, update notification, year-scale history, cloud boundaries, authentication continuity, console integrity, and horizontal containment
- automated UI boundary QC for original game-inspired expression, the technique-video exclusion, readable typography, focus and reduced-motion support, compact mobile coverage, and required product-design context
- lint clean
- production PWA build clean
- 320 px phone, 390 px phone, 768 px tablet, 844 by 390 landscape, and 1440 px desktop layouts checked
- production Lighthouse scores: desktop 100 performance, 100 accessibility, 100 best practices; mobile 98 performance, 100 accessibility, 100 best practices
- reload persistence, survey skip paths, substitutions, partial sessions, and progress updates verified
- versioned backup export, validation, restore, malformed-file rejection, and one-step restore undo verified
- daily, weekly, rolling 28-day, calendar-month, calendar-quarter, yearly, and all-time analytics reconcile to completed source sets
- editable training blocks show the complete weekly movement map, round route, estimated duration and working sets, primary through tertiary roles, athlete-approved swaps, and exact incline setups before applying a versioned plan
- plan revisions preserve completed and partial session truth while replacing future planned work only
- version 28 backup and restore adds direct Library history provenance to athlete-approved block choices, exact-movement workout notes, entered-number provenance, source-backed dose, placement evidence, equipment profiles, plan history, ledgers, and survey evidence, and safely migrates versions 1 through 27
- placement-v3 separates experience, continuity, global movement skill, intensity tolerance, volume tolerance, schedule stability, and evidence confidence before selecting an introductory, reacclimation, bridge, base, hypertrophy, powerbuilding, strength, power, event-specific, or pain-aware cycle route
- movement-placement-v2 separately records skill, heavy-work tolerance, evidence confidence, family context, reasons, unknowns, accepted exact-history review, and an effective starting route for every protected exact movement
- placement-history-v1 summarizes only the exact movement's recent completed sets, exposure dates, source type, RIR availability, quality confirmation, latest exposure, bounded confidence and tolerance suggestions, limitations, and source-set IDs
- history suggestions never apply automatically: the athlete accepts evidence confidence or tolerance separately, any manual score change clears that field's accepted provenance, and skill, pain, recovery, or neighboring variations are never inferred
- every onboarding section is skippable; unknown inputs reduce confidence, Quick Start remains explicitly unconfirmed, and the recommendation explains why lower and higher routes were not selected
- athletes can confirm the route, choose a more conservative route, request faster submaximal verification, correct or import history, or change the goal without losing existing training data
- pain-modified placement is not treated as medical clearance and pauses automatic workout starts until the athlete reassesses the restriction state
- the first one to three productive sessions per exact protected movement can capture an optional warm-up response, the first completed primary work set, completion, effort, technique, pain, time fit, and recovery without requiring a maximum attempt
- movement-specific placement questions stay hidden until every set of that exact movement is logged, so no prompt interrupts the work it asks about; an unreached prompt stays an explicit unknown and the post-session pain answer remains an independent route to the same reassessment gate
- the opening onboarding step offers Powerlifting and Hypertrophy, pre-selects neither, and keeps history import in Library and the placement result instead of the first screen
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
- muscle-dose-v1 gives every built-in exercise a protected conservative mapping from exact overrides or catalog taxonomy, separates 1.0 direct from 0.5 secondary set credit, gives stabilizers no credit, and leaves custom or unknown movements visibly unmapped
- individual-muscle rows expose exact exercise and source-set provenance; upper, lower, arms, trunk, and whole-body parents conserve each source set at its highest child credit while cross-muscle totals remain explicitly non-additive
- custom movements can receive an optional athlete-reviewed mapping with one direct muscle and up to eight distinct secondary muscles; the review source, rule version, and timestamp survive backup, catalog edits, audit history, and one-step undo
- mapping choices are never inferred from a custom movement's body-part label, and built-in mappings remain protected product rules
- muscle-plan-dose-v1 compares mapped intended set credit with completed source sets linked to the exact stored session; repeated raw planned-set IDs remain distinct by exercise slot, unmapped plan gaps stay visible, and unlinked history remains separate
- planned muscle status is descriptive evidence only: it never labels a muscle neglected, fabricates stimulus from tonnage, or prescribes catch-up work

Read [docs/BUILD_REFERENCE.md](docs/BUILD_REFERENCE.md) before changing product behavior.
