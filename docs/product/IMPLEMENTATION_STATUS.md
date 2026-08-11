---
type: implementation-status
aliases: [ForgePath Private Alpha, Adaptive Training App Private Alpha]
tags: [fitness, app, private-alpha, implementation, qa]
created: 2026-08-10
updated: 2026-08-11
status: working-private-alpha
app_version: 0.40.0
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: verified
---

# Private Alpha Implementation 2026-08-10

## Outcome

A working private, local-first application now exists at `/Users/redsky/Projects/adaptive-strength-hypertrophy-app`. Its provisional interface name is **ForgePath Private Alpha**. The name is not final product approval.

The code is preserved in the public GitHub source repository `Falatua/adaptive-strength-hypertrophy-app`. Releases 0.1.0 through 0.34.0 remain in Git history. Private alpha 0.30.0 is commit `b204c54342a08366f8026e305171993ffb27aee7` and adds fresh readiness evidence without penalizing missing or stale answers. Private alpha 0.31.0 feature commit `06336129e7c2952e4645e088fbc0b4c8479208cf` adds source-backed relative priority-region dose as a bounded schedule tie-break. Private alpha 0.32.0 feature commit `035e175` adds context-grounded product and design registers, the evidence-backed Today Training Field Guide, post-onboarding focus handoff, and automated UI boundaries. Private alpha 0.33.0 adds the original `field-guide-synth-v1` runtime sound pack. Private alpha 0.34.0 feature commit `2f469b4ef237092ab5a8687d2fdd03626ab55194` adds the cross-device UX task-focus corrections recorded in [[UX Audit 2026-08-10]]. Private alpha 0.35.0 feature commit `900010570c60981b2b2beeb58cf31f66b754ee37` adds the functional UX corrections recorded in [[Functional UX Audit 2026-08-10]]. Private alpha 0.36.0 feature commits `8257a8b6b0e94eaf6a0eefb4cf78302fee8335dc` and `888b5d8669d8106455a76d4e96df5f4d34da9a30` add the automatic private-source-to-public-artifact Pages release, exact subpath PWA behavior, neutral visitor seed, and stable 390 by 844 mobile gate recorded in [[GitHub Pages Deployment 2026-08-10]]. Private alpha 0.37.0 standardizes readable vertical rhythm across headers, subheaders, supporting text, cards, and dialogs on phone and laptop. The first complete GitHub specification mirror is commit `20cf4298870a11608ddc69642c52c4a1c1b2867f`; later specification commits keep `docs/product/` aligned with implementation. The latest remote identity is recorded in [[Adaptive Strength and Hypertrophy App]] and [[Codex Session Log]].

Private alpha 0.40.0 adds a 154-movement built-in catalog and searchable full-library workout substitutions, including a verified squat-to-leg-press path, while preserving the clean testing reset, exact-movement notes, and complete-state snapshot path. The dedicated remote ForgePath project remains invite-only with public signup disabled. Full automatic cross-device synchronization remains incomplete.

## Private Alpha 0.40.0 Exercise Library and Substitution Delta

- Expanded the built-in catalog from 22 to 154 original canonical movements across all eight movement patterns and all tracked body regions.
- Added 45-degree, horizontal, and single-leg leg press identities; `Leg Press` resolves to the 45-degree canonical movement without splitting history.
- Added a `Best matches` fast path and searchable `Browse full library` path inside every workout replacement dialog.
- Search covers names, aliases, families, movement patterns, body regions, role tags, and equipment while preserving active equipment and joint-avoid constraints.
- Advanced local persistence to 24 so existing browsers gain new system exercises and seeded equipment without losing favorites, joint response, personal aliases, custom movements, or athlete-owned equipment profiles.
- Kept backup schema 25 because the restorable state shape is unchanged.
- Added deterministic catalog, migration, muscle-dose, substitution, desktop, and phone tests, including protected-primary confirmation and zero-load conservative leg-press calibration.

## Private Alpha 0.39.2 Clean Testing Reset Delta

- Replaced the prior reset behavior that restored 238 seeded completed sets with an explicit current-browser clean slate.
- Removes sessions, completed sets, plans, surveys, notes, feedback, records, corrections, reviews, substitutions, placement evidence, missed-opportunity events, active identities, and the local recovery snapshot.
- Retains the canonical exercise catalog and default equipment templates so onboarding can generate a new plan.
- Adds destructive confirmation copy, recommends export first, restarts onboarding, and never contacts Supabase.
- Adds a dedicated browser journey that proves every training collection is empty after reset while catalog and equipment foundations remain available.
- Passes 210 deterministic tests and all sixty desktop and phone browser journeys.

## Private Alpha 0.39.1 Cloud Reliability Delta

- Repaired the missing Supabase CLI migration ledger from the exact committed SQL and verified both remote statement payloads against SHA-256 checksums.
- Added a committed migration manifest, a six-check read-only production acceptance audit, and a nine-check rolled-back authenticated sync and isolation drill.
- Verified the transactional drill left zero test users, devices, events, or snapshots.
- Disabled public signup and verified the setting persisted after a hard reload. No athlete was invited because an exact approved email was not supplied.
- Replaced permissive project URL and key checks with canonical Supabase project-origin validation and browser-safe modern or legacy key validation.
- Added a typed browser database contract, strict outbox-envelope validation, strict RPC status/version/event validation, durable network retry behavior, conflict retention, idempotent replay, and session-start failure handling.
- Kept cloud behavior explicitly manual: save a complete validated checkpoint, check it on another signed-in device, and choose restore. Automatic entity merge and active-workout handoff remain off.
- Kept backup schema 25 and local persistence 23 because the restorable state shape did not change.
- Verified 210 deterministic tests across twenty-two files, all fifty-eight desktop and phone browser journeys, focused live cloud-boundary checks, lint, production and Pages builds, zero high production dependency vulnerabilities, and no secret findings.
- Published private source `42f0eec63ae21f595d0be889004f559a0e07b632` through successful source workflow `31507800273`, public artifact `32d20faf486c6ecbf41523d8de703bbfc15bcf2a`, and successful Pages workflow `31508592285`.
- Verified the live source identity, HTTP 200 root, closed cloud gate, omitted Supabase endpoint, working local backup, 0.39.1 diagnostics, zero browser errors, and zero horizontal overflow on fresh desktop and 390 by 844 phone contexts.

This build turns the [[Adaptive Strength and Hypertrophy App Build Bible]] into a usable end-to-end browser and installable PWA experience. It is governed by the full requirement register but implements a bounded first slice. Automatic entity-level cloud convergence, AI, social, and advanced longitudinal work must not be represented as complete.

## Build Bible 1.46.0 Specification Delta

- Expanded the unimplemented companion concept from three forms to four permanent Starting, Developed, Champion, and Apex forms.
- Added continued post-apex mastery levels, cosmetics, environment development, journal emblems, and bounded celebration milestones so long-term progression does not stop at the fourth form.
- Added strict originality boundaries around Gigantamax, G-Max, Dynamax, Machamp, giant-form silhouettes, signature clouds or energy, battle mechanics, sounds, camera language, and interface terminology.
- Kept app version 0.39.0, backup schema 25, and local persistence 23 unchanged because companion code, XP economy, original assets, and animations remain unimplemented.

## Build Bible 1.48.0 Cloud Reliability Delta

- Added the migration-history, checksum, live audit, rollback, typed-contract, outbox, and release-gate requirements in Chapter 80 and R-377 through R-383.
- Recorded public signup as disabled and the nine transactional identity, RLS, replay, conflict, and isolation assertions as verified live.
- Preserved the distinction between the proven manual snapshot bridge and unimplemented automatic entity synchronization.

## Build Bible 1.47.0 Backend Activation Delta

- Activated dedicated project `ForgePath` at project reference `kdavpkphvapnckenbuyg` in AWS `us-east-2`, connected to public source repository `Falatua/adaptive-strength-hypertrophy-app`.
- Applied both committed migrations transactionally without reading or storing a database password or privileged key.
- Added nine normalized training tables for entity events, cursors, exercises, sessions, movements, sets, notes, survey instances, and survey answers alongside the five-table snapshot foundation.
- Added security-invoker source-set facts and daily, weekly, monthly, and yearly volume rollups using normalized load times repetitions, with total and exclusive primary-region scopes.
- Verified fourteen of fourteen tables with forced Row Level Security, zero anonymous grants, zero normalized browser mutation grants, eighteen authenticated ownership policies, two views, and one snapshot RPC.
- Configured the Pages Site URL, three allowed redirects, the private repository's browser-safe Supabase Actions secrets, and an unset release switch that prevents Pages from compiling them before invite-only Auth is verified.
- Kept app version 0.39.0, backup schema 25, and local persistence 23 unchanged. The normalized tables are not yet client-written, and automatic entity sync, invite acceptance, two-account isolation, and phone-laptop handoff remain incomplete.

## Private Alpha 0.39.0 Release Delta

- Added `movement-note-v1`, one optional autosaving note per exact session, planned movement slot, and canonical exercise.
- Added in-workout recall of the most recent earlier note with date, session, and microcycle context.
- Added a newest-first Movement Notebook and total note count to exact Exercise Library detail.
- Kept notes independent after substitution and preserved original exercise identity through duplicate merge and undo.
- Added a 1,000-character validation boundary. Notes are athlete-authored context and cannot silently change load, repetitions, sets, volume, clearance, or records.
- Advanced backup schema from 24 to 25 and local persistence from 22 to 23. Version 24 migration creates no fictional note history, and the complete cloud bootstrap snapshot includes the validated note collection.
- Verified 201 deterministic tests across twenty-two files and all fifty-eight desktop and phone browser journeys before release.
- Published private source commit `22f1d0b30450a8fd1ec964bf9d536a9e07f95a24` through successful private workflow `31462496701`, compiled-artifact commit `4e1994f89fcd18ba937a76ca985f5959c8dad78a`, and successful public Pages workflow `31462938374`.
- Verified that live `source-version.txt` matched the feature source. Fresh desktop and 390 by 844 phone sessions completed the exact note autosave and Library recall path with zero browser errors and no horizontal overflow.

## Private Alpha 0.38.0 Release Delta

