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
- Four-stage, fully skippable starting-profile onboarding with Quick Start and history-import routes.
- Versioned `placement-v3` inputs and independent one-to-five dimensions for experience, recent continuity, global movement skill, strength tolerance, volume tolerance, schedule stability, and data confidence.
- `movement-placement-v2` stores an exact protected movement, family context, current skill, heavy-work tolerance, evidence confidence, recommended route, athlete-selected route, reasons, unknowns, and any explicitly accepted history review without combining exact exercise history.
- `placement-history-v1` summarizes exact source sets inside a 42-day review window, dates, imported and numeric-only status, RIR availability, quality confirmation, latest exposure, bounded suggestions, limitations, and source-set IDs. The athlete must explicitly accept confidence or tolerance, and the engine never infers skill, pain, recovery, or family transfer.
- Deterministic introductory, reacclimation, bridge, base-building, hypertrophy, powerbuilding, strength, power, event-specific, and pain-aware route selection with explicit confidence, reasons, unknown inputs, lower and higher route comparisons, first-session verification, and criterion-based exit evidence.
- Athlete-controlled confirmation, conservative placement, faster submaximal test request, answer correction, goal change, and history import. Quick Start defaults remain visibly low-confidence until confirmed by completed work.
- Pain-modified placement carries a non-medical boundary, routes to the athlete profile, and pauses both surveyed and survey-free workout starts until reassessment.
- `placement-verification-v1` turns the first one to three normal training sessions for each exact protected movement into productive route checks without a maximal test. Sequence and quota are scoped to the exact movement lane, so evidence from squat cannot consume or confirm the bench lane. It stores optional warm-up response, the first completed primary set, planned versus actual load, repetitions and RIR, completion, duration, readiness, post-session quality, pain, time fit, and optional recovery.
- Verification verdicts remain explainable and athlete-controlled: support the route, collect more evidence, suggest review, or require reassessment before another automatic start. No verification event silently changes the selected route.
- Deferred post-session feedback replays the same verification event from source evidence rather than creating a second interpretation.
- `placement-exit-v1` joins productive verification events only to the exact placement identity and matching cycle-level route. It evaluates two resolved checks, repeated route support, the pain-changing boundary, and supportive recovery evidence while disclosing movement-lane checks excluded because their effective route differs.
- Checkpoint recommendations are collect evidence, hold current, confirm current, review advance, review conservative, or reassessment required. The assessment stores its complete placement and verification snapshots so restore validation can replay the decision rather than trusting a label.
- `placement-exit-review-v1` requires the athlete to keep the current route, open placement reassessment, or defer with a reason. Reassessment creates a future placement and plan version; prior evidence remains historical truth. Pain-changing evidence blocks keep-current, and no recommendation silently changes programming.
- `movement-placement-exit-v1` replays one exact movement placement against only that exact identity's checks. It excludes other protected movements, family neighbors, and the global route from confirmation evidence, then evaluates two resolved checks, repeated support, the pain-changing boundary, and supportive recovery.
- `movement-placement-exit-review-v1` stores the athlete's keep, reassess, or defer decision and reason with the complete source placement, movement placement, and verification snapshots. An earned lane prompt survives queue advancement; reassessment opens the versioned placement flow and never directly rewrites current programming.
- A protected-primary substitution cancels only the active placement check for that session and placement identity. The replacement owns its completed sets and substitution ledger, the original movement's progression clock stays frozen, and the cancelled attempt consumes no exact-lane sequence or quota. Secondary and accessory substitutions do not cancel the primary check.
- `calendar-exposure-v1` derives a 42-cell month view from stored planned sessions and completed source sets without persisting a second truth. Planned and actual dates remain linked through session identity and drift days, while imported or unlinked work stays visible without becoming plan compliance.
- Exact-movement exposure order groups only one canonical exercise's completed source sets, assigns chronological exposure sequence, retains calendar-day gaps, and describes load-first, repetition, set, volume, baseline, or held outcomes without borrowing family history or changing the prescription.
- Fixed-event countdowns require an explicit valid ISO date inside the athlete-authored event text. Missing or unreadable dates remain visible as missing or unreadable and never become an invented deadline.
- `missed-opportunity-v1` records whether training happened, the reason, next realistic date and duration, whether the disruption ended, continues, or is uncertain, and optional athlete context. It preserves the complete source-set and session ledger while storing the queue before and after, every moved date and dose change, the selected exact primary evidence, continuity decision, and no-catch-up proof.
- The deterministic rebuild ranks open sessions by days since the latest completed exact primary exposure, time-fits only the first opportunity, removes optional fatigue after repeated or ongoing disruption, and keeps reported but unlogged training outside progression until it is logged or imported.
- Today explains the rebuilt order, Plan exposes the append-only decision and session changes, and Progress retains the original missed date alongside the current moved opportunity.
- `route-session-v3` applies the exact anchor's movement placement to its generated session while preserving the cycle-level goal route separately. A new squat can use skill-first work while a prepared bench uses strength work in the same cycle.
- Every trainable route retains its distinct primary, secondary, accessory, set, repetition, RIR, intensity, rest, warm-up, dose, progression, explanation, and equipment rules. Version 1 and version 2 history remains valid and unchanged.
- The selected training location removes unavailable secondary and accessory candidates before generation, applies movement-class load increments immediately, and stores the exact normalized equipment snapshot on the plan and every generated session.
- Protected strength anchors are never silently replaced. An unavailable anchor remains explicit and enters the existing review and substitution path with exact missing-item evidence.
- Onboarding regenerates only future planned or deferred sessions. Exact completed and partial history remains attached to its original plan, while every new session stores placement date, selected route, rule version, strategy, and plain-language reasons.
- Target load derives from the latest completed exact movement first, then an existing exact prescription. A movement with no exact evidence keeps zero-load calibration and never borrows weight from another variation.
- Pain-aware placement pauses automatic generation and start until movement restrictions are reassessed. This remains a programming boundary, not diagnosis or medical clearance.
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
- Version 20 open-JSON backup with validated missed-opportunity evidence, replay-validated plan-route and exact-movement checkpoint reviews, athlete-reviewed exact-history placement, per-movement placement, equipment-aware route-session provenance, placement decisions, productive verification and recovery evidence, expanded record definitions, celebration controls, equipment profiles, plan, review, history and catalog changes, substitution, survey-evidence, and deferred-feedback history, integrity checks, versions 1 through 19 migration, preview, restore, malformed-file rejection, and automatic pre-restore undo.
- Original pixel-adventure visual language and installable PWA shell.
- Accurate completed, partial-primary, and partial-without-primary session states.

