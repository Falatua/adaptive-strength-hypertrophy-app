# ForgePath Build Reference

ForgePath is the working private-alpha name for the Adaptive Strength and Hypertrophy App.

## Canonical Product Sources

The authoritative product specifications live in JB's Obsidian vault:

- `Projects/Adaptive Strength and Hypertrophy App/Outputs/Adaptive Strength and Hypertrophy App Build Bible.md`
- `Projects/Adaptive Strength and Hypertrophy App/Outputs/Build Bible Requirement Traceability Matrix.md`
- `Projects/Adaptive Strength and Hypertrophy App/Inputs/App Requirements Register.md`

The first implementation is governed by the complete R-001 through R-295 register. It is a deliberately bounded private-alpha slice, not a claim that every requirement or later delivery phase is complete. Its exact status is recorded in Obsidian at `Outputs/Private Alpha Implementation 2026-08-10.md`.

## Implemented Private-Alpha Slice

- Today, Plan, Progress, Library, and You navigation.
- Optional onboarding with direct-entry and returning routes.
- Independent full 10, quick 5, minimal 3, ask-each-time, and off modes for pre- and post-session surveys.
- Per-question answer, skip, not-sure, and prefer-not states plus immediate survey-free start and finish. Untouched defaults remain unknown rather than becoming fabricated answers.
- Optional post-session “Remind me later” finishes the workout immediately, creates a quiet 24-hour local follow-up, never blocks the next session, and expires without penalty or invented evidence.
- Explicit deferred technique and pain answers replay quality-dependent records from the original completed source sets. Dismissed or expired follow-ups leave numeric bests visibly unverified.
- Active workout logging with local persistence.
- Persistent commercial, home, travel, hotel, bodyweight, and custom training-location profiles with exact available-equipment lists, constraints, units, and separate barbell, dumbbell, cable, machine, and other load increments.
- Conservative availability matching that treats every explicit exercise requirement absent from the active profile as unavailable. Today requires an equipment review before starting a conflicting session, Workout blocks logging for unresolved movements, and Library provides available and unavailable filters with exact missing-item evidence.
- Equipment-aware substitutions that remove unavailable candidates, explain active-location fit, and retain the selected location in the substitution ledger.
- Executable workout targets rounded at session start to the smallest active-profile increment for the movement's equipment class. Actual load entry remains athlete-controlled.
- Primary, secondary builder, priority, maintenance, and optional exercise roles.
- Load-first, repetition-second, recovered-set-third progression decisions.
- Hold, reduce, and reacclimation paths.
- Time-aware session compression.
- Calendar and exposure clock presentation.
- Editable mesocycle objectives, adaptation emphasis, opportunities, time budget, exposure rounds, strength anchors, priority regions, maintenance regions, and criterion fields.
- Deterministic plan preview with protected-anchor coverage, projected sets, time fit, selection rationale, and preview-before-apply.
- Immutable mesocycle revision history with status, effective date, prior-plan link, and required reason for change.
- Future-only plan replacement that preserves completed, partial, stopped, deferred, and expired historical truth.
- Missed-session replanning without catch-up volume.
- Exact exercise history, stable canonical IDs, aliases, duplicate warnings, preferences, and joint response.
- Auditable custom-movement editing for name, family, movement type, body part, equipment, description, and aliases. Built-in taxonomy remains protected except for athlete-managed aliases.
- Exact name and alias collisions are blocked before save. Probable related variations stay visible for athlete review, prior completed-set names remain historical truth, and every catalog edit has a required reason and one-step undo.
- Initial creation of an exact duplicate requires a meaningful distinction. Probable pairs are collapsed into connected cleanup groups so multiple accidental copies can merge into one selected identity in one reason-required, reversible event.
- Completed-history CSV import requires date, exercise, load, and repetitions; previews row errors and unit conversion; auto-maps only exact canonical names or aliases; requires athlete selection for every uncertain source name; preserves file, row, original name, date, unit, and occurrence-aware fingerprint provenance; keeps quality numeric-only; and commits as one reversible ledger event.
- Reason-aware exercise replacement with ranked evidence tiers, visible purpose and tradeoffs, exact-history or conservative calibration prescriptions, protected-primary confirmation, and preserved exact-movement clocks.
- A durable substitution-learning ledger linking original and selected movements, candidate snapshots, prescriptions, completed source sets, outcomes, and available feedback.
- Daily and weekly volume, body-region views, source-backed records, and micro wins.
- Real daily, weekly, rolling-28-day, calendar-month, calendar-quarter, yearly, and all-time filters with source-set reconciliation.
- Exclusive primary-region and upper-body, lower-body, arms, and trunk volume lenses.
- Exact-movement mix with selected-period volume, sets, repetitions, sessions, volume share, and visible limits on cross-exercise interpretation.
- Goal-relative priority attention with represented, outside-window, and no-history states. The app does not label neglect without a versioned planned-dose model.
- Versioned dose-v1 plan comparison using dated stored sessions, intended set count, known planned volume, explicit unknown-load sets, linked completed source sets, and separately preserved completed history with no stored plan.
- Primary-region plan status for below plan, within plan, above plan, unplanned completed, and no dose. These are execution states, not neglect labels or catch-up-volume instructions.
- Explicit muscle-dose-v1 mappings for every built-in movement assign 1.0 direct and 0.5 secondary set credit while giving stabilizers no credit. Individual muscle rows expose contributing exercises and exact completed source-set identifiers, while upper, lower, arms, trunk, and whole-body parents conserve each source set at its highest child credit.
- Optional athlete-reviewed custom-movement mappings assign one direct muscle and up to eight distinct secondary muscles. They are never inferred from a body-part label, remain visibly unmapped when omitted, retain review source, timestamp, and rule version, and participate in the reason-required catalog ledger and one-step undo.
- Muscle-plan-dose-v1 compares intended set credit with only completed source sets linked to those stored sessions. Composite plan identifiers preserve repeated raw set IDs across exercise slots, unmapped plan gaps remain visible, and completed history without a stored plan stays outside compliance.
- Exact all-time record definitions for absolute load, repetitions at load, load for repetitions, exact set scheme, Epley estimated strength for one through twelve repetitions, exact-movement session volume, and workout session volume.
- Deterministic achievement replay for personal records, load and repetition micro wins, quality wins, baselines, returns, and consistency, with completed source-set provenance.
- Opportunity prompts calculated only from prescribed targets. Athlete-entered actuals can never be reclassified as an app-prescribed record attempt.
- Provisional in-workout achievement feedback and a corrected-history-aware Progress ledger.
- A fully validated PR requires confirmed technique and pain feedback. Survey-free sessions keep their numbers as visibly numeric-only bests.
- Athlete-controlled celebration level, quiet mode, opportunity prompts, session achievements, reduced motion, pixel confetti, sounds preference, and supported-device haptics.
- Athlete model, survey controls, focused mode, data export, and local reset.
- Version 11 open-JSON backup with expanded record definitions, celebration controls, equipment profiles, plan, review, history and catalog changes, substitution, survey-evidence, and deferred-feedback history, integrity checks, versions 1 through 10 migration, preview, restore, malformed-file rejection, and automatic pre-restore undo.
- Original pixel-adventure visual language and installable PWA shell.
- Accurate completed, partial-primary, and partial-without-primary session states.