- Reconciled the active implementation against Build Bible Chapters 19 through 24 and 68, then added R-362 through R-367 and Chapter 78 for the first backend slice.
- Added a version-controlled Supabase foundation with five tables covering private profiles, devices, append-only sync events, the current bootstrap snapshot, and preserved conflicts.
- Enabled and forced Row Level Security on every table, revoked anonymous access, limited athlete access through authenticated ownership, and denied direct browser mutation of events, snapshots, and conflicts.
- Added an authenticated, per-athlete serialized save function with device registration, payload and checksum validation, exact-retry idempotency, event-ID tamper rejection, and stale-version conflict preservation.
- Added invite-only email-link sign-in, a stable local device ID, device sequence, retry outbox, confirmed cloud version metadata, explicit save, validated cloud review, and athlete-confirmed restore through the existing local undo path.
- Added truthful `Dedicated project pending` behavior when browser configuration is absent. Automatic merge, hydration, revocation UI, and workout handoff remain off.
- Added `SUPABASE_BACKEND_RUNBOOK.md`, a browser-safe environment template, GitHub Actions configuration hooks, and a backend quality check in the standard release gate.
- Confirmed in the signed-in Supabase dashboard that Falatua's Org is limited to two active free projects and currently contains JB-OS and Roman TD Global Leaderboard. Neither project was modified.
- Advanced app, rules, README, backup application metadata, and documentation to 0.38.0 while preserving backup schema 24 and local persistence 22.
- Verified 195 deterministic tests across twenty-one files, the five-table Row Level Security and sync-function static boundary, all fifty-six desktop and phone browser journeys, and the local Pages artifact.
- Published private source commit `fb8cc2680a38ea71f935d1de3801f1f6d91a7018` through successful private workflow `31460513415`, compiled-artifact commit `961cd407e0d2597603f594575f714723e2414af9`, and successful public Pages workflow `31460913708`.
- Verified that the live `source-version.txt` exactly matched `fb8cc2680a38ea71f935d1de3801f1f6d91a7018`. Fresh desktop and 390 by 844 phone sessions completed Quick Start, opened You, rendered the honest pending-project cloud state, retained local backup/recovery, showed 0.38.0 diagnostics, produced zero browser errors, and had no horizontal overflow.

## Private Alpha 0.37.0 Release Delta

- Added a shared four-pixel-derived spacing scale and applied it to display headings, section headings, labels, supporting text, screen headers, panels, hero blocks, nested cards, and dialogs.
- Increased heading line heights so multiline phone titles remain readable without losing the compact handheld character of the interface.
- Corrected compact component overrides that had reduced title-to-copy separation to two through seven pixels.
- Preserved the primary Today action above the first phone viewport and retained the existing desktop information density.
- Added two cross-device browser journeys that inspect every main destination and the pre-session dialog for minimum heading line-height and text-gap contracts.
- Advanced app, rules, README, backup metadata, and documentation to 0.37.0 while preserving backup schema 24 and local persistence 22.
- Verified the redesigned rhythm visually across phone and desktop before the release gate.
- Verified source feature commit `1195180d11e4b2ddf8de98fc9eb8cef64226d00a` through private workflow `31457517568`, public artifact commit `875d343c23e3ddc7cf92b3ba6dab8827780e47ef`, and public Pages workflow `31457920808`.
- Verified the unauthenticated live site on phone and desktop with every primary destination at or above the spacing contract, the phone start action fully above fixed navigation, and zero browser console errors or warnings.

## Private Alpha 0.36.0 Release Delta

- Added `.github/workflows/deploy-pages.yml` so every push to private source `main` runs the full release gate and automatically publishes the exact passing compiled artifact to public repository `Falatua/adaptive-strength-hypertrophy-app-pages` through a repository-scoped deploy key.
- Added a project-subpath-aware PWA build for `/adaptive-strength-hypertrophy-app-pages/` and a generated-artifact check covering compiled assets, favicon, manifest start URL and scope, and service-worker navigation fallback.
- Preserved the private source repository. The public artifact repository receives no source, tests, Build Bible files, or vault material.
- Replaced the fresh JB-named seed with a neutral Demo Athlete seed. Existing persisted browser state and backup compatibility remain unchanged.
- Advanced app, rules, README, and backup metadata to 0.36.0 while preserving backup schema 24 and local persistence 22.
- Added explicit documentation that Pages does not provide authentication, cloud sync, cross-device handoff, shared storage, or private access control.
- Added extra first-viewport space around the 390 by 844 phone start action and made the CI phone viewport exact after the first cloud run exposed a font and runner-sensitive fold boundary.
- Live workflow and mobile and desktop evidence are recorded in [[GitHub Pages Deployment 2026-08-10]].
- Verified private-source workflow `31455623333`, compiled-artifact commit `4b7c3c432ff323c24dd7f115a51793955857f885`, public Pages workflow `31456005382`, and the live unauthenticated URL with matching source identity and zero browser console errors.

## Private Alpha 0.35.0 Release Delta

- Audited 135 button definitions and removed the last handlerless or simulated-success controls from the implemented product boundary.
- Replaced Library placeholder category notices with real body-part, pattern, role, equipment, and preferred-movement filtering. `My movements` now returns the sixteen preferred canonical exercises rather than an unsupported empty query.
- Added expandable filter semantics, pressed states, clear-all behavior, and compact touch-target hardening.
- Replaced hover-only in-workout progression detail with a native touch and keyboard dialog that discloses decision, action, confidence, explanation, and authority boundary.
- Added active-workout leave and resume without restarting, recompressing, or losing logged sets and verification state.
- Made Plan pinning reorder the real unresolved queue and disabled false pin actions on the active session.
- Aligned package, diagnostics, visible rules, README, and backup export metadata at 0.35.0 while preserving backup schema 24 and local persistence 22.
- Verified 191 deterministic tests across twenty files and fifty-two desktop and phone Playwright journeys.
- Verified zero horizontal overflow across Today, Plan, Progress, Library, and You at 320 by 568, 393 by 851, 768 by 1024, 844 by 390, and 1440 by 900.
- Verified production Lighthouse at desktop 100 performance, 100 accessibility, 100 best practices and mobile 98 performance, 100 accessibility, 100 best practices. Dependency and secret scans found zero vulnerabilities or leaks.

## Private Alpha 0.34.0 Release Delta

- Reconciled JB's `hypertrophy-app-requirements.md` into R-331 through R-340 and Chapter 72. The five-to-ten repetition failure loop is specified as a selectable hypertrophy policy, not activated as a universal rule.
- Added destination scroll reset and main-region focus on every primary-navigation change so Progress, Library, and other screens cannot inherit a prior screen's position.
- Corrected onboarding with a real main landmark, a valid skip-link target, and a four-step accessible progressbar.
- Made transient notices atomic, dismissible, ten-second statuses and moved them to the top of compact screens so bottom navigation and workout actions remain clear.
- Shortened the Today hero objective to its exact anchor and immediate progression decision while keeping full reasoning on demand. The primary start action remains in the initial 390 by 844 viewport.
- Reordered Library so movement discovery precedes placement calibration. Compact screens use a single-row action group, horizontal category strip, and first-viewport search and filters.
- Hid repeated workout-objective prose on phones, enlarged warm-up response targets, disclosed completed-set progress in the footer, and kept Finish visually secondary until every planned set is complete.
- Replaced progress-bar width animation with a compositor-friendly horizontal transform.
- Verified 191 deterministic tests across twenty files and forty-eight desktop and phone browser journeys. The production, accessibility, performance, security, and final visual gates are recorded in [[UX Audit 2026-08-10]].
- Published feature commit `2f469b4ef237092ab5a8687d2fdd03626ab55194` to private GitHub `main` and verified the local, tracking, and remote identities matched.

## Private Alpha 0.33.0 Release Delta

- Added `field-guide-synth-v1`, six original runtime-synthesized cues for sound opt-in, workout start, set completion, earned achievement, workout completion, and pain-aware warning.
- Added a pre-opt-in sound preview and persisted sound preference under Achievement controls. Quiet mode has absolute precedence, disables preview, and changes no workout, record, achievement, or progression data.
- Used the local Web Audio API with no downloaded recordings, bundled audio assets, remote requests, or third-party audio package. Unsupported or blocked audio fails silently while the underlying action completes.
- Added semantic guards so set sound occurs only on incomplete-to-complete transition, earned achievement sound respects the celebration controls, finish cues follow explicit completion paths, and pain audio remains distinct from rewards.
- Added deterministic checks for the complete cue inventory, duration under 700 milliseconds, frequency range, maximum programmed gain, silent default, and quiet-mode suppression.
- Verified 191 deterministic tests across twenty files, the sixty-four-file UI boundary gate, a clean production PWA build, and the existing forty-six desktop and phone browser journeys with persisted sound-plus-quiet control coverage.

## Private Alpha 0.32.0 Release Delta

- Added repository-local `PRODUCT.md`, `DESIGN.md`, and `DESIGN.json` registers grounded in JB's athlete profile, UX and game-development background, quality expectations, original handheld-adventure preferences, accessibility needs, and product anti-references.
- Replaced the decorative Today quest line with an accessible Training Field Guide that shows the current route, the engine-derived next progression target, decision confidence, exact source-set count, and a direct action into the existing explanation.
- Kept the field guide as a read-only projection of deterministic route and progression rules. It cannot change the workout, award progress, borrow movement history, or hide safety and uncertainty.
- Added `npm run qc:ui` to the standard `npm run check` gate. It scans the shipped interface for copied game references, technique-video product surfaces, gradient text, thick decorative side stripes, and missing focus, reduced-motion, compact-mobile, or product-context foundations.
- Converted six existing thick side-stripe callouts to restrained full boundaries and corrected the focus handoff from onboarding into the main training view.
- Verified 189 deterministic tests across nineteen files, a clean production PWA build, the sixty-two-file UI boundary gate, and two new browser runs for the Training Field Guide across desktop Chromium and the 390 by 844 phone project. Full browser coverage is now forty-six journeys.
- Full-resolution phone review confirmed readable route, next-win, and evidence rows, the 44-pixel route-notes control, deliberate pixel-world integration, and horizontal containment.

## Private Alpha 0.31.0 Release Delta