## Verified Journeys

- Complete onboarding and start directly at an experience-appropriate route.
- Open readiness, skip an individual question, and submit the remaining evidence.
- Select a minimal three-question check-in, mark one item not sure, submit two explicit answers, display low evidence confidence, set post-session surveys off, and finish directly without a modal or loss of training credit.
- Start immediately without a survey.
- Log an actual set, reload the app, and recover the active session locally.
- Explain why a primary exercise is being changed, inspect ranked evidence and tradeoffs, confirm the protected-anchor change, receive a movement-specific prescription, freeze the original exact-movement clock, and cancel the original lane's active placement check without losing replacement history.
- Finish a partial session with or without feedback and update progress only from completed sets.
- Defer post-session feedback, verify the next workout remains fully available, complete the optional follow-up later, and replay an unverified numeric best into a quality-validated record from the same completed source set.
- Navigate Today, Plan, Progress, Library, and You on desktop and a 390 px phone viewport.
- Export a complete local backup, validate and preview it, restore it, and recover the pre-restore state.
- Switch every progress horizon and prove chart, body-lens, and headline totals equal the selected completed source sets.
- Select the calendar quarter, show monthly quarter points, inspect exact movement mix and priority attention, and preserve exact-width phone containment without turning volume share into a stimulus or enjoyment claim.
- Preview a 30-minute plan revision, apply it, preserve partial history, inspect both plan versions, reload, and recover the active version from local persistence.
- Export and preview a verified version 19 backup containing replay-validated plan-route and exact-movement checkpoint reviews, exact-history reviews, per-movement placement, equipment-aware route-generated session provenance, productive verification evidence, expanded records, athlete preferences, training locations, plan versions, ledgers, survey evidence, and deferred-feedback provenance.
- Create a distinct custom movement, edit its canonical metadata, block an exact alias collision, save a non-conflicting identity without changing its stable ID, inspect the zero-volume catalog ledger entry, and undo the edit.
- Document two intentionally separate exact-name matches, review the resulting three-identity cleanup group, keep Competition Bench Press, retire both copies in one merge, verify the group disappears, and restore both identities through undo.
- Complete one set from a stored sixteen-set route-generated session, show one of sixteen linked sets, distinguish older completed sets with no stored plan, classify chest from its exact planned mappings, and preserve all unlinked work in Progress without counting it as plan compliance.
- Import a source-dated CSV with an exact alias and an unmatched legacy name, require canonical mapping before commit, preserve unverified row provenance, block a second import from duplicating volume, and undo the complete import in one action.
- Confirm a planned hold remains a hold after an athlete edits actual load, then log, provisionally recognize, save, and replay a source-backed exact-movement load record.
- Turn quiet mode on, reload, and confirm the preference persists without changing training or record calculations.
- Verify the achievement and settings surfaces on desktop and phone with no browser errors or horizontal overflow.
- Review a custom movement's direct and secondary muscle mapping, confirm the replay notice and audit description, inspect its explicit mapping in the movement detail, and undo the review without changing completed history or the stable canonical ID.
- Reconcile a stored route-generated plan to its mapped intended sets, preserve repeated raw planned-set IDs as distinct exercise-slot evidence, and keep all unlinked completed work separate from linked muscle-plan completion.
- Create and persist a home-gym profile, activate it after reload, review four exact equipment conflicts before training, start without losing the workout, block unavailable set logging, enforce a 2.5 lb barbell input step, and replace an unavailable movement only with a candidate available at that location.
- Choose Home Gym during onboarding, preview its generation contract, prove every generated secondary and accessory movement is available there, preserve all protected anchors, store the location snapshot under `route-session-v3`, and begin with no avoidable support-work conflict.
- Enter recent experience, capacity, schedule, evidence, and restriction inputs; receive a high-confidence direct-strength cycle recommendation; place a new squat in Introductory Skill, a prepared bench in Direct Strength, and an uncertain sumo deadlift in Bridge and Calibration; choose a conservative global route; persist the independently adjusted movement lanes; and inspect the complete evidence in You.
- Report that pain changes movement choice, receive a pain-aware modified route with a non-medical warning, prove both workout-start paths remain disabled, and reopen onboarding without deleting existing history.
- Complete a normal placement check through warm-up, a source-linked first primary set, post-session quality and time-fit feedback, and a recovery response; inspect the final verdict and complete evidence on the athlete profile after reload.
- Mark the warm-up painful, finish without fabricating a set or survey, and prove the next automatic workout start is paused for athlete reassessment without silently rewriting the selected route.
- Complete two supportive source-linked productive checks, resolve recovery, receive a confirm-current checkpoint, inspect all four measurable criteria, save an athlete-authored keep-current reason, and preserve the complete replayable evidence without silent reclassification.
- Complete two source-linked bench checks with sequence one and two inside the bench lane, keep squat and deadlift evidence independent, preserve the earned bench prompt after the queue advances, inspect all four exact-lane criteria, save the athlete-authored lane decision, and prove that programming was not silently changed.

## Deliberately Deferred

- Imported-history placement inference, automatic application of movement-lane route changes, complete fixed-event periodization, and calibrated velocity or power evidence.
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