## Verified Journeys

- Complete onboarding and start directly at an experience-appropriate route.
- Open readiness, skip an individual question, and submit the remaining evidence.
- Select a minimal three-question check-in, mark one item not sure, submit two explicit answers, display low evidence confidence, set post-session surveys off, and finish directly without a modal or loss of training credit.
- Start immediately without a survey.
- Log an actual set, reload the app, and recover the active session locally.
- Explain why a primary exercise is being changed, inspect ranked evidence and tradeoffs, confirm the protected-anchor change, receive a movement-specific prescription, and freeze the original exact-movement clock.
- Finish a partial session with or without feedback and update progress only from completed sets.
- Defer post-session feedback, verify the next workout remains fully available, complete the optional follow-up later, and replay an unverified numeric best into a quality-validated record from the same completed source set.
- Navigate Today, Plan, Progress, Library, and You on desktop and a 390 px phone viewport.
- Export a complete local backup, validate and preview it, restore it, and recover the pre-restore state.
- Switch every progress horizon and prove chart, body-lens, and headline totals equal the selected completed source sets.
- Select the calendar quarter, show monthly quarter points, inspect exact movement mix and priority attention, and preserve exact-width phone containment without turning volume share into a stimulus or enjoyment claim.
- Preview a 30-minute plan revision, apply it, preserve partial history, inspect both plan versions, reload, and recover the active version from local persistence.
- Export and preview a verified version 11 backup containing expanded records, athlete celebration preferences, training locations, plan versions, the history and catalog ledger, cycle-review history, substitution learning, survey evidence, and deferred-feedback provenance.
- Create a distinct custom movement, edit its canonical metadata, block an exact alias collision, save a non-conflicting identity without changing its stable ID, inspect the zero-volume catalog ledger entry, and undo the edit.
- Document two intentionally separate exact-name matches, review the resulting three-identity cleanup group, keep Competition Bench Press, retire both copies in one merge, verify the group disappears, and restore both identities through undo.
- Complete one set from a stored fifteen-set session, show one of fifteen linked sets, distinguish 136 older completed sets with no stored plan, classify chest as one of four linked planned sets, and preserve all unlinked work in Progress without counting it as plan compliance.
- Import a source-dated CSV with an exact alias and an unmatched legacy name, require canonical mapping before commit, preserve unverified row provenance, block a second import from duplicating volume, and undo the complete import in one action.
- Confirm a planned hold remains a hold after an athlete edits actual load, then log, provisionally recognize, save, and replay a source-backed exact-movement load record.
- Turn quiet mode on, reload, and confirm the preference persists without changing training or record calculations.
- Verify the achievement and settings surfaces on desktop and phone with no browser errors or horizontal overflow.
- Review a custom movement's direct and secondary muscle mapping, confirm the replay notice and audit description, inspect its explicit mapping in the movement detail, and undo the review without changing completed history or the stable canonical ID.
- Reconcile a stored fifteen-set plan to fifteen mapped intended sets, preserve repeated raw planned-set IDs as distinct exercise-slot evidence, and keep all unlinked completed work separate from linked muscle-plan completion.
- Create and persist a home-gym profile, activate it after reload, review four exact equipment conflicts before training, start without losing the workout, block unavailable set logging, enforce a 2.5 lb barbell input step, and replace an unavailable movement only with a candidate available at that location.

## Deliberately Deferred

- Supabase authentication, Postgres system of record, Row Level Security, and multi-device sync.
- React Native client and SQLite migration after the private web workflow is validated.
- Cloud AI provider, research retrieval, and voice interpretation.
- Friends, social sharing, challenges, and public accounts.
- Medical integrations, wearable imports, and public-launch operations.

## Core Integrity Rules

1. Planned work never counts as completed work.
2. Missing survey data stays unknown.
3. Untouched interface defaults are not athlete answers.
4. Missed training earns no progression and creates no volume debt.
5. Exercise substitutions own their own completed history.
6. Gamification cannot change the training prescription.
7. The deterministic engine must function offline and without an AI provider.
8. Changes to rules, calculations, exercise identity, or evidence semantics must remain versionable and testable.
9. Deferred feedback can enrich completed evidence but cannot change whether the workout counted or block another workout.
10. Muscle-dose mappings are explicit, versioned heuristics. They are not tonnage, measured stimulus, neglect diagnoses, or automatic catch-up instructions.