- Added `missed-opportunity-v5` with nested `schedule-priority-dose-v1` evidence.
- The engine uses only completed source sets inside an inclusive rolling 28-day window and classifies each set once through its stored broad primary region.
- Relative gap is measured only among the athlete's declared priority regions. It is the difference from the most represented declared priority region, not a target-dose deficit or neglect label.
- The ranking hierarchy is explicit: athlete pin, protected-primary eligibility, fully executable session, exact-primary recency, relative priority-dose gap, planned date, then original queue order.
- Support work already removed for equipment or joint-response reasons cannot create candidate coverage. Planned priority-set count is stored for inspection but does not multiply the score.
- The rule can change only an otherwise equal queue choice. It cannot add work, award exposure, change progression, override a pin, rescue an unavailable primary, or outrank exact-primary recency.
- Today shows selected region, score, and applied versus reviewed state. Plan preserves the full rolling-window reason. The missed-opportunity modal states the stronger-factor and no-catch-up boundaries.
- Backup schema 24 and local persistence 22 preserve the full window, region points, candidate coverage, selected evidence, and source-set IDs. Version 23 migration preserves version 4 readiness decisions without inventing dose history.
- Restore rejects malformed windows, mismatched counts, duplicate, missing, wrong-region, or out-of-window source sets, invalid candidate scores, forged selected evidence, and any claim that dose overrode an athlete pin.
- Verification passed 189 deterministic tests across nineteen files, all forty-four desktop and phone Playwright journeys, full-resolution 390 by 844 visual review, production PWA build, dependency audit with zero vulnerabilities, Gitleaks, and diff whitespace validation.

## Private Alpha 0.30.0 Release Delta

- Added `missed-opportunity-v4` and `schedule-readiness-v1` with source survey, capture time, decision age, freshness, source and effective outcomes, bounded action, and plain-language reason.
- Limited readiness authority to explicit answered pre-session evidence for the missed session that is no more than 24 hours old.
- Made missing, skipped, unanswered, future-dated, and stale readiness explicitly unknown with no adherence, access, or programming penalty.
- Mapped fresh normal evidence to proceed, mixed evidence to warm-up confirmation, protective evidence to optional-fatigue removal, reacclimation evidence to returning review, and pain-aware evidence to a pre-mutation block.
- Preserved warm-up and first-set confirmation authority. A single non-pain adverse signal does not automatically reduce the session.
- Added the 24-hour rule to the missed-opportunity modal, a readiness evidence fact to Today, and full freshness and reason replay to Plan.
- Advanced backup schema to version 23 and local persistence to version 21. Version 22 migration preserves version 3 equipment decisions and invents no readiness history. Restore validates source-survey identity and rejects forged freshness or action evidence.
- Verification passed: lint, 186 deterministic tests across nineteen files, production TypeScript and PWA build, and forty-four Playwright journeys across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the missed-opportunity check-in, Today readiness proof, and Plan audit with no horizontal overflow.
- Security passed: dependency audit reported zero vulnerabilities; full-repository and staged-content Gitleaks found no leaks; diff whitespace validation passed.
- Delivery passed: commit `b204c54342a08366f8026e305171993ffb27aee7` is on private repository `main`; local and remote identities match and the worktree is clean.
- Current boundary: readiness does not yet use personal baselines, repeat-signal reliability, wearable evidence, warm-up velocity, or local-versus-systemic fatigue classification. Muscle-dose gaps, fixed-event pressure, downstream fatigue, cloud, AI, and social remain deferred.

## Private Alpha 0.29.0 Release Delta

- Added `missed-opportunity-v3` and `schedule-eligibility-v1` with the selected equipment profile, every open-session eligibility result, protected-primary status, support-review count, reasons, and exact removed movement identities.
- Required an executable known protected primary at the active location. A primary missing required equipment or marked irritating or avoid cannot lead.
- Ranked fully executable sessions before eligible sessions that need support removal, then retained exact completed-exposure recency, planned time, and source order.
- Preserved the athlete pin only when the pinned protected primary is eligible. An invalid pin rejects with the exact equipment or joint-response reason and does not silently choose something else.
- Removed unavailable, unknown, irritating, or avoid-rated support work from the first session before time compression. The protected primary remains intact and later compression reasons remain causally separate.
- Paused automatic rebuilding when pain-aware placement, modifying pain input, or unresolved verification changes what can be trained. The app creates no missed-opportunity event and does not imply medical clearance.
- Added the active location and removal count to Today, exact removed movement names to Plan, and readiness or support-change labels to the session picker.
- Advanced backup schema to version 22 and local persistence to version 20. Version 21 migration preserves version 2 pins and invents no version 3 eligibility evidence. Restore cross-validates the stored equipment profile and rejects malformed or forged candidate evidence.
- Verification passed: lint, 183 deterministic tests across nineteen files, production TypeScript and PWA build, and forty-four Playwright journeys across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the location-aware selector, rebuild proof, and Plan replay. Completed source sets remain `238 -> 238`, open planned sets remain non-increasing, and exact removed support movements remain legible without horizontal overflow.
- Security passed: dependency audit reported zero vulnerabilities; Gitleaks found no leaks across the full repository; diff whitespace validation passed.
- Delivery passed: commit `6f46bd4680e60b14a221fac0f93426dc2718e117` is on private repository `main`; local and remote identities match and the worktree is clean.
- Current boundary: current readiness, muscle-dose gaps, fixed-event pressure, downstream fatigue, and full later-session substitution do not yet participate in schedule priority. Cloud, AI, and social remain deferred.

## Private Alpha 0.28.0 Release Delta

- Added `missed-opportunity-v2` with an optional athlete-selected first session.
- Kept completed exact-exposure recency as the default and as the ordering rule for every remaining session after a pin.
- Rejected stale, terminal, unknown, or forged preferences without mutating the plan.
- Added plain-language proof that the athlete pinned the first choice and that exact exposure still orders the remainder.
- Advanced backup schema to version 21 and local persistence to version 19. Version 20 migration preserves version 1 events and invents no priority selection.
- Verification passed: lint, 180 deterministic tests across nineteen files, production TypeScript and PWA build, and forty-four Playwright journeys across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the version 2 proof card and complete schedule audit without horizontal overflow.
- Security passed: dependency audit reported zero vulnerabilities; explicit secret-pattern scanning, staged-content Gitleaks, full-directory Gitleaks, and repository-history Gitleaks found no leaks. Diff whitespace validation passed.
- Delivery passed: commit `19c374efd9d5951da1d296aeac7cc90d35a04943` is on private repository `main`; local and remote identities match and the worktree is clean.
- Current boundary: starting the pinned session still relies on the existing pain and equipment gates. The queue itself does not yet reject or substitute a pinned session for those constraints, and broader priority factors remain incomplete.

## Private Alpha 0.27.0 Release Delta

- Added `missed-opportunity-v1`, a durable decision event that stores all athlete inputs, source identities, continuity, decision mode, queue before and after, exact-primary exposure evidence, per-session changes, preserved terminal sessions, and completed and planned set conservation.
- Added a five-fact Today check-in for training outcome, reason, next realistic opportunity, available minutes, and whether the constraint ended, continues, or is uncertain. Optional context remains optional and different unlogged training receives no credit until logged or imported.
- Replaced the unsafe active-session-only deferral helper with a deterministic full-ledger rebuild. Completed, partial, stopped, and expired sessions remain unchanged while only planned or deferred sessions can move.
- Added exact-primary overdue ordering without family borrowing, next-session time compression, repeated-miss rebuilding, optional-fatigue removal for repeated or ongoing disruption, and conservative reacclimation review for longer or health-related interruptions.
- Added hard no-catch-up rules. Completed source-set count must remain identical and aggregate open planned sets cannot increase.
- Added persistent evidence in Today, an auditable queue change in Plan, and the original missed opportunity plus new planned date in the Progress calendar.
- Added backup schema version 20 and local persistence version 18. Schema 19 migrates with an empty event ledger and invents no missed-workout history. Restore validates event identity, inputs, dates, references, replay arrays, completed-set conservation, and catch-up-volume prohibition even after an outer checksum is recomputed.
- Verification passed: lint, 177 deterministic tests across nineteen files, production TypeScript and PWA build, and forty-four Playwright journeys across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the missed-opportunity check-in, Today rebuild proof, Plan audit, and original-date calendar evidence with no horizontal overflow.
- Security passed: dependency audit reported zero vulnerabilities; explicit secret-pattern scanning, staged-content Gitleaks, full-directory Gitleaks, and repository-history Gitleaks found no leaks. Diff whitespace validation passed.
- Delivery passed: commit `117295fe29e769bcbd6f9cf20e9ec2d22be3b20a` is on private repository `main`; local and remote identities match and the worktree is clean.
- Current boundary: queue ranking does not yet combine muscle-dose gaps, current readiness and pain state, active equipment, fixed-event compression, downstream fatigue, preference, or manual pinning. Outside training must still be logged or imported. Cloud, AI, and social remain deferred.

## Private Alpha 0.26.0 Release Delta

- Added deterministic `calendar-exposure-v1` as a derived read model over existing canonical sessions, completed source sets, exact exercise IDs, and the athlete-authored fixed-event input.
- Added a Sunday-first forty-two-cell monthly calendar with previous, next, and current-month controls; planned opportunity, completion, and moved-state markers; selected-date detail; plan-to-actual drift; exact set, repetition, and volume totals; and explicit imported or unlinked completion.
- Added exact canonical exercise exposure order grouped by session with chronological sequence, calendar-day gap, completed sets, repetitions, volume load, heaviest load, maximum repetitions at the heaviest load, Epley estimate, average RIR, quality-confirmed count, source-set IDs, and imported status.
- Added descriptive load, repetition, set, volume, held, and mixed change labels. These labels have no prescription, PR, readiness, or progression authority.
- Added fixed-event states for missing, unparsed or invalid, upcoming, today, and past dates. Only an athlete-authored valid ISO `YYYY-MM-DD` date enables the countdown, and the date never changes completed-exposure order.
- Added explicit guardrails: family movements and neighboring variations are not borrowed; empty dates create no missed-work debt; calendar gaps do not become fake completed weeks, automatic progression, or catch-up volume.
- Kept backup schema version 19 and local persistence version 17 unchanged because the feature replays from already governed data and creates no second history store.
- Added six deterministic timeline tests and one new desktop-plus-phone journey. Verification passed: lint, 168 deterministic tests across eighteen files, production TypeScript and PWA build, and forty-two Playwright journeys across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for both calendar and exposure-order axes with readable metrics, intact date cells, and no horizontal overflow.
- Security passed: dependency audit reported zero vulnerabilities; explicit secret-pattern scanning, repository-history Gitleaks, and full-directory Gitleaks found no leaks. Diff whitespace validation passed.
- Current boundary: this is visibility and replay, not calendar editing or scheduling authority. Automatic missed-workout replanning, compliance scoring, future-event pathway compression, macrocycle and annual timeline editing, cloud sync, social calendars, and AI-generated prescriptions remain deferred.

## Private Alpha 0.25.1 Release Delta

- Added a pure primary-substitution cancellation rule that removes only the active placement check matching the current placement identity and session.
- Prevented a replacement movement's first completed set from confirming, reviewing, or consuming quota in the original protected movement lane.
- Preserved the replacement movement's completed history, conservative or exact-history prescription, durable substitution outcome, source-set IDs, and `originalExerciseId` provenance.
- Preserved the original movement as substituted with a frozen exact progression clock. Resolved checks, other sessions, other movement lanes, and non-primary substitution behavior remain unchanged.
- Added an accessible active-workout message naming the cancelled original lane and confirming that replacement history still counts.
- Kept `placement-verification-v1`, backup schema version 19, and local persistence version 17 unchanged. The patch prevents invalid evidence before it enters the persisted replay contracts.
- Added two deterministic cancellation tests and strengthened the protected-primary desktop and phone journey to prove the check exists before substitution, disappears after substitution, and cannot borrow the replacement set.
- Verification passed: lint, 162 deterministic tests across seventeen files, production TypeScript and PWA build, and forty desktop and 390 by 844 phone Playwright journeys.
- Full-resolution phone review passed for the exact-check cancellation message and the unchanged workout flow with no horizontal overflow.
- Security passed: dependency audit reported zero vulnerabilities; explicit secret-pattern scanning, staged-content Gitleaks, repository-history Gitleaks, and full-directory Gitleaks found no leaks.
- Current boundary: swapping back later in the same workout does not resurrect a cancelled check. A later exact exposure can create the next valid check. Real-workout threshold calibration and the broader 0.25.0 deferred boundaries remain unchanged.

## Private Alpha 0.25.0 Release Delta

- Scoped the first one to three `placement-verification-v1` events to each exact protected movement lane. Sequence one can coexist across bench, squat, and deadlift, and no movement consumes another movement's quota.
- Added `movement-placement-exit-v1`, a deterministic replayable assessment that scores only productive checks carrying the exact assessed canonical exercise ID.
- Added strict boundary disclosure. Other protected movements remain in the source snapshot and are counted as excluded, while plan-route agreement, family context, and neighboring variations lend no confirmation evidence.
- Added four exact-lane criteria: two resolved checks, repeated movement-lane support, no pain-changing movement check, and supportive movement recovery.
- Added `movement-placement-exit-review-v1`. The athlete must keep the movement lane, reassess now, or defer with a reason. Pain-changing evidence blocks keep-current.
- Preserved programming authority. A checkpoint never changes load, repetitions, sets, placement, route, or plan. Reassessment must complete the existing placement flow before a new future plan version exists.
- Added exact movement naming and lane sequence to Workout and recovery; honest total-across-lanes summaries; one criterion checkpoint per movement in You; ready-lane evidence in Plan; and an earned Today prompt that remains visible after another movement becomes next.
- Added backup schema version 19 and local persistence version 17. Version 18 migration preserves prior plan-route reviews and creates no movement review.
- Added self-contained replay, exact movement identity, global event, completed source-set, lane sequence, duplicate review, and pain-boundary validation. Restore rejects forged movement recommendations and evidence.
- Verification passed: lint, 160 deterministic tests across seventeen files, production TypeScript and PWA build, and forty desktop and 390 by 844 phone Playwright journeys.
- Full-resolution phone review passed for the exact movement checkpoint and complete reason-required criterion-review dialog.
- Security passed: dependency audit reported zero vulnerabilities; explicit secret-pattern scanning, staged-content Gitleaks, repository-history Gitleaks, and full-directory Gitleaks found no leaks.
- Current boundary: the two-check thresholds require real-workout calibration. Automatic route application, complete goal-specific performance measures, family transfer, structured coach evidence, reliable estimates, velocity evidence, and silent automatic reclassification remain deferred or prohibited. Athlete technique video is explicitly out of product scope.

## Private Alpha 0.24.0 Release Delta

- Added `placement-exit-v1`, a deterministic assessment that joins only productive verification events from the exact placement version and matching plan route.
- Added four visible criteria: two resolved productive checks, repeated route support, no pain-changing event, and supportive recovery evidence.
- Added six recommendations: collect evidence, hold current, confirm current, review advance, review conservative, and reassessment required.
- Added explicit movement-lane separation. A check whose effective movement route differs from the plan route remains visible but cannot confirm or move the plan route.
- Added `placement-exit-review-v1`. The athlete must choose keep current, reassess now, or defer and provide a reason. Pain-changing evidence blocks keep-current.
- Added a Today checkpoint callout, full You criterion panel and history, reason-required review dialog, Plan contract summary, backup preview count, and version diagnostics.
- Added self-contained assessment replay. Backup validation rebuilds the assessment and rejects altered recommendations, criteria, counts, sources, or safety decisions.
- Added backup schema version 18 and local persistence version 16. Version 17 migration preserves existing evidence and invents no criterion review.
- Verification passed: lint, 154 deterministic tests across seventeen files, production TypeScript and PWA build, and thirty-eight desktop and 390 by 844 phone Playwright journeys.
- Visual QA passed for the phone checkpoint callout and complete criterion panel. Same-route confirmation now displays one supported current route instead of a route-to-itself arrow.
- Security passed: dependency audit reported zero vulnerabilities; explicit key-pattern scanning, repository-history Gitleaks, full-directory Gitleaks, and the staged-content commit scan found no leaks.
- Current boundary: thresholds require real-workout calibration. Movement-specific exits, complete goal-specific measurable exit contracts, structured coach evidence, reliable estimates, wearable or velocity data, and silent automatic reclassification remain deferred or prohibited. Athlete technique video is explicitly out of product scope.

## Private Alpha 0.23.0 Release Delta

- Added `placement-history-v1`, a deterministic exact-exercise evidence summary with a transparent 42-day window, latest exposure, set and date counts, imported status, RIR availability, quality confirmation, representative strength-work counts, limitations, and exact source-set IDs.
- Added bounded evidence-confidence and heavy-work-tolerance suggestions. Six numeric-only imported exact sets across three dates can suggest evidence 4 and tolerance 3, but cannot confirm technique, pain, recovery, skill, or medical readiness.
- Added explicit athlete acceptance for evidence confidence and heavy-work tolerance independently. No proposal changes placement until accepted, and a later manual score change clears that field's accepted provenance.
- Advanced the placement stack to `placement-v3` and `movement-placement-v2`. `route-session-v3` remains the prescription engine, so accepted evidence can change future movement lanes without adding an unreviewed programming path.
- Added Library evidence summaries and a direct `Review in placement` path. Added per-anchor review controls, accepted-evidence preview, Plan count, Today explanation, You provenance, backup preview, and diagnostics.
- Added exact source identity validation. Restore rejects missing source sets, source sets from a different exercise, altered counts, altered suggestions, invalid windows, future evidence, mismatched accepted scores, and inconsistent plan or session snapshots.
- Added backup schema version 17 and local persistence version 15. Version 16 migration preserves valid `placement-v2` and `movement-placement-v1` evidence and invents no history review.
- Verification passed: lint, 146 deterministic tests across sixteen files, production TypeScript and PWA build, thirty-six desktop and 390 by 844 phone Playwright journeys, and full-resolution phone review of the Library evidence panel, placement review controls, and stored profile evidence.
- Security passed: dependency audit reported zero vulnerabilities; explicit key-pattern scanning, repository-history Gitleaks, and full-directory Gitleaks found no leaks.
- Current boundary: structured coach history, reliable estimates, family-to-variation transfer, threshold calibration, automatic criterion exits, movement-specific volume tolerance, and automatic reclassification remain deferred. Athlete technique video is explicitly out of product scope.

## Private Alpha 0.22.0 Release Delta

- Added `placement-v2`, retaining one overall cycle route while assigning each protected exact anchor its own `movement-placement-v1` lane.
- Added separate Skill, Heavy-work tolerance, and Recent evidence inputs for each protected anchor. Every field can remain unknown without being converted into a false score.
- Added deterministic movement routing for pain, return, introductory skill, bridge and calibration, and plan-route inheritance.
- Added `route-session-v3`. The exact movement lane now changes executable sets, repetitions, RIR, rest, warm-up guidance, strategy, reasons, and progression policy.
- Stored immutable plan route, movement route, exact movement-placement snapshot, and equipment snapshot on each version 3 session.
- Preserved movement placement through productive verification and later exposure-round generation.
- Added per-movement explanations to onboarding, Plan, Today, You, backup preview, and diagnostics.
- Added backup schema version 16 and local persistence version 14. Version 15 migration preserves old evidence and invents no movement placement.
- Added replay checks that reject missing, duplicate, altered, or mismatched movement evidence while accepting governed substitutions, stable-ID renames, and reversible catalog merges.
- Manual protected-anchor changes without an assessment honestly fall back to version 2 generation.
- Verification passed: lint, 139 deterministic tests across fifteen files, production TypeScript and PWA build, thirty-four desktop and 390 by 844 phone Playwright journeys, and full-resolution phone review of movement inputs, final placement, and profile lanes.
- No backend, account, cloud sync, AI provider, imported-history inference, automatic exit, automatic reclassification, or adjacent-variation evidence transfer is required or claimed.

## Private Alpha 0.21.0 Release Delta

- Added deterministic `route-session-v2` generation that applies the athlete-selected training-location profile before the first future queue is created.
- Filtered unavailable secondary and accessory candidates before ranking. Avoidable equipment conflicts no longer survive until the workout-start gate.
- Preserved declared primary anchors even when the selected profile cannot perform them. Onboarding names every conflicting anchor and exact missing item so the athlete can change location or revise the plan without a silent substitution.
- Applied each profile's barbell, dumbbell, cable, machine, or other increment to route loads before onboarding confirmation, manual revision, and later exposure-round generation.
- Stored an immutable `equipment-profile-v1` snapshot on the mesocycle and each version 2 session, including profile identity, kind, update time, equipment, increment table, and unit.
- Kept the plan's initial location snapshot immutable while allowing later exposure rounds to record a newly active location on their own sessions.
- Added equipment evidence to onboarding route preview, Plan queue and contract, Today's `Why this session?`, backup preview, and diagnostics.
- Added backup schema version 15 and local persistence version 13. Version 14 migration preserves version 1 route history without inventing equipment evidence; restore rejects a forged first-round session snapshot that disagrees with its plan.
- Updated diagnostics to app and rules version 0.21.0 while retaining `placement-v1` and `placement-verification-v1`.
- Verification passed: lint, 133 deterministic tests across fifteen files, production TypeScript and PWA build, thirty-four desktop and 390 by 844 phone Playwright journeys, full-resolution equipment-preview phone review, diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit with zero vulnerabilities.
- No cross-unit conversion, plate inventory, machine-stack topology, per-exercise increment override, backend, account, cloud sync, AI provider, or automatic protected-anchor replacement is required or claimed for this release.

## Private Alpha 0.20.0 Release Delta

- Added deterministic `route-session-v1` profiles for Introductory Skill, Reacclimation, Bridge and Calibration, Base-Building, Hypertrophy, Powerbuilding, Strength, Power, Event-Specific, and Pain-Aware Modified Entry.
- Connected placement confirmation and reassessment to actual future-session regeneration. The selected route now changes primary, secondary, and accessory sets, repetitions, RIR, intensity, rest, accessory caps, warm-up guidance, strategy, reasons, and progression policy.
- Preserved exact strength-anchor order, selected secondary builders, priority-region accessories, maintenance dose, and distinct route session titles.
- Used the latest completed exact-movement set first, then an exact existing planned prescription, then zero-load calibration. No movement family or neighboring variation donates load.
- Replaced cosmetic time compression with honest inclusion: primary work is protected and each later movement enters only when its full setup, work, and rest estimate fits.
- Added route previews to onboarding, route and rule provenance to Plan, route-specific warm-up guidance to Workout, and stored-rule explanations to Today's `Why this session?` view.
- Filtered the visible Plan queue to the active mesocycle while preserving superseded sessions in history.
- Made Pain-Aware Modified Entry generate no automatic queue. Reassessment supersedes the prior plan, preserves performed history, removes its unperformed future queue, and creates a new route-versioned queue.
- Made cycle-review recovery and manual adaptation pivots clear stale route rules before conservative or manually selected generation.
- Added backup schema version 14 and local persistence version 12. Version 13 migration does not invent route provenance; restore rejects forged canonical route strategies or reasons.
- Updated diagnostics to app and rules version 0.20.0 while retaining `placement-v1` and `placement-verification-v1`.
- Verification passed: lint, 128 deterministic tests across fifteen files, production TypeScript and PWA build, thirty-two desktop and 390 by 844 phone Playwright journeys, full-resolution phone review, diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit with zero vulnerabilities.
- No backend, account, cloud sync, AI provider, measured-velocity power model, complete event peak, or automatic route reclassification is required or claimed for this release.

## Private Alpha 0.19.0 Release Delta

- Added deterministic `placement-verification-v1` checks to the first three eligible productive sessions after a placement decision.
- Captured an optional warm-up response, the exact first completed primary source set, target and actual performance, completion rate, available-time fit, post-session difficulty, technique, pain, and an optional next-session recovery response.
- Preserved skip and not-answered states as unknown evidence. Recovery follow-up never blocks the next workout.
- Added transparent event verdicts: collecting, pending recovery, supports route, needs more evidence, review suggested, and reassessment required.
- Added a three-session summary that can support the selected route or suggest review, but never silently changes the athlete's selected route or rewrites completed history.
- Made painful warm-up or pain-changing post-session evidence an immediate conservative reassessment boundary with non-medical language.
- Replayed deferred post-session feedback into the original verification event without duplicating or replacing its source set.
- Added placement verification to Today, active Workout, You, diagnostics, export, restore preview, deterministic restore replay, and provenance validation.
- Added backup schema version 13 and local persistence version 11 with migration from earlier private-alpha data.
- Updated diagnostics to app and rules version 0.19.0 while retaining `placement-v1` and adding `placement-verification-v1`.
- Verification passed: lint, 120 deterministic tests across fourteen files, production TypeScript and PWA build, thirty-two desktop and 390 by 844 phone Playwright runs, full-resolution phone review, diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit with zero vulnerabilities.
- No backend, account, cloud sync, AI provider, automatic route reclassification, or route-specific program rewriting is required for this release.

## Private Alpha 0.18.0 Release Delta

- Replaced the experience-only onboarding shortcut with a four-stage, fully skippable starting-profile assessment.
- Separated experience, recent continuity, movement skill, intensity tolerance, volume tolerance, schedule stability, and evidence confidence.
- Added deterministic `placement-v1` selection across ten entry routes, including direct strength, direct power, experienced-returner reacclimation, bridge, base-building, and pain-aware paths.
- Stored the complete placement hypothesis with rule version, input snapshot, recommendation, selected route, confidence, reasons, uncertainty, route comparisons, verification, exit criteria, and athlete decision.
- Added Quick Start and Import History routes, per-question unknown semantics, conservative entry, faster submaximal verification, answer correction, goal change, and later reassessment.
- Added a non-medical pain-aware gate that disables both automatic workout-start paths until reassessment and cannot be bypassed through the faster-test choice.
- Made reassessment history-preserving by superseding the prior plan, creating a new linked plan version, and moving only future planned or deferred sessions.
- Added backup schema version 12, local persistence version 10, version 11 migration, placement preview, deterministic restore replay, and valid-looking tamper rejection.
- Updated diagnostics to app and rules version 0.18.0 and placement rules version `placement-v1`.
- Verification passed: lint, 110 deterministic tests across thirteen files, production TypeScript and PWA build, twenty-eight desktop and 390 by 844 phone Playwright runs, full-resolution phone review, diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit with zero vulnerabilities.
- No backend, account, cloud sync, AI provider, or automatic personal model is required for this release.
- Per-movement placement, imported-history inference, route-specific session rewriting, captured first-session verification, and automatic criterion exits remain deferred.

## Private Alpha 0.17.0 Release Delta

- Added stable commercial, home, travel, hotel, bodyweight, and custom equipment profiles.
- Stored normalized equipment tags, constraints, units, and separate barbell, dumbbell, cable, machine, and other load increments.
- Added profile creation, editing, activation, local persistence, seeded recovery, and first-use location choice.
- Added exact missing-equipment evidence in Today, Workout, and Library.
- Added a pre-workout review for sessions that conflict with the active location.
- Blocked inputs and incomplete-set logging until unavailable movements are skipped or replaced.
- Filtered substitution candidates against the active location and retained the location in event provenance.
- Rounded workout-start target loads to the active executable jump and used the same value for load-input steps.
- Required explicit equipment tags for new custom movements.
- Added backup schema version 11, local persistence version 9, version 10 migration, active-profile validation, and preview counts.
- Updated diagnostics to app and rules version 0.17.0.
- Verification passed: lint, 101 deterministic tests across twelve files, production TypeScript and PWA build, twenty-four desktop and 390 by 844 phone Playwright runs, full-resolution phone visual review, diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit with zero vulnerabilities.
- The new browser journey persisted Garage Rack across reload, surfaced four exact session conflicts, required review before start, blocked four unresolved movements, enforced a 2.5 lb barbell input step, and admitted only active-location replacement candidates.
- No backend, account, cloud sync, or language-model provider is required for this release.

## Private Alpha 0.16.0 Release Delta

- Added optional `exercise-muscle-map-v1` data to custom exercises with one direct muscle, up to eight distinct secondary muscles, athlete source, and review timestamp.
- Added creation and editing controls without inferring mappings from name, family, movement type, or broad body part.
- Kept built-in `muscle-dose-v1` mappings protected and unmapped custom movements visibly unknown.
- Added reason-required mapping edits, catalog descriptions, before and after mapping snapshots, deterministic replay, and exact latest-change undo.
- Added backup version 10 validation for current mappings and historical event snapshots without breaking versions 1 through 9 migration.
- Added `muscle-plan-dose-v1` from dated stored sessions with composite session, exercise-slot, and set identifiers.
- Compared only completed source sets linked to those exact stored sessions and preserved all unlinked history outside compliance.
- Added planned mapping gaps, mapped planned-set totals, linked mapped completion, per-muscle direct and secondary plan credit, completion rate, and descriptive status.
- Added shared All, Upper, Lower, Arms, and Trunk lenses with explicit no-stimulus, no-neglect, and no-catch-up interpretation copy.
- Kept backup schema version 10 and local persistence version 8.
- Updated diagnostics to app and rules version 0.16.0.

## Private Alpha 0.15.0 Release Delta

- Added versioned `muscle-dose-v1` derived only from completed source sets in the selected Progress range.
- Added seventeen leaf muscles across upper body, lower body, trunk, and the arms subset.
- Added an explicit mapping for every built-in exercise with `1.0` direct and `0.5` secondary credit. Stabilizers receive no credit.
- Added visible zero-exposure muscles and explicit unmapped source sets instead of name-based inference.
- Added overlap-safe whole-body, upper-body, lower-body, arms, and trunk rollups that count each source set once at its highest child credit.
- Added All, Upper, Lower, Arms, and Trunk lenses with direct and secondary bars.
- Added exact contributing exercise, exposure date, source-set count, and on-demand source-set identifier provenance.
- Added explicit copy that the metric is non-additive across muscles and is not measured activation, recovery cost, or exact hypertrophy stimulus.
- Kept backup schema version 10 and local persistence version 8 because the new view is a deterministic projection of existing completed history.
- Updated diagnostics to app and rules version 0.15.0.

## Architecture Decision

The immediate private alpha uses React, TypeScript, Vite, Zustand local persistence, a generated PWA service worker, Recharts, and a deterministic domain engine separated from interface components.

This decision prioritized a working private app on the same day, responsive desktop and phone access, offline-capable startup after installation, fast iteration, and no dependency on accounts, Supabase, or an AI provider. The Build Bible's React Native, SQLite, and Supabase direction remains the leading later architecture when native device distribution, durable relational storage, multi-device sync, or wider private testing becomes necessary.

The later client direction is now refined by Build Bible Chapter 68. The responsive PWA remains the first phone-and-laptop client, with a durable local repository and Supabase-backed authenticated synchronization required before the product can be described as multi-device ready. React Native remains a later evidence-gated client rather than the only route to mobile use.

The current browser store is a private-alpha operational store, not the eventual relational system of record. Before multi-device use or public testing, replace or migrate it through versioned repositories, stable IDs, schema migrations, export, restore, and conflict-aware sync.

## Working Product Surface

### Onboarding and Athlete Placement

- Four-stage taste-picker covering goal, experience, continuity, current capacity, schedule stability, evidence, pain state, weekly opportunities, available time, and equipment location.
- Seven separate athlete dimensions rather than one beginner or advanced label.
- Ten explainable entry routes with explicit confidence, supporting evidence, uncertainty, lower and higher route comparisons, productive verification, and exit criteria.
- Athlete control to Quick Start, skip sections or individual questions, import history, choose a more conservative route, request faster submaximal verification, correct answers, change goals, and reassess later.
- Pain-aware automatic-start gate with clear non-medical boundaries.
- Immutable plan supersession during reassessment so completed history never changes owners.
- Productive placement verification across the first three eligible sessions, with optional warm-up and recovery checks, exact source-set evidence, transparent verdicts, and athlete-controlled reassessment.

### Today and Scheduling

- Next-best-session presentation driven by the rolling exposure queue.
- Separate calendar and completed-exposure concepts.
- 15, 30, 45, 60, and 75-minute session choices.
- Time compression that protects a minimum primary dose before lower-priority work.
- Missed-opportunity input and reason-aware replanning without catch-up volume.
- Visible progression decision, exact recent exposure, joint response, and explanation.

### Readiness and Feedback

- Ten-question pre-session survey.
- Ten-question post-session survey.
- Independent Full 10, Quick 5, Minimal 3, Off, and Ask each time preferences for pre- and post-session collection.
- Individual skip control on every survey question.
- Not sure, Prefer not, and untouched Not answered states remain distinct null evidence.
- Whole-survey skip at both ends of the workout.
- Missing answers remain explicitly skipped rather than becoming false negative values.
- Only deliberate interactions become answers. Visible placeholders never become training evidence.
- Saved survey provenance includes effective mode, answered count, unknown count, and evidence confidence.
- An explicit available-time answer controls current-session compression.
- Remind Me Later finishes and credits the workout immediately, creates one quiet local follow-up for 24 hours, and never blocks the next workout.
- Deferred feedback can be completed or dismissed from Today. Expiry creates no survey answer and no training-state claim.
- Explicit later technique and pain replay quality-dependent records from the original completed source sets without changing their load, repetitions, identity, date, or volume.
- Pre-session readiness is a hypothesis, with a warm-up confirmation step in the active workout.
- Pain-aware, protect, confirm, normal, and reacclimation paths exist in the deterministic engine.

### Active Workout

- Primary anchor, secondary builder, priority accessory, maintenance, and optional roles.
- Per-set actual load, repetitions, RIR, and completion state.
- Actual volume load from completed repetitions multiplied by completed load.
- Automatic local persistence after every interaction and recovery after browser reload.
- Completed, partial-primary, and partial-without-primary session truth.
- Unfinished sets create no completed volume and no automatic volume debt.
- Educated movement substitutions ranked by optional reason, purpose, pattern, body region, family, role tags, joint response, preference, readiness, and exact-history familiarity.
- Every candidate shows tier, score, ranking reasons, preserved purpose, changed specificity, exact-history recency and count, and its proposed prescription.
- A replacement uses its own exact history through the load-first engine or receives a conservative zero-copy-load baseline calibration. The original movement's load is never blindly copied.
- Protected primary changes require explicit athlete confirmation before selection.
- Original exact-movement progression clock remains frozen after substitution, and completed source sets credit only the selected movement.
- In-workout PR opportunity copy remains informative and cannot change the prescription.
- Opportunity prompts now compare only the original prescribed targets with exact records. Athlete-entered actuals cannot become app-prescribed record attempts.
- Protect, pain-aware, reacclimation, irritating-joint, avoid-joint, and zero-RIR conditions pause live record prompts.
- Completed active sets can show one non-blocking provisional achievement. Final validation waits for session save and explicit technique and pain evidence.

### Progress, Plan, Library, and Profile

- Today, Plan, Progress, Library, and You navigation on desktop and phone.
- Daily, rolling 7-day, rolling 28-day, calendar-month, calendar-quarter, calendar-year, and all-time volume-load views.
- Selected-period completed sets, repetitions, average actual load, session count, active days, exact movement volume, records, and priority-region coverage.
- Calendar-quarter charts use completed source sets and visible monthly points from the current quarter start through today.
- Exact-movement mix ranks volume, sets, repetitions, sessions, volume share, and last exposure without relabeling tonnage as stimulus or enjoyment.
- Goal-relative priority attention reports represented, outside-window, or no-history evidence with contributing exercises and last-exposure recency. It does not declare neglect without a planned-dose model.
- Dose-v1 compares dated stored-session intentions with completed source sets linked to those exact session IDs. It reports planned sets, linked completed sets, known planned volume, unknown planned-load sets, and completed history with no matching stored plan as separate quantities.
- Priority-region dose rows use below-plan, within-plan, above-plan, unplanned-completed, or no-dose status. One below-plan window is execution evidence only and never creates a neglect label or catch-up-volume recommendation.
- Primary-region and exclusive upper-body, lower-body, arms, and trunk lenses.
- Visible reconciliation proving that headline, time-series, and region totals match completed source sets exactly.
- Cycle and exposure-queue view with partial-session states and dual-clock explanation.
- Editable mesocycle title, objective, dominant adaptation, opportunities, session time, target exposure rounds, strength anchors, priority regions, maintenance regions, entry criteria, success criteria, exit plan, and required reason for change.
- Deterministic preview before applying a plan, including protected-anchor coverage, projected sessions, projected sets, time fit, movement roles, and generation rationale.
- Immutable mesocycle version history with active and superseded states, effective dates, timing assumptions, and why-changed records.
- Future-only plan replacement. Completed, partial, stopped, deferred, and expired truth is not rewritten when a plan changes.
- Powerbuilding, strength, hypertrophy, and reacclimation emphasis remain separate from the load-first progression engine.
- Exercise-library discovery by body part, movement type, training role, goal or weak point, equipment, and personal collections.
- Search across names and aliases.
- Seed catalog with common and specialized strength variations including competition lifts, board presses, coffin press, safety squat bar work, deficits, and cambered-bar work.
- Exact exercise history, preference, joint response, duplicate warnings, and custom-movement creation.
- No athlete-facing technique-video library, demonstration feed, video upload, or automated form-video analysis exists. Build Bible Chapter 69 now makes that absence an explicit permanent product boundary unless JB later reverses it directly.
- Current preference behavior is limited to a boolean favorite. Favorites receive deterministic weight in substitution ranking, while the separate joint-response scale can suppress `avoid` and adjust ranking. Prefer, dislike, do-not-recommend, context-specific rules, preference events, and protected-primary preference review are not implemented.
- Custom movements can edit name, family, aliases, movement type, primary region, equipment, and description while retaining one stable canonical history ID.
- Built-in taxonomy is protected while athlete-managed aliases remain editable. Proposed names and aliases show related movements, and exact collisions are blocked before save.
- Every catalog save requires a reason, preserves completed-set names as historical truth, appends a zero-volume before-and-after event, and supports latest-change undo.
- Creating an exact name or alias match requires at least ten characters explaining the meaningful distinction before the separate custom identity can be saved.
- Data Quality turns connected duplicate pairs into one cleanup group. The athlete can select one canonical identity and retire every other connected identity into it in one reason-required merge and one exact undo snapshot.
- Completed-history CSV import requires date, exercise, load, and repetitions, accepts optional RIR and session names, validates every row before mutation, and shows load-unit conversion before commit.
- One exact canonical name or alias may auto-map. Every probable or unmatched source name requires an explicit active-catalog selection. Imported sets retain original name, source file, row, source unit, RIR known-or-unknown state, source date, and an occurrence-aware fingerprint.
- Re-import fingerprints skip existing occurrences without collapsing two legitimate identical sets. Imported numbers remain numeric-only, do not fabricate quality evidence, do not count toward stored-plan completion, replay records and analytics from source sets, and commit through one reversible history-import event.
- Athlete profile, survey modes, focused mode, reduced motion, celebration level, quiet mode, opportunity prompts, in-workout achievement controls, pixel confetti, sound and haptic preferences, local export, diagnostic copy, and reset.
- Version 10 open JSON backup export includes PR v2 records, celebration preferences, all mesocycle versions, the active-plan pointer, the complete history and catalog ledger, cycle-review decisions, durable substitution events, survey evidence, and deferred-feedback provenance. Validation, preview, restore, versions 1 through 9 migration, malformed-file rejection, and automatic pre-restore undo remain supported.
- The Exercise Library shows a substitution-learning ledger with original and selected movement, role, reason, prescription method and explanation, outcome, completed source-set count, and available response evidence.
- Every visible personal record is regenerated from completed source set IDs. Unsupported seeded PR claims are no longer used.
- PR v2 separates absolute load, repetitions at an exact load, load for an exact repetition count, exact uniform-load set schemes, Epley v1 estimated strength for one through twelve repetitions, exact-movement session volume, and whole-workout session volume.
- A validated PR requires explicitly confirmed technique and pain. Missing quality preserves the number as `numeric-only` and labels the achievement `Unverified number best` instead of inventing favorable survey evidence.
- Progress now includes record category filters, source-set counts, validation labels, a deterministic PR and micro-win timeline, and next-session opportunities that already fit the prescription.
- Exercise detail supports set correction and deletion with a required reason, consequence preview, exact replay, and latest-change undo.
- The Data Quality view suggests probable duplicates, requires athlete confirmation, preserves original exercise identity, retires rather than erases merged sources, updates future plan references only, and reverses the merge from its audit snapshot.
- Plan now derives an explicit exposure-round number, start date, seven-day target review, fourteen-day maximum span, qualified and unresolved sessions, completed sets, exact round volume, average session RPE, maximum pain, and calendar days.
- The deterministic review proposes continue and progress, continue and hold, extend, recover, or complete. The athlete can override within eligibility rules, must record a reason, and can pivot through a new immutable mesocycle version.
- Continue and progress runs the load-first exercise progression engine when it creates the next exposure round. Recovery expires unresolved work honestly and creates a conservative reacclimation round. Extension moves unresolved sessions without adding work. Completion closes the active mesocycle without rewriting its sessions.
- Every review appends its recommendation, reasons, evidence snapshot, athlete decision, reason, generated session IDs, and expired session IDs to version history.

### Original Visual System

- Dark modern training interface with lime and orange pixel-adventure accents.
- Original athlete avatar, exercise emblems, progress map, reactions, and game-like status language.
- Pixel elements carry identity and delight while loads, sets, surveys, warnings, and charts remain clean and readable.
- Responsive bottom navigation on phone and sidebar navigation on desktop.
- Focus visibility, semantic labels, native dialog behavior, reduced-motion support, and a low-decoration focused mode.

## Deterministic Rules Implemented

1. Planned work never enters completed totals.
2. Volume load equals the sum of actual completed repetitions times actual completed load.
3. Progression order is load first, repetitions second, then a recovered set only when evidence supports more dose.
4. Pain, poor execution, discontinuity, or insufficient evidence can hold, reduce, substitute, or reacclimate instead of forcing overload.
5. Comparable exact-movement history drives recommendations.
6. Missed work does not earn progression and creates no catch-up debt.
7. Time compression protects the primary anchor before lower-priority work.
8. Survey skips, not-sure responses, private responses, and untouched defaults remain unknown.
9. A visible survey default is not an athlete answer.
10. Exercise duplicates are checked through canonical names and aliases.
11. A partial primary exposure is not mislabeled as a completed session.
12. A plan revision replaces future planned work only and keeps completed or partial outcomes unchanged.
13. Weekly opportunities estimate calendar pace, while protected exposures remain the progression authority.
14. Planned sets in a mesocycle preview never enter completed analytics.
15. Reacclimation removes one working set and begins with a conservative load rather than adding catch-up work.
16. Corrections and deletions always replay volume, exact history, charts, and record eligibility from completed source sets.
17. Exercise merges never erase the original exercise ID or entered name and never rewrite completed session or prior mesocycle truth.
18. Record values without completed source set provenance are invalid.
19. Calendar duration alone cannot complete a microcycle or mesocycle.
20. An unresolved exposure round can extend only after its target date and before its maximum span.
21. Recovery expires unresolved work instead of disguising it as completed or copying it into catch-up volume.
22. A mesocycle can complete only after its target exposure rounds and minimum productive exposures are satisfied.
23. A record opportunity can reveal only a target already present in the prescription and cannot read an athlete-edited actual as an app target.
24. A fully validated PR requires completed source sets plus explicitly confirmed technique and pain inside the conservative quality bounds.
25. Missing technique or pain preserves the completed number as numeric-only and cannot become favorable quality evidence.
26. Quiet mode and celebration preferences can change presentation but cannot change logging, progression, records, or plan state.
27. Record and achievement replay uses stable versioned definitions after completion, correction, deletion, merge, local migration, and backup migration.
28. Deferred feedback may enrich completed evidence, but it cannot change whether the workout counted or block another workout.
29. Planned-dose completion can use only completed source sets linked to a stored session inside the selected intended window. Unlinked completed work remains valid progress history but cannot be assigned to a missing plan.
30. A planned target load of zero means unknown load for planned-volume purposes. It never becomes known zero-load intent.
31. An imported source name cannot create or select an exercise silently unless it has one exact active canonical name or alias match.
32. Imported history remains numeric-only until the athlete explicitly confirms quality through a later correction. Missing imported RIR remains visibly unknown.
33. A repeated identical set keeps its own occurrence fingerprint so one occurrence can be removed or restored without collapsing the other.
34. An unknown or custom exercise cannot receive inferred muscle credit from its name, family, or broad body region.
35. Individual-muscle totals are non-additive, while parent-area dose counts each source set once at the highest eligible child credit.
36. Zero muscle exposure is visible evidence, not an automatic neglect diagnosis or catch-up prescription.
37. A placement route cannot change only a label while leaving every generated prescription identical.
38. A route-generated load can use only the exact movement's completed or already planned source. Unknown exact movements calibrate from zero.
39. Time fitting cannot reduce the displayed duration without removing or changing the work that created that duration.
40. Pain-Aware Modified Entry cannot leave an automatic future queue executable.
41. Reassessment may replace only unperformed future work. Completed and partial session identity remains attached to the historical plan.
42. Backup migration cannot invent `route-session-v1` provenance for sessions created before that rule existed.
43. A `route-session-v2` secondary or accessory cannot require equipment missing from its stored generation profile.
44. A protected primary anchor cannot disappear or silently change identity because the selected profile lacks equipment.
45. Every positive version 2 generated load must use the selected profile's movement-class increment.
46. A first-round version 2 session's equipment snapshot must match its mesocycle's initial snapshot.
47. A later exposure round may record a different current profile without rewriting the mesocycle's original snapshot or earlier sessions.

## Verification Evidence

- Current 0.26.0 release gate: lint, 168 deterministic tests across eighteen files, production PWA build, and forty-two Playwright journeys across desktop Chromium and the 390 by 844 phone project all passed.
- Exact-history placement coverage includes numeric-only and quality-confirmed suggestions, stale and absent history, exact-identity isolation, future and window validation, suggestion replay, per-field athlete acceptance, manual provenance clearing, version 16 migration, unknown source rejection, cross-movement source rejection, and plan and session persistence.
- Browser coverage includes six imported exact bench sets across three dates, Library evidence 4 and tolerance 3, per-field placement review, accepted version 3 evidence, Plan and Today explanations, You provenance, local persistence version 15, and exact source-set continuity.
- Full-resolution phone review confirmed the Library evidence panel, long per-anchor review controls, accepted evidence buttons, and profile provenance remain readable and horizontally contained.
- Per-movement coverage includes mixed Introductory Skill, Direct Strength, and Bridge and Calibration lanes inside one strength plan; unknown evidence; independent conservative lowering; forged-lane rejection; exact session provenance; productive-verification evidence; and honest legacy migration.
- Browser coverage includes per-anchor input, mixed route preview, conservative control, version 3 session persistence, You profile review, and exact 390 by 844 containment.
- Full-resolution phone review confirmed readable long-form movement controls, final recommendation cards, stored profile lanes, and no obstructing focus artifact.
- Equipment-aware generation coverage includes Home Gym support-work filtering, Travel Setup protected-anchor conflicts, custom 2.5-unit barbell rounding, version 1 historical validity, version 2 round trip, version 14 migration, first-round snapshot agreement, and forged-snapshot rejection.
- Browser coverage includes exact Travel Setup conflict disclosure, return to Home Gym, equipment-clean non-primary generation, stored Home Gym evidence on plan and sessions, and persistence after entering the app.
- Full-resolution 390 by 844 review confirmed the green equipment-ready card, orange protected-anchor review card, exact missing-item copy, readable controls, and horizontal containment.
- Route-generation domain coverage includes all ten canonical profiles, all nine trainable prescriptions, materially distinct route outputs, exact-movement-only load sources, zero-load calibration, time fitting, accessory caps, route provenance, version 13 backup migration, round trip, and forged-strategy rejection.
- Browser coverage includes Direct Strength 4 x 4 preview, athlete-selected Base-Building 3 x 8 at 3 RIR persistence, low-confidence Quick Start Powerbuilding generation, stored route and rule provenance, route explanation, and route-specific workout warm-up guidance.
- Full-resolution phone review confirmed the starting-session preview, route decision explanation, primary route warm-up card, fixed workout completion controls, and horizontal containment.
- Placement-verification domain coverage includes event creation, optional warm-up evidence, exact first-set linkage, pending recovery, skipped unknown evidence, deferred-feedback replay, supportive and review verdicts, pain-changing reassessment, three-session summary, and tamper rejection.
- Backup coverage includes schema version 13 round trip, version 12 migration, exact verification source references, deterministic verdict replay, and governed history-correction handling.
- Browser coverage includes a supportive warm-up-to-recovery journey, persisted first-set provenance, deferred feedback updating the original check, You evidence review, and a painful-warm-up gate that does not fabricate a set or survey response.
- Placement domain coverage includes direct strength, reacclimation without experience erasure, introductory, bridge, base-building, power prerequisites, pain priority, missing-evidence confidence, conservative choice, faster submaximal verification, Quick Start uncertainty, and deterministic provenance validation.
- Backup coverage includes schema version 12 round trip, version 11 migration, agreement checks across athlete level and entry route, and rejection of a valid-looking placement altered without corresponding source inputs.
- Browser coverage includes high-confidence Direct Strength recommendation, lower and higher route rationale, athlete-selected Base-Building, persisted recommendation-selection separation, pain-aware start blocking, manual reassessment, low-confidence Quick Start, and immutable superseded and active plan versions.
- Full-resolution phone review confirmed readable onboarding hierarchy, route explanations, dimension bars, athlete controls, profile provenance, and horizontal containment.
- Diff validation, explicit secret scan, repository-history and full-directory Gitleaks, and dependency audit passed. The dependency audit reported zero vulnerabilities.

- `npm run lint`: clean.
- `npm run test`: 93 deterministic tests passed across eleven files, including custom mapping validation, backup round trip, invalid provenance rejection, exact-session-linked planned muscle dose, repeated raw planned-set ID preservation, full built-in muscle-map coverage, direct and secondary credit separation, parent-area conservation, unknown-movement handling, muscle-lens filtering, CSV import, planned-dose reconciliation, catalog governance, training rules, surveys, substitutions, records, cycle review, and source-history preservation.
- `npm run test:e2e`: twenty-two Playwright runs passed across desktop Chromium and Pixel 5 projects.
- `npm run build`: production PWA build passed.
- Production output is screen-split, with no oversized-bundle warning.
- Browser console: zero errors and zero warnings during the final check.
- Playwright console and uncaught page-error collectors remained empty in all twenty-two 0.16.0 runs.
- Desktop visual checks: onboarding, Today, and active Workout.
- Phone visual checks at 390 by 844: Today, Plan, Library, Progress, backup controls, the Exercise Data Quality modal, and both the opening and identity-review portions of the history-import dialog.
- Responsive overflow checks passed at 320, 640, 768, 1024, and 1440 pixels.
- Browser journey verified: onboarding, individual readiness-question skip, readiness submission, workout start, set logging, reload recovery, ranked primary swap, ten-question post survey, whole-post-survey skip, partial session completion, and progress update.
- Mesocycle journey verified: changed a live 60-minute plan to three 30-minute protected-anchor sessions, previewed the queue before applying, preserved one partial-primary and one partial-without-primary outcome, superseded version 1, activated version 2, showed both reasons for change, and recovered the active version after reload.
- Backup journey verified: schema version 10 export includes plan, history and catalog events, cycle-review, PR v2, celebration-preference, substitution-event, survey-evidence, and deferred-feedback state, validates catalog edits and existing event projections, and retains versions 1 through 9 migration coverage in automated tests.
- Correction journey verified: a real browser correction changed Competition Bench Press from 180 by 7 to 175 by 7, recorded the reason, changed volume by exactly negative 35, then restored the original set through Undo latest change.
- Duplicate journey verified: an athlete-created Flat Barbell Bench was detected as a 100 percent match to the existing canonical alias, merged into Competition Bench Press, removed from the active catalog without deletion, recorded in the ledger, and restored as its own movement through undo.
- Catalog-edit journey verified: a custom Ring Press Arc retained its stable ID while its name, family, equipment, and alias changed; an attempted Bench alias was blocked because it belongs to Competition Bench Press; the valid change appeared as zero volume in the ledger and restored exactly through undo.
- Catalog-edit phone view at 390 by 844 passed exact-width dialog containment and visual review after a phone-only modal heading overflow was found and fixed.
- Group-cleanup journey verified: exact Flat Barbell Bench and Bench copies could not be created until each received a written distinction; they joined Competition Bench Press in one three-identity group; the athlete selected Competition Bench Press, retired both copies in one merge, saw the group disappear, and restored both identities through undo.
- The three-identity phone merge dialog passed visual review with the chosen canonical movement, completed-set consequence, and retirement count visible.
- Cycle-review journey verified: a real browser recovery decision expired three unresolved first-round sessions, created three conservative round-two sessions, preserved completed and partial history, stored the athlete's reason and evidence, and recovered the new round after local persistence.
- Cycle-review phone journey verified at 390 by 844 with exact-width layout, initial focus on the dialog close control, Escape dismissal, and zero browser errors or warnings.
- Analytics journeys verified: every period selector including calendar quarter, monthly quarter points, region and high-level area lenses, exact movement mix, goal-relative priority attention, period-specific records, honest empty states, matched-window trend, and exact source-set reconciliation.
- Gamification journey verified: an original productive-hold prescription stayed unchanged after actual-load editing, one completed actual produced provisional feedback, confirmed post-session technique and pain created a validated source-backed 185 load record, and Progress replayed the PR and micro-win evidence.
- Preference journey verified: quiet mode persisted across reload without changing any training or record calculation.
- Substitution journey verified: equipment reason changed deterministic candidate evidence, an unconfirmed primary replacement was blocked, explicit confirmation unlocked the choice, a no-history Coffin Press received a two-set calibration with no copied load, one completed set became linked source evidence, and the Library displayed the completed original-to-selected event.
- Survey-preference journey verified: minimal pre-session mode showed exactly three questions, Not sure remained null unknown evidence, explicit pain and forty-five-minute answers produced low survey confidence, the workout compressed to forty-five minutes, post-session Off finished directly without a modal, and both provenance records persisted.
- Deferred-feedback journey verified: one 185-pound source set finished immediately with Minimal feedback deferred, remained an unverified numeric best, left the next workout available, appeared as a quiet Today follow-up, accepted explicit difficulty, technique, and pain later, then replayed the same source set into a validated strength record and persisted completed request-to-survey provenance.
- Phone visual checks verified the deferred Today card and feedback form at 390 by 844 with exact-width containment and no horizontal overflow.
- Quarter analytics phone journey verified seven horizon controls, monthly volume presentation, movement mix, priority attention, conservative interpretation notes, and exact-width containment.
- Planned-dose journey verified that one completed source set linked to a stored fifteen-set session reports `1 / 15`, while 136 completed sets with no stored plan remain visible and separate. It also verified per-region status, the unknown-plan explanation, the no-neglect rule, exact-width containment, and zero browser errors on desktop and phone.
- The 390 by 844 planned-dose panel passed visual review with all four summary cards, four region rows, progress bars, status labels, and the full interpretation note contained without horizontal overflow.
- History-import journey verified three source-dated sets, an exact Bench alias, an unmatched Legacy Coffin name, disabled commit before canonical review, explicit mapping to Coffin Press, numeric-only evidence, original source provenance, three duplicate rows skipped on repeat import, and exact full-import undo.
- The 390 by 844 import dialog passed visual review at both the opening instructions and final mapping decision. Dialog and page containment checks found no horizontal overflow.
- Muscle-dose journey verified the All time range, arms lens, non-additive interpretation, overlap-safe parent rollups, triceps direct and secondary evidence, exact exercise drilldown, and recoverable source-set identifiers.
- The 390 by 844 muscle-dose panel passed visual review after long source identifiers were moved into bounded on-demand disclosures. Summary cards, area rollups, muscle rows, direct and secondary bars, provenance, and interpretation copy remain contained without horizontal overflow.
- Custom-mapping journey verified that an athlete can assign Pectorals as direct and Triceps as secondary, save the reason-required catalog event, inspect the mapping in Exercise Detail, and undo the mapping without changing the stable ID or completed history.
- Planned-muscle journey verified one stored session, fifteen intended source sets, fifteen mapped planned source sets, distinct composite identities despite reused raw planned-set IDs, and 238 completed source sets preserved outside stored-plan comparison in the all-time fixture.
- Phone visual checks verified the custom mapping options, full catalog-edit dialog, and planned muscle-dose panel at 390 by 844 with readable controls and no horizontal overflow.
- Phone visual checks verified the Progress achievement ledger and You achievement controls with exact-width containment and no horizontal overflow.
- Explicit secret-pattern scanning and Gitleaks directory scanning passed against the final working tree.

Screenshots are stored inside the code project at `output/playwright/` and are development evidence, not final marketing assets.

## Known Boundaries and Deferred Work

- Browser storage is not yet SQLite or Postgres. Versioned local backup now reduces private-alpha loss risk but does not replace cloud or native durability.
- The version-controlled Supabase schema, forced Row Level Security, invite-only client boundary, event outbox, explicit snapshot save, cloud review, athlete-confirmed restore, and conflict-preserving server function now exist. The dedicated remote ForgePath project and both migrations are active, but hosted phone and laptop instances still hold independent local state until invite-only Auth and live acceptance are complete. Automatic entity-level merge, device revocation UI, background hydration, and active-workout handoff remain deferred.
- No OpenAI, Anthropic, retrieval, statistical calibration service, or unstructured-feedback interpretation exists yet.
- The original evolving training companion, source-backed XP ledger, levels, three-stage evolution, and post-workout ceremony are specified in Chapter 66 but are not implemented. Actual Pokémon characters, names, likenesses, mechanics, and presentation are prohibited.
- The current athlete-learning display is seeded and deterministic. It is not a trained personal model.
- Starting placement is deterministic, explainable, productively verified across up to three eligible sessions per exact protected movement, and connected to route-specific, equipment-aware, exact-movement future-session generation. Imported exact history can propose bounded confidence and heavy-work-tolerance values only after athlete review. Matching plan-route and exact-movement evidence now produce separate athlete-reviewed criterion checkpoints, but calibrated thresholds, structured coach history, reliable estimates, family transfer, measured-velocity power work, complete event peaks, automatic route application, and silent automatic reclassification remain incomplete or prohibited. Athlete technique video is explicitly out of product scope.
- Editable mesocycles, exposure-round date bounds, criterion reviews, extension, recovery, completion, and pivot entry are executable. Waived or substituted round roles, automatic review reminders, macrocycles, annual plans, fixed-event replanning, and quadrennial transitions remain incomplete.
- Planned-versus-completed region and individual-muscle dose now have versioned first slices, custom movements have athlete-reviewed mappings, and relative completed priority-region representation can resolve an otherwise equal missed-opportunity queue choice. This is not a target-dose or neglect model. Plan-revision provenance, imported-plan mapping, historical catalog-version mapping, density, duration, quality-adjusted, and causal progression-driver analytics need deeper implementation.
- Record eligibility now has exact set provenance, PR v2 type separation, all-time scope, quality-confirmed versus numeric-only validation, achievement replay, correction replay, and numeric-only imported history. Mixed-load set schemes, variation-family and time scopes, bodyweight and assistance conventions, quality-validated imports, superseded-event views, and richer physical-unit conventions still need expansion.
- Exercise merge, connected-group multi-source cleanup, merge undo, direct alias management, custom movement editing, exact collision blocking, exact-match creation distinctions, catalog-edit undo, and pre-import canonical identity review are working. Additional vendor formats, in-flow custom movement creation, orphan-alias review, unrelated-group bulk operations, notes provenance, and full catalog governance still need expansion.
- Initial generation and substitution both enforce first-slice exact equipment filtering, but repeated outcomes do not yet retrain or statistically recalibrate ranking. Cross-unit conversion, browse-full-library replacement, equipment aliases, plate and stack physics, per-exercise increments, rest and warm-up recalculation, muscle-dose and fatigue recalc, later-work reprioritization, and movement-specific feedback remain incomplete.
- Session survey modes, unknown semantics, and deferred feedback are working. Automatic burden reduction, later survey cadences, body maps, and athlete-level active restriction state remain incomplete.
- Public accounts, friends, challenges, moderation, wearables, and native notifications remain later phases.
- Medical decisions and pain thresholds require conservative boundaries and appropriate expert review.

## Next Build Priorities

1. Use the plan-route and exact movement-lane placement checkpoints with real current evidence, then calibrate supportive, review, and reassessment thresholds without silently reclassifying the athlete.
2. Use exact-history placement review with real training logs, then calibrate the 42-day window and evidence thresholds without lending exact loads or silently transferring variation skill.
3. Calibrate route-specific session prescriptions, exact-load heuristics, equipment-filtered exercise selection, time estimates, and protected-anchor conflicts through real workouts before treating them as individually optimized.
4. Calibrate Full, Quick, Minimal, Off, Ask each time, and deferred survey friction during real workouts before adding later cadences or automatic burden reduction.
5. Use the editable mesocycle in real workouts and calibrate generated exercise selection, time estimates, maintenance exposure, and success criteria from actual outcomes.
6. Use real location changes and substitutions to calibrate equipment tags, missing-item explanations, executable jumps, ranking, prescription fit, reason usefulness, time estimates, and the minimum repeated-evidence threshold before any outcome can alter future weights.
7. Expand completed-set import into structured coach, reliable-estimate, and vendor evidence adapters with explicit source quality, while adding in-flow distinct movement creation, orphan-alias review, unrelated-group bulk operations, and remaining catalog-governance tools. Do not add athlete technique-video import or analysis.
8. Calibrate custom mappings, planned muscle dose, relative priority-region schedule evidence, progression, interruption, reacclimation, PR gates, and micro-win thresholds from actual comparable exposures.
9. Add fixed-event schedule pressure with explicit athlete-authored dates, bounded phase logic, and no-debt safeguards, then add block, recent, return, and yearly record scopes and longer-horizon planning without weakening exact-movement authority.
10. Provision a dedicated ForgePath Supabase project after account capacity is approved, apply and inspect the committed migration, invite the initial private-alpha account, add browser-safe deployment configuration, and run the documented authenticated push, pull, conflict, restore, revocation, and isolation drills before enabling cloud sync. React Native and SQLite remain later evidence-gated decisions.

## Continuity Rule

All implementation changes must preserve the source order in [[App Build Reference Index]], link their requirement IDs, update deterministic tests, and record deferred versus complete behavior honestly. This note is the implementation-status source for the 2026-08-10 private alpha.

Related: [[Adaptive Strength and Hypertrophy App]], [[Adaptive Strength and Hypertrophy App Build Bible]], [[Build Bible Requirement Traceability Matrix]], [[App Requirements Register]]
