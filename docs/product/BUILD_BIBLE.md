---
type: product-build-bible
aliases: [Adaptive Training App Build Bible, App Build Bible]
tags: [fitness, app, product, architecture, requirements, build]
created: 2026-08-10
updated: 2026-08-31
status: canonical-build-reference-and-active-implementation
version: 1.75.0
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: product-decision
---

# Adaptive Strength and Hypertrophy App Build Bible

### Version 1.75.0 Change Entry

- Advanced the working application to private alpha 0.79.0 without changing backup schema 30, local persistence 31, the 251-movement catalog, or the Supabase cloud-authoritative boundary.
- Added R-489 through R-493 and Chapter 106 for scope-first active-workout replacement, bodyweight logging, phase-safe progress cues, quiet Set 1 autofill presentation, and shared workout previews.
- Preserved completed work, exact movement histories, separate set completion, prior block versions, and athlete-approved programming authority.
- Verified 539 deterministic tests and all 159 desktop Chromium, Android-style mobile Chromium, and iPhone WebKit journeys before release packaging.

## 106. Workout Scope, Bodyweight Progress, and Future Preview

### 106.1 Scope-First Active Replacement

The active workout's `Change` action presents `This workout` and `Entire training block` as peer choices before candidate selection. The written consequence and final action repeat the selected scope. Workout scope changes only the active session. Block scope applies the selected movement in the active session, creates an append-only block version, and regenerates future planned sessions from the corresponding recurring slot. Completed and partial sessions, former exact history, and previous plan versions remain unchanged. Primary movement changes retain their separate intent confirmation.

### 106.2 Bodyweight Load and Record Identity

Pull-ups, dips, and other explicitly eligible movements expose a two-state bodyweight or active-unit control. Bodyweight applies only to unfinished sets, removes external-load entry, shows `BW`, and stores a dedicated load-mode field with zero external load at completion. It never reinterprets completed evidence. Bodyweight records are the best repetitions in one completed set and the best total repetitions across completed sets in one session. Absolute-load, estimated-strength, and load-volume records remain external-load concepts.

### 106.3 Phase-Safe Motivation

Progress cues remain present from calibration and bridge work through development. No exact history produces a baseline cue tied to the planned sets and repetitions. A planned record produces an available cue. Work below an existing record produces a build cue naming the current best and the exact next threshold without adding stress. Reacclimation alone does not suppress these informational cues. Protect, pain-aware, irritating-joint, avoid, and unsafe-effort gates pause record pursuit and preserve the written reason. Every cue is display-only.

### 106.4 Quiet Autofill and Shared Preview

Set 1 continues to fill only untouched fields in later ordinary straight sets. The workout omits the repeated explainer paragraph while keeping editable rows, origin protection, and a separate `Log set` action for every row. Today and each Plan queue item open the same read-only workout-preview component. It lists session time, movement count, objective, exact planned sets, repetitions, load mode, latest exact exposure, and one evidence-backed cue. Preview state cannot start, pin, edit, complete, or progress a session.

### 106.5 Acceptance

Deterministic acceptance covers bodyweight record taxonomy, baseline, reacclimation cues, load-mode persistence, Set 1 draft behavior, block versioning, active-session preservation, completed-history preservation, and backup round trip. Browser acceptance covers absent autofill explainer copy, visible copied values, separate set completion, Today and Plan preview entry points, unchanged serialized sessions after preview, bodyweight `BW` rows, mobile containment, console integrity, and desktop Chromium, Android-style mobile Chromium, and iPhone WebKit.

### Version 1.74.0 Change Entry

- Advanced the working application to private alpha 0.78.0 without changing backup schema 30, local persistence 31, the 251-movement catalog, or the Supabase cloud-authoritative boundary.
- Added R-485 through R-488 and Chapter 105 for a read-only full training-block outlook with time remaining, round-by-round state, progression order, and honest deload timing.
- Preserved athlete authority by leaving future exact targets unknown until review and making preview state presentation-only.

## 105. Full Training-Block Outlook

### 105.1 Persistent Preview Route

Every active training-block blueprint exposes `Preview full block`. The read-only dialog shows the current round, total planned rounds, recorded rounds, planned rounds remaining including the current round, approximate training weeks left, and an expected final review date if each remaining round takes about one week. It explains that life interruptions may stretch a round and that passing dates do not complete work.

### 105.2 Round and Progression Visibility

The outlook lists every target round plus the final block review. Each round is written as Recorded, Current, or Planned. Recorded reviews may show their saved decision, the current round shows qualified important workouts, and future rounds state that exact targets wait for the prior review. Progression is shown as load first, then repetitions, then working sets, with holds and reductions still governed by exact completed evidence.

### 105.3 Deload Timing and Authority

When recovery is not currently recommended, the outlook says `No fixed deload date` and identifies the planned recovery decision after the final target round. If current evidence recommends recovery, it says so and shows the source reason. Pain, fatigue, technique, or unresolved work may support an earlier recovery proposal. Previewing never schedules a deload, applies progression, edits the block, or counts estimates as completed work.

### 105.4 Acceptance

Deterministic and browser acceptance covers all summary facts, current and planned round states, progression order, deload wording, unchanged serialized plan data, dialog focus and close behavior, responsive text wrapping, contained horizontal round scrolling, desktop Chromium, Android-style mobile Chromium, and iPhone WebKit.

### Version 1.73.0 Change Entry

- Advanced the working application to private alpha 0.77.0 without changing backup schema 30, local persistence 31, the 251-movement catalog, or the Supabase cloud-authoritative boundary.
- Added R-481 through R-484 and Chapter 104 for explicit workout-only versus training-block replacement scope, staged confirmation, before-and-after recurring movement changes, plain terminology, and preservation acceptance.
- Kept exact movement histories independent and preserved every completed workout and prior block version.

## 104. Movement Replacement Scope and Progression Ownership

### 104.1 Two Different Decisions

An active-workout replacement changes one workout only. A training-block replacement changes one recurring blueprint slot for future planned workouts in the current block. Athlete-facing screens call these `this workout only` and `future workouts in this training block`. Internal schemas may retain mesocycle and microcycle names, but ordinary interface copy uses training block and training round.

### 104.2 Workout-Only Flow

The active workout opens with a visible scope panel stating that the original movement remains in the training block. Candidate selection stages a choice and shows the exact original and replacement names before mutation. The final action reads `Change this workout only`. The replacement receives a prescription and progression evidence from its own exact history or conservative calibration. The original movement stays scheduled in future rounds and its exact progression clock is frozen only for the substituted workout.

### 104.3 Training-Block Flow

Every expanded blueprint movement exposes `Change for block`. The ordinary versioned editor remains the only block-level mutation path. Before application, the preview compares the current block with the proposed version and lists every recurring movement change, including changes proposed by regeneration. Each row identifies Before and After and states that the new movement will be scheduled and progressed for the rest of the block while the former movement keeps its completed history. The athlete must acknowledge the scope before Apply becomes available.

### 104.4 Preservation and Acceptance

Workout-only substitution never edits movement overrides or the block blueprint. Block revisions replace only future planned work, create an append-only version, and preserve completed or partial workouts. Exact histories never merge because two exercises serve a similar role. Deterministic acceptance covers direct blueprint actions, disabled Apply before acknowledgement, future-round replay, and plan-version preservation. Browser acceptance covers staged workout choice, protected-primary confirmation, exact-history calibration, desktop Chromium, Android-style mobile Chromium, iPhone WebKit, console integrity, and horizontal containment.

### Version 1.72.0 Change Entry

- Advanced the working application to private alpha 0.76.0 with backup schema 30 and local persistence 31 while preserving the 251-movement catalog and Supabase cloud-authoritative boundary.
- Added R-476 through R-480 and Chapter 103 for optional intra-workout exact-movement feedback, source-set provenance, progression consequences, athlete authority, and RP Hypertrophy research boundaries.
- Preserved the broader post-workout survey as a separate whole-session evidence layer.

## 103. Exact-Movement Completion Feedback

### 103.1 Trigger and Interaction

Logging the final set of each exact planned movement unlocks a short inline feedback panel beneath that movement's set table. The panel opens and scrolls into view when feedback is enabled, but it never blocks the athlete from continuing. The athlete may answer, skip, leave individual questions unknown, edit before finishing, or collapse the panel. Adding another set makes the earlier response stale until the added work is complete and the feedback is updated.

### 103.2 Question Contract

The ordinary check asks joint response, technique consistency, target stimulus, load and repetition fit, and hard-set volume. Recovery from the last exact exposure appears only when prior exact history exists. Minimal and quick modes reduce burden, while Off mode prevents automatic interruption and leaves a collapsed voluntary entry point. Optional free text records setup or context but never drives programming by itself.

### 103.3 Provenance and Exact-Lane Authority

Every response stores its rule version, session, planned movement, canonical exercise, written exercise name, completed planned-set IDs, and a common recorded bench angle only when every completed set shares it. Feedback from another exercise, variation, or setup cannot satisfy the lane. Exact-movement answers take precedence over broad post-session answers only for the matching movement. Skipped or missing items remain unknown.

### 103.4 Progression Consequences

Completed load, repetitions, RIR, and quality remain primary. Pain that changed training blocks overload and added volume for the movement. A too-heavy target or broken technique holds load and repetition progression. `At my limit` caps set increases. `Too much` supports a one-set reduction without mathematically increasing a low set count. `Just right` holds dose while load or repetitions may progress. `Could do more` supports another set only when comparable performance, manageable fatigue, and later recovery also agree.

### 103.5 Athlete Control, Research, and Acceptance

The panel previews the likely future consequence before save. No answer diagnoses pain, changes today's work, silently rewrites a future plan, or independently earns more work. Every future change remains an athlete-approved proposal. RP Hypertrophy public sources inform the pump, soreness, workload, pain, load, repetition, and set progression model, but ForgePath does not claim to reproduce RP's proprietary algorithm. Deterministic acceptance covers question budgets, conditional recovery, safety previews, exact provenance, load and repetition holds, set caps and reductions, unknowns, backup migration, and low-set monotonicity. Browser acceptance covers immediate final-set reveal, saving, persistence, responsive containment, console integrity, and desktop Chromium, mobile Chromium, and iPhone WebKit.

### Version 1.71.0 Change Entry

- Advanced the working application to private alpha 0.75.0 and `athlete-level-v2` without changing backup schema 29, local persistence 30, route-session-v4, the 251-movement catalog, or the Supabase cloud-authoritative boundary.
- Added R-472 through R-475 and Chapter 102 for progressively slower levels, bounded per-workout rewards, record-burst protection, anti-grind source rules, and transparent recalculation from unchanged training truth.
- Raised level 2 to 200 points and made every later level cost 75 more points than the prior level.

## 102. Progressively Slower Forge Journal Levels

### 102.1 Curve

Forge level 2 requires 200 points. The cost of each following level is `200 + 75 × (current level - 1)`. Level 3 therefore costs 275, level 4 costs 350, and level 10 costs 875. This steadily increasing requirement keeps the early loop understandable while making higher journal levels meaningfully longer-term.

### 102.2 Bounded Source Awards

A completed workout earns 100 points. An honest partial workout that completed primary work earns 70. Any number of validated record views sourced from the same workout share one 25-point bonus. Numeric-only record views share one 10-point bonus only when that source workout does not already own a validated bonus. A movement earns one 25-point breadth award after appearing in three distinct completed workouts.

### 102.3 Anti-Grind Boundary

Raw tonnage, absolute load, repetitions, working-set count, athlete-added sets, workout duration, surveys, and multiple record categories from the same source workout do not award additional level points. A five-movement first workout may create many legitimate record views, but it remains one completed-workout award and one bounded record-workout bonus. More work than prescribed is never the fastest route to a cosmetic level.

### 102.4 Recalculation and Training Separation

Forge level is derived display state. Version 2 recalculates it from the athlete's unchanged completed sessions, source records, and exact movement exposures. A v1 level inflated by raw tonnage or many record rows may display lower after correction. That is an economy repair, not a deletion or a judgment: completed sets, records, plans, placement, readiness, and programming remain unchanged. The interface states that rewards are bounded and each later level requires more points.

### 102.5 Acceptance

Deterministic acceptance covers a blank journal, completed and partial sessions, record-workout deduplication, validated-over-numeric precedence, tonnage invariance, set-count invariance, three-workout movement breadth, increasing level cost, form reachability, and source explanation. Browser acceptance proves that a first workout containing fifteen sets, five movements, and thirty validated record views remains Forge level 1 at 125 of 200 points across desktop Chromium, Android-style mobile Chromium, and iPhone WebKit.

### Version 1.70.0 Change Entry

- Advanced the working application to private alpha 0.74.0 and route-session-v4 with backup schema 29 while keeping the 251-movement catalog, local persistence 30, Home Gym preference v3, completed history, and Supabase cloud-authoritative boundary intact.
- Added R-467 through R-471 and Chapter 101 for returning and undertrained repetition floors, demonstrated readiness before low-repetition work, high-repetition Leg Developer programming, and athlete-approved existing-plan upgrades.
- Preserved route-session-v1 through v3 plans exactly. New v4 prescriptions apply only through new onboarding or an athlete-approved plan version.

## 101. Returning and Undertrained Repetition Safety

### 101.1 Transitional Route Floors

Introductory Skill, Rebuild, Calibration, and Base Building are not low-repetition strength-expression routes. Their primary prescriptions are at least eight repetitions and their secondary prescriptions are at least ten. Rebuild changes from 2 by 6 to 2 by 8 and Calibration changes from 3 by 6 to 3 by 8. A high RIR remains useful effort evidence but cannot independently justify the greater absolute loading and skill demand of six-repetition work.

### 101.2 Low-Repetition Readiness Gate

Six repetitions or fewer requires stable current continuity, at least two years of structured training, and experience, movement-skill, intensity-tolerance, and exact-evidence levels of three or higher. Unknown, returning, interrupted, or undertrained state routes to Introductory Skill, Rebuild, Calibration, or Base Building. Power retains its stricter four-or-higher gate. This rule selects a training route and does not claim universal medical safety.

### 101.3 Leg Extension and Curl Floor

Knee Extension and Leg Curl movements never prescribe ten repetitions or fewer. The Freak Athlete Home Gym profile raises Leg Extension, Single-Leg Extension, and Lying Leg Curl to a fifteen-repetition starting target. A substituted Leg Developer movement progresses inside fifteen to twenty repetitions. Athlete edits, pain, exact setup, and separately logged history remain authoritative.

### 101.4 Substitution and Existing-Plan Safety

Substitutions use the same readiness and movement-specific floors. An athlete without demonstrated low-repetition readiness receives at least eight repetitions for a primary replacement, ten for a secondary replacement, and twelve for accessory or tertiary work. A Home Gym Leg Developer replacement begins at fifteen.

Existing route-session-v3 sessions, prescriptions, completed work, and approved plan versions remain unchanged. Plan shows a calm review notice only when every protected anchor has the movement-placement evidence required for route-session-v4. The athlete previews the new prescription and supplies a revision reason before applying a new version.

### 101.5 Persistence and Acceptance

Backup schema 29 accepts route-session-v4 and migrates schema 28 without rewriting stored sessions. The current engine preserves version-specific route profiles so old v3 evidence continues to validate against its original six-repetition Rebuild and Calibration prescriptions. Deterministic acceptance covers route floors, readiness gates, Leg Developer targets, substitution ranges, old-policy validation, backup migration, and the athlete-approved Plan review. Browser acceptance covers onboarding output, stored v4 provenance, mobile layout, console integrity, and horizontal containment.

### Version 1.69.0 Change Entry

- Advanced the working application to private alpha 0.73.0 without changing the 251-movement catalog, backup schema 28, local persistence 30, Home Gym preference v3, or the Supabase cloud-authoritative boundary.
- Added R-464 through R-466 and Chapter 100 for Set 1 workout-entry autofill, protected manual exceptions, and separate set completion.
- Added field-level entry provenance so later straight sets can follow a corrected Set 1 value without overwriting athlete-authored exceptions or structured technique rows.

## 100. Active Workout Set Autofill

### 100.1 Set 1 Template Contract

Set 1 is the entry template for each exact movement's ordinary straight sets. When the athlete enters load, repetitions, or RIR/RPE, ForgePath copies only that field into later unfinished straight sets in the same planned exercise. Each movement has its own template boundary. No value crosses into another exercise.

### 100.2 Manual Exception and Structure Protection

Autofill records field-level origin. A later field the athlete edits manually becomes an exception and remains unchanged if Set 1 is corrected again. A field that still came from Set 1 may follow that correction. Completed sets, skipped sets, drop-set rows, and myo-rep rows are protected. Bench angle is excluded because a valid set ladder may intentionally use different angles.

### 100.3 Truth and Completion Boundary

Copied values count as accepted draft entry but never as completed training. Autofill does not press `Log set`, change prescribed targets, judge success or failure, create a record, trigger progression, or change the plan. Each row remains editable and retains its own explicit completion action. Only completed source sets enter history, volume, records, placement evidence, and later programming.

### 100.4 Persistence and Acceptance

Field-level entry provenance persists inside the existing validated session snapshot. Backup schema 28 and local persistence 30 remain compatible because the metadata is optional and older sessions without it remain valid. Deterministic tests prove copy, correction, exception, legacy-value, completion, skip, and structured-row behavior. Browser acceptance proves the visible helper copy, load/repetition/effort propagation, edit protection, separate log actions, persistence, and phone and desktop containment.

### Version 1.68.0 Change Entry

- Advanced the working application to private alpha 0.72.0 without changing the 251-movement catalog, backup schema 28, local persistence 30, Home Gym preference v3, or any Supabase cloud-authoritative data boundary.
- Added R-461 through R-463 and Chapter 99 for independently collapsible training days, truthful closed-day summaries, and progressive disclosure of the upcoming-session queue and long life-aware explanation.
- Kept Day 1 open for immediate orientation, later days closed for scanability, and every disclosure keyboard, touch, focus, and screen-reader operable.

## 99. Plan Progressive Disclosure

### 99.1 Collapsible Training-Day Contract

Every training day in the repeatable weekly blueprint is independently collapsible. Day 1 opens by default to establish the workout grammar. Every later day begins collapsed so a seven-day schedule remains scannable. The closed summary retains the written day number, session title, objective, estimated duration, movement count, and planned working-set count. Expanding or collapsing changes presentation only and never mutates the plan.

### 99.2 Secondary Detail Hierarchy

The upcoming-session queue and the long life-aware missed-work explanation are secondary Plan material. Both remain available behind labeled disclosure controls and begin collapsed. The weekly route, block facts, movement-stability contract, recovery checkpoint, review state, and primary edit action remain visible because they define the current plan rather than explain optional depth.

### 99.3 Interaction and Accessibility

Each training-day control uses one full-width button with at least a 44-pixel target, written Show or Hide language, a state chevron, visible hover and focus states, `aria-expanded`, and `aria-controls`. Closed content is removed from the accessibility tree. Compact layouts preserve the summary hierarchy without horizontal scrolling at 320 pixels or wider. Desktop Chromium, Android-style mobile Chromium, and iPhone WebKit must prove independent expand and collapse behavior.

### 99.4 Preservation Boundary

Progressive disclosure is interface state only. It does not enter the backup, Supabase snapshot, plan version, workout history, movement override, schedule evidence, or programming engine. App updates may reset which panels are visually open without losing or changing athlete data.

### Version 1.67.0 Change Entry

- Advanced the working application to private alpha 0.71.0 while keeping the 251-movement catalog, backup schema 28, and every Supabase cloud-authoritative data boundary unchanged.
- Added R-456 through R-460 and Chapter 98 for Home Gym preference v3, incline-first pressing, block-stable Two-Board, Close-Grip, and Spoto rotation, separate exact histories, and preservation boundaries.
- Added bench boards to the system Home Gym profile and advanced local persistence to 30 so untouched profiles receive the capability without replacing athlete-owned locations.
- Added deterministic ranking, rotation, equipment, blueprint-frequency, and protected-flat-primary acceptance.

## 98. Home Gym Incline and Triceps Press Emphasis

### 98.1 Incline-First Hierarchy

Automatic Home Gym support work ranks ABX incline barbell and dumbbell pressing above ordinary flat assistance. A standard round reserves an incline exposure when a suitable press is not already present and the declared time budget allows it. Competition Bench Press and any athlete-selected flat primary remain protected.

### 98.2 Targeted Flat Exceptions

Two-Board Press, Close-Grip Bench Press, and Spoto Press remain purposeful flat movements because they train the triceps and specific bench ranges. One is selected deterministically from the plan version and remains stable within that block. New plan versions rotate through the three rather than making one permanent.

### 98.3 Exact History and Equipment

Each press keeps its own canonical ID and exact completed history. Loads, repetitions, RIR, pain, notes, and progression never transfer between variants. The seeded Home Gym profile declares bench boards alongside the existing barbell, bench, and rack capabilities so Two-Board Press is executable.

### 98.4 Athlete and Safety Boundaries

Time fitting, equipment availability, pain, dislike status, athlete-approved movement overrides, and protected anchors outrank automatic preference. The rule changes only newly generated support work and never rewrites completed training or an active athlete-authored block.

### 98.5 Persistence and Acceptance

The 251-movement catalog, backup schema 28, and Supabase snapshot contract remain unchanged. Local persistence version 30 re-merges the updated untouched Home Gym profile while preserving athlete-owned locations. Acceptance covers incline-over-flat ranking, three-version triceps rotation, at least two incline exposures in a normal long-form round, targeted triceps inclusion, protected Competition Bench Press, equipment fit, profile merge, and cross-device browser regression.

### Version 1.66.0 Change Entry

- Advanced the working application to private alpha 0.70.0 while keeping backup schema 28 and every Supabase cloud-authoritative data boundary unchanged.
- Added R-451 through R-455 and Chapter 97 for Home Gym preference v2, preferred barbell hinge and shrug work, frequent cambered-bar rowing, provisional pull-up calibration, upper-body support priority, and low calf frequency.
- Added the Home Gym deficit-platform capability and advanced local persistence to 29 so untouched system profiles receive it without replacing athlete-owned locations.
- Added deterministic acceptance proving two row exposures and one pull-up exposure in a normal three-session round, exact pull-up history superseding the estimate, no more than one calf opportunity, and preservation of protected anchors and athlete-approved movement choices.

## 97. JB Home Gym Programming Preference v2

The second versioned Home Gym policy expands the preferred repertoire without changing the athlete-control hierarchy. The system Home Gym profile explicitly includes a deficit platform. Conventional deficit deadlifts, Romanian deadlifts, and stiff-leg deadlifts are the preferred barbell hinge builders. Barbell Shrug is the preferred direct upper-trapezius accessory. Pain, avoid status, exact equipment availability, protected anchors, and athlete-approved block choices remain stronger than every automatic preference.

In a normal three-session round, automatic support work reserves the ABX Cambered-Bar Chest-Supported Row in two sessions and Pull-Up in the remaining session when the declared time budget can contain them. Larger rounds reserve rows in at least two thirds of sessions and one pull-up exposure in the final session. Reserved back work receives an accessory role so upper-body development remains present even when the declared region rotation would otherwise omit it. A saved block with athlete movement overrides is not silently reflowed to make room for the new reservations.

JB's stated current pull-up ability becomes a provisional three-set, five-repetition starting target only when there is no exact completed pull-up history or existing planned pull-up prescription. It remains load zero, does not create history, records, confidence, or progression evidence, and is visibly described as an estimate. Exact logged pull-up sets replace the estimate, including their completed set count, repetitions, load, effort, and later progression evidence.

Calves remain available in the Exercise Library and through athlete choice, but automatic Home Gym accessory rotation allows calves in no more than the final session of a training round and applies a strong negative ranking. This is a low-priority ceiling, not a ban. The policy changes no stored data shape, backup contract, cloud table, authentication rule, or Supabase snapshot behavior.

### Version 1.65.0 Change Entry

- Advanced the working application to private alpha 0.69.0 while keeping backup schema 28 and every Supabase cloud-authoritative data boundary unchanged.
- Added R-446 through R-450 and Chapter 96 for JB Home Gym preference v1, exact equipment capabilities, three canonical movement identities, automatic planning boundaries, and preservation-safe migration.
- Advanced local test persistence to version 28 so existing profiles receive the current protected catalog and untouched Home Gym template without replacing athlete-owned data.

## 96. JB Home Gym Programming Preference v1

JB expects most training to occur at Home Gym. The first versioned preference policy ranks movements only after pain, avoid state, equipment availability, protected anchors, and athlete-approved block choices have been respected.

The strongly preferred repertoire is ABX dumbbell and barbell incline pressing at recorded angles, ABX cambered-bar and dumbbell chest-supported rows, Squat Press, Safety Squat Bar and high-bar squats when squatting is useful, Bulgarian split squats, Leg Developer extensions and lying curls, red-band pull-aparts, parallel-bar and weighted dips, and flat cambered-bar bench press. Squat Press is eligible as an athlete-selected primary anchor and is the strongest automatic squat-pattern secondary builder.

Automatic Home Gym support selection excludes Low-Bar Back Squat and de-prioritizes other free-weight squat volume. This rule never removes a protected anchor. Cambered Bar Bench Press remains a flat-bench movement and never exposes incline controls. ABX Cambered-Bar Chest-Supported Row retains optional exact-angle tracking because the adjustable back pad changes its repeatable setup identity.

The canonical catalog adds Squat Press with Cybex and athlete-language aliases, ABX Cambered-Bar Chest-Supported Row, and Red-Band Pull-Apart. The Home Gym template adds squat press machine, safety squat bar, cambered bar, dip station, and resistance bands. Existing athlete-owned locations, movement preferences, aliases, plans, completed sets, and Supabase snapshots remain authoritative.

### Version 1.64.0 Change Entry

- Advanced the working application to private alpha 0.68.0 while keeping backup schema 28 and every Supabase cloud-authoritative data boundary unchanged.
- Added R-441 through R-445 and Chapter 95 for a separate Traps Library region, curated movement base, Plan and split integration, dedicated trapezius dose, and preservation-safe migration.
- Advanced local test persistence to version 27 so existing profiles receive the protected catalog taxonomy without splitting Barbell Shrug history or replacing athlete preferences.

### Version 1.63.0 Change Entry

- Advanced the working application to private alpha 0.67.0 while keeping backup schema 28, local persistence 26, and every cloud-authoritative training-data boundary unchanged.
- Added R-436 through R-440 and Chapter 94 for anatomically targeted body-region art, a clear preference symbol, movement-specific visual mapping, automated image integrity, and all-flow responsive acceptance.
- Expanded the movement system from twenty broad generated scenes to forty-one mapped scenes backed by forty reviewed local files, while preserving written exercise identity and saved setup as the authority.

### Version 1.62.0 Change Entry

- Advanced the working application to private alpha 0.66.0 while keeping backup schema 28, local persistence 26, and every cloud-authoritative training-data boundary unchanged.
- Added R-431 through R-435 and Chapter 93 for one original generated destination family, one coherent Exercise Library movement family, written Level badges, source provenance, optimized local delivery, and cross-device acceptance.
- Retained written destination and exercise identity as the accessible and training-truth authority when visual assets are decorative or unavailable.

### Version 1.61.0 Change Entry

- Advanced the working application to private alpha 0.65.0 while keeping backup schema 28 and preserving all completed training, block choices, equipment profiles, and Supabase snapshot behavior.
- Added R-426 through R-430 and Chapter 92 for the Freak Athlete Hyper Pro, ABX bench, Leg Developer, angle-aware chest-supported rows, home-gym programming preference, catalog migration, and compact-phone acceptance.
- Advanced local test persistence to version 26 so existing browser profiles re-merge the current system catalog and untouched equipment templates without replacing athlete-owned profiles or preferences.

### Version 1.60.0 Change Entry

- Advanced the working application to private alpha 0.64.0 and backup schema 28 while preserving completed workouts, imported history, movement identities, and every earlier plan version.
- Added R-421 through R-425 and Chapter 91 for direct exact-movement past-performance entry from the Exercise Library.
- Captures date, sets, repetitions, load, pounds or kilograms, RIR or RPE, optional incline angle, optional paired technique and pain feedback, session name, and setup notes.
- Preserves unknown effort and quality as unknown, records direct-entry provenance, supports per-set correction and deletion plus one-step undo, and never creates a fake planned session.
- Routes the exact saved sets into records, placement evidence, load selection, backup, and the cloud-authoritative snapshot with version 27 migration and responsive browser acceptance.
- Passes 458 deterministic tests, 135 desktop Chromium, mobile Chromium, and iPhone WebKit journeys, and the Pages artifact gate.

### Version 1.59.0 Change Entry

- Advanced the working application to private alpha 0.63.0 and backup schema 27 while preserving every completed workout, earlier plan version, and training-rule identity.
- Added R-416 through R-420 and Chapter 90 for the complete training-block blueprint, weekly movement-role map, whole-block estimates, athlete-approved movement swaps, exact incline setup persistence, and completed-block reuse review.
- Added explicit separation between the stable movement contract and adaptive load, repetition, dose, schedule, and recovery proposals.
- Added version 26 migration, malformed-override rejection, deterministic future-round persistence, component interaction coverage, compact-screen blueprint-first ordering, modal scroll reset, and horizontal-containment acceptance.

### Version 1.58.2 Change Entry

- Advanced the working application to private alpha 0.62.2 while preserving backup schema 26 and every training-rule identity.
- Added R-415 and Chapter 89 for normal phone Chrome session continuity, mobile keyboard submission, persistent resend protection, and Chrome-safe email-link guidance.
- Added the complete iPhone WebKit-engine interface suite beside desktop Chromium and Android-style mobile Chromium, increasing browser acceptance from 86 to 129 journeys.
- Corrected the development-only security policy so local WebKit acceptance no longer upgrades loopback Vite modules to an unavailable HTTPS endpoint; the production HTTPS build retains `upgrade-insecure-requests`.
- Added iPhone safe-area and standalone metadata without changing Supabase authority, invitation-only identity proof, or Home Screen handoff security.

### Version 1.58.1 Change Entry

- Advanced the working application to private alpha 0.62.1 while preserving backup schema 26 and every training-rule identity.
- Advanced R-414 and Chapter 88 with a no-new-email transfer path for an athlete whose default browser already has a verified renewable session.
- Added a sixty-second send cooldown and precise account-safe messages for Supabase email-send and request throttles.
- Added structured handoff failure codes, actionable recovery guidance, and rollback of the redemption claim when server token creation fails so the same unexpired code can be retried.
- Retains the invited-email proof, public-signup denial, exact-origin enforcement, digest-only code storage, and renewable installed-app session boundary.

### Version 1.58.0 Change Entry

- Advanced the working application to private alpha 0.62.0 while preserving backup schema 26 and every training-rule identity.
- Added R-414 and Chapter 88 for a secure verified-Safari to installed Home Screen session handoff.
- Uses a random 100-bit one-time code, digest-only server storage, five-minute expiry, atomic redemption, approved-origin enforcement, and a server-generated magic-link token hash.
- Keeps the installed app signed in with its own renewable Supabase session after the one-time setup without placing reusable Auth tokens in the URL or clipboard.
- Added the fifth checksum-locked migration, fifteenth forced-RLS table, deployed `pwa-handoff` Edge Function, and live nine-check production acceptance evidence.

### Version 1.57.1 Change Entry

- Advanced the working application to private alpha 0.61.1 while preserving backup schema 26 and every training-rule identity.
- Made the renewable Supabase Auth session explicitly use durable browser storage without changing its existing storage key, so the release preserves already-verified browsers.
- Added regression coverage for persistent session storage, automatic token renewal, email-link return handling, and update cleanup isolation.
- Verified the live project has no session timebox or inactivity timeout. A verified browser remains signed in until explicit sign-out, browser site-data removal, or server-side revocation.

### Version 1.57.0 Change Entry

- Advanced the working application to private alpha 0.61.0 while preserving backup schema 26 and every training-rule identity.
- Advanced R-314, R-316, and R-380 with one durable account-scoped pending snapshot, safe same-device rebasing, post-kill replay, and truthful live save-state labels.
- Keeps Supabase authoritative and removes the pending local payload after authenticated confirmation.
- Preserves both copies and blocks editing when the pending snapshot and a newer cloud version diverge.
- Keeps passwordless login invitation-only. `Log in with email` starts one verified email confirmation on a new or signed-out browser, after which the renewable session opens the device automatically until sign-out.
- Added R-413 as a dedicated-browser-origin gate before external athlete invitations because path-scoped Pages deployment does not isolate Auth or recovery storage from other applications on the parent origin.
- Added Chapter 87 for the exact interrupted-save and authentication boundary.

### Version 1.56.0 Change Entry

- Added R-412 and Chapter 86 for persistent, accessible update-ready notification.
- Advanced the working application to private alpha 0.60.0 while preserving backup schema 26 and every training-rule identity.
- Checks the exact public source marker immediately, once per visible minute, and after focus or reconnection.
- Saves pending cloud changes before refresh, refuses to navigate after a failed save, and keeps the notice visible until the athlete updates.
- Changed PWA activation to prompt mode and limited repair cleanup to ForgePath's worker and named caches so another Pages app on the shared origin cannot be disrupted.

### Version 1.55.0 Change Entry

- Advanced the working application to private alpha 0.59.0 while preserving backup schema 26 and all training-rule identities.
- Made the invited-email magic link the sole athlete-facing authentication path, with account creation disabled and non-enumerating responses.
- Kept reset and deletion behind a fresh email-link JWT no more than five minutes old, exact typed confirmation, and server-side self-only enforcement.
- Added exact installed-versus-published source comparison before cloud hydration or save.
- Added an always-available athlete-controlled pain effect signal that blocks added volume when pain changed training.
- Added deterministic 10,000-set persistence and analytics conservation coverage and expanded responsive browser acceptance to 84 journeys.

### Version 1.54.0 Change Entry

- Added R-404 through R-411 and Chapter 85 for long-term athlete simulation and cloud lifecycle acceptance.
- Added a deterministic 52-week replay covering stable progression, athlete-added work, missed family weeks, reacclimation, fatigue, pain, setup changes, cycle extension, recovery, analytics, records, calibration, and backup.
- Corrected recovery confidence so repeated explicit recovery answers can mature without a separate placement workflow.
- Corrected schedule-fit confidence so consistent attendance can mature without requiring a missed workout.
- Canonicalized backup checksums to the JSON actually transported, including optional undefined fields.
- Expanded the production rollback test to 52 weeks, 156 sessions, and 624 sets with idempotence, conflict, isolation, and zero-residue proof.
- Advanced the working application to private alpha 0.58.0 with backup schema 26 and preserved `progression-v2`, `volume-progression-v2`, `ongoing-confidence-v1`, and `cloud-sync-v1` rule identities.

## 0. Authority, Use, and Change Control

This document is the canonical build-oriented specification for the private-first adaptive strength and hypertrophy application. It converts JB's full product conversation, complete requirement register, training research, book synthesis, video research, product comparisons, and detailed process notes into one implementable system.

Use this source order when information conflicts:

1. A current direct decision from JB.
2. [[App Requirements Register]] for durable requirement identity and provenance.
3. This Build Bible for system behavior, screen contracts, data boundaries, implementation order, and acceptance tests.
4. The relevant detailed process or research note for deeper rationale.
5. [[Adaptive Strength and Hypertrophy App]] for project status and open questions.
6. [[Living App Development Outline]] as a compact historical outline.

Every material change must update the requirement register, this document or its linked specification, the project note, [[Hot Cache]], and [[Codex Session Log]]. Never silently overwrite a training rule. Version rule changes, calculation changes, exercise merges, plan revisions, and recommendation decisions so historical results remain explainable.

### Version 1.53.0 Change Entry

- Added R-395 through R-403 and Chapter 84 for feedback-gated progression and volume decisions.
- Replaced cross-session set pooling with latest exact prescribed-exposure evidence.
- Made missing RIR and quality feedback explicitly unknown and excluded athlete-added work from automatic overload qualification.
- Required pain, readiness, recovery, fatigue, exact comparable performance, and target ownership to clear before load, repetitions, or sets can increase.
- Added optional between-session recovery feedback and a usable numeric duration field.
- Advanced the working application to private alpha 0.57.0 with `progression-v2` and `volume-progression-v2` while preserving backup schema 25.

### Version 1.51.0 Change Entry

- Added optional per-set back-pad angle tracking for incline movements using an adjustable bench.
- Added the current Freak Athlete ABX 0°, 15°, 22°, 30°, 37°, 45°, 52°, 60°, 67°, 75°, and 85° back-pad positions as reference presets without restricting athletes to that equipment.
- Defined same-angle, high-to-low, low-to-high, independently edited, and untracked setup states.
- Separated PRs, workload records, micro wins, and automatic progression evidence by exact recorded angle. Mixed-angle sessions retain completed dose but cannot masquerade as a single-angle comparison.
- Required angle history, correction, backup validation, responsive controls, and carry-forward into future plan generation.
- Prohibited unearned biomechanical claims. The stored degree is setup evidence; athlete feedback and comparable history remain necessary to learn personal response.

The companion [[Build Bible Requirement Traceability Matrix]] maps every requirement to its implementation chapter and delivery phase.

### Locked Language

- `Athlete` means the app user, initially JB.
- `Exposure` means completed goal-relevant work for a movement, muscle, quality, or session role.
- `Comparable exposure` means work comparable enough in canonical exercise, variation, range, technique, effort, and context to support a progression decision.
- `Volume load` means the sum of `completed repetitions x actual external load` for every set.
- `Muscle dose` means direct and optional fractional set credit. It is not interchangeable with volume load.
- `Strength anchor` means a primary lift or movement the plan intentionally protects and progresses.
- `Secondary builder` means a movement chosen to improve the current strength anchor, weak point, or adaptation goal.
- `Working max` means a conservative programming input, distinct from an estimated or verified maximum.
- `Unknown` means missing, skipped, not answered, or unavailable. It never means good, bad, zero pain, or zero fatigue.
- `AI` means an optional language-model assistant unless a section explicitly refers to deterministic or statistical intelligence.

## 1. Product Definition

### One-Paragraph Pitch

An adaptive strength and hypertrophy coach that learns the athlete for life, protects meaningful strength progress, and keeps training productive when sleep, children, injuries, time, travel, or an irregular schedule disrupt the plan. It combines load-first progression, muscle-level volume intelligence, readiness and performance feedback, flexible training cycles, deep exercise history, transparent substitutions, and small measurable wins in a private pixel-adventure experience, giving the athlete the best next workout for the time, equipment, recovery, goals, and work they have actually completed.

### Product Thesis

The product is not a static program generator and not a chatbot that invents workouts. It is a longitudinal athlete operating system. It stores the athlete's actual training history, goals, constraints, preferences, joint response, exercise relationships, and personal response patterns. It produces a clear plan, observes what happens, explains what changed, and improves future decisions while preserving athlete control.

### Primary Athlete Problem

Most programs assume the week happened as written. JB's real training is sometimes interrupted by children, sleep, injury, work, time, equipment, or unpredictable life. A rigid calendar then either progresses unearned work, creates impossible catch-up volume, or makes the athlete feel behind. This app uses completed exposures and a rolling priority queue so the training path remains coherent even when the calendar is not.

### Core Differentiators

- Load-first progression with repetitions, recovered sets, holds, reductions, substitutions, deloads, and reacclimation as explicit alternatives.
- Calendar time for planning and reporting, completed-exposure time for progression.
- Strength anchors plus muscle-level hypertrophy allocation in one program.
- Daily through all-time volume and progress views with overlap-safe body-region analysis.
- A canonical exercise system that recognizes exact movements, variations, aliases, duplicates, history, joint response, and transfer hypotheses.
- Optional surveys that improve personalization without ever blocking training.
- Time-aware and equipment-aware workouts that preserve the highest-value work.
- Explainable decisions whose inputs, rules, confidence, and outcome are saved.
- A private-first learning period before any public or social release.
- An original two-dimensional pixel training-adventure layer that makes progress fun without obscuring serious training data.

## 2. Product Principles and Non-Negotiables

1. Completed qualified work drives progression. A planned or missed set contributes no volume and earns no progression.
2. Progress load first. If load is not earned, progress repetitions. Add a set only when load and repetitions have stalled, more dose is appropriate, and recovery, time, attendance, pain, and the block support it.
3. Progress is broader than overload. Better technique, lower RPE at the same work, improved range, a recovered movement, better time efficiency, restored consistency, or one extra final-set repetition can be a meaningful win.
4. Never manufacture progress. Holding, reducing, substituting, deloading, or reacclimating is correct when evidence does not support overload.
5. Do not create volume debt. Missed accessories may be restored when they remain a priority, but they are never blindly pasted into the next session.
6. Preserve athlete control. The athlete may skip questions, start immediately, change movements, correct history, override suggestions, or choose a more conservative option.
7. Explain every meaningful change. Show what changed, why, the evidence used, confidence, and what would change the decision next time.
8. Separate safety from ordinary readiness. Pain and serious symptoms can stop or redirect work. The app does not diagnose injuries.
9. Use exact identity and honest uncertainty. Do not compare different equipment, ranges, exercises, or techniques as if they were identical.
10. The deterministic engine owns training truth. Statistical learning can influence confidence and calibrated weights. Language models may interpret and explain but cannot mutate authoritative training state.
11. Missing data remains unknown. Skipping never becomes a negative readiness, adherence, or motivation signal.
12. Private by default. Collect only decision-useful data, protect it, and support correction, export, and deletion.
13. Never use shame. Disruption, low readiness, missed training, and a changed goal are planning evidence, not moral failure.
14. Gamification must reward valid performance and consistency, not unsafe escalation or junk volume.
15. Training content must retain provenance. Distinguish coach doctrine, scientific evidence, product heuristic, app observation, and personal response.

## 3. Scope, Release Strategy, and Success

### Private Incubation Decision

The first usable product is private and primarily for JB for several months. It is a real longitudinal product, not disposable demo code, but public-user complexity is intentionally deferred. Private incubation must preserve history across schema and rule changes so experiments can be compared instead of resetting the athlete model.

### First Private Usable Release

Must include:

- onboarding and entry-cycle placement;
- one athlete profile and private account;
- equipment profiles and available-time input;
- program and session generation with primary, secondary, and accessory roles;
- active workout logging with immediate local saves;
- set-level load, repetitions, RIR or RPE, technique, pain, and completion status;
- exact volume-load calculations and basic muscle-dose views;
- optional pre-session and post-session surveys with complete skipping support;
- comparable-exposure progression using load, repetitions, sets, and hold paths;
- missed-workout replanning and per-movement exposure clocks;
- exercise library, history, aliases, duplicate warnings, and educated swaps;
- Today, Plan, Progress, Library, and You navigation;
- PR validation, micro wins, and non-blocking celebrations;
- deterministic explanations and decision history;
- offline workout execution, private backup, and multi-device-ready data design;
- an initial original pixel visual system with focused-training mode.

### Explicitly Later

- public sign-up and broad onboarding optimization;
- public profiles or leaderboards;
- friends, social feeds, challenges, reactions, and friend PR prompts;
- coach-client accounts;
- billing and subscriptions;
- broad wearable integrations;
- advanced foundation-model coaching;
- autonomous model-driven programming;
- a separate analytics warehouse or custom model-training pipeline.

### Explicitly Excluded

- athlete-facing exercise-technique videos or demonstration feeds;
- licensed or embedded form-instruction libraries;
- athlete technique-video uploads;
- automated form-video analysis or scoring;
- video watch-time, completion, playlist, or recommendation systems.

### Product Success Measures

Private incubation is successful when:

- JB can start a workout in no more than two deliberate actions from Today when no check-in is wanted;
- every completed set survives app interruption or connectivity loss;
- computed volume exactly reconciles to source sets;
- the next target can always be traced to a prior completed comparable exposure and a versioned rule;
- missed sessions rebuild the plan without unearned progression or catch-up debt;
- shortened sessions preserve their stated priority and usually finish within the promised time band;
- exercise history remains continuous despite aliases, imports, substitutions, and corrected duplicates;
- survey completion is useful but survey skipping never reduces core functionality;
- the athlete can understand why a prescription changed without reading source code;
- false PRs, unsafe gamification, cross-user data leaks, and irreversible history corruption remain zero-tolerance defects;
- the app learns at least several demonstrably useful personal patterns without overstating confidence;
- daily use is faster and more motivating than maintaining a spreadsheet or static program.

### Public Readiness Gate

Do not move to public testing because a date arrived. Require stable schema migrations, tested backups and restore, reliable sync, Row Level Security tests, data export and deletion, accessible screens, safety language, longitudinal rule replay, crash monitoring, privacy documents, abuse controls for any social feature, and evidence that core recommendations are useful across more than one synthetic profile.

## 4. Primary End-to-End Journeys

### 4.1 First Launch and Placement

1. Explain the private coach concept, data ownership, survey optionality, and non-medical boundary.
2. Offer `Build My Starting Profile`, `Quick Start`, and `Import History` when import exists.
3. Collect current goal, fixed event, realistic frequency, time, equipment, training history, recent continuity, current capacity, movement skill, preferences, pain or restrictions, and evidence quality.
4. Allow any item or the full sequence to be skipped. Missing values reduce confidence rather than block placement.
5. Generate a multi-dimensional profile, not one global level.
6. Choose the highest appropriate entry route: introductory, reacclimation, bridge, base building, hypertrophy or powerbuilding, strength, power, event-specific, or pain-aware modified.
7. Show the recommendation, reasons, uncertain inputs, first-session verification plan, and rejected lower or higher routes.
8. Offer `This Looks Right`, `Start More Conservatively`, `I Am Ready for More`, `Correct My History`, and `Choose a Different Goal`.
9. Create the first macrocycle, mesocycle, microcycle, session queue, strength anchors, muscle priorities, and baseline athlete-model version.

### 4.2 Fast Daily Start

1. Today shows the next best session, expected time, main objective, readiness assumptions, and any known active restriction.
2. Athlete can tap `Start Workout Now` without answering a survey.
3. The engine uses completed history, active restrictions, equipment, time defaults, and the current plan. Unknown current readiness lowers confidence only.
4. The session opens immediately and saves locally.

### 4.3 Full Adaptive Session

1. Offer the ten-question pre-session survey or Quick Check.
2. Produce a readiness hypothesis: normal plan, confirm with warm-up, protect priority work, reacclimation, or pain-aware modification.
3. Present the warm-up and a skippable confirmation when it can change a decision.
4. Use warm-up and first-set evidence to confirm or revise the plan.
5. Log sets with fast load, repetitions, effort, completion, technique, and pain controls.
6. Permit substitutions, additional work, skipped work, and session shortening with clear effects.
7. Validate compatible PR opportunities already inside the plan. Do not escalate only for a record.
8. Finish the workout, compute actual work, show wins, and offer the ten-question post-session survey or immediate finish.
9. Save the recommendation outcome and update future calibration.

### 4.4 Time-Constrained Session

1. Athlete chooses 15, 20, 30, 45, 60, 75, 90+, custom minutes, or `unsure`.
2. The engine estimates warm-up, rest, setup, and transitions from personal history.
3. Preserve in order: safety and warm-up, minimum useful primary work, best secondary builder, priority accessories, maintenance work, optional finishers.
4. Do not make heavy training fit by cutting rest until quality fails.
5. Label removed, moved, supersetted, or expired work and explain the tradeoff.
6. A completed short session counts as a useful exposure and consistency win, not a failed long session.

### 4.5 Missed or Partial Session

1. A passed opportunity remains `not attempted` until the athlete confirms what happened.
2. Ask whether training occurred, the reason, next realistic opportunity, time, and whether the disruption continues.
3. Credit every completed set and completed primary or secondary exposure.
4. Freeze only missed movement clocks. Do not advance untouched calendar targets.
5. Recalculate recency, muscle-dose gaps, fatigue interactions, equipment, time, and continuity state.
6. Rank the rolling queue and propose the highest-value next session.
7. Offer `Rebuild My Week`, `Move This Session`, `Keep Only the Primary Work`, `Let This Session Go`, `My Schedule Is Still Uncertain`, and `Pin This Lift as Next Priority`.
8. Show what moved, expired, remained valid, or became lower confidence.

### 4.6 Exercise Swap

1. Athlete taps `Change Movement` on any exercise.
2. Optional reason chips include pain or joint, equipment, time, dislike, setup, occupied station, fatigue, novelty, or another reason.
3. Rank `Best Matches`, `Good Alternatives`, `Changes Today's Focus`, and `Browse Full Library`.
4. Every candidate shows what it preserves, what changes, why it ranks there, exact or family history, joint and enjoyment history, equipment, time, fatigue, and confidence.
5. Recalculate load, repetitions, sets, warm-up, ordering, duration, muscle dose, and fatigue from the selected movement's own history. Never copy load blindly.
6. Mark the original as `substituted`, freeze its progression clock, and attribute completed work to the replacement.
7. Require stronger confirmation if a protected primary changes the session objective.

### 4.7 Pain or Safety Event

1. Keep soreness, ache, and pain distinct.
2. Record location, severity, trend, affected motion, and whether function changed.
3. New severe, radiating, neurological, sudden, worsening, or major-function-loss signals stop or redirect affected work and recommend professional evaluation.
4. Ordinary movement irritation may change range, exercise, load, repetitions, sets, or session role.
5. Do not diagnose, predict pathology, or treat skipped pain questions as pain-free.

### 4.8 Cycle Review and Goal Change

1. Review completed exposure roles, performance, dose, joint response, fatigue, consistency, enjoyment, and parent-goal progress.
2. Choose continue and progress, continue and hold, extend, recover, change exercise or dose, complete, pivot, or reacclimate.
3. Ask whether goals, schedule, equipment, movements, pain, or desired aggressiveness changed.
4. Version the plan. Preserve the prior goal and cycle history.
5. Show how the new decision affects strength anchors, muscle priorities, cycle timing, and confidence.

### 4.9 Correction, Merge, Export, and Delete

1. Corrections append a new version or correction event and recompute affected derived values.
2. Exercise merges preserve original names, affected records, provenance, and undo.
3. PRs and summaries invalidated by a correction are recalculated and visibly superseded.
4. Export includes open JSON and CSV representations of workouts, sets, plans, goals, surveys, decisions, records, and exercise identity.
5. Deletion follows a confirmed, auditable process and removes cloud data and social projections according to documented retention behavior.

## 5. Information Architecture and Navigation

### Primary Navigation

Use five persistent destinations:

- `Today`: next action and fastest training entry.
- `Plan`: rolling queue, current week, cycle hierarchy, goals, and replanning.
- `Progress`: volume, strength, muscle, consistency, PR, enjoyment, joint, and learning views.
- `Library`: exercise discovery, history, categorization, preferences, and custom movements.
- `You`: athlete model, goals, equipment, survey controls, privacy, data, display, and app settings.

`Workout` is an immersive state launched from Today or Plan, not a permanent tab. `Friends` is later and should begin as a Progress subsection or Today card before earning a tab.

### Global Interaction Contract

- Important actions are visible buttons, not hidden gestures.
- Every recommendation offers `Why`, `Adjust`, and `Swap` where relevant.
- Destructive or history-changing actions require clear confirmation and an undo path when possible.
- Numbers, units, exercise identity, and active target remain readable above decorative art.
- Offline, syncing, saved, conflict, stale, and lower-confidence states are explicit.
- Focused-training mode removes optional animation and character interruption during sets.

## 6. Screen Contracts

### 6.1 Today

Purpose: answer `What is the best valuable thing I can do now?`

Required modules:

- next recommended session with primary objective and duration;
- `Start Today's Workout` and `Start Without Check-In`;
- time selector and `I Have Less Time`;
- current equipment location and `Change Equipment Location`;
- continuity, readiness, cycle, and active pain or restriction summary;
- brief explanation of why this session is next;
- recent result for the primary and eligible PR opportunity;
- moved, missed, or deferred work card when needed;
- small current pixel-world state and recent achievement.

States: normal, no plan, interrupted, returning, deload, peak, pain-aware, offline, sync pending, first use, completed today, and uncertain schedule.

Acceptance: the athlete can begin immediately, alter time or location before generation, and understand the top three reasons the session was chosen.

### 6.2 Active Workout

Required regions:

- session objective, elapsed and estimated remaining time;
- exercise cards grouped by primary, secondary builder, priority accessory, maintenance, and optional;
- set rows with planned and actual load, repetitions, RIR or RPE, completion, rest, technique, and pain;
- quick previous-result and exact-exercise history;
- warm-up and first-set confirmation when needed;
- `Change Movement`, `Shorten Session`, `Add Set`, `Skip`, `Stop for Pain`, and `Why This Target`;
- valid PR proximity and micro-win feedback;
- persistent local save and visible sync state;
- finish controls that never require the post-session survey.

Error recovery: restore in-progress state after crash, duplicate tap, backgrounding, clock drift, lost connectivity, or device restart. A set commit must be idempotent.

### 6.3 Plan

Required views:

- next-session rolling queue;
- rolling calendar week with planned and actual status;
- current microcycle, mesocycle, macrocycle, annual plan, and long horizon;
- strength anchors, priority muscles, maintenance qualities, and fixed events;
- exposure-role completion rather than weekday-only completion;
- planned and actual dates plus calendar-time and exposure-sequence axes;
- missed or deferred work decisions;
- historical plan versions and `why changed` records.

Primary actions: rebuild week, move session, pin priority, change goal, edit availability, adjust cycle, declare event, and review cycle.

### 6.4 Progress

Time ranges: Today, 7 Days, Week, 28 Days, Month, 3 Months, Year, All Time, and custom.

Required modules:

1. Current Direction.
2. Volume Explorer.
3. Muscle Balance Map.
4. Movement Frequency and Rotation.
5. Strength Anchor Dashboard.
6. What Builds What.
7. Enjoyment and Adherence.
8. Joint-Friendly Movement Matrix.
9. Time and Efficiency.
10. Consistency and Life Context.
11. Micro-Win Timeline.
12. What the App Has Learned.
13. Cycle and Goal Explorer.
14. PRs, Achievements, and Opportunities.

Every graph must state metric, unit, date basis, filter, comparison basis, and whether categories overlap. Planned and completed values must never look identical.

### 6.5 Volume Explorer

Required controls:

- volume load, working sets, repetitions, direct muscle sets, fractional muscle dose, average load, top load, estimated strength, duration, and density;
- whole body, upper body, lower body, trunk, arms, region, muscle, movement, exercise family, and exact exercise;
- daily, weekly, rolling, monthly, block, yearly, and all-time grouping;
- planned versus actual;
- exclusive region assignment, non-additive region involvement, or muscle-dose mode.

Drilldown must reach the source exercise and completed sets. Parent regions sum child values once. Overlapping custom groups must display an overlap warning.

### 6.6 Library Home

Entry points:

- Body Part;
- Movement Type;
- Training Role;
- Goal or Weak Point;
- Equipment;
- My Movements;
- Recently Used;
- Browse All.

Search supports names, aliases, abbreviations, equipment, movement family, muscle, role, and variation modifiers. Filters and ranking use the same taxonomy as the swap engine.

### 6.7 Exercise Detail

Required sections:

- canonical name, aliases, family, modifiers, muscles, regions, pattern, role, equipment, setup, and technique notes;
- preferred, neutral, disliked, unavailable, and avoid status;
- target-muscle feel, joint response, enjoyment, setup cost, fatigue cost, and confidence;
- last exact exposure, recent exact history, family history, best comparable performances, PRs, volume, and cycle use;
- relationship graph showing which primary it may build and evidence confidence;
- reusable setup fields and athlete notes;
- merge, alias, duplicate, or distinguish controls for custom movements.

Example requirement: opening Bench Press can show that it was last trained ten weeks ago, with the exact sets, repetitions, load, effort, variation, and resulting response.

### 6.8 You

Required sections:

- athlete profile and multi-dimensional placement;
- goals, fixed events, strength anchors, priority muscles, and desired aggressiveness;
- schedule patterns and time presets;
- equipment profiles by location;
- movement preferences and restrictions;
- survey modes by cadence;
- readiness and learning insights with correction controls;
- units, load conventions, accessibility, animation, focused mode, and notifications;
- privacy, AI consent, social consent, export, correction, account, and deletion;
- rule, knowledge-base, schema, and app version shown in diagnostics.

### 6.9 Empty, Error, and Offline States

- Never present a blank dashboard without a next useful action.
- Explain whether insufficient data, an active filter, a missing comparable exposure, or a sync issue caused the empty result.
- Permit workout logging and deterministic decisions offline.
- Queue optional AI summaries and social actions for later.
- Resolve sync conflicts explicitly when both sides changed an authoritative object.

## 7. Athlete Model

The athlete model is a versioned set of observations, stated preferences, inferred hypotheses, active constraints, and confidence. It is not a personality score.

### Core Dimensions

- identity, units, body mass history, and optional demographics;
- training experience and structured-training years;
- recent continuity over 7, 28, 56, and 84 days;
- movement skill by family and exact exercise;
- strength and intensity tolerance by lift;
- volume tolerance by muscle, pattern, and systemic cost;
- current goals and time horizon;
- fixed events and available buffers;
- schedule stability and actual opportunity pattern;
- equipment by location;
- pain, restriction, and known safety state;
- preferred, disliked, joint-friendly, productive, and unavailable movements;
- response to sleep, stress, soreness, fatigue, and interruption;
- survey response style and question usefulness;
- evidence quality, source, date, confidence, and staleness.

### Placement Profile

Store one-to-five statuses separately for training experience, recent continuity, movement skill, strength tolerance, volume tolerance, schedule stability, and data confidence. Never use age alone or one global level to downgrade the athlete.

### Personal Hypothesis Lifecycle

`candidate -> observing -> supported -> useful -> weakened -> retired`

Every hypothesis stores the claim, relevant scope, evidence rows, sample size, effect direction, uncertainty, last evaluated date, rule version, and athlete correction. Example: `sleep below personal baseline is associated with higher squat RPE, weak confidence, n=7`.

## 8. Training Plan and Cycle Model

### Goal Cascade

`long horizon -> annual plan -> macrocycle -> mesocycle -> microcycle -> session -> completed set`

Every child serves a parent objective. Every completed set can update the confidence or state of its parent layers.

### Cycle States

Base flow: `draft -> scheduled -> active -> completed`.

Additional states: `extended`, `recovering`, `replanned`, and `abandoned`. A replan creates a new version with reason, date, inputs, prior version, and affected exposure roles.

### Microcycle

A microcycle completes required exposure roles, not fixed weekdays. It stores minimum, target, and maximum days; required, optional, completed, substituted, waived, and expired roles; and the review reason. When its target date passes, it may extend. At the maximum span or when constraints invalidate remaining work, unresolved roles must be explicitly completed, substituted, waived, expired, or replanned.

### Mesocycle

Stores dominant adaptation, maintenance qualities, entry criteria, progression model, target microcycle range, minimum productive exposures, success criteria, and recovery or exit plan.

At each microcycle review choose:

- continue and progress;
- continue and hold;
- extend;
- recover;
- change exercise or dose;
- complete;
- pivot or reacclimate.

Calendar duration cannot complete a mesocycle by itself.

### Macrocycle, Annual Plan, and Long Horizon

- Macrocycle owns the major outcome, optional fixed date, ordered mesocycles, transfer intent, buffers, minimum viable path, and outcome review.
- Annual plan maps high- and low-availability periods, events, travel, family constraints, development, maintenance, and strategic reviews.
- Long horizon expresses one-to-four-year strength, physique, skill, participation, and health directions with widening uncertainty.
- Use `quadrennial` only for an exact four-year horizon.

### Fixed-Date Replanning

Preserve the event date, recalculate exposures remaining, spend buffer, retain specificity and protected primary work, remove lower-priority work, insert reacclimation when required, and update confidence. Never replace missed foundation with doubled workload.

### Maintenance Qualities

Every mesocycle identifies what is being developed and maintained. Use the smallest individually validated maintenance exposure that prevents unacceptable loss while preserving recovery for the dominant objective.

## 9. Session Architecture

### Role Order

1. `Primary`: the day's main strength anchor, tester, or dominant stimulus.
2. `Secondary builder`: chosen to improve the primary, weak point, or target adaptation.
3. `Priority accessory`: high-value direct work for a current muscle or technical need.
4. `Maintenance accessory`: minimum work for a non-dominant quality.
5. `Optional finisher`: removable without breaking the session objective.

### Secondary-Builder Relationship

Every builder relationship stores intended mechanism, affected primary or goal, evidence type, evidence confidence, athlete-specific outcome count, joint and fatigue cost, and current status. Examples include a conventional deficit deadlift to support low-back strength for a sumo deadlift, a board press to target triceps for bench, or a safety squat bar squat or good morning to support a squat. These are hypotheses until the athlete's results support them.

### Session Statuses

- completed as planned;
- completed with modification;
- partial, primary completed;
- partial, primary not completed;
- deferred to next opportunity;
- skipped and expired;
- stopped for pain or safety;
- not attempted.

### Planned and Completed Separation

Planned sessions, exercises, and sets remain separate from completed workout records. Editing a future plan does not rewrite what was completed. Completing an altered workout does not pretend the original prescription happened.

## 10. Progression Decision Engine

### Authority Order

1. Safety and active restrictions.
2. Program and cycle state.
3. Last completed comparable exposure.
4. Technique, range, effort, pain, and completion quality.
5. Recent continuity and days since exposure.
6. Readiness hypothesis.
7. Warm-up and first-set ground truth.
8. Block objective, time, equipment, and fatigue budget.
9. Personal response evidence with minimum sample and confidence.
10. Athlete override.

### Comparable-Exposure Key

The comparison key includes canonical exercise ID, relevant modifiers, equipment, range of motion, laterality, resistance profile, tempo or pause when material, session role, rep range, target effort, and training phase. The matcher may broaden from exact to family context only with an explicit confidence reduction and label.

### Gate 0: Is Progression Appropriate?

All must be evaluated:

- prior exposure completed rather than planned;
- acceptable technique and range;
- target RIR or RPE met closely enough;
- pain below the permitted threshold and not worsening;
- recency supports normal comparison;
- equipment and variation remain comparable;
- recovery and cycle state support progression;
- no fixed-event, deload, reacclimation, or safety rule blocks progression.

If the gate fails, valid outputs are hold, reduce, substitute, modify, deload, or reacclimate.

### Step 1: Progress Load

Progress load when the athlete owns the current prescription, normally after reaching the upper rep target at the intended effort. Choose the smallest sensible available increment based on the exact equipment, movement, current load, historical response, and percentage jump. Do not apply one universal increment.

### Step 2: Progress Repetitions

If the next load increment is not yet supportable, hold load and add one or more total repetitions inside the allowed rep range. Repetitions may be distributed unevenly, including one extra repetition on the final set.

### Step 3: Progress Sets

Consider one working set only when load and repetition progress have stalled across enough comparable exposures, technique and effort remain acceptable, the target muscle is recovering, recent attendance is stable, pain is not worsening, time permits, fatigue remains inside budget, and the mesocycle wants more dose. Never add a set as the default response to poor performance.

### Step 4: Hold or Regress Intelligently

Possible outputs:

- repeat to confirm ownership;
- keep work while improving technique, range, or effort;
- reduce a set;
- reduce load or repetitions;
- substitute the movement;
- extend rest;
- run a reacclimation exposure;
- enter or continue a deload;
- protect only the primary objective.

### Required Decision Record

Store original target, selected comparable exposures, gate results, progression candidates, blocked candidates, selected action, load increment, rule version, statistical features, confidence, athlete override, resulting work, and later outcome.

### Reference Algorithm

```text
build_context()
if safety_stop: return stop_or_redirect
identify_program_state()
last = find_last_comparable_completed_exposure()
if no_last: return calibrated_baseline_or_entry_prescription
gate = evaluate_progression_gate(last, current_context)
if gate.blocked: return safest_valid_hold_reduce_substitute_or_reacclimate(gate)
readiness = create_pre_session_hypothesis_or_unknown()
readiness = update_with_warmup_and_first_set(readiness)
if readiness.blocks_normal_progression: return targeted_adjustment()
if load_increment_is_owned_and_available: return progress_load()
if repetitions_can_progress_in_range: return progress_repetitions()
if plateau_confirmed_and_more_dose_is_recoverable_and_goal_relevant: return add_one_set()
return hold_and_define_next_evidence_needed()
```

### Undulation

Compare heavy to prior heavy, moderate to prior moderate, and volume to prior volume. Daily tonnage may intentionally rise and fall. The dashboard must distinguish planned undulation from unplanned decline.

### Working, Estimated, and Verified Maximums

Store these independently. A rep overperformance may propose a working-max change only after technique, range, context, equipment increment, projection reliability, and comparable-exposure checks. Never copy a paid program's protected table or use one maximum formula universally.

### Technical Floor

Progression cannot be earned by materially degrading the agreed movement standard. Technique evidence remains athlete-entered through concise structured feedback and optional personal notes. Athlete-facing video upload or automated video analysis is excluded.

## 11. Volume, Dose, and Progress Analytics

### Source Calculation

For completed set `s`:

`set_volume_load = completed_reps_s x normalized_external_load_s`

For an exercise, session, day, period, or exact non-overlapping group:

`volume_load = sum(set_volume_load)`

Never compute actual volume from planned sets. Retain original entered load, unit, normalized load, load convention, bodyweight contribution where defined, assistance, bands or chains, and calculation-version fields.

### Required Time Views

- session and daily;
- rolling 7 days and calendar week;
- rolling 28 days and calendar month;
- three months;
- mesocycle, macrocycle, and annual plan;
- calendar year;
- all time;
- custom range.

### Companion Metrics

Every volume view can pair volume load with completed working sets, total repetitions, top and average load, rep range, planned and actual RIR or RPE, estimated strength, direct muscle sets, fractional muscle dose, exposure count, completion rate, technique, pain, duration, rest, and density.

### Three Body-Area Calculation Modes

1. `Exclusive exercise volume load`: each completed set has one exclusive reporting region, so totals add correctly.
2. `Region involvement volume load`: a set can appear in every involved region, but results are labeled non-additive.
3. `Muscle dose`: direct and configurable fractional set credit. Parent regions sum unique child credits once.

Never add upper body, arms, chest, and triceps involvement views as if they were independent totals.

### Body Hierarchy

Top level: whole body, upper body, lower body, and trunk. Upper body includes chest, back, shoulders, and arms. Arms include biceps, triceps, forearms, and grip. Lower body includes quadriceps, hamstrings, glutes, calves, adductors, abductors, and hip flexors. Trunk includes abdominals, obliques, spinal erectors, and configurable bracing or low-back views. Exact production vocabulary is versioned.

### Open Load-Normalization Policies

Bodyweight, assisted bodyweight, cable stacks, pulley ratios, machines, unilateral loads, bands, chains, sleds, and accommodating resistance require explicit per-exercise conventions. Until validated, preserve source values and show volume as exercise-specific rather than falsely comparable. A convention change must recompute derived values under a new calculation version.

### Progress Types

- load;
- repetitions;
- set or recoverable dose;
- estimated strength;
- lower effort at equal work;
- better technique or range;
- increased density without quality loss;
- restored movement after interruption;
- improved joint response;
- time-fit improvement;
- consistency or return streak;
- new useful movement;
- better goal alignment.

### Planned Versus Actual

Show planned load, repetitions, sets, duration, muscle dose, and session role next to completed results. Variance must preserve reason: athlete choice, readiness adjustment, substitution, pain, time, interruption, equipment, or data correction.

## 12. Readiness, Fatigue, Preparedness, and Peaking

### Four Separate Estimates

- `Acute readiness`: likely capacity today.
- `Accumulated fatigue`: repeated training and life stress suppressing response.
- `Preparedness`: current ability to perform the target quality based on specific practice and development.
- `Peak state`: date-driven expression of fitness through reduced fatigue and retained specificity.

Do not collapse these into one wellness score.

### Decision Sequence

1. Safety.
2. Program state: stable, interrupted, returning, accumulating fatigue, deloading, or peaking.
3. Pre-session hypothesis when data exists.
4. Warm-up confirmation.
5. First-set confirmation.
6. Smallest targeted adjustment that preserves the session purpose.
7. Post-session outcome and later recovery learning.

### Adjustment Knobs

Exercise, range, load, repetitions, sets, target RIR, rest, order, advanced methods, session duration, movement priority, and exposure purpose may change independently. Do not express every low-readiness result as a blanket percentage reduction.

### Sleep and Life Stress

Use deviation from the athlete's own baseline. One poor night mainly changes confidence and monitoring. Repeated sleep loss plus performance decline has more influence. Wearables remain optional context. The app cannot diagnose or treat a sleep disorder.

### Peaking

Require a declared event or test date. Reduce volume before removing all intensity, retain specific lift practice, individualize taper length from prior response, and store every outcome. Feeling fresh after time off is not a peak.

## 13. Surveys and Feedback Learning Loop

### Universal Skip Contract

Every onboarding, pre-session, warm-up, during-session, post-session, next-day, weekly, monthly, and block question is optional. Each question supports `Skip`, `Not Sure`, and `Prefer Not to Answer` where appropriate. Each survey supports full, quick, minimal, off, ask each time, and immediate continue controls.

Skipping cannot block training, mark a session incomplete, invent an answer, lower adherence, break a streak, trigger repeated nagging, or erase a known active safety restriction. Store response status separately from response value.

### Ten Pre-Session Questions

1. Sleep duration.
2. Sleep quality from very poor to excellent.
3. Nutrition readiness from under-fueled to fully fueled.
4. Hydration.
5. Physical energy.
6. Life stress.
7. Motivation.
8. General physical fatigue.
9. Soreness, aches, or pain with location and trend.
10. Actual available time and deadline flexibility.

### Pre-Session Outputs

- Normal plan.
- Confirm with warm-up.
- Protect priority work.
- Reacclimation.
- Pain-aware modification.

Except for clear safety overrides, the survey forms a hypothesis and should not automatically reduce work before performance evidence.

### Warm-Up Confirmation

When useful, ask whether the movement felt better than expected, normal, slower or harder, painful, or technically unstable. Combine this with actual load, repetitions, effort, and technique.

### Ten Post-Session Questions

1. Overall session difficulty or session RPE.
2. Easier or harder than expected.
3. Target-muscle stimulus: too little, good, too much, or unsure.
4. Pump or local response.
5. Technique confidence.
6. Pain that appeared or worsened.
7. End-of-session fatigue.
8. Fit to available time and energy.
9. Especially productive or unproductive exercises.
10. Optional note or voice input for what the numbers missed.

### Feedback Processing

Objective training logs are authoritative. Structured answers become normal application records. Free text or voice may later produce proposed tags through an LLM, but the athlete confirms ambiguous meaning. A model cannot directly alter pain state, sets, load, cycle completion, or progression eligibility.

### Survey-Fatigue Controls

Use one-tap chips, saved defaults, conditional body maps, estimated completion time, optional voice, one deferred post-session reminder, and adaptive question selection. Frequent skipping should reduce question burden, not change training readiness.

## 14. Schedule Adaptation and Missed-Workout Engine

### Two Clocks

- `Calendar clock`: planned dates, opportunities, reporting periods, and life events.
- `Exposure clock`: actual completed sequence for each lift, family, muscle, role, and session type.

The next target comes from the exposure clock. The calendar clock decides when to offer and how to report it.

### Continuity States

Initial heuristics, subject to calibration:

- `stable`: at least 80 percent of planned sessions completed over 28 days with no unusual relevant gap;
- `interrupted`: 50 to 79 percent or a meaningful gap;
- `returning`: below 50 percent or a gap that makes old capacity uncertain.

These are provisional product thresholds, not scientific truths. Training age remains separate.

### Missed-Opportunity Check-In

Ask whether training happened, why not, the next realistic opportunity, likely available time, and whether the disruption ended, continues, or is uncertain. Reason options include children or family, work, time, travel, sleep, illness, pain, equipment, motivation, and other.

### Replanning Algorithm

1. Reconcile completed, modified, partial, or missed work.
2. Record reason and ongoing constraint.
3. Update performance and dose from completed work only.
4. Freeze missed progression clocks.
5. Recompute days since useful exposure.
6. Recompute continuity and readiness confidence.
7. Rank overdue roles.
8. Build the highest-value session that fits equipment, time, pain, and recovery.
9. Prescribe from the last completed comparable exposure.
10. Explain held, moved, reduced, substituted, waived, and expired work.
11. Use rebuilt-session results to determine return speed.

### Session Priority Components

- block and goal priority;
- strength-anchor protection;
- days since useful exposure;
- muscle-dose gap;
- skill-decay or detraining risk;
- fatigue interaction with recent and following work;
- available time and equipment;
- pain and readiness;
- cost of another delay;
- athlete preference or manual pin.

Show the highest-impact reasons. Do not hide them inside an unexplained score.

### Family-Schedule Behavior

One missed session may be deferred or reduced to its most valuable work. Two or more misses trigger a rebuilt sequence and reduced optional fatigue. A long gap can trigger reacclimation. Childcare or work disruption does not imply physiological fatigue, while illness or pain can require a more conservative return.

## 15. Exercise Knowledge System

### Canonical Exercise Identity

Every exercise has an immutable ID and structured signature containing:

- canonical name and aliases;
- exercise family and movement pattern;
- body regions and muscles;
- implement and equipment;
- body position and bench or torso angle;
- grip, stance, and laterality;
- range of motion and start condition;
- tempo and pause;
- resistance profile and accommodation;
- training roles and weak-point relationships;
- custom or system origin;
- definition version and retirement state.

### Required Catalog Depth

The library must extend beyond generic gym movements. It should represent powerlifting and powerbuilding variations such as two-board press, three-board press, coffin press, pin press, floor press, close-grip variations, cambered-bar press and row, safety squat bar, box and pause squats, good mornings, sumo and conventional deadlifts, deficit deadlifts, block pulls, rack pulls, paused pulls, specialty bars, chains, bands, tempos, partial ranges, and machine or cable variations. Exact catalog scope is phased and versioned.

### Taxonomy Views

Browse by body part, muscle, movement type, exercise family, training role, primary-builder relationship, goal, weak point, equipment, athlete preference, joint response, recently used, and personal movements. One exercise may appear in several views while retaining one canonical history.

### Exact and Family History

Exact history supports progression. Family history provides contextual estimates and transfer evidence. The interface must label which is being shown. A safety squat bar squat is related to but not identical with a competition squat.

### Duplicate Classification

- `exact`: same canonical signature;
- `probable duplicate`: normalized name or signature strongly matches;
- `related variation`: same family but a meaningful modifier differs;
- `distinct`: separate identity.

Before creating a custom movement, show likely matches and offer `Use Existing`, `Add Alias`, `This Is Different`, `Merge`, or `Create Anyway` with a disambiguating field. Merges are auditable and reversible.

### Athlete Exercise Model

Store preference, joint response, target-muscle response, progression rate, fatigue cost, setup time, completion rate, substitution history, best-use roles, confidence, and staleness separately from global exercise metadata.

## 16. Substitution Recommendation Engine

### Hard Eligibility Filters

Remove candidates that violate available equipment, active restrictions, intolerable pain history, required movement or muscle purpose, session time, or an explicit athlete block.

### Ranking Features

- preserves session role and primary objective;
- trains the intended muscle or weak point;
- supports the relevant strength anchor;
- exact or family familiarity;
- current joint response;
- available equipment and setup time;
- likely fatigue and recovery cost;
- historical progress and target feel;
- athlete enjoyment and completion;
- current cycle and nearby sessions;
- reason for the requested swap;
- data confidence and staleness.

### Output Tiers

- `Best Matches`: preserve nearly all important constraints.
- `Good Alternatives`: preserve the main purpose with modest tradeoffs.
- `Changes Today's Focus`: viable but materially changes purpose, dose, or fatigue.
- `Browse Full Library`: athlete-controlled escape hatch.

### Prescription Recalculation

Use the chosen exercise's exact history first, related-family context second, then conservative calibration. Recompute warm-up, load, repetitions, sets, effort target, order, duration, muscle dose, fatigue cost, and lower-priority work. Never transfer weight between different bars, machines, angles, ranges, or resistance profiles without a validated conversion.

### Learning Event

Store requested reason, candidates, ranking version, selected movement, override, prescription, completion, target feel, pain, enjoyment, time fit, and later recovery. Repeated outcomes may adjust ranking only after a minimum evidence threshold.

## 17. PRs, Achievements, and Motivation

### PR Taxonomy

- absolute load best;
- repetition best at a given load;
- load best for a repetition target;
- exact set-scheme best, such as `4 x 12 at 235`;
- estimated-strength best;
- exact-movement session volume best;
- comparable workout-day volume best;
- rep, set, density, technique, return, consistency, and block achievements.

Scopes include recent, block, return, calendar year, and all time. Exact movement and family records remain distinct.

### Comparability and Validation

Validate canonical identity, range, technique, equipment, assistance, load convention, effort, phase, correction state, and calculation version. Only completed work establishes a record. A volume PR is a workload record and does not automatically justify more volume.

### Opportunity Prompt

Before a planned eligible set, show the last comparable result and a valid opportunity such as `175 x 8 was your best here. The planned 180 x 8 would be a new load-for-reps record.` The prompt may highlight a programmed target but cannot independently increase it.

### Celebrations

Use concise pixel reactions, record cards, cycle-map progress, unlockable cosmetics, and a micro-win timeline. Celebrations never interrupt an active set, shame a non-record session, or imply that every workout needs a PR.

### Corrections and Offline

PR records point to source sets. Correcting or merging history recalculates active records and supersedes invalid ones. Local and cloud validation must use the same rule version so offline records do not duplicate or conflict after sync.

## 18. Pixel Training Adventure Design System

### Direction

Create an original two-dimensional pixel training-adventure world inspired by the inviting clarity and collectability of classic handheld role-playing games, without copying Pokémon characters, names, maps, creatures, interfaces, or protected visual assets.

### Hybrid UI Rule

Use crisp modern interface components for numbers, forms, accessibility, charts, safety, and workout speed. Use pixel art for the athlete avatar, supporting characters, emblems, environment, reactions, celebrations, and optional journey maps.

### Visual Components

- customizable athlete avatar;
- original training companions or coaches with narrow functional roles;
- one optional original four-form training companion with source-backed levels, post-workout XP, athlete-confirmed evolution, and continued post-apex progression;
- gym room, journal, journey map, or town-like progress environment;
- emblems for movement families, muscles, cycles, and achievements;
- emoji-like pixel reactions for effort, recovery, pain-aware caution, PRs, and micro wins;
- cosmetic environment progress tied to verified behavior, not spending or punishment;
- small idle animations outside active sets;
- reduced-motion and focused-training modes.

### Original Companion Boundary

The emotional reference may be a familiar monster-training progression, but the product must own its character world. References such as Machop, Machoke, Machamp, Gigantamax, G-Max, Dynamax, and Pokémon are shorthand for a satisfying small-to-developed-to-champion-to-apex arc only. Do not reproduce names, recognizable anatomy, four-arm progression, giant-form silhouettes, signature clouds or energy, costumes, interface language, sounds, fonts, numeric thresholds, trade mechanics, battle transformation rules, or evolution effects.

Companion progression is cosmetic and motivational. It never changes athlete placement, exercise selection, progression eligibility, readiness, fatigue, pain decisions, or cycle status. Detailed behavior is specified in Chapter 66 and [[Pixel Training Adventure Visual and Interaction System]].

### Design Tokens to Establish

- pixel grid and export scales;
- limited core palette plus semantic safety and data colors;
- modern interface typeface plus optional pixel display typeface;
- spacing, radius, border, shadow, chart, and icon rules;
- animation duration, frequency, and maximum simultaneous motion;
- light and dark themes with contrast-tested data states.

### Accessibility

Do not encode status through color or character expression alone. Support text labels, sufficient contrast, large tap targets, screen readers, scalable text, reduced motion, focused mode, and non-pixel alternatives for detailed numerical content.

### Initial Visual Prototype

Prototype Today, Active Workout, Progress, and Exercise Detail first. These four screens test the balance between delight, numerical density, workout speed, and the app's original identity.

## 19. Recommended Technical Architecture

### Status of This Recommendation

The product behavior in this Bible is locked unless JB changes it. The technology choices below are the recommended starting implementation and remain replaceable after a focused spike. Platform choice is the largest unresolved implementation decision.

### Recommended First Client

Continue the responsive installable TypeScript PWA as the first private phone-and-laptop client. Optimize active workout use for mobile and planning, analytics, imports, and data review for laptop while keeping every core workflow available on both. Replace the temporary browser store with a durable local operational database and authenticated cloud sync before claiming multi-device readiness.

Reasons:

- the current PWA already provides one working responsive surface on phone and laptop;
- workout logging remains phone-first while long-range planning and analysis benefit from laptop space and input;
- one TypeScript domain model can serve deterministic rules, sync, and both responsive modes;
- one cloud account and canonical history avoid a premature split between native and desktop products;
- the original pixel layer remains asset-driven and client-independent.

Keep a later React Native and Expo client as an evidence-gated option for stronger native distribution, background behavior, notifications, sensors, or device integration. It must use the same domain contracts, IDs, cloud records, and sync rules. Before the multi-device milestone, complete an architecture spike proving durable browser storage, migrations, offline recovery, foreground or resumed sync, active-workout handoff, the most complex Progress chart, pixel rendering, accessibility, and private distribution on at least one phone and one laptop.

### Recommended Repository Shape

```text
apps/
  mobile/
  admin-research/             optional later
packages/
  domain/                     entities, value objects, units
  rules/                      progression, readiness, scheduling, PRs
  data/                       repositories, schemas, migrations
  sync/                       outbox, reconciliation, conflicts
  analytics/                  derived metrics and chart queries
  exercise-knowledge/         taxonomy and seed catalog
  ui/                         shared components and tokens
  pixel-world/                original assets and presentation logic
  ai-gateway-contracts/       optional provider-neutral schemas
supabase/
  migrations/
  functions/
  tests/
docs/
  architecture-decisions/
  fixtures/
```

Keep domain and rules packages free of React Native, Supabase, and AI-provider dependencies. This permits deterministic tests, replay, and future platform changes.

### Runtime Layers

1. Presentation and interaction.
2. Application use cases and command handlers.
3. Deterministic domain engine.
4. Local repositories and derived queries.
5. Sync outbox and conflict resolution.
6. Supabase Postgres cloud system of record.
7. Server functions for privileged operations.
8. Optional statistical features and AI gateway.

### Local-First Workout Contract

- Starting a workout creates a local authoritative session immediately.
- Every set, answer, substitution, timer event, and adjustment is committed locally before the UI confirms success.
- Use client-generated sortable unique IDs so offline events can sync idempotently.
- Changes enter an outbox with entity version, device, sequence, and timestamp.
- Workout execution never waits for cloud or AI.
- Cloud acknowledgement clears the outbox entry but does not delete source event history.
- An in-progress workout can be restored after process death or restart.

### Supabase Role

Supabase Postgres is the leading private cloud system of record for account history, cross-device sync, relational integrity, aggregates, backups, and optional retrieval. Use Supabase Auth, Row Level Security, versioned migrations, Storage only where required, Edge Functions for short privileged workflows, and background jobs for heavy recomputation.

### Conflict Policy

- Append-only set and event IDs deduplicate automatically.
- Current-state records use explicit version checks.
- Edits to the same completed set on two devices require a visible conflict resolution or deterministic correction ordering with both originals preserved.
- Plan versions never overwrite completed training.
- Exercise merge conflicts pause canonical reassignment until validated.
- Server time may record receipt, but athlete-local event time and timezone remain preserved.

## 20. Core Data Model

All authoritative tables include `id`, `user_id` where athlete-owned, `created_at`, `updated_at`, `source_device_id`, schema or definition version where relevant, and soft-retirement or correction fields when history must persist.

### Identity and Preferences

- `users`: authentication identity and account state.
- `athlete_profiles`: units, body mass, profile version, current placement summary.
- `privacy_preferences`: collection, AI, sharing, retention, and consent settings.
- `survey_preferences`: cadence-specific full, quick, minimal, off, or ask mode.
- `notification_preferences`: survey, training, PR, cycle, and later social controls.
- `devices`: device identity, sync cursor, app version, and last seen.

### Goals and Availability

- `goals`: type, priority, target metric, horizon, status, confidence, and parent relationship.
- `events`: meet, test, vacation, travel, family, work, or other fixed constraint.
- `availability_windows`: planned opportunities, actual opportunities, minutes, and location.
- `equipment_profiles`: home, commercial, work, travel, hotel, temporary, or bodyweight.
- `equipment_items`: implement, increments, stack convention, availability, and notes.

### Exercise Knowledge

- `exercises`: canonical identity and system or custom origin.
- `exercise_aliases`: normalized alias, source, language, and approval state.
- `exercise_modifiers`: structured variation dimensions.
- `exercise_muscles`: direct or secondary role and default credit.
- `exercise_regions`: exclusive reporting region and involvement relationships.
- `exercise_relationships`: builder, regression, progression, substitute, or related-family edge with provenance.
- `athlete_exercise_profiles`: preference, joint response, target feel, fatigue, setup, confidence, and current status.
- `exercise_merge_events`: from IDs, target ID, reason, version, affected rows, actor, and undo state.

### Cycles and Planning

- `goals` and `goal_versions`.
- `annual_plans` and `long_horizons`.
- `cycles`: type, parent, objective, dates, criteria, state, version, and prior version.
- `cycle_exposure_roles`: required or optional roles and resolution state.
- `program_versions`: immutable generated or edited plan definitions.
- `planned_sessions`: objective, priority, duration, location, status, and queue position.
- `planned_exercises`: exercise, role, purpose, prescription, comparability key, and priority.
- `planned_sets`: target load, repetitions, RIR or RPE, rest, and set type.
- `progression_states`: last comparable exposure, current target, plateau evidence, and clock state.
- `working_max_history`: value, lift, source, confidence, and effective window.

### Completed Training

- `workout_sessions`: planned-session link, status, start, finish, actual duration, context, and local sync state.
- `workout_exercises`: planned-exercise link, actual exercise, role, order, status, and substitution link.
- `workout_sets`: set type, load, unit, normalized load, repetitions, RIR or RPE, range, technique, rest, completion, and correction state.
- `exercise_substitution_events`: original, candidates, selection, reason, ranking version, and effects.
- `session_adjustment_events`: original prescription, change, reason, evidence, and actor.
- `pain_and_joint_events`: location, severity, trend, movement, restriction, and safety route.
- `time_and_interruption_events`: available time, interruption type, duration, and impact.

### Feedback and Learning

- `survey_instances`: type, offered time, mode, completion status, and session or cycle link.
- `survey_questions`: versioned definition and safety classification.
- `survey_answers`: response state and typed value.
- `exercise_feedback`: target feel, joint response, enjoyment, setup, and comment.
- `session_feedback`: session RPE, fit, fatigue, expectation, and summary.
- `athlete_corrections`: target entity, old representation, corrected representation, reason, and actor.
- `derived_feature_snapshots`: exact features used at one decision time.
- `personal_hypotheses`: claim, scope, state, confidence, sample, and staleness.
- `hypothesis_evidence`: source event and contribution.

### Decisions and Records

- `recommendation_decisions`: authoritative selected action and state.
- `decision_input_snapshots`: rules, comparable exposures, features, and known unknowns.
- `decision_candidates`: candidate, rank, blocked state, and reasons.
- `decision_reason_codes`: stable explainable codes and copy template version.
- `recommendation_outcomes`: completion, athlete judgment, recovery, and later evaluation.
- `rule_engine_versions`: semantic version, effective date, migration, and release notes.
- `calculation_versions`: volume, estimated strength, muscle dose, and PR definitions.
- `pr_definitions`, `pr_records`, `pr_opportunities`, `pr_validation_events`, and `achievement_events`.

### Research and AI

- `knowledge_documents`: approved source identity, version, confidence, and rights status.
- `knowledge_passages`: retrievable text, topic, and source link.
- `knowledge_base_versions`: included document versions and release state.
- `ai_interactions`: task, provider, model, prompt version, source IDs, structured result, validation, cost, latency, and retention state.

### Social Tables, Later

Use separate `social_profiles`, `friend_requests`, `friendships`, `groups`, `blocks`, `visibility_preferences`, `shared_activity_events`, `shared_pr_events`, `reactions`, `challenges`, `challenge_attempts`, and `social_notifications`. Social tables store sanitized projections, never permissions into private workout tables.

## 21. Domain Events and Command Contracts

### Core Commands

- `StartWorkout(sessionId, context)`
- `RecordSet(workoutExerciseId, setPayload, idempotencyKey)`
- `CorrectSet(setId, correctionPayload)`
- `CompleteExercise(workoutExerciseId, status)`
- `SubstituteExercise(plannedExerciseId, selectedExerciseId, reason)`
- `AdjustSession(sessionId, adjustment)`
- `CompleteWorkout(workoutId, status)`
- `RecordSurveyAnswer(instanceId, questionId, responseState, value)`
- `SkipSurvey(instanceId)`
- `ReplanAfterMiss(plannedSessionId, missContext)`
- `EvaluateProgression(exposureKey, currentContext)`
- `MergeExercises(sourceIds, targetId, reason)`
- `UndoExerciseMerge(mergeEventId)`
- `ReviewCycle(cycleId)`
- `ChangeGoal(goalId, versionedChange)`
- `ExportAthleteData(format)`
- `RequestAccountDeletion()`

### Core Events

- `WorkoutStarted`
- `SetRecorded`
- `SetCorrected`
- `ExerciseCompleted`
- `ExerciseSubstituted`
- `SessionAdjusted`
- `WorkoutCompleted`
- `SurveyOffered`
- `SurveyAnswerRecorded`
- `SurveySkipped`
- `TrainingOpportunityMissed`
- `PlanRebuilt`
- `ProgressionEvaluated`
- `RecommendationOverridden`
- `PRValidated`
- `AchievementEarned`
- `ExerciseMerged`
- `ExerciseMergeReversed`
- `CycleStateChanged`
- `GoalVersionCreated`
- `AthleteHypothesisChanged`
- `SyncConflictDetected`
- `DataExportCompleted`

### Event Integrity

Events use stable IDs, local occurrence time, timezone, server receipt time, actor, device, entity version, rule version, and provenance. Consumers must be idempotent. Corrections and supersession preserve the original event.

## 22. Derived Analytics and Personal Learning

### Reproducible Derivation

Daily through annual views, muscle dose, estimated strength, continuity, comparable exposure, time accuracy, PRs, and personal hypotheses must be reproducible from authoritative source records plus a calculation version. Do not store only the latest total.

### Initial Statistical Methods

- rolling means and medians;
- exponentially weighted trends;
- exercise-specific estimated-strength trend;
- completion and adherence ratios;
- response by days-since-exposure;
- simple correlations and regularized regression only when sample supports it;
- anomaly detection against personal baseline;
- confidence intervals or interpretable uncertainty bands;
- minimum sample thresholds;
- stale-data decay.

### Allowed Influence

Statistical features may change ranking weights, confidence, time estimates, follow-up-question selection, and bounded recommendation aggressiveness. They cannot bypass hard safety, progression, identity, privacy, or cycle-state rules.

### Learning Examples

- whether sleep loss predicts higher squat RPE;
- whether stress changes attendance more than performance;
- recovery time after heavy hinges;
- per-muscle set tolerance before response worsens;
- which substitutions produce stimulus with lower joint cost;
- the shortest workout reliably completed;
- whether a rolling queue outperforms fixed weekdays;
- time-estimate error by exercise and location;
- how quickly each lift returns after an interruption.

### Correction Interface

Every visible learned statement offers `Correct This`, `Not Anymore`, `This Depends`, or `Do Not Use This`. A correction changes hypothesis state and future use, not the historical evidence.

## 23. AI, Knowledge Base, and Decision Authority

### Three-Layer Model

1. Deterministic rules own arithmetic, progression, scheduling, cycle state, safety boundaries, identity, permissions, and deletion.
2. Personal statistics learn patterns and calibrated weights.
3. An optional language model interprets unstructured feedback, retrieves approved knowledge, summarizes patterns, and explains bounded choices.

The first release is fully useful with layers one and two and requires no OpenAI or Anthropic key.

### Appropriate Language-Model Tasks

- propose structured tags from voice or free-text feedback;
- suggest possible canonical matches for an unknown exercise nickname;
- explain a saved deterministic decision in plain language;
- summarize a verified week, month, cycle, or year;
- answer questions from the approved training knowledge base with citations;
- explain tradeoffs among already eligible substitution candidates;
- identify contradictions or missing context and ask a useful question;
- generate optional celebration wording for an already validated event.

### Prohibited Language-Model Authority

The model cannot own arithmetic, progression eligibility, workout completion, pain diagnosis, safety stops, cycle completion, authentication, permissions, data deletion, billing, historical mutation, PR validation, or uncited research claims.

### Provider-Neutral Gateway

Expose internal operations such as:

- `extractSessionFeedback(input)`
- `explainDecision(decisionRecord)`
- `summarizePeriod(periodId)`
- `answerKnowledgeQuestion(question, retrievedSources)`
- `proposeAlternativeExplanations(constraints)`

Adapters may use OpenAI, Anthropic, or a future local model. Begin with no provider, then one provider after evaluation. API credentials remain server-side and never enter the client, logs, screenshots, or Obsidian.

### Structured Output and Validation

Any behavior-adjacent output must match a strict schema, reject unknown actions and invalid ranges, cite retrieved sources, pass policy checks, compare against authoritative data, and require user confirmation when ambiguous. Free-form prose never updates training state.

### Knowledge Pipeline

1. Curate research in Obsidian.
2. Record source identity, date, evidence type, confidence, rights, topic, and methodology.
3. Approve app-eligible claims.
4. Export versioned runtime documents.
5. Index with full-text search first and semantic retrieval only if evaluation proves benefit.
6. Retrieve a bounded set of passages.
7. Require source IDs and reject unsupported claims.
8. Save the knowledge-base version used.

### Source Lanes

Maintain separate provenance for peer-reviewed research, official coach material, books legally available to the project, official product documentation, community observation, product heuristic, and athlete-specific evidence. Coach popularity does not convert doctrine into scientific fact.

### RP Video Corpus

The official Renaissance Periodization and Mike Israetel corpus remains a continuing source queue. The existing snapshot, 766-video high-relevance queue, 43-video programming foundation, 42 usable transcript syntheses, and one corrupted transcript are a foundation pass, not a claim that every relevant video has been fully synthesized. Every new rule extracted from a video must retain source, transcript quality, applicability, contradictions, and regression-test implications.

### Failure, Privacy, and Cost

- AI timeout never blocks workout execution.
- Use deterministic reason-code explanations as fallback.
- Send minimum relevant context with de-identified IDs where possible.
- Avoid raw pain history when a compact derived state is enough.
- Allow cloud AI to be disabled without losing core features.
- Bound retries, latency, output length, daily usage, and monthly cost.
- No model call per set or repetition.
- Evaluate hallucinated citations, arithmetic errors, unsafe pain interpretation, contradictory advice, prompt injection, schema failure, latency, cost, and user acceptance before release.

## 24. Privacy, Security, and Data Rights

### Data Classification

- Public product content: exercise definitions and approved research summaries.
- Private athlete data: workouts, goals, schedule, preferences, records, and app decisions.
- Sensitive private data: sleep, pain, injury context, health restrictions, free text, and voice.
- Secrets: API keys, service credentials, signing keys, and recovery material. Secrets never enter athlete tables, client bundles, analytics, or Obsidian.

### Required Controls

- Supabase Auth or equivalent secure identity.
- Row Level Security on every client-accessible athlete and social table.
- Server-only service credentials and AI keys.
- Separate development, staging, and production environments.
- Least-privilege server functions.
- encryption in transit and provider-managed encryption at rest;
- audit logs for privileged access, export, merge, correction, and deletion;
- explicit consent versions for cloud AI and later social sharing;
- open export, correction, and confirmed deletion;
- documented retention for raw notes, model interactions, backups, and deletion queues;
- independent logical exports and tested restore.

### RLS Tests

For at least two accounts, prove that one user cannot select, insert, update, delete, infer, or join into another user's profile, workout, set, survey, pain, decision, record, or private exercise data. Later social reads must authorize the sanitized event through current friendship, visibility, block, revocation, and field-level policy without joining to private source rows.

### Non-Medical Boundary

The app provides training organization and safety-conscious modification, not medical diagnosis or treatment. Safety copy must be reviewed before public use and serious symptoms must route conservatively.

## 25. Friends, Social Progress, and Challenges, Later Phase

### Product Intent

Friends can optionally see selected workout completions, validated PRs, achievements, and challenge progress to create encouragement and friendly competition. Social participation is optional and cannot influence the athlete's core programming without explicit acceptance.

### Privacy Model

- private by default;
- mutual friendship for the initial version;
- per-event visibility and detail controls;
- no surveys, sleep, pain, health, readiness, exact schedule, or private notes shared;
- mute, remove, block, revoke, correct, and delete propagate to projections;
- no public leaderboard requirement.

### Feed Events

Sanitized events may include workout completed, movement trained, selected top set, validated PR, verified achievement, and challenge result. The athlete chooses whether exact load, repetitions, sets, and volume appear.

### Friend Comparisons

Exact comparison requires compatible movement, equipment, range, and metric. Scaled comparison may later use body mass, training age, or another transparent method, but must be labeled and validated. A friend result can motivate but cannot cause an unplanned workload increase.

### Challenges

Support personal-improvement challenges first, then mutually authorized comparable challenges. Challenge attempts must fit each athlete's program and safety state. The engine can defer an attempt rather than distort the current cycle.

### Anti-Shame Rules

No missed-workout callouts, public failure states, coercive streaks, unsolicited body comparison, or loss-framed notifications. Reactions begin positive and bounded. Comments and messaging remain deferred until moderation value is proven.

## 26. Delivery Roadmap and Build Order

### Phase 0: Product and Architecture Foundation

Deliverables:

- confirm the responsive PWA durable local database, migration, and phone-laptop sync spike, while retaining React Native as a later evidence-gated client;
- establish repository, formatting, linting, test, migration, and release conventions;
- create architecture decision records for platform, local database, sync, units, and IDs;
- implement domain entities, units, canonical exercise identity, planned-versus-completed separation, and event envelope;
- create synthetic athlete fixtures representing stable, interrupted, returning, novice, advanced, pain-aware, and time-constrained states;
- prove SQLite crash recovery and idempotent set recording;
- create Supabase development project, initial schema, RLS policy suite, seed catalog, and logical export;
- implement calculation versioning and deterministic reason codes;
- create design tokens and the four-screen visual prototype.

Exit gate: source sets can produce exact daily through yearly volume; offline set capture survives interruption; one account cannot access another; the UI direction is approved; and rule tests can run without a client or network.

### Phase 1A: Private Logging Core

Deliverables:

- private account and athlete profile;
- Today and Active Workout;
- program, planned session, completed workout, and set logging;
- primary, secondary, accessory, and optional roles;
- equipment profiles and time selection;
- exercise library search, categories, detail, custom creation, aliases, and duplicate warnings;
- exact exercise history and previous-result display;
- volume load, sets, repetitions, duration, and basic Progress charts;
- local outbox, Supabase sync, in-progress recovery, and export;
- focused-training mode and basic pixel layer.

Exit gate: JB can use the app for every workout for two consecutive weeks without data loss or a spreadsheet fallback for basic logging.

### Phase 1B: Adaptive Coaching Core

Deliverables:

- onboarding placement and entry routes;
- progression Gate 0 and load, repetitions, sets, hold, reduce, and reacclimate decisions;
- comparable-exposure matcher and exposure clocks;
- pre-session, warm-up, and post-session flows with universal skipping;
- readiness states and targeted session adjustment;
- missed-opportunity check-in, rolling priority queue, and no-volume-debt replanning;
- educated substitutions and substitute-specific prescription;
- deterministic explanation and complete decision records;
- micro wins, PR validation, opportunity prompts, and corrections.

Exit gate: a scenario suite proves no unearned progression, no survey penalty, no blind load transfer, no catch-up debt, and correct behavior after partial or missed sessions.

### Phase 1C: Longitudinal Intelligence

Deliverables:

- Plan cycle hierarchy and criteria-based reviews;
- full Progress modules and body-region drilldowns;
- direct and fractional muscle dose with versioned rules;
- enjoyment, joint response, time accuracy, consistency, and life-context analytics;
- personal hypothesis pipeline with sample thresholds and correction controls;
- learned time estimates, exercise ranking, interruption response, and question usefulness;
- working-max history and transfer hypotheses;
- stable backups, restore rehearsal, migration replay, and diagnostics.

Exit gate: several months of private history remain coherent across at least two rule or schema upgrades, and at least three personal insights are both useful and transparently supported.

### Phase 2: Optional AI and Knowledge Assistant

Deliverables:

- approved runtime knowledge export;
- provider-neutral gateway and one evaluated provider, if justified;
- free-text or voice extraction with confirmation;
- cited weekly and cycle summaries;
- cited training-knowledge questions;
- strict schemas, prompt versions, data minimization, fallback, budget, and evaluation dashboard.

Exit gate: AI unavailability has no effect on workout execution, structured extraction passes the representative case suite, citations are supported, and no model output can mutate authoritative state directly.

### Phase 3: Private Multi-User Readiness

Deliverables:

- generalized onboarding and account lifecycle;
- stronger import, export, migration, support, diagnostics, and release notes;
- accessibility audit and safety-copy review;
- public-readiness privacy, retention, deletion, incident, and recovery procedures;
- expanded synthetic and consenting tester cohort;
- product analytics that exclude sensitive content and respect consent.

### Phase 4: Friends and Social

Deliverables:

- mutual friends, sanitized feed, visibility, mute, remove, block, and revocation;
- validated shared PR events and positive reactions;
- opt-in friend proximity and personal-improvement challenges;
- social RLS test suite, correction propagation, notification controls, reporting, and moderation minimums.

Exit gate: no social client can reach private source records; challenges cannot override programming; and removal, blocking, correction, and revocation work end to end.

## 27. Quality Assurance and Test Bible

### Testing Layers

- Domain unit tests for units, volume, comparable exposure, progression, readiness, scheduling, cycles, substitutions, PRs, and permissions.
- Property tests for aggregation conservation, parent-child body rollups, idempotency, and state transitions.
- Repository tests for SQLite and Postgres equivalence.
- Migration tests from every released schema snapshot.
- Sync tests for offline creation, duplicate delivery, conflicting correction, device time skew, and reconnect.
- Integration tests for complete user journeys.
- RLS tests with multiple accounts and social projections.
- Visual regression for numerical layouts, charts, pixel assets, light and dark themes, large type, and reduced motion.
- Accessibility tests plus manual screen-reader and tap-target checks.
- Performance tests for workout start, set save, history query, chart load, sync, and cold restore.
- Rule replay tests over historical and synthetic athlete timelines.
- AI evaluation tests only after AI exists.

### Zero-Tolerance Defects

- data loss or duplicate authoritative sets;
- another user can access private data;
- planned work counted as completed;
- a skipped survey interpreted as an answer;
- missed work earns progression;
- catch-up volume added automatically;
- a substitute inherits an unsafe unrelated load;
- a false PR caused by duplicate, correction, identity, or unit error;
- gamification overrides the training engine;
- an LLM directly changes authoritative training state;
- a serious safety signal is silently treated as normal fatigue;
- an exercise merge loses or irreversibly rewrites history.

### Required Scenario Fixtures

1. Stable three-day lifter completes all work and earns a small load increase.
2. Load increment is too large, so repetitions progress instead.
3. Load and repetitions plateau while recovery is good, so one set is considered.
4. Fatigue is high, so the same case holds or reduces rather than adds a set.
5. Monday squat completes; Wednesday bench and Friday deadlift are missed for childcare. Only squat can progress.
6. Primary completes but accessories do not. Primary counts and no accessory debt is created.
7. Experienced athlete returns after a long gap and enters reacclimation without being labeled a beginner.
8. Experienced and current athlete enters direct strength development.
9. All surveys are skipped. Workout generation, logging, progression, and completion still work.
10. Poor sleep survey with normal warm-up preserves the primary plan.
11. Normal survey with abnormal first-set performance causes caution.
12. Active pain flag persists when today's pain question is skipped.
13. A 30-minute request preserves primary work and removes optional work within time.
14. A board press is swapped for a machine press and receives its own prescription rather than the board-press load.
15. Three accidental incline-bench entries are detected, merged, and later unmerged without losing source names.
16. Bench last performed ten weeks ago shows the exact old exposure and a lower-confidence next target.
17. Upper-body exclusive volume adds correctly; region-involvement view is labeled non-additive.
18. An exact set-scheme PR is validated while a technically non-comparable attempt is rejected.
19. A volume PR celebration does not cause an extra set recommendation.
20. The app goes offline mid-workout, restarts, restores every set, completes, and syncs once.
21. Two devices correct the same set and produce a visible preserved conflict.
22. A fixed meet date loses two weeks and replans specificity without doubled work.
23. A changed goal versions the plan and keeps prior cycle history visible.
24. Athlete corrects a learned sleep-performance claim and future recommendations stop using it.
25. AI times out during a summary while all training functions remain available.
26. One social user blocks another and all feed, challenge, and notification authorization disappears without deleting private source workouts.

### Performance Budgets for Private MVP

- Today useful content within two seconds on a normal recent phone after local data is available.
- Workout start within one second from local state.
- Set save acknowledgement within 150 milliseconds locally under normal load.
- In-progress restore within two seconds for a typical session.
- Common exercise search response within 200 milliseconds locally.
- Progress summary within one second for one year of personal data and within three seconds for all-time drilldown during private incubation.

These are starting budgets and must be measured on the actual target device.

## 28. Observability, Backups, and Operations

### Diagnostics

Log non-sensitive app version, device, schema version, rule version, calculation version, sync cursor, error code, latency, and feature state. Do not place survey content, pain notes, free text, exact private workout detail, credentials, or provider prompts into general analytics.

### Private Release Practice

- maintain development, staging, and private-production environments;
- use versioned database and seed migrations;
- produce human-readable release notes for training-rule and calculation changes;
- keep synthetic regression fixtures in source control;
- export JB's data before high-risk migrations;
- test restore on a schedule, not only backup creation;
- preserve a rollback or forward-fix path for app and schema versions;
- display a diagnostic bundle the athlete can export without secrets.

### Incident Priorities

1. Privacy or authorization breach.
2. Data loss or corruption.
3. Unsafe or materially wrong prescription behavior.
4. Sync and workout-blocking failure.
5. Incorrect analytics or records.
6. AI, social, animation, or cosmetic failure.

## 29. Research and Methodology Governance

### Coaches and Systems

Continue structured study of Dave Tate and elitefts, John Meadows, Mike Israetel and Renaissance Periodization, Chad Wesley Smith and Juggernaut systems, relevant books, scientific literature, official product behavior, and credible community reports. The goal is an original multi-methodology brain, not a copied program or personality imitation.

### Translation Template

Every useful concept must record:

- source and date;
- claim or doctrine;
- intended athlete, phase, and goal;
- mechanism or rationale;
- scientific support, contradiction, or uncertainty;
- product translation;
- deterministic variables and decision boundary;
- safety or misuse risk;
- test fixture or evaluation case;
- athlete-specific evidence after use.

### Methodology Synthesis Rules

- Treat methods as tools at different layers rather than mutually exclusive religions.
- Preserve strength specificity while hypertrophy dose can vary by muscle.
- Use dynamic correspondence and transfer as explicit hypotheses.
- Match variation complexity to athlete maturity and problem.
- Track multidimensional load rather than tonnage alone.
- Use conservative working maxima and technical floors.
- Separate development, maintenance, realization, and recovery.
- Do not let a source's authority override the athlete's actual response.

### Competitor Intelligence

Track official release notes, help documentation, visible product behavior, patch history, roadmap statements, reviews, and subreddit or community reports for RP Hypertrophy, JuggernautAI, and relevant products. Separate official fact from user report. Turn repeated failure reports into regression cases instead of copying interface or protected content.

### Books and PDFs

Retain source-integrity notes, missing-page warnings, publication context, and claim currency. The existing five-book, 897-available-page corpus remains a major source, including its recorded missing printed pages 205 through 207 in the supplied Zatsiorsky scan. Do not represent an incomplete source as complete.

## 30. Open Decisions, in Priority Order

### Decisions Required Before Coding Phase 1

1. Select the durable browser database and prove the responsive PWA phone-laptop sync spike defined in Chapter 68.
2. Confirm the private app name and repository location.
3. Select initial strength anchors and first private training goal.
4. Choose the first exercise catalog boundary and seed data format.
5. Define initial load conventions for bodyweight, unilateral, cable, and machine work.
6. Choose fixed-day, rolling, or hybrid default scheduling. Recommended default is rolling with optional weekday anchors.
7. Select initial 15, 30, 45, and 60-minute behavior and minimum primary doses.
8. Design and test the preserved-conflict review interface for same-set corrections and other authoritative collisions.
9. Add Supabase Auth, RLS, and private synchronization after the verified local logging milestone and before any multi-device-ready claim.
10. Approve the four-screen visual prototype, palette, pixel density, and focused-mode boundary.

### Decisions Required During Adaptive Core

- plateau exposure count before set progression;
- per-lift interruption and reacclimation thresholds;
- pain stop and modification thresholds after appropriate review;
- direct and fractional muscle-credit defaults;
- estimated-strength formulas and eligible repetition limits;
- working-max update thresholds;
- primary-replacement confirmation flow;
- substitution-ranking weights and minimum personal evidence;
- exact microcycle duration limits and mesocycle completion criteria;
- default survey modes and deferred post-session expiration;
- maximum question budget for advanced users;
- PR normalization and mixed-set-scheme rules.

### Decisions Deferred Until Evidence Exists

- first AI workflow and provider;
- managed versus app-owned AI cost and any bring-your-own-key mode;
- semantic retrieval beyond full-text search;
- wearable integrations;
- coach accounts;
- friends navigation placement, share defaults, scaling method, and challenge catalog;
- public profiles, followers, comments, messaging, or leaderboards;
- warehouse, streaming, read replicas, or custom model training;
- final monetization and public distribution.

## 31. Definition of Done

### Feature Definition of Done

A feature is complete only when:

- its requirement IDs and source notes are linked;
- product behavior, empty states, error states, offline behavior, privacy, and accessibility are specified;
- domain and data changes are versioned;
- deterministic rules and calculations have tests;
- migrations have forward and recovery coverage;
- analytics do not expose sensitive data;
- user-facing reasons are understandable;
- corrections and historical consequences are handled;
- acceptance scenarios pass on the target device;
- the Build Bible and release notes reflect the final behavior.

### Private MVP Definition of Done

The private MVP is usable when JB can onboard, receive an appropriate cycle, start with or without surveys, complete and recover workouts offline, change movements intelligently, see exact history and multi-horizon progress, miss training without breaking progression, receive valid small-win and PR feedback, understand every adjustment, export data, and continue across app and schema updates without losing longitudinal truth.

## 32. Build Sequence for the Next Development Session

1. Decide project name and create the repository.
2. Run the client-platform architecture spike.
3. Approve architecture decision records for platform, local database, IDs, units, and sync.
4. Implement the shared domain package and synthetic fixtures.
5. Implement SQLite schema, migrations, repositories, outbox, and crash-recovery tests.
6. Implement canonical exercise identity and the seed-catalog pipeline.
7. Implement planned and completed session models plus set logging.
8. Implement volume calculations and source-set reconciliation tests.
9. Build Today and Active Workout using the approved visual tokens.
10. Add Supabase schema, authentication timing decision, RLS, sync, export, and restore test.
11. Build Library and Exercise Detail.
12. Build the first Progress volume and exercise-history views.
13. Begin two-week private logging before enabling adaptive progression.
14. Use observed logging and timing data to calibrate Phase 1B rather than guessing every threshold in advance.

## 33. Key Linked Specifications

- [[App Requirements Register]]
- [[Build Bible Requirement Traceability Matrix]]
- [[Progression and Volume Model]]
- [[Micro Progress and Long-Term Wins]]
- [[Session Feedback and Learning Loop]]
- [[Readiness Fatigue and Peaking Model]]
- [[Conditional Schedule Adaptation and Missed Workout Game Plan]]
- [[Hierarchical Training Cycle and Goal Architecture]]
- [[Onboarding Training Status and Entry Cycle Placement]]
- [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- [[AI Integration and Decision Engine Architecture]]
- [[Data Backend Storage and Learning Architecture]]
- [[PR Gamification and In-Workout Motivation System]]
- [[Friends Social Progress and Challenge System]]
- [[Pixel Training Adventure Visual and Interaction System]]
- [[Multi-Methodology Training Intelligence Brain]]
- [[Strength Training Book Corpus 2026-08-09]]
- [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]
- [[Research Corpus and Source Quality Register]]
- [[App Build Reference Index]]

## 34. Living-Bible Maintenance Rule

This document is deliberately detailed enough to build from, but it remains a versioned living specification. When implementation reveals a better threshold, data shape, workflow, or interaction, record the observed evidence, update the corresponding requirement, add or revise the test case, migrate affected data, and create a Bible version entry. Product learning is allowed. Silent drift is not.

## 35. Private Alpha Implementation Baseline

The first working implementation is documented in [[Private Alpha Implementation 2026-08-10]]. It uses the provisional name ForgePath Private Alpha, lives at `/Users/redsky/Projects/adaptive-strength-hypertrophy-app`, and is preserved in the public GitHub source repository `Falatua/adaptive-strength-hypertrophy-app`. The verified baseline commit is `61cc63f`.

The architecture spike selected a responsive installable React and TypeScript PWA for the immediate private test loop. Local persistence, the service worker, and the deterministic domain engine allow a real same-day workout workflow without accounts, Supabase, or an AI provider. This is a delivery decision for the private alpha, not a permanent rejection of the leading React Native, SQLite, and Supabase path.

The verified slice includes onboarding, Today, Plan, Progress, Library, You, ten-question pre and post surveys with universal skipping, warm-up confirmation, local set logging, reload recovery, actual volume load, load-first progression, partial-session truth, missed-workout replanning, time compression, canonical exercise history, duplicate warnings, educated substitutions, body-region progress, records, editable mesocycles, immutable plan revisions, settings, verified export and restore, and an original responsive pixel-adventure interface.

The current codebase passes lint, 51 deterministic tests, a production PWA build, desktop and phone browser journeys, local persistence checks, versioned backup checks, correction, merge, cycle-review, PR, micro-win, and celebration-control journeys, and a zero-error browser-console check.

This baseline does not complete every chapter. Browser storage, seeded training history, and deterministic learned-insight examples are temporary private-alpha boundaries. Durable relational storage, automatic cycle review and completion, macrocycles and longer horizons, deeper records, historical correction replay, AI, native distribution, multi-device sync, social features, and public operations remain governed by their original delivery phases.

### Version 1.1.0 Change Entry

- Added R-290 through R-295.
- Recorded the working private-alpha architecture and repository.
- Converted the pre and post survey contracts into working ten-question, per-question-skippable flows.
- Verified completed, partial-primary, and partial-without-primary session states.
- Preserved later native, database, AI, and social boundaries without making the first workout dependent on them.

## 36. Private Alpha 0.2.0 Durability and Analytics Baseline

Private alpha 0.2.0 closes two high-risk gaps discovered through implementation audit.

First, every progress range now changes the underlying source-set query. The Progress screen supports Today, last 7 days, rolling 28 days, calendar month, calendar year, and all time. It derives completed sets, actual repetitions, average actual load, sessions, active days, exact-movement volume, records, priority-region coverage, and time-series points from the selected source sets. Primary-region and high-level upper-body, lower-body, arms, and trunk views are exclusive, so each set contributes once. A visible reconciliation panel proves that headline volume, chart volume, and region volume match exactly.

Second, local export is now a tested recovery system rather than a one-way download. Backup schema version 2 includes the complete restorable state, app and schema versions, export date, deterministic integrity value, and explicit data. Restore validates format, schema, integrity, IDs, references, dates, numbers, active-session identity, and a private-alpha file-size limit before showing a preview. Legacy version 1 exports migrate without inventing survey data. A confirmed restore retains one automatic copy of the previous local state for immediate undo.

The 0.2.0 codebase passes lint, 23 deterministic tests, a production PWA build, desktop and mobile visual review, backup export and restore, malformed-file rejection, restore undo, all progress-range interactions, both body lenses, zero browser-console errors, and horizontal-overflow checks from 320 through 1440 pixels.

The verified private repository commit for 0.2.0 is `ae8bf5f` on `main`.

This release does not complete quarter, individual-muscle, fractional-muscle, density, duration, quality, plan-versus-actual, cloud backup, native storage, or public recovery requirements. Those gaps remain explicit.

### Version 1.2.0 Change Entry

- Advanced R-003, R-004, R-038, R-039, R-040, R-145, R-146, R-184, R-196, and R-197 to their verified implementation states.
- Added real multi-horizon source-set filtering and calculation reconciliation.
- Added exclusive upper-body, lower-body, arms, trunk, and primary-region views.
- Added version 2 backup integrity, migration, preview, restore, rejection, and undo behavior.
- Increased the deterministic suite from 14 to 23 tests.

## 37. Private Alpha 0.3.0 Editable Mesocycle Baseline

Private alpha 0.3.0 converts the static seeded Plan screen into the first executable, athlete-editable mesocycle while preserving the deterministic authority and history rules in Chapters 8, 9, 19, and 20.

The active mesocycle now stores a stable ID, sequential plan version, title, objective, dominant adaptation, status, creation and effective dates, superseded-plan link, required revision reason, entry criteria, progression model, target exposure rounds, minimum productive exposures, success criteria, recovery or exit plan, weekly opportunities, session time target, protected strength anchors, priority regions, maintenance regions, and generated session IDs.

The athlete can edit powerbuilding, strength, hypertrophy, or reacclimation emphasis; two through five weekly opportunities; 30-, 45-, 60-, 75-, or 90-minute session targets; three through eight target exposure rounds; squat, press, and hinge anchors; up to three priority regions; up to three distinct maintenance regions; and the mesocycle criteria. Applying a plan always requires a why-changed record.

Before mutation, the deterministic engine shows a preview containing required exposure count, projected planning sets, projected minutes, selected movement roles, anchor coverage, and generation rationale. The preview is explicitly labeled as planned work and cannot enter completed volume. Weekly opportunities estimate calendar pace. If fewer calendar opportunities exist than protected anchors, the exposure round still retains every anchor and may extend beyond one calendar week.

The generator reuses existing prescriptions or the most recent exact completed exposure rather than inventing aggressive targets. Reacclimation begins with one fewer working set and a conservative load. Primary and secondary work receive first claim on short sessions. Priority and maintenance accessories rotate across longer sessions within the declared time budget.

A confirmed revision supersedes the prior active plan and replaces only sessions still marked `planned`. Completed, partial-primary, partial-without-primary, active, stopped, deferred, and expired outcomes remain historical truth. Starting a revision is allowed during normal browsing, but applying one is blocked while a workout is active. The Plan screen displays the active plan version, criteria-driven exposure progress, protected contract, current queue, and inspectable revision history.

Backup schema version 3 includes every mesocycle version and the active-plan pointer. Version 2 backups migrate without inventing cycle history, and version 1 migration remains supported. Restore validation checks plan identity, dates, strength-anchor references, active-plan identity, and active-plan session references before preview.

Verification includes a real browser change from a 60-minute plan to three 30-minute protected-anchor sessions. Two previous partial outcomes remained unchanged, the old planned session was replaced, version 1 became superseded, version 2 became active, both why-changed records remained visible, reload recovered version 2, and the schema version 3 export contained both plan versions. Desktop and 390-pixel phone views had no horizontal overflow and the browser console remained free of errors and warnings.

The verified private repository commit for this slice is `143f242` on `main`.

This slice does not yet automate microcycle extension or expiry, decide mesocycle continue, hold, recover, complete, or pivot states from accumulated performance, or build macrocycle, annual, fixed-event, and long-horizon editors. Those behaviors remain governed by Chapter 8 and must extend this model without rewriting prior versions.

### Version 1.3.0 Change Entry

- Advanced R-051, R-063, R-064, R-065, R-068, R-069, R-071, R-072, and R-196 to their verified private alpha 0.3.0 states.
- Added editable mesocycle contracts and preview-before-apply.
- Added immutable plan versions with required why-changed records and superseded links.
- Added future-only queue replacement with completed and partial history preservation.
- Added deterministic anchor protection, time fit, priority rotation, and conservative reacclimation.
- Added backup schema version 3 and version 2 migration.
- Increased the deterministic suite from 23 to 31 tests.

## 38. Private Alpha 0.4.0 Historical Integrity Baseline

Private alpha 0.4.0 implements the first complete historical-integrity slice required by Chapters 15, 17, 20, and 21. The system now treats completed set rows as the authority for volume, exercise history, and personal records. A record without one or more exact completed source set IDs is invalid.

### Source-Backed Record Replay

The deterministic history engine derives four current record classes per exercise from completed source sets:

- heaviest completed set;
- most repetitions in one completed set;
- highest exact-exercise session volume;
- highest Epley estimated-strength result.

Each record stores its supporting set IDs and achieved date. Saving a workout, correcting a set, deleting a set, merging exercise identities, restoring a backup, or migrating old local state regenerates the record projection. The private alpha no longer uses seeded all-time PR claims that lack completed source evidence.

### Set Correction and Deletion Contract

Exercise Detail exposes every visible completed set with load, repetitions, RIR, technique, pain, date, set position, and any original exercise name preserved by a merge. Correcting a set requires a reason and accepts an updated load, repetitions, RIR, technique score, pain score, and completion timestamp. Before saving, the interface shows the before value, after value, and exact volume delta.

Deleting a set is an explicitly destructive action. The interface names the exercise, set, timestamp, and volume consequence, requires a reason, and states that the removal is recoverable through the latest-change undo control.

Both commands append a history mutation event and then replay total volume, time-series charts, body-region totals, exposure history, and record eligibility. The event retains the exact before and after projections, source set IDs, athlete-entered reason, timestamp, record projections, and volume consequence. Silent overwrite is forbidden.

### Duplicate Detection and Merge Contract

The Library includes a Data Quality view that presents deterministic probable-duplicate pairs. The detector uses canonical names, aliases, normalized equipment wording, movement type, and identity modifiers. Paused, deficit, incline, decline, board, competition, safety, close-grip, and wide-grip variants do not become duplicates merely because one name contains another. Suggestions never mutate data by themselves.

An athlete-confirmed merge requires the user to choose the canonical identity to keep and record a reason. The merge:

- marks source exercises retired instead of deleting them;
- records the canonical target ID on each retired source;
- adds source names and aliases to the target identity;
- repoints completed set projections to the target while retaining original exercise ID, name, family, and primary region;
- updates only planned and deferred future session references;
- does not rewrite completed sessions or prior mesocycle versions;
- updates active athlete strength-anchor references;
- regenerates source-backed records;
- appends a reversible merge event.

The current interface supports one reviewed pair per merge. The store command accepts multiple source IDs so a later batch-cleanup interface can merge three or more accidental copies in one audited event.

### Undo and Audit Contract

The Correction and Merge Ledger shows the latest mutation events, reason, time, event type, volume consequence, and undone state. Undo always reverses the latest still-active history mutation. It restores the exact recorded pre-change history, exercise catalog, future sessions, athlete anchors when applicable, and record projection, then marks the event undone instead of erasing it. Out-of-order selective undo remains deferred because it could overwrite later legitimate changes.

### Persistence and Backup Version 4

Local persistence advances to version 3 and initializes old local states with an empty mutation ledger plus records replayed from completed history. Backup schema version 4 includes the full history mutation ledger and source-backed record projection. Restore rejects records with missing source sets or values that do not exactly match a fresh deterministic replay. The integrity checksum is checked before semantic validation.

Backups from schema versions 1, 2, and 3 migrate forward. Migration does not invent historical correction events. It starts an empty ledger and recalculates records from the completed sets present in the older file.

### Verification

- Lint passed.
- Thirty-nine deterministic tests passed across five files.
- Production PWA build passed.
- Explicit secret-pattern scanning and Gitleaks passed.
- Browser console reported zero errors and zero warnings.
- A browser correction changed one source set by negative 35 volume, recorded the reason, and restored the original set through undo.
- A browser-created duplicate was detected from an existing alias, merged into Competition Bench Press, retired from the active catalog, recorded in the ledger, and restored through undo.
- The 390 by 844 phone view had no horizontal overflow. The Data Quality dialog received focus on open, closed with Escape, and passed visual review.
- Private repository commit `9212959` is on `main`.

### Deferred Boundaries

- Batch merge interface, direct alias editing, imported-history mapping, and custom movement editing.
- Selective out-of-order undo and correction conflict resolution across devices.
- Notes and attachment provenance inside each set correction.
- Bodyweight, assisted, unilateral, cable, and machine-load normalization.
- Comparable-set-scheme record families, rep-range eligibility, working-max records, quality achievements, and athlete notification controls.
- SQLite or Postgres event storage, multi-device synchronization, and cloud conflict resolution.

### Version 1.4.0 Change Entry

- Advanced R-149 through R-158, R-184, R-187, R-196, R-197, R-207, R-209 through R-213, and R-215 to their verified private alpha 0.4.0 states where implemented.
- Added exact source-set provenance to every current personal record.
- Added reason-required set correction and deletion with full derived-state replay.
- Added deterministic exercise data-quality suggestions and reversible athlete-confirmed merge.
- Added the visible correction and merge ledger plus latest-active-change undo.
- Added backup schema version 4 and schema version 3 migration.
- Increased the deterministic suite from 31 to 39 tests.

## 39. Private Alpha 0.5.0 Criterion-Based Cycle Review Baseline

Private alpha 0.5.0 makes the elastic microcycle and criterion-driven mesocycle rules in Chapter 8 executable. The interface uses the athlete-facing term exposure round while storing its explicit microcycle number.

### Exposure-Round Clock

Each generated session stores its microcycle number. Existing sessions without that field migrate as round one. The active round derives:

- earliest planned date as the round start;
- target review date at seven calendar days;
- maximum span at fourteen calendar days;
- required, qualified, and unresolved sessions;
- total qualified exposures across the active mesocycle;
- completed source sets and exact volume load for the round;
- average known session RPE;
- maximum known set pain;
- elapsed calendar days.

Qualified means completed or partial-primary. Planned, active, and deferred sessions remain unresolved. Partial work without a primary exposure does not qualify the protected role.

### Deterministic Recommendation

The review engine proposes one of five structured decisions:

1. `continue-progress` when the round is complete, effort is recoverable, pain is not elevated, and the target mesocycle rounds are not complete;
2. `continue-hold` when protected work remains inside the target window or a completed round should repeat productive targets;
3. `extend` when unresolved work passes the seven-day target but remains inside the fourteen-day maximum;
4. `recover` when pain reaches the conservative threshold or unresolved work exceeds the maximum span;
5. `complete` when the target exposure rounds and minimum productive exposures are both satisfied.

The recommendation is deterministic and explainable. The athlete retains final authority among currently eligible choices and must record a reason. Pivot is exposed separately because it opens the existing immutable mesocycle revision workflow instead of mutating the active plan in place.

### Decision Effects

- Continue and progress creates the next exposure round and applies the existing exact-exercise load-first progression engine to its prescriptions.
- Continue and hold keeps an unresolved current round in place or creates the next completed round at the same productive targets.
- Extend moves unresolved work seven days without adding sets, repetitions, or catch-up sessions.
- Recover marks unresolved sessions expired and creates a conservative reacclimation round with one fewer working set where applicable and a reduced starting load.
- Complete marks the mesocycle completed, expires any unresolved future work, clears the active-plan pointer, and leaves every prior plan version and completed outcome intact.
- Pivot opens a new version preview with the current contract as its starting point. The new plan still requires a why-changed record before apply.

### Review Ledger

Every saved review appends a `CycleReviewEvent` containing plan ID, plan version, microcycle number, deterministic recommendation, recommendation reasons, athlete decision, athlete reason, evidence snapshot, timestamp, generated session IDs, and expired session IDs. The Versions view shows these decisions beneath immutable plan versions.

### Persistence and Backup Version 5

Local persistence advances to version 4 and initializes old local state with an empty cycle-review ledger. Backup schema version 5 includes cycle reviews and validates plan references, decision vocabulary, dates, evidence shape, and generated or expired session references. Schema versions 1 through 4 migrate forward. Version 4 migration preserves the plan and correction ledgers and starts cycle-review history empty rather than inventing decisions.

### Verification

- Lint passed.
- Forty-five deterministic tests passed across six files.
- Production PWA build passed.
- Explicit secret-pattern scanning and Gitleaks passed.
- Browser console reported zero errors and zero warnings.
- A real recovery review expired three unresolved round-one sessions, queued three conservative round-two sessions, and stored its evidence and athlete reason in version history.
- The new round remained tied to the same active plan version and used distinct session IDs.
- The 390 by 844 review dialog had no horizontal overflow, received focus on open, and closed with Escape.
- Private repository commit `0a24b20` is on `main`.

### Deferred Boundaries

- Required-role waiver and explicit substitution outcomes at maximum span.
- Reminder delivery when the target or maximum date arrives.
- Statistical confidence across several completed rounds and automatic success-criteria parsing.
- Review undo or correction workflow. Cycle review events are currently append-only and a later decision creates the next state.
- Macrocycle, annual, fixed-event, and long-horizon editors.
- Cloud conflict rules for concurrent cycle reviews.

### Version 1.5.0 Change Entry

- Advanced R-063, R-064, R-065, R-071, R-072, R-084, R-187, and R-196 to their verified private alpha 0.5.0 states where implemented.
- Added explicit seven-day target and fourteen-day maximum exposure-round clocks.
- Added criterion recommendations, athlete-selected eligible decisions, and required reasons.
- Added next-round progression, hold, extension, recovery, completion, and pivot workflows.
- Added the append-only cycle-review ledger and Versions presentation.
- Added backup schema version 5 and schema version 4 migration.
- Increased the deterministic suite from 39 to 45 tests.

## 40. Private Alpha 0.6.0 Source-Backed Records and Safe Gamification Baseline

Private alpha 0.6.0 makes the first release portion of Chapter 17 executable while preserving the rule that motivation can reveal prescribed progress but cannot create training stress.

### PR v2 Record Definitions

The deterministic record engine now derives these all-time definitions from completed source sets:

1. absolute load for one exact canonical exercise;
2. most repetitions at an exact load;
3. heaviest load for an exact repetition count;
4. heaviest uniform load for an exact ordered repetition scheme;
5. Epley v1 estimated strength from sets of one through twelve repetitions;
6. highest exact-movement session volume load;
7. highest whole-workout session volume load.

Exact set schemes retain their ordered repetition distribution. Four sets of six is not collapsed into one set of twenty-four. A mixed six, six, five, five pattern owns a different definition from four sets of six. The current implementation compares uniform load across the scheme. Mixed-load scheme comparison remains deferred.

Every record stores its stable definition ID, record type, category, value, unit class, all-time scope, exact exercise or whole-workout identity, achieved date, source session ID, completed source set IDs, type-specific context, validation state, and `pr-v2` rule version.

### Quality Confirmation and Numeric-Only Results

A completed number and a validated PR are not identical. A record is fully validated only when every supporting set has explicitly confirmed quality, technique is at least three on the five-point scale, and pain is no greater than three on the five-point scale.

When the athlete skips the post-session survey, skips technique or pain, or imports older history without explicit quality confirmation, the number remains in exact history but its record state is `numeric-only`. The corresponding achievement is labeled `Unverified number best` and explicitly says it is not a validated PR. Missing quality is never replaced with perfect technique or zero pain.

The post-session workflow transfers answered technique and pain values to every completed set in that session and records whether the quality evidence was confirmed. The completed-set correction workflow displays the current state and requires the athlete to actively check `Confirm technique and pain` before a numeric-only result can become eligible for validated PR status.

### Prescribed-Target Opportunity Engine

The opportunity engine compares current exact records with the original target load, repetitions, set count, and set scheme already present in the prescription. It never reads athlete-edited actual load or repetitions as a new app prescription.

Opportunity prompts pause when:

- readiness is protect, pain-aware, or reacclimate;
- the exercise joint response is irritating or avoid;
- any planned set has less than one target repetition in reserve.

An eligible prompt says that the opportunity is already inside prescribed work and that no extra work should be added. If the prescription does not cross a record, the active workout shows a productive-hold message rather than manufacturing a target.

### Achievement Replay and Micro Wins

Achievement v1 replays completed history chronologically and produces source-backed events for:

- validated personal records;
- numeric-only number bests;
- first exact-movement baseline;
- comparable load micro wins;
- comparable repetition micro wins;
- confirmed quality wins at matched load and repetitions;
- return to a movement after at least fourteen days;
- three useful sessions completed inside seven days.

Each event stores category, kind, record type when applicable, prior and new values, delta, exact exercise or training-rhythm identity, scope, source session and sets, prior source sets, validation state, and `achievement-v1` rule version. Correction, deletion, exercise merge, local migration, and backup migration regenerate current records and achievement presentation from completed evidence.

### Workout and Progress Presentation

The active workout shows at most the highest-priority planned opportunity for each exercise. After a completed active set, the interface can show one non-blocking provisional achievement. It remains provisional until the session is finished and saved with its quality evidence.

Progress now includes:

- the selected time-window count of validated wins and separately labeled numeric-only bests;
- category filters for strength, repetition, set scheme, and workload records;
- record values, dates, exact source-set counts, and validation state;
- a PR and micro-win evidence timeline;
- next-session opportunities already allowed by the prescription;
- honest empty states when no PR chase is appropriate.

### Athlete Controls and Pixel Feedback

Local preferences now include:

- celebration level: off, subtle, normal, or high-energy;
- quiet mode;
- planned opportunity prompts;
- in-workout achievements;
- pixel confetti;
- reduced motion;
- sound preference for a later approved sound pack;
- supported-device haptics.

Quiet mode changes presentation only. It never changes logging, the training prescription, progression, completed history, record calculation, or backup contents. Reduced motion suppresses animated celebration behavior. Pixel feedback stays compact and never covers an active set.

### Persistence, Backup, and Browser Tests

Local persistence advances to version 5 and adds the new controls with quiet defaults. Old local record arrays are regenerated from completed history. Historical correction snapshots also regenerate their before and after record projections so a later undo cannot restore an obsolete record shape.

Backup schema version 6 includes PR v2 records and athlete celebration preferences. It validates type, category, scope, value, source sets, context, validation state, rule version, and every history-mutation record projection. Schema versions 1 through 5 migrate forward. Version 5 migration preserves plan, correction, and cycle-review ledgers, regenerates records, and adds celebration defaults without inventing athlete responses.

Playwright is now a committed verification layer with desktop Chromium and Pixel 5 projects. The release journeys prove:

- a prescribed hold remains a hold after the athlete edits actual load;
- a completed actual can show provisional feedback without mutating the target;
- confirmed post-session technique and pain produce a validated source-backed PR;
- quiet mode persists across reload;
- the phone Progress and You screens have no horizontal overflow;
- browser console and uncaught page errors remain empty.

### Verification

- Lint passed.
- Fifty-one deterministic tests passed across six domain files.
- Four Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Production PWA build passed.
- Git diff whitespace validation passed.
- Explicit secret-pattern scanning and Gitleaks directory scanning passed.
- The final browser journeys reported zero console errors and zero uncaught page errors.
- Phone screenshots for Progress achievements and gamification controls were visually inspected.
- Private repository commits `eb457a8` and `4a724ba` are on `main`.

### Deferred Boundaries

- Calendar-year, rolling, mesocycle, phase, and since-return record scopes.
- Variation-family records and explicit family comparability.
- Mixed-load set-scheme records and total repetitions across a fixed number of sets at one load.
- Bodyweight, assistance, bands, chains, tempo, range, board height, pin height, and normalized physical unit conventions.
- Workout archetype, body-region, muscle-dose, density, and advanced quality-adjusted records.
- Historical notification-delivery outcomes, approved sounds, native haptics, and share cards.
- Superseded or invalidated PR event views beyond the existing correction ledger and deterministic current replay.
- Cloud sync and concurrent-device achievement conflict resolution.

### Version 1.6.0 Change Entry

- Advanced R-199 through R-209, R-213, R-214, and R-216 through R-218 to their honest private alpha 0.6.0 implementation slices.
- Added PR v2 exact record definitions with source session, source sets, context, validation, and calculation version.
- Added prescribed-target opportunities that cannot read athlete-edited actuals as app targets.
- Added numeric-only uncertainty labels and explicit technique and pain confirmation for validated PRs.
- Added deterministic PR, baseline, load, repetition, quality, return, and consistency achievement replay.
- Added Progress record filters, achievement timeline, validation labels, and safe next-session opportunities.
- Added athlete-controlled celebration level, quiet mode, prompts, achievements, confetti, reduced motion, sound preference, and haptics.
- Added backup schema version 6, local persistence version 5, and schema version 5 migration.
- Added committed Playwright desktop and phone journeys.
- Increased the deterministic suite from 45 to 51 tests.

## 41. Private Alpha 0.7.0 Explainable Substitution and Learning-Event Baseline

Private alpha 0.7.0 implements the first complete workout-to-history substitution loop for R-159 through R-170. The athlete can change any active programmed movement, optionally explain why, inspect ranked alternatives and their tradeoffs, receive a replacement-specific prescription, complete the replacement, and later inspect the durable event in the Exercise Library.

This is a deterministic evidence-capture system, not yet a self-modifying recommendation model. The app records enough structured evidence to support future calibration while deliberately preventing one isolated choice or poor day from rewriting future ranking weights.

### Candidate Eligibility and Contextual Reasons

The active workout exposes Change on primary, secondary, priority, maintenance, and optional roles. Candidate eligibility excludes:

- the movement currently occupying the planned slot;
- retired exercise identities;
- exercises marked avoid for joint response.

The athlete may choose pain or joint irritation, equipment unavailable, short on time, high fatigue, poor target feel, variety, preference, harder, easier, other, or no reason. A reason is optional and never becomes a survey requirement. Reason selection changes deterministic scoring for relevant candidates.

### Ranking Evidence and Tiers

Each eligible candidate receives a stable numeric score and ranks into Best Match, Good Alternative, or Changes Focus. Current scoring considers:

- same movement pattern;
- same or involved primary body region;
- same exercise family;
- overlapping training-role tags;
- prior joint response;
- athlete favorite status;
- exact completed history and familiarity;
- current readiness;
- reason-specific equipment, time, fatigue, variety, preference, difficulty, or pain signals.

Every visible candidate explains why it ranks, what purpose it preserves, what changes, exact-history count and recency, recommendation tier, score, proposed set count, target load method, repetitions, and RIR. The explanation explicitly warns that movement identity, equipment, specificity, or the exact progression clock can change.

The current purpose model uses planned role and purpose, movement pattern, primary body region, exercise family, and role tags. Calibrated transfer mechanisms, dynamic correspondence, equipment-transition cost, movement-specific stimulus prediction, and statistical confidence remain later work.

### Replacement-Specific Prescription

Blind load transfer is forbidden.

When the selected exercise has exact completed history, the engine:

1. locates the latest exact completed session for that canonical exercise ID;
2. derives a role-appropriate repetition range;
3. applies the existing load-first progression engine to only that movement's exact history;
4. caps the replacement at the original planned slot's set count;
5. resets all completion and actual-value fields;
6. preserves at least one target RIR in normal readiness and at least two when readiness is constrained;
7. labels the method `exact-history` and names the source exposure in plain language.

When no exact completed history exists, the engine:

1. sets target load to zero rather than copying the original movement;
2. requires the athlete to choose a conservative calibration load;
3. targets at least three repetitions in reserve;
4. limits a primary calibration to at most two work sets;
5. labels the method `baseline-calibration`.

The selected movement receives the completed sets and future progression credit. The root original identity stays in `substitutedFrom`, so repeated swaps do not erase where the slot began. The original exact-movement progression clock remains frozen.

### Protected Primary Confirmation

A primary anchor replacement is blocked until the athlete explicitly confirms that:

- the replacement owns a separate exact progression clock;
- movement specificity can change even when purpose is preserved;
- the athlete accepts the informed override.

The confirmation state is stored on the substitution event and validated during backup restore. A primary substitution event without explicit confirmation is invalid.

### Session Recalculation and Repeated Swaps

After a valid replacement, ForgePath recalculates:

- replacement set count;
- estimated replacement minutes from set count and rest context;
- total session duration from the active planned exercises.

If the athlete changes the same planned slot again before completion, the prior pending event closes as not completed and the newest event becomes the active substitution. This prevents abandoned candidate choices from remaining permanently pending.

Equipment-transition order, fractional muscle dose, systemic fatigue, builder relationships, and automatic shrinking, movement, or expiry of later work remain deferred and visible in R-167.

### Durable ExerciseSubstitutionEvent

Every accepted substitution stores:

- event, session, and planned-slot IDs;
- original and selected canonical exercise IDs;
- exercise role and planned purpose;
- optional reason;
- creation time;
- readiness, available time, and equipment location;
- protected-primary confirmation state;
- top candidate snapshots with rank, score, tier, reasons, preserved purpose, tradeoffs, last exposure, and prior set count;
- original and replacement prescriptions;
- prescription method and explanation;
- completed source set IDs;
- pending, completed, partial, or not-completed outcome;
- completion time;
- available post-session difficulty, target stimulus, technique, pain, enjoyment, and survey-skip state.

Completed set records also preserve planned-slot ID plus original exercise identity for substituted work. The visible Exercise Library ledger shows original to selected movement, role, reason, prescription method, explanation, outcome, completed source-set count, and available response evidence.

Deleting a source set replays the linked substitution outcome and source-set list. History-mutation snapshots preserve substitution events so Undo can restore the source linkage. Correction preserves stable source IDs. Exercise merge retains original event identities while canonical movement records follow the existing reversible merge system.

### Evidence Threshold Boundary

Version 0.7.0 records substitution outcomes but does not automatically change future ranking weights from them. One preference tap, one completed replacement, or one painful day therefore cannot materially rewrite the athlete model.

The future learning step must define and test:

- minimum comparable substitution count;
- recency and decay;
- success and failure definitions;
- movement, role, reason, and readiness comparability;
- correction and deletion replay;
- athlete override and reset;
- calibrated confidence;
- bounded score changes;
- protection against sparse, contradictory, or missing feedback.

Until those gates exist, the event ledger is structured evidence and the current deterministic inputs remain ranking authority.

### Persistence, Backup, and Validation

Local persistence advances to version 6 and includes substitution events.

Backup schema version 7 includes the complete substitution ledger. Restore validates:

- unique event identity;
- session, planned-slot, original-exercise, selected-exercise, candidate-exercise, and source-set references;
- role, reason, readiness, outcome, prescription method, and candidate tier values;
- nonnegative rank, score, time, prior set count, and prescription values;
- dates and optional completion date;
- candidate reasons, preserved purpose, and tradeoff explanations;
- original and replacement prescription structure;
- optional feedback structure;
- explicit protected-primary confirmation.

Schema versions 1 through 6 migrate forward. Version 6 migration preserves records, preferences, plans, corrections, and cycle reviews while initializing the substitution ledger empty. Migration never invents historical substitution decisions.

### Verification

- Lint passed.
- Fifty-seven deterministic tests passed across seven domain files.
- Six Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Production PWA build passed.
- Git diff whitespace validation passed.
- Explicit secret-pattern scanning and Gitleaks passed.
- Browser console and uncaught page-error collectors remained empty.
- The primary-substitution journey proved reason selection, a blocked unconfirmed primary change, explicit confirmation, conservative no-history calibration, no copied original load, completed source-set capture, Library ledger presentation, persistence, and exact-width phone containment.
- Phone screenshots for the substitution picker and Library event ledger were visually inspected.
- Private repository commit `8696090` is on `main` and matches the remote branch.

### Deferred Boundaries

- Browse Full Library from inside the replacement modal.
- Pre-session replacement outside an active workout.
- Full equipment-profile availability filtering and transition cost.
- Warm-up and rest recalculation.
- Fractional muscle dose, systemic fatigue, and later-exercise reprioritization after a swap.
- Movement-specific post-session questions instead of session-level response projection.
- Repeated-event statistical learning, confidence, decay, and athlete correction of learned weights.
- Cloud synchronization and concurrent-device event conflict handling.

### Version 1.7.0 Change Entry

- Advanced R-159 through R-168 and R-170 to honest private alpha 0.7.0 implementation slices.
- Marked R-169 as instrumented but intentionally not yet learning.
- Added optional contextual reasons and reason-aware deterministic ranking.
- Added three-tier candidate explanations with purpose, tradeoffs, history, and proposed prescription.
- Added exact-history replacement prescriptions and conservative zero-copy-load calibration.
- Added explicit protected-primary confirmation and progression-clock separation.
- Added duration recalculation and repeated-swap closure.
- Added the durable substitution event and visible Exercise Library ledger.
- Added source-set deletion and Undo integrity for substitution outcomes.
- Added backup schema version 7, local persistence version 6, and version 6 migration.
- Added deterministic substitution and backup tests plus committed desktop and phone browser journeys.
- Increased the deterministic suite from 51 to 57 tests and Playwright journeys from four to six.

## 42. Private Alpha 0.8.0 Operational Survey Burden and Unknown-Evidence Baseline

Private alpha 0.8.0 makes the survey preferences executable instead of decorative. Pre-session and post-session collection now follow independent full, quick, minimal, off, or ask-each-time settings. Training access, completed-work credit, progression, and records remain available at every burden level.

### Question Budgets

Pre-session modes use:

- Full: all ten readiness questions.
- Quick: sleep duration, energy, fatigue, pain, and available time.
- Minimal: energy, pain, and available time.
- Off: no modal and no readiness claim.
- Ask each time: a neutral chooser for Full, Quick, Minimal, or immediate survey-free start.

Post-session modes use:

- Full: all ten response questions.
- Quick: difficulty, target stimulus, technique, pain, and time fit.
- Minimal: difficulty, technique, and pain.
- Off: finish and save immediately without a modal.
- Ask each time: a neutral chooser for Full, Quick, Minimal, or immediate survey-free finish.

These budgets are stable deterministic definitions in the survey engine. They do not change the workout prescription by themselves.

### Explicit Answer and Unknown Semantics

A visible default is not an athlete answer.

Every question begins as `not-answered` even when the interface provides a placeholder or reference value. Only an explicit scale-button or number-input interaction changes the status to `answered` and stores a non-null value.

Every visible pre- and post-session question also provides:

- Skip;
- Not sure;
- Prefer not.

Those states store null and remain distinct from each other and from untouched `not-answered`. Readiness, technique confirmation, pain confirmation, substitution feedback, and future learning read only explicit answered values.

Backup restore rejects any unknown-status response carrying a non-null value. It also validates answer status, effective mode, answered count, unknown count, and evidence confidence.

### Evidence Confidence and Fallback

Every saved session survey records:

- effective mode;
- explicit answered count;
- unknown count;
- skipped state;
- low, medium, or high evidence confidence.

Current deterministic confidence rules are:

- Low when the whole survey is skipped or fewer than three explicit answers exist.
- Medium when three through seven explicit answers exist.
- High when at least eight explicit answers exist.

When no explicit pre-session answer exists, ForgePath stores no readiness outcome and shows the baseline plan with low survey confidence. It does not label the athlete normal, recovered, pain-free, tired, or unmotivated.

When partial evidence exists, the readiness engine uses only answered fields. Missing questions cannot contribute favorable or unfavorable values. Completed training history and the existing deterministic plan remain fallback authority.

The active workout displays both the current readiness or baseline-plan state and the survey-evidence confidence separately.

### Time Constraint Execution

An explicitly answered pre-session available-time value becomes the current session compression budget. A skipped, unknown, or untouched time item leaves the athlete's existing time preference unchanged.

This lets the minimal three-question path change a sixty-minute planned session to a forty-five-minute version without interpreting missing energy or pain data.

### Survey-Free Integrity

When both session survey preferences are Off:

- the Today primary action starts immediately;
- no pre-session modal opens;
- no readiness claim is created;
- the active workout remains fully editable;
- exercise substitution remains available;
- set logging and local persistence remain unchanged;
- Finish workout saves immediately without a post-session modal;
- completed sets, volume, records, and progression remain active;
- quality-dependent records remain numeric-only unless quality evidence is explicitly supplied elsewhere.

Skipping cannot reduce adherence, motivation, recovery, completion, streaks, functionality, or access. No reminder or punishment system exists in this release.

### Known Safety State

Skipping the pain question does not create a pain-free claim. Existing exercise joint-response and avoid states remain unchanged and continue to affect substitution and opportunity safety. The current private alpha does not yet have a separate athlete-level injury, restriction, or clinician-managed state.

### Persistence, Backup, and Migration

Local persistence advances to version 7.

Backup schema version 8 adds survey effective mode, answered count, unknown count, and confidence. Restore validates that these projections reconcile with the stored answer statuses and skipped state.

Schema versions 1 through 7 migrate forward. Version 7 migration preserves every existing answer exactly and does not infer a mode, confidence, or missing response for historical surveys. New provenance begins only with future check-ins.

### Verification

- Lint passed.
- Sixty-two deterministic tests passed across eight domain files.
- Eight Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Production PWA build passed.
- Git diff whitespace validation passed.
- Explicit secret-pattern scanning and Gitleaks passed.
- Browser console and uncaught page-error collectors remained empty.
- Deterministic tests prove ten, five, three, and zero question budgets plus explicit-answer confidence.
- Backup tests prove version 7 migration, unknown-state round trip, non-null unknown rejection, and evidence reconciliation.
- The browser journey sets minimal pre-session and off post-session preferences, shows exactly three readiness questions, marks energy not sure, explicitly answers pain and time, reports low confidence from two answers and one unknown, compresses the session to forty-five minutes, logs a set, finishes without a post modal, and preserves both survey records after local persistence.
- Phone screenshots for minimal readiness and the persisted settings surface were visually inspected.
- Private repository commit `fa6ec09` is on `main` and matches the remote branch.

### Deferred Boundaries

- Per-cadence modes for onboarding, warm-up, during-session, recovery, weekly, monthly, and block surveys.
- Athlete-authored custom question budgets.
- Remind Me Later, expiry, and deferred post-session dismissal.
- Automatic question-burden reduction from repeated skip behavior.
- Athlete-level active pain, injury, restriction, and resolution state.
- Conditional body maps and movement-specific post-session feedback.
- Statistical validation of which questions predict outcomes for this athlete.

### Version 1.8.0 Change Entry

- Advanced R-171 through R-178, R-180, and R-181 to honest private alpha 0.8.0 slices.
- Marked R-179 as manual controls only.
- Added independent full, quick, minimal, off, and ask-each-time session preferences.
- Added explicit skipped, not-sure, prefer-not, and not-answered semantics.
- Prevented untouched interface defaults from becoming fabricated answers.
- Added survey-evidence counts and confidence to session and survey provenance.
- Added baseline-plan fallback when no readiness evidence exists.
- Connected explicit available time to current-session compression.
- Added automatic survey-free start and finish when modes are Off.
- Added backup schema version 8, local persistence version 7, and version 7 migration.
- Added deterministic survey tests, backup integrity tests, and committed desktop and phone journeys.
- Increased the deterministic suite from 57 to 62 tests and Playwright journeys from six to eight.

## 43. Private Alpha 0.9.0 Deferred Feedback Without Training Friction

Private alpha 0.9.0 implements the remaining executable part of R-178. Post-session feedback can now be completed immediately, skipped, or deferred without changing whether the workout counted. The feature is a local optional evidence window, not a notification campaign or adherence mechanic.

### Athlete Flow

After selecting Full, Quick, or Minimal post-session feedback, the athlete can choose Remind Me Later.

That action:

- finalizes the session immediately;
- saves every completed set and its actual volume;
- updates exposure and progression clocks from completed work only;
- labels quality-dependent records numeric-only until explicit quality evidence exists;
- creates one quiet local follow-up tied to the completed session;
- navigates away from the workout normally;
- leaves the next planned workout fully available.

The Today screen shows the earliest active follow-up above the workout card. It states that feedback is optional and never blocks training. The athlete can add feedback or dismiss it. Multiple historical requests remain ordered and auditable, but only one quiet card is presented at a time.

### Expiry and No-Nag Contract

Each deferred request has a deterministic 24-hour window with:

- request ID;
- completed session ID;
- selected post-session mode;
- created timestamp;
- expiry timestamp;
- pending, completed, dismissed, or expired status;
- resolution timestamp when resolved;
- source survey ID when a completed or dismissed response exists.

An expired request creates no survey answer and no training-state inference. A dismissed request records an explicitly skipped post-session survey. Neither path changes completion, volume, records, progression, readiness, adherence, access, or the next workout.

No operating-system notification, repeated prompt, streak penalty, shame language, or automatic preference change exists in this release.

### Later Quality Replay

When the athlete completes deferred feedback, ForgePath stores the selected mode, explicit answers, unknown states, evidence counts, confidence, optional note, and source session.

If both technique and pain are explicitly answered, every completed source set from that session receives the same quality evidence that immediate post-session feedback would have supplied. Personal records are then deterministically replayed from the original set IDs. A numeric-only best can become quality-validated, but its load, repetitions, date, exercise identity, and source set never change.

If either technique or pain remains missing, technique and pain remain unknown for quality gating and the numeric result stays unverified. Deferred feedback cannot fabricate favorable quality, add a set, alter actual load or repetitions, or manufacture a record.

Deferred feedback also attaches available difficulty, target-stimulus, technique, pain, and enjoyment evidence to completed substitution events from the same session. It does not automatically retrain substitution rankings.

### Persistence, Backup, and Validation

Local persistence advances to version 8.

Backup schema version 9 adds the deferred-feedback ledger. Restore validates:

- unique request IDs;
- known session references;
- Full, Quick, or Minimal effective mode;
- valid created, expiry, and resolution dates;
- expiry after creation;
- valid lifecycle status;
- no premature resolution data on pending requests;
- no invented survey on expired requests;
- a valid source post-session survey for completed or dismissed requests;
- explicitly skipped survey semantics for dismissal;
- session agreement between the request and source survey.

Schema versions 1 through 8 migrate forward. Version 8 migration preserves existing workout and survey evidence exactly and starts the deferred-feedback ledger empty.

### Verification

- Lint passed.
- Sixty-six deterministic tests passed across eight domain files.
- Ten Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Production PWA build passed.
- Git diff whitespace validation passed.
- Explicit secret-pattern scanning and Gitleaks passed.
- Browser console and uncaught page-error collectors remained empty.
- Deterministic tests prove 24-hour creation, pending selection, exact expiry, and no post-expiry availability.
- Backup tests prove version 8 migration, completed request round trip, source-survey linkage, and broken-provenance rejection.
- The browser journey completes one 185-pound source set, defers Minimal feedback, records an unverified numeric best, proves the next workout remains available, displays the quiet Today follow-up, submits difficulty, technique, and pain later, removes the follow-up, and replays the same source set into a validated strength record.
- Mobile Today card and feedback-form screenshots were visually inspected at 390 by 844 with no horizontal overflow.
- Private repository commit `e98d0e5` is on `main` and matches the remote branch.

### Deferred Boundaries

- Automatic question-burden reduction from repeated skip behavior.
- Operating-system notifications or cross-device reminders.
- Athlete-configurable expiry duration.
- Next-day recovery surveys and later weekly, monthly, and block cadences.
- Conditional body maps and movement-specific post-session follow-up.
- Statistical validation of which questions predict outcomes for this athlete.

### Version 1.9.0 Change Entry

- Advanced R-178 to its private alpha core.
- Added a deterministic 24-hour deferred-feedback lifecycle.
- Preserved immediate session completion and next-workout access.
- Added quiet Today completion and dismissal controls.
- Added original-source-set quality replay from explicit later technique and pain.
- Added deferred substitution feedback attachment without automatic learning.
- Added backup schema version 9, local persistence version 8, and version 8 migration.
- Added deterministic lifecycle and backup tests plus committed desktop and phone journeys.
- Increased the deterministic suite from 62 to 66 tests and Playwright journeys from eight to ten.

## 44. Private Alpha 0.10.0 Quarter and Movement-Mix Analytics

Private alpha 0.10.0 closes the missing calendar-quarter horizon in R-038 and expands the honest movement and priority signals in R-039 and R-040. Every new value derives from completed source sets. Planned, missed, deferred, expired, and untouched work remains excluded.

### Calendar-Quarter Window

Calendar quarter begins on the first day of January, April, July, or October that contains today. The end remains the current end of day. This is distinct from rolling 28-day, calendar-month, calendar-year, and all-time views.

Quarter charts aggregate into monthly points from the quarter start through the current month. A quarter-to-date comparison uses a preceding matched-duration window under the same existing comparison rule. Records, achievements, body lenses, headline totals, and reconciliation all use the exact same selected source-set window.

The Progress horizon control now contains seven private-alpha options:

- Day;
- Week;
- 28 days;
- Month;
- Quarter;
- Year;
- All time.

The control may scroll horizontally inside its own boundary on narrow screens, but the page itself must never overflow.

### Exact-Movement Mix

For each exact canonical exercise inside the selected window, ForgePath derives:

- completed volume load;
- completed set count;
- completed repetition count;
- distinct completed session count;
- most recent completed timestamp;
- share of selected-period volume load;
- share of selected-period completed sets.

Rows rank by volume load, then set count, then name for stable ties. The interface shows the six leading movements and their exact evidence.

Volume share is an exercise-mix description only. It is not muscle-stimulus share, enjoyment, movement quality, recovery cost, or proof that one exercise is better than another. The interface states this limitation directly.

### Goal-Relative Priority Attention

For each current athlete priority region, ForgePath derives selected-window sets, selected-window volume, contributing exact exercises, all-time last completed exposure, and days since that exposure.

The visible evidence state is one of:

- `represented`: at least one completed primary-region set exists inside the selected window;
- `outside-window`: completed history exists, but none lies inside the selected window;
- `no-history`: no completed primary-region history exists.

These are evidence states, not programming judgments. A zero is a review signal. ForgePath does not label a body part neglected, undertrained, or over target until a versioned planned-dose model can compare the current goal, phase, intended direct and fractional dose, maintenance obligations, and completed work.

### Verification

- Lint passed.
- Sixty-eight deterministic tests passed across eight domain files.
- Twelve Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Production PWA build passed.
- Git diff whitespace validation passed.
- Explicit secret-pattern scanning and Gitleaks passed.
- Browser console and uncaught page-error collectors remained empty.
- Deterministic tests prove the distinct quarter window, monthly point construction, movement-share conservation, stable movement ranking, and represented, outside-window, and no-history priority states.
- The browser journey selects Quarter, shows monthly volume, exact movement mix, goal-relative attention, both conservative interpretation notes, seven horizon controls, and no page overflow.
- The 390 by 844 full Progress screenshot was visually inspected.
- Private repository commit `83665d7` is on `main` and matches the remote branch.

### Deferred Boundaries

- Individual-muscle and fractional-muscle dose.
- Planned versus completed dose and target-range classification.
- Pattern balance and builder-versus-tester balance.
- Density and actual session-duration analytics.
- Quality-adjusted workload.
- Causal decomposition of progress into load, repetitions, sets, frequency, or exercise mix.
- Stated and behavior-inferred enjoyment with separate correction controls.

### Version 1.10.0 Change Entry

- Advanced R-038 to every requested private-alpha horizon.
- Expanded R-039 with exact-movement mix and visible interpretation boundaries.
- Expanded R-040 with conservative goal-relative priority attention.
- Added calendar-quarter range and monthly aggregation.
- Added volume-share and set-share conservation tests.
- Added represented, outside-window, and no-history priority tests.
- Added committed desktop and phone quarter journeys.
- Increased the deterministic suite from 66 to 68 tests and Playwright journeys from ten to twelve.

## 45. Private Alpha 0.11.0 Auditable Exercise Catalog Editing

Private alpha 0.11.0 advances R-149, R-153, R-155, R-157, R-158, R-187, and R-196. It adds the first safe editing path for exercise identities without weakening exact-movement authority or rewriting completed training.

### Product Outcome

An athlete can open Exercise Detail and choose `Edit catalog`.

For a custom movement, the editable fields are:

- canonical display name;
- exercise family;
- aliases;
- movement pattern;
- primary body region;
- available equipment;
- setup or distinction description.

For a built-in movement, the shipped name, family, movement pattern, body region, equipment, and description remain protected. The athlete may add, remove, or normalize personal search aliases.

### Stable Identity Contract

The exercise ID never changes during a catalog edit. The edit changes the current catalog projection, not the movement's progression identity.

Completed source sets retain the exercise name, family, body region, and other values that were recorded when the work occurred. A later catalog rename cannot silently rewrite historical entry truth. Future displays may resolve the current catalog identity by ID while the set record retains its entered identity.

### Input Normalization

Before save, the deterministic catalog engine:

1. trims surrounding whitespace;
2. collapses repeated internal whitespace;
3. removes empty list items;
4. removes aliases that equal the canonical name without regard to case;
5. removes duplicate aliases without regard to case;
6. applies length and alias-count limits;
7. requires at least one equipment value for a custom movement;
8. preserves protected built-in fields.

The private-alpha alias limit is twenty aliases per movement. Names, families, and aliases are limited to one hundred characters. The setup note is limited to five hundred characters.

### Duplicate and Collision Contract

While the athlete edits the name or aliases, the interface shows up to three related active movements ranked by the existing deterministic matcher. This is guidance, not an automatic mutation.

At save time, the complete projected catalog passes through the stronger pair matcher. An exact canonical-name or alias collision is blocked. The error names the existing movement and tells the athlete to review that history rather than split it.

A probable but non-exact related variation may still save. It remains visible in Data Quality so the athlete can later decide whether it is a legitimate variation, needs a clearer distinction, or should be merged. No score automatically merges, retires, or deletes an identity.

Initial custom-movement creation still permits an athlete-controlled separate identity after warnings. A required high-confidence disambiguator at initial creation remains deferred.

### Audit and Undo Contract

Every successful catalog edit requires a reason and appends an `exercise-edited` event. The event stores:

- event ID and creation time;
- athlete-entered reason;
- readable before-to-after description;
- IDs of completed source sets currently attached to the movement;
- complete before and after history, catalog, future-session, athlete, and substitution snapshots;
- before and after record projections;
- before and after volume.

Catalog edits do not change completed work, so their volume consequence must be zero. The combined History and Catalog Ledger renders the event as an auditable data change. `Undo latest change` restores the exact pre-edit catalog snapshot and marks the event undone instead of erasing it.

Selective out-of-order undo remains deferred because restoring an old snapshot could overwrite a later valid edit, merge, correction, or plan consequence.

### Backup and Migration

Backup schema version 10 recognizes `exercise-edited` alongside set correction, set deletion, and exercise merge events. Restore validates the event structure and verifies that its before and after record projections still match their source histories.

Schema version 9 migrates to version 10 without inventing catalog events. Versions 1 through 8 retain their existing migration paths. Local persistence remains version 8 because no new top-level state collection is required.

### Interface and Accessibility

The editor explains before input that the canonical ID stays fixed, completed-set names remain historical truth, and the change is undoable. A protected-taxonomy callout explains the narrower built-in alias path. The final action is labeled `Save without splitting history`.

The phone editor uses one-column fields, full-width actions, wrapped modal headings, and exact-width containment. A phone-only heading overflow found during visual QA was corrected by allowing the header content to shrink and long headings to wrap.

### Verification Evidence

- Lint passed.
- Seventy-four deterministic tests passed across nine files.
- Production PWA build passed.
- Fourteen Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Catalog tests cover alias normalization, stable-ID custom edits, protected built-in taxonomy, and exact collision blocking.
- Backup tests cover schema version 9 migration and version 10 catalog-event round trip.
- The browser journey creates a custom movement, edits name, family, equipment, and alias, blocks an attempted `Bench` alias collision with Competition Bench Press, saves a valid alias, shows the zero-volume ledger event, and restores the original movement through undo.
- Dialog and page horizontal-containment checks passed on phone.
- Console-error and uncaught-page-error collectors remained empty.
- The 390 by 844 catalog editor screenshot passed visual review.
- Explicit secret-pattern scanning and Gitleaks passed.
- Private repository commit `2f4e1df` is on `main` and matches the remote branch.

### Deferred Boundaries

- Batch selection and merge of three or more accidental identities.
- Required mark-distinct rationale during initial custom creation.
- Import mapping and pre-import identity review.
- Orphaned-alias, family-fragmentation, and incomplete-taxonomy maintenance queues.
- Full structured implement, angle, grip, stance, range, tempo, pause, resistance, and laterality fields.
- Per-field catalog provenance and selective out-of-order undo.
- Multi-device edit conflicts and relational event storage.

### Version 1.11.0 Change Entry

- Added stable-ID custom movement editing.
- Added athlete-managed aliases for built-in and custom movements.
- Protected the built-in canonical taxonomy from local rewrites.
- Added live related-movement review and exact identity-collision blocking.
- Added reason-required `exercise-edited` events and latest-change undo.
- Renamed the visible mutation surface to History and Catalog Ledger.
- Advanced backup schema from version 9 to version 10 with version 9 migration.
- Increased deterministic tests from 68 to 74 and Playwright journeys from twelve to fourteen.

## 46. Private Alpha 0.12.0 Connected Duplicate Cleanup

Private alpha 0.12.0 expands R-153, R-155, R-156, and R-158. It closes the pair-by-pair cleanup limitation for connected duplicate identities and makes intentional exact-match creation more accountable.

### Exact-Match Creation Contract

Custom movement creation continues to search active system and custom identities while the athlete types.

When the proposed name exactly matches another canonical name or alias:

- the existing movement remains directly reviewable;
- the separate-create action changes to `Create documented variation`;
- the action remains disabled until the athlete records at least ten non-whitespace characters describing why the movement needs its own progression history;
- the explanation is stored in the initial custom movement description;
- no automatic merge or deletion occurs.

Probable but non-exact matches continue to show warnings without forcing the exact-match distinction field. Later calibration may extend the requirement to other high-confidence scores.

### Connected-Component Grouping

Duplicate evidence is modeled as a graph:

- each active movement is a node;
- each probable duplicate pair is an edge;
- every connected component with at least two nodes becomes one cleanup group;
- retired movements are excluded;
- groups rank by highest pair score, then identity count, then stable name order.

This means that if A matches B and B matches C, all three appear in one group even when A does not independently cross the match threshold with C. The interface reports group identity count, highest match, evidence-link count, and every connected name.

### One-Decision Multi-Source Merge

Opening a cleanup group shows every identity as an explicit canonical-target choice. Each option displays its exact completed-set count and alias count.

After the athlete selects the identity to keep and confirms a reason:

1. every other group identity becomes a source ID;
2. all sources retire into the selected target in one `exercise-merged` event;
3. source names and aliases join the target aliases;
4. completed set projections point to the target while retaining original entered identity fields;
5. planned and deferred future references update;
6. athlete strength anchors deduplicate onto the target;
7. source-backed records replay;
8. the group disappears from active Data Quality if no duplicate evidence remains;
9. one undo restores the full pre-merge group.

The merge dialog states the number of identities that will retire and the completed sets that will share one progression history. Suggestions remain non-mutating until the athlete confirms.

### Verification Evidence

- Lint passed.
- Seventy-six deterministic tests passed across nine files.
- Production PWA build passed.
- Sixteen Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Deterministic tests prove connected-component grouping and retired-identity exclusion.
- The browser journey creates `Flat Barbell Bench` and `Bench` only after a meaningful distinction is entered for each exact match.
- Data Quality presents both copies and Competition Bench Press as one three-identity group.
- The athlete keeps Competition Bench Press and retires both copies in one event.
- Data Quality becomes clean after the merge and returns after one undo.
- Persisted source identities retain `retired` and `mergedIntoId` truth before undo.
- Page containment, console-error, and uncaught-page-error checks passed on desktop and phone.
- The 390 by 844 three-identity merge dialog passed visual review.
- Git diff validation, explicit secret-pattern scanning, and Gitleaks passed.
- Private repository commit `d6bc401` is on `main` and matches the remote branch.

### Deferred Boundaries

- Import-time identity mapping and pre-import cleanup.
- Orphaned alias review and removal suggestions.
- Family-fragmentation and incomplete-taxonomy queues.
- Bulk operations across several unrelated cleanup groups.
- Calibrated disambiguation requirements for non-exact high-confidence matches.
- Selective out-of-order undo and cross-device merge conflicts.

### Version 1.12.0 Change Entry

- Added required distinctions before intentionally creating an exact duplicate.
- Added deterministic connected-component duplicate groups.
- Added one-decision multi-source merge from the Data Quality interface.
- Preserved the existing reason, history, record replay, retirement, and undo contracts.
- Kept backup schema version 10 and local persistence version 8 because no state shape changed.
- Increased deterministic tests from 74 to 76 and Playwright journeys from fourteen to sixteen.

## 47. Private Alpha 0.13.0 Planned Dose Reconciliation

Private alpha 0.13.0 expands R-039, R-040, and R-145 with the first executable planned-versus-completed dose model. Its rule identifier is `dose-v1`. The purpose of this slice is to compare stored intent with source-backed execution without inventing compliance for history that has no stored plan.

### Selected-Window Intent Contract

A stored session contributes planned intent when its `plannedDate` falls inside the selected analytics window. The session may be planned, active, completed, stopped, deferred, or expired because all of those states preserve what the app intended for that date.

Future planned sessions outside the selected window are excluded. Completed history continues to use the completed source set's actual completion time for the selected progress window.

This creates two deliberately different date questions:

1. what work was intended inside the window;
2. what work was actually completed inside the window.

The two questions are reconciled through stable session IDs, not by guessing from exercise name, date proximity, or similar load.

### Linked Completion and Missing-Plan Separation

Only a completed source set whose `sessionId` matches a stored intended session in the selected window can count toward planned-set completion.

Completed source sets without a matching stored plan remain valid completed training. They continue to contribute to volume, repetitions, records, exercise history, movement mix, and progress charts. They appear separately as `Completed without stored plan` and cannot be silently assigned to an intended session.

This separation protects imported or seeded history, older workouts created before plan storage, and direct logging from becoming false compliance evidence.

### Planned Set and Volume Definitions

For each included stored session:

- every prescribed set contributes one planned set;
- known planned volume load equals target repetitions multiplied by target load;
- a target load greater than zero is known planned load;
- a target load of zero is unknown load, not known zero volume;
- unknown planned-load sets are counted and displayed explicitly;
- linked completed volume continues to use actual completed repetitions multiplied by actual completed load.

The headline panel reports:

- stored plans in the window;
- intended sets;
- linked completed sets and completion percentage;
- known planned volume load;
- count of planned sets with unknown load;
- completed sets with no stored plan;
- completed volume load kept outside the plan-completion calculation.

### Primary-Region Dose Status

Dose-v1 maps planned and linked completed sets to the exercise's current primary body region. Current athlete-priority regions remain visible even when both planned and completed dose are zero.

Status uses linked completed sets divided by planned sets:

- `below-plan`: less than 85 percent;
- `within-plan`: 85 through 115 percent;
- `above-plan`: greater than 115 percent;
- `unplanned-completed`: no planned sets and at least one linked completed set in the region;
- `no-dose`: no planned sets and no linked completed sets.

These thresholds are a visible product heuristic under `dose-v1`, not a physiological truth. They require calibration from real use before they may influence future prescriptions.

### Interpretation Guardrails

- Below-plan means execution differed from stored intent in this selected window.
- One below-plan window does not prove that a body part is neglected.
- Below-plan never creates catch-up volume automatically.
- Above-plan does not prove superior stimulus or better training.
- Set completion does not equal individual-muscle stimulus.
- Current catalog region assignment may not perfectly reproduce historical catalog state.
- Missing stored plans and unknown planned loads must remain visible uncertainty.
- Dose status is descriptive in 0.13.0 and cannot alter programming automatically.

### Verification Evidence

- Lint passed.
- Seventy-eight deterministic tests passed across nine files.
- Production PWA build passed.
- Eighteen Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Deterministic tests prove linked-session reconciliation, missing-plan separation, unknown planned-load preservation, and future-plan exclusion.
- The browser journey completed one source set from a stored fifteen-set plan and verified `1 / 15` linked completion.
- The same journey preserved 136 completed sets and 153,700 pounds of volume with no stored plan as separate progress history.
- The chest row reported four planned sets and one linked completed set without claiming neglect or prescribing catch-up work.
- The 390 by 844 planned-dose panel passed visual review with no horizontal overflow.
- Page-width, console-error, and uncaught-page-error checks passed on desktop and phone.
- Git diff validation, explicit secret-pattern scanning, and Gitleaks passed.
- Private repository commit `30044b7` is on `main` and matches the remote branch.

### Deferred Boundaries

- Individual-muscle and fractional-muscle dose.
- Historical catalog-version mapping.
- Plan-revision and superseded-target provenance inside one selected window.
- Import-time mapping between completed history and historical plans.
- Duration, density, quality-adjusted, and proximity-to-failure dose.
- Exercise substitution attribution when a completed movement differs from the planned movement.
- Calibrated status thresholds and longitudinal target ranges.
- Automatic program adaptation from dose status.
- Causal attribution of progress to load, repetitions, sets, frequency, or exercise mix.

### Version 1.13.0 Change Entry

- Added `dose-v1` as a versioned planned-versus-completed analytics rule.
- Counted planned sets from dated stored sessions inside the selected window.
- Counted only session-linked completed source sets toward plan completion.
- Preserved completed history with no stored plan as separate progress evidence.
- Treated zero target load as unknown planned load.
- Added primary-region planned and linked-completed status with conservative interpretation rules.
- Kept backup schema version 10 and local persistence version 8 because no persisted state shape changed.
- Increased deterministic tests from 76 to 78 and Playwright journeys from sixteen to eighteen.

## 48. Private Alpha 0.14.0 Validated Training History Import

Private alpha 0.14.0 expands R-102, R-150, R-153, R-154, R-187, R-196, and R-197. It creates the first safe path for bringing older completed training into ForgePath without fragmenting exercise identity, inventing quality evidence, or silently duplicating volume.

### Supported Source Contract

The first adapter accepts a UTF-8 CSV file with one completed set per row.

Required semantic columns are:

- `date`, with aliases `completed_at`, `completed_date`, and `workout_date`;
- `exercise`, with aliases `exercise_name`, `movement`, and `movement_name`;
- `load`, with aliases `weight` and `load_weight`;
- `reps`, with alias `repetitions`.

Optional columns are:

- `rir`, with alias `reps_in_reserve`;
- `session`, with aliases `session_name`, `workout`, and `workout_name`.

The parser supports quoted fields, escaped double quotes, commas inside quoted values, Unix and Windows line endings, and a leading UTF-8 byte order mark. A template is downloadable from the import dialog.

The private-alpha batch limit is 10,000 completed sets. Larger sources must be divided or handled through a later streaming adapter.

### Atomic Validation Contract

The importer validates the complete source before any application state changes.

- Dates must use `YYYY-MM-DD` or an ISO date and time.
- Calendar-impossible dates are rejected.
- Exercise names cannot be empty.
- Load must be finite and zero or greater.
- Repetitions must be a whole number from 1 through 1,000.
- RIR must be blank or a number from 0 through 10.
- Missing required columns block the file.
- An unclosed quoted field blocks the file.
- Any invalid row blocks the full commit.
- Errors identify the original CSV row number.

There is no partial success mode in this release. The athlete fixes the file and previews it again. This prevents a large history from entering an ambiguous half-imported state.

### Canonical Exercise Identity Review

Every distinct source exercise name receives one mapping decision.

The deterministic matcher may auto-map only when exactly one active canonical name or alias matches after normalization. That mapping is labeled as exact.

A containment or family-like probable match may be shown as review evidence, but it is never auto-selected. An unmatched name is also never auto-selected. Both cases require the athlete to choose one active canonical movement from the library.

Commit remains disabled until every source name has an active canonical target. The importer does not create a custom exercise, merge identities, or retire identities automatically.

This preserves one progression history per movement while allowing source vocabulary such as `Bench` to resolve to `Competition Bench Press`. A source-only name such as `Legacy Coffin` remains attached as entered text after the athlete maps it to `Coffin Press`.

### Load Units and Numeric Truth

Before file selection, the athlete chooses whether source loads are pounds or kilograms. The app's active unit setting is the destination unit.

- Matching units preserve the source number.
- Kilograms to pounds use the standard conversion factor and round to one decimal place.
- Pounds to kilograms use the reciprocal conversion and round to one decimal place.
- Zero load remains zero.
- The preview reports how many loads will convert.
- Each imported set retains its source unit.

This release normalizes imported load into the app's active unit. It does not yet support plate-only notation, bodyweight-plus or bodyweight-minus notation, assistance-machine levels, bands, chains, distance, time, or mixed-unit rows.

### Source Provenance and Duplicate Occurrences

Every imported completed set retains:

- source file name;
- original CSV row number;
- batch ID;
- original exercise text;
- source date and time;
- source unit;
- whether RIR was known;
- an import fingerprint.

The system does not invent an original canonical exercise ID for text that existed only in the source file.

The fingerprint uses source date, normalized source movement name, normalized session name, normalized destination load, repetitions, known or unknown RIR, and the occurrence number of otherwise identical rows.

Occurrence numbers are required because two sets of 205 by 5 in one session are two legitimate source sets. If both were imported, a repeat import skips both. If one occurrence is later removed, importing the same file again can restore only the missing occurrence.

### Session and Plan Separation

Rows sharing the same date and normalized source session name share one imported session identity. When the source has no session column, rows on the same date share an imported workout identity.

These imported session IDs are completed-history groupings, not stored ForgePath plans. Imported sets contribute to:

- completed volume;
- repetitions;
- exact exercise history;
- exercise and body-region analytics;
- numeric-only records;
- movement mix;
- unlinked completed history in dose-v1.

They do not count toward stored-plan completion. A later historical-plan mapping workflow must make that relationship explicit rather than guessing it from dates or names.

### Quality and Missingness

Imported numbers are never treated as quality-confirmed in this release.

- Missing RIR is stored with `rirKnown: false` and displayed as `RIR unknown`.
- A numeric placeholder used by the current record shape cannot become RIR evidence while `rirKnown` is false.
- Technique and pain remain unconfirmed.
- Imported record candidates are labeled numeric-only.
- A later explicit set correction can provide known RIR and quality confirmation.
- The importer does not assume good technique, zero pain, or target achievement.

### Commit, Replay, and Undo

A successful import appends all new source sets at once, replays every derived personal record, updates analytics from completed source truth, and adds one `history-imported` event.

The event retains:

- source file in its reason and description;
- all affected source-set IDs;
- complete before and after history snapshots;
- before and after record projections;
- before and after volume;
- one-step undo state.

Repeating a fully imported source adds no sets and creates no second mutation event. The interface reports that every row already exists.

Undo restores the complete state before the import and marks the import event undone. It does not delete or rewrite unrelated completed training.

### Interface Contract

Library exposes a visible `Import history` button beside Data Quality and Add Movement.

The dialog includes:

- source-unit selection;
- CSV chooser;
- downloadable template;
- source-row count;
- distinct movement-name count;
- source date range;
- already-imported row count;
- conversion notice;
- row-specific validation errors;
- mapping status and evidence for every source movement;
- canonical movement selectors;
- an explicit no-silent-inference boundary;
- disabled commit until all requirements pass.

The 390 by 844 phone layout stacks controls, summary cards, mapping rows, safety copy, and actions without horizontal overflow.

### Verification Evidence

- Lint passed.
- Eighty-four deterministic tests passed across ten files.
- Production PWA build passed.
- Twenty Playwright journeys passed across desktop Chromium and Pixel 5 projects.
- Parser tests cover quoted commas, header aliases, invalid dates, invalid numbers, missing headers, and unclosed quotes.
- Mapping tests prove exact alias mapping and required unmatched-name selection.
- Unit tests prove kilogram-to-pound normalization and explicit missing RIR.
- Fingerprint tests prove repeated identical sets remain separate occurrences and a removed occurrence can be restored.
- Backup tests prove import event and row provenance round trip and reject incomplete imported metadata.
- The browser journey imported two exact-alias Bench sets and one explicitly mapped Legacy Coffin set.
- The journey proved all imported quality remained unverified and the original source file, row, name, and RIR missingness persisted.
- Re-importing the same source skipped all three existing occurrences without adding volume.
- One undo restored the exact pre-import set count and marked the import event undone.
- Dialog-width, page-width, console-error, and uncaught-page-error checks passed on desktop and phone.
- Both the opening and identity-review portions of the 390 by 844 dialog passed visual review.
- Git diff validation, explicit secret-pattern scanning, and Gitleaks passed.
- Private repository commit `d7e1afd` is on `main` and matches the remote branch.

### Deferred Boundaries

- Vendor-specific adapters for Hevy, Strong, JuggernautAI, RP, spreadsheets, and other sources.
- Column-mapping UI for arbitrary headers.
- Imported planned-session and historical-plan mapping.
- Imported structured coach notes, readiness, equipment, location, and block context.
- Placement-confidence changes from imported history.
- In-flow creation of a genuinely distinct custom movement.
- Athlete-approved quality import and quality-source provenance.
- Bodyweight, assistance, band, chain, distance, time, and mixed-unit conventions.
- Import correction at batch or mapping level after commit without full undo.
- Streaming or server-backed import above 10,000 rows.
- Cross-device import conflict resolution.

### Version 1.14.0 Change Entry

- Added complete-set CSV preview and atomic validation.
- Added exact-only automatic canonical mapping and required uncertain-name review.
- Added visible pounds and kilograms normalization.
- Added source file, row, name, unit, missingness, batch, and fingerprint provenance.
- Added occurrence-aware duplicate prevention for identical sets.
- Added numeric-only imported record behavior and stored-plan separation.
- Added one-event import replay and exact undo.
- Kept backup schema version 10 and local persistence version 8 because all new persisted fields are optional and backward compatible.
- Increased deterministic tests from 78 to 84 and Playwright journeys from eighteen to twenty.

## 49. Private Alpha 0.15.0 Individual and Fractional Muscle Dose

### Outcome

Private alpha 0.15.0 adds the first complete, source-traceable individual-muscle dose lens. It answers which muscles received direct or secondary completed-set exposure without confusing the result with volume load, EMG, fatigue, recovery cost, or measured hypertrophy stimulus.

The implementation is deterministic, local, offline-capable, and versioned as `muscle-dose-v1`. It derives entirely from completed source sets in the currently selected Progress time range. Planned work, missed work, and incomplete sets never enter this calculation.

### Metric Contract

For one completed source set and one mapped muscle:

- direct credit equals `1.0` muscle set-equivalent;
- secondary credit equals `0.5` muscle set-equivalent;
- stabilizer credit equals `0`;
- one exercise has exactly one direct muscle in this initial taxonomy;
- one source set can credit several individual muscles, so muscle rows are non-additive;
- load, repetitions, RIR, technique, pain, tempo, and range of motion do not modify set credit in version 1;
- zero-exposure muscles remain visible rather than disappearing;
- an unmapped movement receives no invented credit and remains visibly unmapped.

For muscle `m` over completed sets `S`:

`muscle_dose(m) = sum(credit(set, m) for set in S)`

The interface always separates:

- direct set-equivalents;
- secondary set-equivalents;
- their displayed muscle total;
- unique completed source-set count;
- exact contributing exercises;
- exact source-set identifiers;
- latest exposure date.

The sum across muscle rows can exceed the number of completed sets because one compound set can credit multiple muscles. This is correct for the non-additive muscle lens and must never be presented as conserved workload.

### Leaf Muscle Taxonomy

`muscle-dose-v1` contains seventeen leaf groups:

| Parent | Leaf muscles |
|---|---|
| Upper body | Pectorals, anterior deltoids, lateral deltoids, posterior deltoids, triceps, biceps, forearms and grip, latissimus, upper back |
| Lower body | Quadriceps, hamstrings, gluteals, adductors, calves |
| Trunk | Spinal erectors, abdominals, obliques |
| Arms subset | Triceps, biceps, forearms and grip |

The arms lens is an explicit subset of upper body, not another mutually exclusive whole-body region. The taxonomy separates trapezius from generic upper back but does not silently subdivide upper, middle, and lower traps as independent dose lanes. It also does not yet separate upper and lower pectorals, individual quadriceps heads, individual hamstrings, soleus and gastrocnemius, or biceps and brachialis. That extra precision requires a deliberate later version rather than silent inference.

### Built-In Exercise Credit Map

Every built-in movement has an explicit mapping. There is no fallback based only on exercise name, family, or broad body region.

| Exercise | Direct 1.0 | Secondary 0.5 |
|---|---|---|
| Competition Bench Press | Pectorals | Triceps, anterior deltoids |
| Two-Board Press | Triceps | Pectorals, anterior deltoids |
| Three-Board Press | Triceps | Pectorals |
| Coffin Press | Pectorals | Triceps |
| Incline Dumbbell Press | Pectorals | Anterior deltoids, triceps |
| Low-to-High Cable Fly | Pectorals | None |
| Sumo Deadlift | Gluteals | Quadriceps, hamstrings, adductors, spinal erectors |
| Conventional Deficit Deadlift | Hamstrings | Gluteals, spinal erectors, upper back |
| Paused Sumo Deadlift | Gluteals | Quadriceps, hamstrings, adductors, spinal erectors |
| Competition Back Squat | Quadriceps | Gluteals, adductors, spinal erectors |
| Safety Squat Bar Squat | Quadriceps | Gluteals, upper back, spinal erectors |
| Cambered Bar Good Morning | Hamstrings | Gluteals, spinal erectors |
| Hack Squat | Quadriceps | Gluteals |
| Seated Leg Curl | Hamstrings | None |
| Cambered Bar Row | Upper back | Latissimus, biceps, forearms and grip, spinal erectors |
| Chest-Supported Row | Upper back | Latissimus, biceps |
| Neutral-Grip Lat Pulldown | Latissimus | Biceps, upper back |
| Standing Overhead Press | Anterior deltoids | Triceps, lateral deltoids |
| Cable Lateral Raise | Lateral deltoids | None |
| Overhead Cable Triceps Extension | Triceps | None |
| Cross-Body Hammer Curl | Biceps | Forearms and grip |
| Ab Wheel Rollout | Abdominals | Obliques |

These mappings are product heuristics for programming review. They are not claims about universal biomechanics or equal stimulus across lifters, techniques, machines, loads, repetition ranges, or ranges of motion.

### Overlap-Safe Parent Rollups

Parent areas use a different conserved calculation from the non-additive muscle rows. Within a parent, each source set contributes only its highest eligible child-muscle credit:

`parent_dose(area) = sum(max(child_credit(set)) for each unique set in area)`

Examples:

- One competition-bench set gives pectorals `1.0`, triceps `0.5`, and anterior deltoids `0.5` in individual rows.
- The same set gives upper body `1.0`, not `2.0`.
- The same set gives arms `0.5`, not another full set.
- A sumo-deadlift set gives lower body `1.0` and trunk `0.5`.
- Whole body counts a mapped source set at its highest credit, which is `1.0` under the current explicit map.

The Progress interface shows whole body, upper body, lower body, arms, and trunk together with both conserved dose and unique contributing source-set count.

### Unknown and Zero Evidence

Zero and unknown are different states:

- A known built-in muscle with no mapped completed set in the selected window is shown as `0.0`.
- A completed custom or otherwise unmapped exercise remains in volume load and completed-set totals but adds no muscle credit.
- The summary reports mapped source sets, unmapped source sets, and the names of unmapped exercises.
- The engine never guesses a custom movement mapping from a name or broad region.
- Mapping a custom movement requires a later athlete-reviewed taxonomy workflow and a new versioned rule or stored mapping.

### Progress Interface Contract

The Progress screen includes:

- the same Day, Week, rolling 28-day, Month, Quarter, Year, and All time range selector used by source-set analytics;
- All, Upper, Lower, Arms, and Trunk muscle lenses;
- completed source sets, mapped sets, direct credit, and secondary credit summary cards;
- overlap-safe parent rollups;
- one row for every muscle in the selected taxonomy lens, including zero rows;
- visually distinct lime direct and orange secondary bars;
- source-set count and latest exposure date;
- tap-to-open provenance detail;
- exact contributing movement, direct credit, secondary credit, total credit, latest date, and source-set count;
- collapsed access to complete source-set identifiers so auditability does not overwhelm the phone layout;
- an unmapped warning that names affected movements;
- explicit non-additive, heuristic, and non-causal interpretation copy.

The interface must not label a zero row as neglected, prescribe catch-up volume, rank the athlete morally, or imply that two exercises with equal credit create equal outcomes.

### Implementation Contract

The current implementation lives in `src/domain/muscle-dose.ts` and is consumed by `src/screens/ProgressScreen.tsx`.

Required invariants:

1. Every shipped built-in exercise ID appears exactly once in the versioned credit map.
2. No custom or unknown ID receives a fallback mapping.
3. Every mapped exercise has at least one direct `1.0` assignment.
4. Credits are limited to `1.0` and `0.5` in version 1.
5. Individual muscle totals preserve direct and secondary components separately.
6. Parent rollups deduplicate by completed source-set ID and keep only the maximum eligible child credit.
7. Selected time range is applied before muscle-dose calculation.
8. Exact source-set identifiers remain recoverable from the interface.
9. Corrections, deletions, merges, imports, and undo automatically replay the derived view from current completed history.
10. No new persisted state, backup schema, cloud dependency, or AI dependency is required.

### Verification Evidence

- Lint passed.
- Eighty-nine deterministic tests passed across eleven files.
- Production PWA build passed.
- Twenty-two Playwright runs passed across desktop Chromium and Pixel 5 projects.
- A mapping-coverage test proves all twenty-two built-in exercises have explicit entries.
- Direct and secondary separation tests prove the `1.0` and `0.5` calculation.
- Parent tests prove whole, upper, lower, arms, and trunk rollups conserve each source set once at its highest eligible child credit.
- Unknown-movement tests prove no inferred credit is created.
- Lens tests prove upper, lower, arms, and trunk filtering.
- The browser journey proves the All time range, arms lens, triceps drilldown, exact source identifiers, interpretation text, and overlap-safe rollup.
- Desktop and 390 by 844 phone layouts have no horizontal overflow.
- Phone visual review found and corrected an overlong provenance presentation. Full identifiers now remain available inside a bounded disclosure.
- Git diff validation, explicit secret-pattern scanning, pre-commit Gitleaks, and full-directory Gitleaks passed.
- Private repository commit `4ccfe5b` is on `main` and matches the remote branch.

### Deferred Boundaries

- Exercise-specific fractional values beyond `0.5`.
- Technique, range of motion, effort, repetition range, load, tempo, and quality modifiers.
- Muscle-length, regional-hypertrophy, and individual-muscle-head distinctions.
- Calibrated minimum effective, target, maximum recoverable, or neglect thresholds.
- Historical catalog-version mapping instead of replaying current custom mappings across all history and plans.
- Trend charts for individual muscles and progression-driver decomposition.
- Region-involvement tonnage as a separate non-additive metric.
- Stored or server-generated aggregate tables.
- Athlete-specific learning that revises mappings from outcomes.
- Scientific validation of the product taxonomy against longitudinal outcomes.

### Version 1.15.0 Change Entry

- Added versioned `muscle-dose-v1` with seventeen leaf muscles.
- Added explicit mappings for every built-in exercise.
- Added direct `1.0`, secondary `0.5`, and no-stabilizer credit.
- Added zero-exposure rows and visible unmapped movement handling.
- Added overlap-safe whole, upper, lower, arms, and trunk rollups.
- Added exact exercise and source-set drilldowns.
- Added phone-safe collapsible source identifiers and interpretation guardrails.
- Kept backup schema version 10 and local persistence version 8 because muscle dose is derived from existing completed source sets.
- Increased deterministic tests from 84 to 89 and Playwright runs from twenty to twenty-two.

## 50. Private Alpha 0.16.0 Athlete-Reviewed Muscle Mapping and Planned Muscle Dose

### Release Status

- App version: `0.16.0`.
- Calculation rules: `exercise-muscle-map-v1`, `muscle-dose-v1`, and `muscle-plan-dose-v1`.
- Backup schema: version `10` because the new mapping field is optional and backward compatible.
- Local persistence: version `8`.
- Repository: private `Falatua/adaptive-strength-hypertrophy-app`.
- Verified commit: `adde78ae4a7ad291406123035050eed7fcd7cc23` on `main`, equal to remote `main`.
- Cloud and AI boundary: no authentication, backend, cloud sync, or language-model provider was added.

### Product Outcome

Private alpha 0.16.0 closes the two immediate boundaries left by 0.15.0. An athlete can explicitly review muscle attribution for a custom movement, and Progress can compare intended muscle set credit with completion linked to the exact stored sessions. The product still treats these values as transparent programming heuristics. It does not infer a custom mapping, convert tonnage into stimulus, diagnose neglect, or schedule catch-up work.

### Custom Exercise Mapping Contract

An optional `ExerciseMuscleMapping` may exist only on a custom exercise. Its required shape is:

```ts
interface ExerciseMuscleMapping {
  ruleVersion: 'exercise-muscle-map-v1'
  direct: MuscleId
  secondary: MuscleId[]
  source: 'athlete'
  reviewedAt: string
}
```

Validation invariants:

1. The direct muscle must be one of the seventeen versioned `MuscleId` values.
2. A mapping contains exactly one direct muscle at `1.0` credit.
3. It may contain zero through eight distinct secondary muscles at `0.5` credit each.
4. The direct muscle cannot also appear in the secondary list.
5. The source is always `athlete` in version 1.
6. The review timestamp must be a valid date.
7. Built-in exercises cannot store an athlete mapping because their shipped `muscle-dose-v1` mappings remain protected product rules.
8. An athlete may leave a custom movement unmapped. Missing attribution stays unknown and adds no muscle credit.
9. The application never infers muscle credit from a custom movement's name, family, movement type, or primary body-part field.

### Library Workflow

Custom movement creation offers an optional `Map muscle dose now` control. Enabling it requires one direct choice before creation and presents the full secondary list with a visible `0/8` through `8/8` count. Once eight secondary muscles are selected, unchecked choices are disabled while selected choices remain removable.

Exercise Detail distinguishes three states:

- protected built-in `muscle-dose-v1` mapping;
- athlete-reviewed custom mapping with review date;
- visibly unmapped custom movement.

The custom-movement editor can add, replace, or remove the mapping. Saving still requires a written catalog-change reason. The canonical exercise ID stays fixed, completed-set names remain historical truth, and existing set volume is not rewritten.

### Audit, Replay, and Undo

A mapping change uses the existing `exercise-edited` history event. Before and after exercise snapshots contain the complete mapping state. The catalog ledger describes whether the mapping was reviewed and updated or removed. Latest-change undo restores the exact previous mapping, and derived completed and planned muscle-dose views replay immediately.

Version 0.16.0 intentionally uses the exercise's current mapping when replaying all completed history and stored plans. The event snapshot preserves what changed, but a completed set does not yet retain the catalog mapping version that existed on its completion date. Historical catalog-version attribution is a declared later requirement, not silently claimed behavior.

When duplicate identities merge, source history and future planned references move to the athlete-selected target and replay under the target's mapping. Undo restores the source identities and their mapping snapshots.

### Planned Muscle Dose Source Contract

`muscle-plan-dose-v1` accepts stored sessions, completed source sets, the current exercise catalog, a selected Progress range, and the current date. It applies the same Day, Week, rolling 28-day, Month, Quarter, Year, and All time range boundary used by the existing analytics.

Planned sources are dated stored sessions inside that selected window. Every prescribed set receives a composite source identity:

`planned source ID = session ID + planned exercise slot ID + planned set ID`

The exercise-slot component is required because plan-generation fixtures and legitimate repeated structures may reuse raw set IDs across several movement slots. A raw planned set ID alone must never collapse distinct intended sets.

Only completed source sets whose `sessionId` matches a stored session in the selected window count as linked completion. Completed history without a matching stored plan remains valid training and progress evidence but stays separate from plan comparison. No matching is performed by date, movement name, or a guessed schedule.

### Planned Calculation Contract

For every composite planned source set:

- direct credit adds `1.0` to the mapped direct muscle;
- each mapped secondary muscle adds `0.5`;
- an unmapped movement increments the planned mapping gap and adds no muscle credit.

For every linked completed source set, the same current mapping rules produce linked completed direct and secondary credit. The engine reports:

- stored plan count;
- intended source-set count;
- mapped planned source-set count;
- unmapped planned source-set count and affected movement names;
- linked completed source-set count;
- linked mapped and linked unmapped completed-set counts;
- completed source sets without stored plans;
- per-muscle planned direct, planned secondary, linked completed direct, linked completed secondary, composite planned identifiers, and exact completed source-set identifiers.

Per-muscle completion is:

`completion rate = linked completed muscle set-equivalents / planned muscle set-equivalents`

Version 1 status labels are descriptive only:

- below plan when the rate is less than `0.85`;
- within plan from `0.85` through `1.15`;
- above plan when the rate is greater than `1.15`;
- no planned dose when planned set-equivalents are zero.

These thresholds do not define minimum effective volume, maximum recoverable volume, neglect, recovery, or hypertrophy response. A `0%` result can simply mean that the stored session has not been performed yet.

### Progress Interface Contract

The new panel is titled `Intended set credit versus linked completion` and is explicitly labeled `Planned muscle dose · muscle-plan-dose-v1`. It shares the existing All, Upper, Lower, Arms, and Trunk lens so completed and planned views stay comparable.

The summary shows stored plans, intended source sets, mapped and unmapped planned sets, linked mapped completion, total linked source sets, and completed work without a stored plan. Each visible muscle row shows:

- planned direct and secondary credit;
- linked completed direct and secondary credit;
- total planned and linked completed set-equivalents;
- completion percentage and descriptive status;
- planned credit-link count and completed credit-link count;
- a bounded progress bar.

An interpretation note states that ratios use versioned muscle set-equivalents, not volume load or measured stimulus. It also states that unlinked history remains valid progress evidence and that below-plan evidence never creates a neglect label or catch-up prescription.

### Backup and Recovery Contract

Backup schema version 10 accepts the new optional mapping without forcing a migration. Restore validation rejects:

- mappings on built-in exercises;
- unsupported mapping rule versions or sources;
- invalid direct or secondary muscles;
- duplicate secondary muscles;
- direct and secondary overlap;
- more than eight secondary muscles;
- invalid review timestamps;
- invalid mapping snapshots inside history events.

Valid mappings survive export, integrity validation, preview, restore, catalog-event history, and undo. Versions 1 through 9 remain covered by migration tests.

### Verification Evidence

- ESLint passed.
- Ninety-three deterministic tests passed across eleven files.
- Production TypeScript and PWA build passed.
- Twenty-two Playwright runs passed across desktop Chromium and the 390 by 844 phone project.
- Domain tests cover valid custom credit, visibly unmapped custom movements, mapping validation, backup round trip, invalid provenance rejection, session-linked plan completion, unlinked history separation, and repeated raw planned-set IDs across movement slots.
- The browser mapping journey adds Pectorals direct and Triceps secondary credit, verifies the detail state and catalog event, then proves one-step undo removes the mapping.
- The browser plan journey reconciles one stored session to fifteen intended and fifteen mapped planned sets. It preserves duplicate raw set IDs through composite identities and keeps 238 unlinked completed sets separate in the all-time fixture.
- Phone captures for custom mapping, the catalog editor, and planned muscle dose passed full-resolution visual review with readable controls and no horizontal overflow.
- Git diff validation, explicit secret-pattern scanning, pre-commit Gitleaks, full-directory Gitleaks, and dependency audit passed. The dependency audit reported zero vulnerabilities.
- Local and remote commit hashes match exactly at `adde78ae4a7ad291406123035050eed7fcd7cc23`.

### Deferred Boundaries

- Store mapping-version identity on each planned and completed source set so historical attribution can replay under the rule active at that time.
- Allow athlete-reviewed adjustments to built-in mappings only after a separate override and provenance design.
- Calibrate credit beyond fixed `1.0` and `0.5` values.
- Add plan-revision attribution, imported historical plan mapping, density, duration, RIR, technique, range-of-motion, tempo, pain, and quality modifiers.
- Add individual-muscle trend charts and saved custom muscle groups.
- Validate meaningful minimum, target, maximum, neglect, recovery, or adaptation thresholds from longitudinal outcomes.
- Use mapping disagreements and athlete corrections as evidence without silently retraining deterministic rules.
- Add server materialization only when backend needs justify it.

### Version 1.16.0 Change Entry

- Added optional, athlete-reviewed custom exercise muscle mappings.
- Added one direct and up to eight secondary selections with strict validation.
- Added mapping provenance, review time, audit descriptions, backup validation, replay, and exact undo.
- Added `muscle-plan-dose-v1` using exact stored-session linkage.
- Added composite planned source identities that preserve repeated raw set IDs across movement slots.
- Added planned mapping gaps and separate unlinked completed history.
- Added shared body-area lenses and descriptive planned-versus-linked muscle rows.
- Kept backup schema version 10 and local persistence version 8.
- Increased deterministic tests from 89 to 93 while retaining twenty-two desktop and phone Playwright runs.

## 51. Private Alpha 0.17.0 Equipment Profiles and Executable Loads

### Scope and Requirement Authority

Private alpha 0.17.0 implements the first local deterministic slices of R-045 Equipment and Location Profiles, R-046 Equipment-Aware Substitution, and R-115 Executable Load Increments. The release does not claim plate inventory, assistance-direction, unilateral convention, or machine-stack discovery. Those remain explicit later increments.

### Equipment Profile Contract

An `EquipmentProfile` is a stable local record with:

- stable ID and athlete-editable name;
- location kind of commercial gym, home gym, travel, hotel, bodyweight, or custom;
- normalized exact equipment tags;
- optional short constraint statements;
- load unit;
- separate positive increments for barbell, dumbbell, cable, machine, and other work;
- source and update time.

The app ships with Commercial Gym, Home Gym, and Travel Setup seeds. Athletes can create or customize profiles and select one active location. Built-in profile IDs cannot be deleted. A location name alone never implies equipment. Every omitted explicit requirement is treated as unavailable.

The active profile ID, legacy-compatible location label, and athlete equipment label stay synchronized. Equipment profiles persist in local schema version 9 and backup schema version 11. Version 10 backups migrate to the matching seeded location when possible, while versions 1 through 9 continue through their established migration chain.

### Availability Contract

`equipment-profile-v1` normalizes exercise and profile equipment tags, then requires every explicit exercise tag to exist in the active profile. It returns the complete required list and exact missing list. It does not infer synonyms, equivalent attachments, or hidden inventory.

Today displays the active location and every conflicting planned movement. Starting a conflicting session requires a visible review. The athlete can cancel, edit the location, or enter the workout knowing each unresolved movement must be changed before logging.

Workout marks every unavailable movement, names the missing equipment, disables its load, repetition, and RIR fields, and blocks incomplete-set completion. A previously completed set can still be undone. The athlete can skip or resolve the movement, so unavailable planned work never becomes completed evidence by accident.

Library provides All equipment, Available here, and Missing equipment filters. Every movement card and detail panel shows availability against the active profile and lists missing requirements when unavailable. New custom movements must name at least one required equipment item so the app never creates an unclassifiable `custom` placeholder.

### Equipment-Aware Substitution Contract

The substitution engine accepts the active equipment profile as explicit input. Unavailable candidates are removed before scoring and presentation. Available candidates receive a visible location-fit reason. All existing role, purpose, target region, joint, familiarity, fatigue, readiness, and protected-primary rules remain active.

The store revalidates availability when the athlete commits the substitution. The event ledger retains the active location name, candidate snapshots, original and replacement prescriptions, reason, readiness, and eventual completed source sets. Equipment compatibility is necessary but does not silently claim perfect stimulus equivalence.

### Executable Load Contract

`load-increment-v1` classifies each exercise into barbell, dumbbell, cable, machine, or other from its explicit equipment tags. Progression and replacement prescriptions use the active profile's increment for that class instead of a universal five-pound assumption.

When a workout starts, every planned target load in the executable workout copy rounds to the nearest multiple of the active profile increment. Zero remains zero for bodyweight, calibration, or unknown-load work. The load input step uses the same increment. Athlete-entered actual load remains authoritative and is never silently replaced after entry.

This first slice does not yet model plate-pair inventory, bar weight, fractional plates, maximum dumbbell weight, nonuniform machine stacks, band assistance direction, or per-exercise overrides. The interface and data model label the current value as the smallest executable jump rather than claiming full loading physics.

### Backup, Recovery, and Validation

Backup schema version 11 includes equipment profiles and active-profile identity. Restore validation rejects malformed profiles, duplicate IDs, duplicate equipment tags, invalid increments, unsupported units or kinds, invalid timestamps, missing active references, and location labels that disagree with the active profile. Preview reports the number of training locations before restore.

The local schema migration backfills seeded profiles and selects the legacy saved location when possible. Reset restores the three seeded profiles. No cloud database or language-model provider is required.

### Verification Evidence

- ESLint passed.
- One hundred one deterministic tests passed across twelve files.
- Production TypeScript and PWA build passed.
- Twenty-four Playwright runs passed across desktop Chromium and the 390 by 844 phone project.
- Domain tests cover exact availability, missing-item evidence, session gaps, normalization, invalid profiles, equipment-filtered substitutions, load increment classification, executable rounding, backup round trip, version 10 migration, and malformed-profile rejection.
- The browser journey creates Garage Rack, records exact equipment and constraints, sets a 2.5 lb barbell increment, activates and reloads it, reviews four session conflicts, starts through the explicit gate, confirms the 2.5 load-input step, sees four blocked movements, and replaces Two-Board Press only with an available Coffin Press.
- Full-resolution phone review confirmed readable location cards, active-state hierarchy, constraints, blocked-workout cards, fixed workout controls, and no horizontal overflow.
- Git diff validation, explicit secret-pattern scanning, repository-history Gitleaks, full-directory Gitleaks, and dependency audit passed. The dependency audit reported zero vulnerabilities.
- Local and remote private-repository `main` match at commit `9acfba9c9eebc4d1b9dcdb1c94bc7a15cdf3d8f3`.

### Deferred Boundaries

- Add plate-pair math, bar weights, fractional plates, maximum dumbbell loads, nonuniform machine stacks, assistance direction, unilateral logging, and per-exercise overrides.
- Add equipment-profile version identity to planned and completed source records so older sessions can replay against the exact inventory state active at that exposure.
- Make generated future sessions equipment-eligible before they reach Today, instead of relying on the honest review and substitution gate.
- Add athlete-approved equipment aliases and equivalence groups without weakening conservative matching.
- Recalculate warm-ups, rest, total time, muscle dose, fatigue, and later-session priority after every substitution.
- Calibrate location switching and equipment corrections during real training before adding cloud synchronization.

### Version 1.17.0 Change Entry

- Added local equipment and location profiles with exact inventories, constraints, units, and five load-increment classes.
- Added conservative availability filters to Today, Workout, Library, custom movement creation, and substitution ranking.
- Added a pre-workout equipment review and blocked unavailable set logging.
- Added profile-specific progression, substitution, executable target rounding, and load-input steps.
- Added backup schema version 11, local persistence version 9, and version 10 migration.
- Increased deterministic tests from 93 to 101 and browser journeys from twenty-two to twenty-four.

## 52. Private Alpha 0.18.0 Explainable Starting Placement

### Scope and Requirement Authority

Private alpha 0.18.0 implements the first deterministic local slices of R-089 through R-101 and a manual, history-preserving slice of R-103. It replaces the earlier shortcut that inferred almost every experienced athlete's route from training years and continuity alone.

The release does not yet implement per-exercise placement, automatic route-specific exercise rewriting, imported-history inference, fixed-event date calculations, warm-up performance capture, or automatic reclassification after the first three sessions. Those boundaries remain explicit.

### Placement Input Contract

`placement-v1` stores:

- current goal or unknown;
- optional fixed-event description;
- structured-training years or unknown;
- recent continuity or unknown;
- current movement skill from one to five or unknown;
- current strength and intensity tolerance from one to five or unknown;
- current volume tolerance from one to five or unknown;
- schedule stability from one to five or unknown;
- current performance-evidence confidence from one to five or unknown;
- pain or restriction state of none, manageable, modifying, or unknown;
- realistic weekly opportunities;
- default session minutes;
- active equipment-profile identity;
- every explicitly skipped section or field.

Years of experience are converted into a separate experience dimension. Continuity becomes its own dimension. Missing dimensions receive a neutral calculation fallback only for route comparison and remain listed as uncertain inputs. The stored athlete model therefore keeps experience, recent continuity, movement skill, strength tolerance, volume tolerance, schedule stability, and data confidence as seven separate one-to-five values.

### Entry Route Contract

The deterministic engine can select:

- introductory skill;
- reacclimation;
- bridge and calibration;
- base building;
- hypertrophy;
- powerbuilding;
- strength;
- power;
- event-specific development;
- pain-aware modified entry.

Priority rules are explicit. Modifying pain takes precedence. A declared return goal or meaningful training gap selects reacclimation without erasing past experience. Very low current experience or movement skill selects introductory work. Insufficient evidence selects bridge and calibration. Low schedule, intensity, or volume tolerance selects base building. Direct strength, power, event, hypertrophy, or powerbuilding requires the relevant current prerequisites.

Power requires experienced, skilled, recently stable, strength-tolerant evidence. Event-specific entry requires an event description and usable current skill and tolerance. Strength requires current experience, skill, and intensity tolerance. A prepared athlete can enter goal-specific development directly without a generic beginner cycle.

### Confidence and Explainability Contract

The assessment stores its rule version, creation time, complete input snapshot, seven dimensions, engine recommendation, athlete-selected route, confidence, athlete decision, reasons, uncertain inputs, verification plan, lower-route explanation, higher-route explanation, and route-specific exit criteria.

Confidence is high with zero or one uncertainty, medium with two through four uncertainties, and low with five or more. Quick Start always becomes low-confidence and adds `unconfirmed Quick Start defaults` even when operational defaults are available. Unknown data never becomes a positive readiness answer.

The result screen shows:

- selected route;
- confidence and hypothesis language;
- all seven dimensions;
- why the engine recommended its route;
- uncertain inputs;
- why a lower route was not selected;
- why a higher route was not selected;
- first-session verification steps;
- athlete controls and non-medical safety language.

When the athlete chooses a more conservative route, the engine recommendation remains stored separately and visible. This preserves both the recommendation and the athlete's decision instead of rewriting one as the other.

### Optionality and Athlete Control Contract

Onboarding provides Build My Starting Profile, Quick Start, and Import History routes. Each of the three input stages can be skipped. The athlete can also choose `Not sure` or `Prefer not to answer` inputs where appropriate.

At the result, the athlete can:

- confirm the recommendation;
- select the next conservative route;
- request a faster submaximal verification test without requiring a maximal attempt;
- save the hypothesis and correct or import completed history;
- return to correct answers or choose a different goal.

An athlete can reopen onboarding later from You. This does not delete history. The action is disabled during an active workout.

### Pain-Aware Start Gate

A modifying pain or restriction response selects Pain-Aware Modified Entry. The interface states that this is not medical clearance and advises qualified care for new, severe, or unexplained pain.

Completing this route opens the athlete profile rather than Today. Today displays a placement-review gate and disables both the check-in start and survey-free start. The athlete must reopen and complete the placement assessment with a changed restriction state before automatic workout start returns. A more aggressive-test choice cannot bypass the pain route.

This gate is a conservative product boundary, not a diagnosis, treatment recommendation, or substitute for professional care.

### Plan and Reassessment Contract

The first completed placement writes route, confidence, reasons, verification, exit criteria, weekly opportunities, default minutes, and dominant adaptation into the initial active mesocycle metadata.

Later reassessment never rewrites that active plan in place. The prior plan becomes superseded, a new active version links through `supersedesId`, and only planned or deferred sessions move to the new plan ID and plan version. Completed, partial, stopped, expired, and other historical sessions retain their prior plan identity.

The current first slice changes plan metadata and preserves future-session identity. It does not yet rewrite every exercise, set, load, or role for all ten routes. Route-specific session generation remains a required later slice.

### Backup, Recovery, and Tamper Validation

Backup schema version 12 includes the complete placement assessment. Restore validates input domains, one-to-five dimensions, rule version, dates, routes, confidence, decision, evidence lists, route comparisons, and the agreement between the stored assessment, athlete level, and entry-route label.

The validator deterministically replays `placement-v1` from the stored inputs and decision. A backup that changes a valid-looking route, dimension, confidence, explanation, or verification result without changing its source inputs is rejected. Version 11 backups receive a transparent legacy-derived placement hypothesis. Versions 1 through 10 continue through the existing migration chain and then receive the same placement migration.

Backup preview identifies the stored starting route and placement confidence before restore. Local persistence version 10 backfills movement skill and a legacy-derived assessment without deleting prior training.

### Verification Evidence

- ESLint passed.
- One hundred ten deterministic tests passed across thirteen files.
- Production TypeScript and PWA build passed.
- Twenty-eight Playwright runs passed across desktop Chromium and the 390 by 844 phone project.
- Domain tests cover direct strength, reacclimation without experience erasure, introductory, bridge, base, power prerequisites, pain priority, missing-data confidence, conservative choice, faster submaximal verification, Quick Start uncertainty, provenance validation, backup round trip, version 11 migration, and tamper rejection.
- The explainable-placement browser journey enters seven current dimensions, receives high-confidence Direct Strength Development, opens lower and higher explanations, chooses Base-Building Cycle, and verifies recommendation, selection, decision, dimensions, confidence, and plan metadata after local persistence.
- The pain browser journey selects modifying pain, verifies the non-medical boundary, confirms both workout-start paths are disabled, reopens onboarding, completes Quick Start, and proves the old mesocycle is superseded by one new active version.
- Full-resolution phone review confirmed readable placement hierarchy, dimension bars, long explanations, control cards, athlete-profile provenance, and horizontal containment.
- Git diff validation, explicit secret-pattern scanning, repository-history Gitleaks, full-directory Gitleaks, and dependency audit passed. The dependency audit reported zero vulnerabilities.
- Private repository commit `f96102634265f9ea70aaee3f70d3d1ff61e07ece` was pushed to `main`, and remote `main` exactly matches the local release.

### Deferred Boundaries

- Store movement-family and exact-exercise skill and capacity instead of only the starting-profile movement-skill dimension.
- Use imported completed history and recent working sets as placement evidence with source quality and staleness.
- Generate route-specific session exercises, roles, sets, repetitions, loads, RIR, warm-ups, and progression rules.
- Add fixed-event date parsing, buffer logic, and event-specific prerequisite detail.
- Capture warm-up and first-work-set performance as actual placement verification evidence.
- Automatically reclassify after one to three productive sessions while preserving athlete review and version history.
- Add preference, movement-specific pain, body-map, and active-restriction detail to onboarding.
- Calibrate thresholds from real athlete outcomes before allowing any learned model to change route selection.

### Version 1.18.0 Change Entry

- Added the four-stage skippable starting-profile flow with Quick Start and Import History.
- Added `placement-v1`, seven independent athlete dimensions, ten routes, confidence, reasons, uncertainty, comparisons, verification, and exit criteria.
- Added confirmed, conservative, aggressive-test, and Quick Start decisions with recommendation-selection separation.
- Added pain-aware non-medical language and automatic workout-start gating.
- Added history-preserving manual reassessment with immutable mesocycle versioning.
- Added backup schema version 12, local persistence version 10, version 11 migration, deterministic replay validation, and placement preview.
- Increased deterministic tests from 101 to 110 and browser journeys from twenty-four to twenty-eight.

## 53. Private Alpha 0.19.0 Productive Placement Verification

### Scope and Requirement Authority

Private alpha 0.19.0 implements the first executable productive-verification slice of R-098 and deepens the evidence path used by R-099, R-100, R-101, and R-103. The release turns the first one to three normal training sessions after a placement assessment into source-linked checks of the starting hypothesis.

The athlete is never required to perform a true maximum, waste a session on generic testing, complete a survey, or accept a silent route change. Completed training remains useful even when verification evidence is incomplete.

### Verification State Machine

`placement-verification-v1` uses three event states:

1. `active`: the productive session has started and may collect an optional warm-up response.
2. `awaiting-recovery`: the session produced a completed primary first set and is waiting for an optional recovery response.
3. `resolved`: the event has enough information to emit a final verdict, or it ended with insufficient or pain-changing evidence.

Each event is bound to one placement creation time, selected route, session, and sequence number from one through three. A reassessment creates a new placement identity. Older events remain attached to their historical hypothesis and are not reused as proof for the new one.

### Session Eligibility

The first three sessions started after the current placement assessment are eligible unless the route is already Pain-Aware Modified Entry. A session can begin while an earlier recovery response remains pending because recovery feedback is optional and cannot block training.

Only one verification event may exist for a session and placement pair. Sequence numbers must be unique within the placement hypothesis. After three events begin, the app does not manufacture additional placement checks until the athlete reassesses.

### Warm-Up Evidence

The active workout shows `Placement check N of 3` and explains that the route is a hypothesis. The athlete can record:

- better than expected;
- as expected;
- harder than expected;
- painful;
- skipped;
- untouched and therefore not answered.

The response and capture time persist immediately. Skipped and untouched remain different explicit missing states. A harder response increases review evidence but does not automatically stop useful work. A painful response tells the athlete to modify or stop the affected movement, becomes a hard reassessment signal when the session closes, and is not medical diagnosis or clearance.

### First Work Set Source Contract

At session completion the engine takes the earliest completed set from the primary exercise slot. The verification snapshot stores:

- the immutable completed source-set ID;
- planned exercise-slot ID;
- exact exercise ID and name;
- target load, repetitions, and RIR;
- actual load, repetitions, and RIR.

The target and actual values are stored separately. A substitution keeps the selected exact exercise and its own prescription. No original movement load is copied into verification.

If no primary set was completed, the workout still enters training history normally, but the verification verdict becomes `needs-more-evidence`. An incomplete placement check never turns a valid partial workout into failure or volume debt.

### Session Evidence Contract

The event also stores:

- final session status;
- completed and planned set counts;
- completion rate;
- planned and wall-clock duration;
- readiness result when available;
- overall difficulty when answered;
- technique when answered;
- joint pain or irritation when answered;
- time fit when answered;
- whether post-session feedback was skipped or deferred.

The engine checks whether the first set was at least two RIR harder than prescribed, technique fell below the conservative repeatability threshold, pain reached a review threshold, the session fit time poorly, difficulty reached nine or ten, or less than half the plan was completed. These are explainable review signals, not hidden scores.

### Recovery Check

After a qualifying session, Today presents one quiet optional recovery card. The athlete can report:

- recovered;
- acceptable;
- not recovered;
- skipped.

Skipping preserves unknown recovery and never blocks the next workout. Not recovered becomes a placement-review signal. Recovered or acceptable can support the route only when the source set exists and technique, pain, and time fit are known and acceptable.

Deferred post-session feedback replays the same event from its original warm-up, first-set, completion, and recovery evidence. It does not create a second placement interpretation. Later quality feedback can improve evidence completeness but cannot replace or rewrite the completed source set.

### Verdict Contract

An event can resolve as:

- `supports-route`: the productive session and recovery are consistent with the current starting route;
- `needs-more-evidence`: a useful session occurred, but primary, quality, time-fit, or recovery evidence remains insufficient;
- `review-suggested`: difficulty, execution, time fit, RIR mismatch, joint irritation, or recovery suggests a more conservative review;
- `reassessment-required`: warm-up or post-session pain changed what could be trained;
- `pending-recovery` or `collecting` while unfinished.

The cross-session summary can be gathering, waiting for recovery, route supported, more evidence needed, review suggested, or reassessment required. Two supportive resolved checks can support the route. Two review-suggested checks request review. One pain-changing event takes priority.

### Athlete Authority and Safety Boundary

Verification never silently changes `recommendedRoute`, `selectedRoute`, goal, athlete dimensions, exercise prescriptions, or plan version. Support means the evidence is consistent with the route, not that every future progression is automatically earned.

A review-suggested verdict remains advisory. A reassessment-required verdict disables both surveyed and survey-free automatic workout starts. The athlete opens the existing reassessment flow, corrects the current restriction state and other inputs, and confirms the next hypothesis. The prior plan and completed session remain immutable.

This behavior is a conservative programming boundary. It is not injury diagnosis, treatment advice, clearance, or a substitute for qualified care.

### Athlete Interface

Workout displays the current placement-check number and persisted warm-up response. Today displays the optional recovery card and any hard review gate. You displays:

- current verification summary;
- resolved and started counts;
- support and review counts;
- each event's verdict;
- session identity;
- warm-up and recovery states;
- exact first-set snapshot;
- complete plain-language reasons.

All views preserve the original pixel-adventure visual language while keeping training evidence readable on a 390 by 844 phone.

### Backup, Migration, and Replay

Backup schema version 13 includes the full placement-verification ledger. Restore checks:

- rule version and stable identity;
- valid placement date, route, session, and one-to-three sequence;
- response missingness and timestamps;
- first-set numeric snapshot;
- source-set linkage or an auditable governed history mutation;
- session evidence ranges and status;
- recovery state;
- verdict and explanations;
- deterministic replay from the captured source evidence.

A valid-looking forged verdict is rejected. Version 12 backups migrate with an empty verification ledger because prior sessions did not capture this evidence. No verification answer is invented. Local persistence version 11 applies the same empty-ledger migration.

### Verification Evidence

- ESLint passed.
- One hundred twenty deterministic tests passed across fourteen files.
- Production TypeScript and PWA build passed.
- Thirty-two Playwright runs passed across desktop Chromium and the 390 by 844 phone project.
- Domain tests cover event start, optional warm-up capture, source-linked first-set capture, recovery support, missing-data behavior, harder-than-planned review, poor recovery, pain priority, deferred-feedback replay, cross-session summary, deterministic replay, backup round trip, version 12 migration, and forged-verdict rejection.
- The productive browser journey captures an as-expected warm-up, logs one primary source set, answers difficulty, technique, pain, and time fit, records recovered status, displays the source evidence in You, reloads, and preserves the resolved route-supporting verdict.
- The pain browser journey captures a painful warm-up, finishes without inventing a set or survey, blocks both next-workout start paths, preserves the original selected route, and displays non-medical reassessment language.
- Full-resolution phone review confirmed readable recovery controls, verification evidence hierarchy, pain gate, fixed workout controls, and horizontal containment.
- Diff validation, explicit secret-pattern scanning, repository-history and full-directory Gitleaks, and dependency audit passed. The dependency audit reported zero vulnerabilities.
- Release commit `e038249202003db93bb25676e98365d2384f77fc` was pushed to private repository `Falatua/adaptive-strength-hypertrophy-app`; local and remote `main` were verified equal and the worktree was clean.

### Deferred Boundaries

- Calibrate every warning threshold with real athlete sessions before using verification to propose more aggressive placement.
- Add movement-family and exact-movement verification instead of only the primary slot and global starting route.
- Capture movement-specific pain location, symptom change, velocity, and structured coach evidence only when explicitly useful and privacy-safe.
- Add athlete-reviewed automatic reclassification after repeated evidence. Do not allow it to rewrite history or bypass safety.
- Generate complete route-specific sessions so a confirmed route changes exercise roles, loading, volume, RIR, and warm-ups rather than only plan metadata.
- Use imported recent history as pre-placement evidence with source quality and staleness rules.

### Version 1.19.0 Change Entry

- Added the three-state `placement-verification-v1` event lifecycle.
- Added optional warm-up, source-linked first-set, session-quality, time-fit, pain, and recovery evidence.
- Added explainable per-event and cross-session verdicts without silent route mutation.
- Added pain-triggered next-workout reassessment gating.
- Added deferred-feedback replay into the original verification event.
- Added athlete-profile evidence history and Today recovery controls.
- Added backup schema version 13, local persistence version 11, version 12 migration, and deterministic tamper rejection.
- Increased deterministic tests from 110 to 120 and browser journeys from twenty-eight to thirty-two.
- Published and verified private release commit `e038249202003db93bb25676e98365d2384f77fc`.

## 54. Private Alpha 0.20.0 Route-Specific Session Generation

### Scope and Requirement Authority

Private alpha 0.20.0 implements the first complete deterministic route-to-session slice of R-089, R-093, R-094, R-095, R-096, R-097, R-099, R-100, R-114, and the first-release programming boundary. A confirmed starting route now changes the actual primary, secondary, and accessory prescriptions rather than changing plan metadata alone.

The engine remains rules-based, local, inspectable, and versioned. No language model, hidden readiness score, account, backend, or network request is needed to generate the starting queue.

### Versioned Rule Identity

The rule identity is `route-session-v1`. The active mesocycle stores:

- the selected entry route;
- the rule version;
- the placement creation time that authorized generation;
- the route strategy and progression policy;
- the generated session IDs and plan version.

Every generated session stores the same rule version, placement time, route, canonical strategy, and canonical reasons. The session therefore remains explainable after later reassessment, plan revision, backup, or restore.

### Canonical Route Profiles

The first version uses the following deterministic starting prescriptions. Intensities are conservative fractions of an estimated maximum derived only from the exact movement's latest completed or already planned performance. They are programming heuristics for private calibration, not claims of universal optimality.

| Route | Primary | Secondary | Accessory | Accessory cap | Intent |
|---|---:|---:|---:|---:|---|
| Introductory Skill | 2 x 8 at 4 RIR | 2 x 10 at 4 RIR | 2 x 12 at 4 RIR | 1 | technique-first practice with a small menu |
| Reacclimation | 2 x 6 at 4 RIR | 2 x 8 at 3 RIR | 2 x 12 at 3 RIR | 2 | restore current tolerance without erasing past skill |
| Bridge and Calibration | 3 x 6 at 3 RIR | 2 x 8 at 3 RIR | 2 x 10 at 3 RIR | 2 | collect representative non-maximal evidence while training |
| Base-Building | 3 x 8 at 3 RIR | 3 x 10 at 3 RIR | 2 x 12 at 3 RIR | 2 | build repeatable work capacity and stable exposure |
| Hypertrophy | 3 x 8 at 3 RIR | 3 x 10 at 2 RIR | 3 x 12 at 2 RIR | 3 | retain anchor practice and allocate more recoverable priority dose |
| Powerbuilding | 4 x 5 at 2 RIR | 3 x 8 at 2 RIR | 3 x 12 at 2 RIR | 3 | protect specific strength work and meaningful hypertrophy dose |
| Strength | 4 x 4 at 2 RIR | 3 x 6 at 3 RIR | 2 x 10 at 3 RIR | 2 | emphasize lower-repetition anchors and limit nonessential fatigue |
| Power | 5 x 3 at 4 RIR | 3 x 5 at 3 RIR | 2 x 8 at 3 RIR | 2 | preserve speed, technical repeatability, intent, and recovery |
| Event-Specific | 4 x 3 at 2 RIR | 3 x 5 at 3 RIR | 2 x 8 at 3 RIR | 2 | prioritize declared anchors without pretending a full peak exists |
| Pain-Aware Modified | none | none | none | 0 | pause automatic generation until restrictions and movement choices are reviewed |

Each route also owns distinct rest intervals, intensity factors, warm-up guidance, strategy copy, progression policy, and explanation reasons. Power is intentionally not hypertrophy-by-another-name: repetition and set increases do not earn priority when they would create fatigue without preserving fast execution.

### Exercise Role Generation

For every valid strength anchor, the generator attempts to build one exposure session with:

1. the protected exact anchor as primary;
2. one secondary movement from the same pattern or family, ranked by secondary-builder role, joint response, priority-region relevance, and preference;
3. priority accessories selected from the current priority regions;
4. maintenance accessories when time and the route cap permit.

Avoid-rated exercises are excluded from generated secondary and accessory choices. Exact anchor identity is never silently replaced. Equipment conflicts remain visible through the existing pre-workout equipment gate and educated substitution system.

### Exact-Movement Load Source

The load calculation uses this source order:

1. the latest completed set for the exact exercise;
2. an existing planned prescription for that exact exercise;
3. zero-load calibration when neither source exists.

For a positive exact source, the engine estimates a conservative maximum from load, completed or planned repetitions, and RIR, applies the route-role intensity, and rounds to the current five-pound rule used by this generation slice. Unknown exact movements remain at zero for athlete calibration. A family member, substituted movement, or visually similar variation never donates its load.

This release does not claim the heuristic is calibrated for every athlete, implement velocity-based power prescription, or distinguish every device increment during initial route generation. Executable increments are still enforced when the workout starts.

### Time-Fit Contract

Estimated movement time includes setup, working-set execution, and the declared rest between sets. The generator always protects the primary movement. It adds the secondary and each accessory only when the full estimated movement fits the selected session budget. It never reports a shorter duration by silently compressing rest or pretending omitted work remains scheduled.

The route accessory cap and the athlete's default 15, 30, 45, 60, or 75-minute budget operate together. Short sessions can therefore retain only the primary and the highest-value work that honestly fits. Omitted work does not become debt.

### Onboarding and Reassessment Transaction

Before the athlete confirms placement, onboarding previews the selected route's actual primary, secondary, and accessory prescriptions, RIR, rest, warm-up intent, and rule identity. Conservative or faster-verification choices refresh the preview immediately.

Confirmation creates a new plan version and generates a new future queue from the selected route. A reassessment:

- supersedes the prior active mesocycle;
- preserves completed, partial, stopped, and expired sessions under their original plan;
- removes the prior plan's unperformed planned or deferred queue;
- generates a new queue with new stable IDs and the new placement identity;
- keeps the current protected-anchor order when it remains valid.

Pain-Aware Modified Entry creates no automatic session queue. The app does not leave seed sessions executable behind the restriction gate.

### Progression and Cycle Review Interaction

All development routes retain the core hierarchy: progress comparable load first, then repetitions, then a recoverable working set. Hold, reduce, or reacclimate when completed performance, recovery, continuity, pain, or schedule evidence does not support overload.

Route generation chooses the starting dose. The normal workout progression engine still decides whether the next exact movement exposure has earned change. A cycle-review recovery decision intentionally clears the prior entry-route identity and generates a conservative reacclimation round. A manual plan pivot also clears route generation when the athlete chooses a different dominant adaptation, preventing stale placement rules from masquerading as the new plan.

### Explainability Interface

Today's `Why this session?` panel uses the session's stored generation evidence. It displays the actual route strategy, canonical reasons, and current progression decision instead of hard-coded bench explanations. Plan displays route and rule provenance for the active version. Workout displays route-specific warm-up guidance on the protected primary card.

The active queue is filtered to the active plan. Superseded-plan sessions remain in history but do not appear as future work in the current queue.

### Backup, Migration, and Tamper Boundary

Backup schema version 14 stores route provenance on plans and sessions. Restore validates:

- supported `route-session-v1` identity;
- valid placement creation time;
- agreement among session route, plan route, plan rule, and placement identity;
- exact canonical route strategy and reasons;
- stable session and plan relationships.

A forged strategy or reason is rejected. Version 13 backups migrate without invented route-generation evidence because those sessions were created before this rule existed. Local persistence version 12 preserves the same boundary.

The validator proves provenance and structural agreement. It does not fully replay every generated load from a historical source snapshot because `route-session-v1` does not yet store the complete prescription-input snapshot. That stronger replay requirement remains open before cloud or multi-user distribution.

### Verification Evidence

- ESLint passed.
- One hundred twenty-eight deterministic tests passed across fifteen files.
- Production TypeScript and installable PWA build passed.
- Thirty-two Playwright journeys passed across desktop Chromium and the 390 by 844 phone project.
- Route tests cover all ten profiles, all nine trainable prescriptions, materially different route outputs, zero cross-variation load borrowing, honest time fitting, accessory caps, backup round trip, version 13 migration, and forged provenance rejection.
- The direct-strength browser journey previews 4 x 4 primary work; the conservative Base-Building selection previews and stores 3 x 8 at 3 RIR; Quick Start stores a low-confidence Powerbuilding queue and `route-session-v1` provenance.
- Phone visual review confirmed readable onboarding route preview, route explanation, route-specific warm-up, fixed workout controls, and horizontal containment.
- Diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit passed. The dependency audit reported zero vulnerabilities.

### Deferred Boundaries

- R-092 per-movement and movement-family placement remains deferred.
- Initial route generation does not yet replace unavailable accessories before the equipment gate or use every equipment profile's distinct increment in its pre-workout load calculation.
- Imported history remains numeric training evidence, not sufficient placement evidence, until source quality and staleness rules are implemented.
- Route prescriptions and warning thresholds need real-workout calibration before any claim of individual optimization.
- Power does not yet use measured bar velocity; event-specific does not yet implement a validated event calendar, taper, or peak.
- Criterion-based route exits, athlete-reviewed automatic reclassification, and complete generation-input replay remain deferred.
- Backend, multi-device sync, optional AI explanation, and social features remain later evidence-gated phases.

### Version 1.20.0 Change Entry

- Added deterministic `route-session-v1` profiles for ten placement routes.
- Connected placement confirmation and reassessment to actual session regeneration.
- Added route-specific roles, sets, repetitions, RIR, intensity, rest, accessory caps, warm-ups, strategies, reasons, and progression policies.
- Added exact-movement-only load sourcing with zero-load calibration for unknown movements.
- Replaced cosmetic duration compression with honest movement inclusion that protects the primary and fits the declared time budget.
- Added stored session provenance, route-aware explanations, active-plan queue filtering, and recovery or pivot safeguards.
- Added backup schema version 14, local persistence version 12, version 13 migration, and canonical-strategy tamper rejection.
- Increased deterministic tests from 120 to 128 while retaining thirty-two passing desktop and phone journeys.
- Published and verified private release commit `7d7c16056bc85ee4bcc929c9318ae561e7a6f4fe`; local and remote `main` match and the repository worktree is clean.

## 55. Private Alpha 0.21.0 Equipment-Aware Route Generation

### Scope and Requirement Authority

Private alpha 0.21.0 closes the first-generation equipment boundary left by Chapter 54 and advances R-045, R-046, R-093, and R-115. Training location is no longer only a workout-start gate. The selected profile now constrains the initial route queue before the athlete confirms placement.

The rule remains deterministic, local, inspectable, and replayable. It does not require a backend, external AI provider, hidden readiness score, or network request.

### Versioned Rule Identity

New generation uses `route-session-v2`. A version 2 session contains the complete versioned route evidence from version 1 plus an immutable `equipment-profile-v1` snapshot:

- stable profile ID, name, and kind;
- profile update time;
- normalized available-equipment list;
- barbell, dumbbell, cable, machine, and other increments;
- increment unit.

The mesocycle stores the snapshot used to create its first exposure round. Each session also stores the snapshot used for that exact generation event. This separation is deliberate: a later round may be generated after the athlete changes location, but neither the original plan evidence nor earlier session evidence may be rewritten.

Existing `route-session-v1` plans and sessions remain valid historical facts. Migration never upgrades or relabels them because their original generation did not capture an equipment snapshot.

### Equipment Eligibility Before Ranking

The generator normalizes each exercise's required equipment and compares it with the selected profile by exact conservative membership. For secondary and accessory candidates, complete equipment fit is a prerequisite before preference, role, muscle priority, or name-order ranking occurs.

The selection order is therefore:

1. exclude the protected anchor and already selected movements;
2. exclude avoid-rated movements;
3. exclude movements with any missing required equipment;
4. apply role, pattern or family, muscle-priority, joint-response, and preference ranking;
5. fit the selected work into the honest session-time budget.

This prevents the engine from knowingly selecting an unavailable cable, machine, bar, bench, rack, or attachment when a compatible candidate exists. If filtering leaves no valid secondary or accessory, that slot is omitted. Missing support work does not become volume debt and does not authorize an unrelated movement.

### Protected Anchor Exception

Declared strength anchors are identity-bearing plan commitments. The generator therefore does not silently remove or replace an unavailable anchor. It preserves the exact anchor as primary and exposes the conflict before confirmation.

The onboarding preview must show:

- the selected training-location name and profile kind;
- the available-equipment count and increment unit;
- every protected anchor that cannot be performed there;
- the exact missing items for each anchor;
- plain language that protected anchors remain visible and require athlete review.

A protected-anchor conflict is not proof that the location is wrong. It is a decision point. The athlete may choose another profile, change the anchor through the governed plan workflow, or retain the anchor knowing that workout-start equipment review and educated substitution will apply. No automatic substitution may disguise the conflict.

### Executable Load Generation

Every positive generated load is rounded to the selected profile's increment for the exercise's equipment class. Classification follows the exercise's canonical equipment metadata:

- barbell or bar equipment uses the barbell increment;
- dumbbells use the dumbbell increment;
- cables use the cable increment;
- machines and leg-curl devices use the machine increment;
- all other equipment uses the other increment.

The route intensity heuristic, exact-movement source order, and zero-load calibration from Chapter 54 remain unchanged. The improvement is that rounding now occurs before onboarding confirmation, manual route revision, and later exposure-round generation. A custom 2.5-pound barbell profile therefore creates a 2.5-pound-executable prescription rather than first producing a five-pound-rounded target and correcting it only when the workout opens.

This version assumes the equipment profile's increment unit and the athlete's active logging unit describe the same physical scale. Automatic pound-to-kilogram conversion is not implemented and must not be inferred.

### Onboarding Transaction and Reassessment

The onboarding location selector initializes from the current active equipment setting. Route preview is generated from that profile, and confirmation atomically:

- stores the athlete placement input;
- sets the active equipment profile and visible location label;
- stores the mesocycle's initial equipment snapshot;
- generates only compatible support work;
- stores the exact equipment snapshot on every new session.

Returning to an earlier onboarding step and choosing another location rebuilds the preview from that profile. Reassessment follows the same contract while preserving completed and partial history under the prior plan version.

Manual revisions of a placement-derived plan promote future generation to `route-session-v2` and snapshot the current profile. A manual pivot that clears the placement route also clears the route-equipment provenance. Recovery rounds remain conservative and do not pretend to inherit stale entry-route evidence.

### Later Exposure Rounds

Cycle review generates a new round from the currently active profile. It uses that profile for candidate eligibility, route load rounding, and session evidence. The mesocycle's initial `generationEquipment` remains unchanged, while the new sessions capture their later profile. This enables legitimate home, commercial, or travel changes between rounds without rewriting the original plan.

Continue-progress decisions use the same movement-class increment. Continue-hold preserves the generated executable target. Recover intentionally clears entry-route provenance and builds a conservative non-route round.

### Interface Evidence

Onboarding displays a green equipment-ready card when all protected anchors fit and an orange review card when any protected anchor conflicts. The warning names exact anchors and exact missing items instead of presenting a generic availability message.

Plan shows the mesocycle's initial generation location and the generation location attached to each queued session. Today includes the stored equipment snapshot in `Why this session?`, making the explanation historical rather than dependent on whichever profile happens to be active now. Diagnostics expose app version 0.21.0, `route-session-v2`, backup schema version 15, and local persistence version 13.

### Backup, Migration, and Tamper Boundary

Backup schema version 15 stores the plan and session equipment evidence. Restore validates:

- supported equipment rule identity;
- stable profile identity and valid profile kind;
- valid profile update time;
- nonempty, normalized, duplicate-free equipment;
- finite positive increments no greater than 100;
- pound or kilogram increment unit;
- complete route provenance;
- equality between the plan's initial snapshot and every version 2 first-round session snapshot.

Later-round sessions may contain a different valid profile snapshot because location can change between exposure rounds. The original mesocycle snapshot remains the initial-generation fact. Backup preview reports both all route-generated sessions and the subset with version 2 equipment evidence.

Version 14 migration preserves every `route-session-v1` record and adds no equipment evidence. A valid-looking forged first-round equipment snapshot is rejected. Local persistence version 13 applies the same honest migration boundary.

### Verification Evidence

- ESLint passed.
- One hundred thirty-three deterministic tests passed across fifteen files.
- Production TypeScript and installable PWA build passed.
- Thirty-four Playwright journeys passed across desktop Chromium and the 390 by 844 phone project.
- Domain tests prove Home Gym support-work filtering, Travel Setup preservation of three conflicting protected anchors, custom 2.5-unit barbell rounding, legacy version 1 validity, version 2 backup round trip, version 14 migration, equipment-session counting, and forged initial-snapshot rejection.
- The new browser journey first selects Travel Setup and sees exact squat, bench, and sumo anchor conflicts, then returns to Home Gym and confirms a queue whose every non-primary movement fits the selected equipment.
- Persisted browser evidence proves `route-session-v2` on the generated sessions and matching Home Gym snapshots on the plan and first-round sessions.
- Full-resolution phone review confirmed the green equipment-ready preview, orange protected-anchor warning, exact missing-item copy, readable controls, and horizontal containment.
- Diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit passed. The dependency audit reported zero vulnerabilities.

### Deferred Boundaries

- Cross-unit conversion between a profile and the athlete's logging unit remains deferred.
- Plate inventory, loadable-bar math, machine stack topology, assistance direction, unilateral logging, and per-exercise increment overrides remain deferred.
- Equipment aliases and equivalence classes remain conservative. A differently named item is unavailable until the catalog or profile explicitly recognizes it.
- Protected anchors are not automatically replaced. Athlete-controlled plan revision and the existing explicit substitution workflow remain authoritative.
- Version 2 stores generation evidence but does not yet store every historical input required to replay all candidate rankings and calculated loads bit for bit.
- Real-workout calibration remains necessary before treating the current exercise-selection and load heuristics as individually optimized.
- Backend, multi-device sync, optional AI explanation, and social features remain later evidence-gated phases.

### Version 1.21.0 Change Entry

- Added deterministic `route-session-v2` equipment-aware route generation.
- Filtered unavailable secondary and accessory candidates before ranking and time fitting.
- Preserved exact protected anchors while showing exact missing-equipment conflicts before confirmation.
- Applied profile-specific movement-class increments to initial, revised, and later-round generation.
- Stored immutable equipment-generation evidence on mesocycles and sessions.
- Added profile-aware onboarding, Plan, Today, backup-preview, and diagnostics evidence.
- Added backup schema version 15, local persistence version 13, safe version 14 migration, and initial-snapshot tamper rejection.
- Increased deterministic tests from 128 to 133 and browser journeys from thirty-two to thirty-four.
- Published and verified private release commit `da1b68adef09a03f4fc4b64ef2697ff9fa6fc3da`; local and remote `main` match and the repository worktree is clean.

## 56. Private Alpha 0.22.0 Per-Movement Placement

### 56.1 Requirement Boundary

Private alpha 0.22.0 implements the first executable slice of R-092 while advancing R-089, R-091, R-093, R-094, R-098, and R-100. The athlete still receives one overall cycle route for the current goal, schedule, pain state, and recent preparedness, but every protected exact primary anchor now receives its own starting lane. A strength mesocycle can therefore teach a new squat, train a familiar bench directly for strength, and calibrate an under-documented sumo deadlift without calling the entire athlete a beginner.

This is a placement and prescription feature, not merely profile copy. The selected movement lane changes the generated session's sets, repetitions, RIR, rest, warm-up guidance, strategy, reasons, and progression policy through `route-session-v3`.

### 56.2 Two-Level Placement Model

The placement model has two deliberately separate layers:

1. `placement-v2` determines the plan-level route from goal, training experience, recent continuity, general movement skill, strength tolerance, volume tolerance, schedule stability, data confidence, pain state, weekly opportunities, time, equipment location, skipped fields, and athlete decision.
2. `movement-placement-v1` determines the effective lane for each protected exact exercise from exact exercise identity, movement family context, exact-movement skill, exact-movement heavy-work tolerance, exact-movement recent evidence, the plan route, global pain state, and global continuity state.

The movement family is explanatory context and a future learning seam. It never merges exact exercise history or lends a neighboring variation's load to the protected anchor. Stable exercise IDs remain authoritative.

### 56.3 Movement Input Contract

Each protected exact anchor collects three optional one-to-five inputs:

- movement skill: present technical familiarity with this exact exercise;
- heavy-work tolerance: present ability to perform demanding work on this exact exercise;
- recent evidence: confidence that recent exact-exercise records represent current capacity.

Every control also supports `?`, which means unknown. Skipping the placement section sets these fields to unknown rather than zero, beginner, pain-free, or ready. Unknown evidence lowers the movement confidence and chooses a bridge lane unless pain or return constraints require a more conservative route.

### 56.4 Deterministic Movement Decision Order

The engine evaluates each movement in this order:

1. If the global pain state is modifying, select Pain-Aware Modified Entry and generate no automatic work.
2. If recent continuity is returning or the plan route is Reacclimation, select Reacclimation.
3. If exact-movement skill is one, select Introductory Skill.
4. If any movement input is unknown, select Bridge and Calibration.
5. If exact-movement skill, heavy-work tolerance, or recent evidence is two or below, select Bridge and Calibration.
6. Otherwise inherit the confirmed plan route.

An athlete-selected conservative plan decision lowers each movement lane independently through the same canonical route ladder. It does not flatten every movement to the same result. Quick Start preserves unknown evidence and low confidence. A faster productive test does not manufacture higher scores.

### 56.5 Generation and Evidence Contract

`route-session-v3` stores both the plan route and effective movement route. Every generated session must include:

- `planRoute`, identifying the confirmed overall placement route;
- `route`, identifying the effective route used to prescribe that session;
- the exact immutable `movement-placement-v1` snapshot governing its primary anchor;
- the existing immutable equipment snapshot;
- placement creation time, strategy, and reasons.

A version 3 plan must have exactly one valid movement-placement record for every protected anchor. Duplicate lanes, missing anchor lanes, invalid replay, selected-route mismatch, plan-route mismatch, or primary-identity mismatch invalidate restore. A governed substitution may replace the session primary while retaining `substitutedFrom`. A governed catalog merge may resolve a retired historical anchor through `mergedIntoId`. Neither path rewrites the historical placement snapshot.

### 56.6 Productive Verification Contract

The first one to three eligible productive checks now preserve the session's exact movement-placement snapshot. The verification route is the movement's effective route, not automatically the plan route. Warm-up response, first completed primary set, session quality, pain, time fit, and next-day recovery remain optional and source linked. Old verification events without movement evidence remain valid history.

### 56.7 Athlete Interface

Onboarding shows a `Protected anchors` section with one compact card per exact movement and separate Skill, Heavy-work tolerance, and Recent evidence controls. The final recommendation shows the overall plan route plus an `One cycle, individual starting lanes` explanation for every anchor, including family context, confidence, scores, unknowns, route, and reason.

Plan shows the number of exact movement lanes and uses them in queue generation. Today explains why the current exact movement received its route. You preserves the complete movement-lane profile for later review. If the athlete manually changes a protected anchor before reassessing it, future generation honestly falls back to `route-session-v2` rather than inventing movement evidence.

### 56.8 Data, Backup, and Migration

Backup schema version 16 and local persistence version 14 are current. Version 15 migration preserves `placement-v1` and `route-session-v2` evidence exactly and creates no movement-placement records. Current version 3 plans and sessions replay every lane and reject forged evidence. Exercise renames may retain stable IDs without invalidating historical display names. Version 1 and version 2 route-session history remains valid.

### 56.9 Acceptance Tests

The release must prove all of the following:

- one strength plan can yield Introductory Skill squat, Direct Strength bench, and Bridge and Calibration deadlift;
- the conservative athlete decision lowers the three lanes independently;
- skipped movement inputs remain unknown and lower confidence;
- every version 3 session stores its plan route, effective route, exact movement snapshot, and equipment snapshot;
- forged movement evidence is rejected;
- legacy placement, generation, verification, and backup evidence remains valid without invented facts;
- manual anchor replacement cannot silently claim version 3 evidence;
- desktop and 390 by 844 phone onboarding, profile, and long movement-control layouts remain readable and horizontally contained.

### 56.10 Verification Evidence

- ESLint passed.
- One hundred thirty-nine deterministic tests passed across fifteen files.
- Production TypeScript and installable PWA build passed.
- Thirty-four Playwright journeys passed across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the long per-movement input controls, complete route recommendation, and stored profile lanes.
- Diff validation, explicit secret scanning, repository-history and full-directory Gitleaks, and dependency audit passed with zero vulnerabilities or leaks.

### 56.11 Deferred Boundaries

- Movement families do not yet infer placement from adjacent variations or imported history.
- Movement-specific volume tolerance, muscle-specific tolerance, measured velocity, automatic exit criteria, and automatic reclassification remain deferred.
- Current thresholds are conservative product rules that require real-workout calibration.
- A manual new protected anchor requires reassessment for version 3 generation. The app falls back to version 2 rather than guessing.
- No backend, account, cloud sync, AI provider, or social system is required for this release.

### Version 1.22.0 Change Entry

- Added `placement-v2` and `movement-placement-v1` with one independent lane per protected exact anchor.
- Added `route-session-v3` so movement lanes change executable prescriptions.
- Preserved exact movement identity while using family only as explanatory context.
- Carried movement evidence through productive verification, plan revisions, later rounds, backup, and restore.
- Added backup schema version 16, local persistence version 14, and honest version 15 migration.
- Increased deterministic coverage from 133 to 139 tests while retaining thirty-four desktop and phone Playwright journeys.
- Published and verified private release commit `d2bddb87b986e78525a715a3ea9eb2ddc2d1349f`; local and remote `main` match and the repository worktree is clean.

## 57. Private Alpha 0.23.0 Athlete-Reviewed Exact-History Placement

### 57.1 Requirement Boundary

Private alpha 0.23.0 implements the first placement-learning slice of R-102 while advancing R-089, R-092, R-095, R-098, R-099, R-100, and R-103. Completed exact-movement history can now support a placement decision, but the app does not silently convert old logs into athlete facts. The deterministic engine creates a bounded evidence proposal. The athlete reviews and accepts evidence confidence and heavy-work tolerance separately. Only accepted fields enter a new placement version and future plan.

This release does not add family-to-variation transfer, coach-history interpretation, medical inference, or automatic reclassification. Athlete-facing video analysis is explicitly excluded by Chapter 69. This release closes the narrower gap between the existing source-preserving completed-set importer and the existing per-movement placement system.

### 57.2 Authority and Safety Contract

The feature follows six hard rules:

1. Exact canonical exercise ID is the evidence boundary. A bench variation cannot lend its sets, load, skill, or tolerance to Competition Bench Press.
2. History may suggest only `dataConfidence` and `strengthTolerance`.
3. History never infers movement skill, present pain, recovery, medical readiness, or technical quality that was not explicitly recorded.
4. Every suggestion is advisory until the athlete accepts that field.
5. Manual editing of an accepted field clears that field's accepted-history provenance.
6. A placement review creates a new placement and future plan. It never rewrites completed sets, prior plans, prior sessions, or prior placement versions.

### 57.3 Versioned Data Contract

The current rule stack is:

- `placement-v3` for the overall placement assessment;
- `movement-placement-v2` for each protected exact anchor;
- `placement-history-v1` for the history evidence snapshot;
- `route-session-v3` for the unchanged executable prescription engine.

Each `placement-history-v1` record stores:

- exact exercise ID and display name;
- assessment time and review-window length;
- basis: `recent-window`, `latest-stale`, or `none`;
- immutable source-set IDs;
- total exact sets and recent exact sets;
- distinct recent exposure dates;
- recent imported-set count;
- recent sets with known RIR;
- recent quality-confirmed sets;
- representative strength-set count, distinct representative dates, and representative quality-confirmed count;
- latest exact exposure date;
- suggested evidence confidence;
- optional suggested heavy-work tolerance;
- explicit limitations.

An accepted review stores the evidence snapshot, the accepted fields, and `reviewedAt`. The same accepted review is preserved in the placement inputs and the generated movement-placement assessment so the decision can be replayed and audited.

### 57.4 Exact-History Window

The initial review window is 42 days. It is a transparent product heuristic that must be calibrated with real use, not a biological truth.

- Future-dated sets are excluded.
- Recent evidence contains every exact set at or after the 42-day cutoff through the assessment time.
- If no set is recent but older exact history exists, the evidence basis is `latest-stale` and only the latest exact set is cited.
- If no exact history exists, the basis is `none` and no source set is invented.
- The validator accepts configured windows only from 7 through 365 whole days.

### 57.5 Evidence-Confidence Suggestions

The deterministic first-slice thresholds are:

| Suggested score | Exact recent evidence requirement |
|---|---|
| 5 | At least 6 recent sets across at least 3 dates, at least 4 sets with known RIR, and at least 4 quality-confirmed sets |
| 4 | At least 4 recent sets across at least 2 dates |
| 3 | At least 2 recent sets |
| 2 | One recent exact set, or at least one older exact set with no recent sets |
| 1 | No exact history |

Data confidence describes how much exact recent evidence exists. It does not mean the athlete is skilled, pain-free, recovered, or ready for maximal work.

### 57.6 Heavy-Work Tolerance Suggestions

A representative strength set must have external load greater than zero, eight or fewer repetitions, known RIR, and RIR no higher than four. The suggestion is:

| Suggested score | Representative exact evidence requirement |
|---|---|
| 5 | At least 6 representative sets across at least 3 dates, including at least 4 quality-confirmed representative sets |
| 4 | At least 4 representative sets across at least 2 dates, including at least 2 quality-confirmed representative sets |
| 3 | At least 3 representative sets across at least 2 dates |
| Not inferred | Fewer than 3 representative sets or fewer than 2 representative dates |

Numeric-only imported sets can therefore establish that repeated exact work occurred, but they cannot produce the highest suggestions without confirmed quality. Six numeric-only imported sets across three dates produce evidence confidence 4 and heavy-work tolerance 3 in the current contract. They do not confirm technique, pain, recovery, or current medical readiness.

### 57.7 Athlete Review and Correction

Library shows the current evidence summary for every protected anchor before any placement change. `Review in placement` opens the per-movement placement step with the current global placement fields preserved. Each anchor displays exact recent set count, distinct dates, latest exposure, suggestions, and limitations.

The athlete may:

- accept evidence confidence only;
- accept heavy-work tolerance only when the engine produced a suggestion;
- accept both fields;
- leave either field unchanged;
- set any score manually;
- leave fields unknown;
- exit without committing a new placement.

The acceptance buttons distinguish a proposed value from a value currently in use. If the athlete edits an accepted field afterward, only that field's accepted provenance is removed. Movement skill is always athlete-entered or unknown in this release.

### 57.8 Placement and Programming Effects

Accepted values enter `placement-v3`, which rebuilds all per-anchor `movement-placement-v2` records under the existing route order. If a score changes the movement route, future `route-session-v3` prescriptions change through the already-versioned session engine. If a score does not change the route, the accepted evidence still remains visible and auditable.

Plan reports the number of history-reviewed anchors. Today explains which accepted history fields informed the current movement lane and how many recent exact source sets support them. You shows review date, recent exact-set count, accepted fields, scores, route, confidence, reasons, and remaining unknowns.

### 57.9 Provenance and Restore Integrity

Backup schema version 17 and local persistence version 15 are current. Version 16 migration preserves valid `placement-v2` and `movement-placement-v1` history and creates no history review.

Restore rejects:

- unsupported evidence or placement rule versions;
- invalid exercise identity, date, window, basis, counts, suggestions, or limitations;
- duplicate, missing, future, or stale-window-inconsistent source references;
- accepted fields that do not match their suggested values;
- review evidence attached to a different movement;
- a source-set ID that does not exist in current history or governed history-mutation snapshots;
- a source set that exists but belongs to a different exercise identity;
- movement, plan, session, or productive-verification snapshots that disagree.

Current history plus before and after snapshots of governed corrections, deletions, imports, edits, and merges preserve the source trail. Identity validation requires that each cited set belonged to the exact reviewed exercise in at least one authoritative snapshot.

### 57.10 Acceptance Tests

The release must prove all of the following:

- six recent numeric-only imported Competition Bench Press sets across three dates suggest evidence 4 and tolerance 3;
- quality-confirmed repeated exact work is required for the highest suggestions;
- stale history and absent history remain conservative;
- another bench variation or another movement cannot support the exact bench review;
- suggestion or count tampering is rejected;
- unknown and cross-movement source-set references are rejected;
- the athlete can accept evidence and tolerance independently;
- manual score changes clear only the changed field's accepted provenance;
- a new placement, plan, and session preserve accepted source evidence;
- Library, onboarding review, Plan, Today, You, backup preview, and diagnostics agree;
- version 16 migration invents no review evidence;
- desktop and 390 by 844 phone layouts remain readable and horizontally contained.

### 57.11 Verification Evidence

- ESLint passed.
- One hundred forty-six deterministic tests passed across sixteen files.
- Production TypeScript and installable PWA build passed.
- Thirty-six Playwright journeys passed across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the Library evidence panel, per-anchor review controls, and stored profile provenance.
- The dependency audit reported zero vulnerabilities.
- Explicit key-pattern scanning, repository-history Gitleaks, and full-directory Gitleaks found no leaks.
- Diff validation passed.

### 57.12 Deferred Boundaries

- Thresholds and the 42-day window require calibration from real workouts.
- Imported numeric history cannot validate technique, pain, range, recovery, or coaching quality.
- Structured coach statements, reliable estimates, wearable data, and measured velocity are not placement sources yet. Athlete technique video is out of product scope.
- Family and neighboring-variation context remains visible but contributes no score or load.
- Automatic criterion exits and automatic reclassification remain deferred.
- Movement-specific volume tolerance and muscle-specific tolerance remain deferred.
- No backend, account, Supabase project, cloud sync, AI provider, or social system is required for this release.

### Version 1.23.0 Change Entry

- Added `placement-history-v1` with exact-only 42-day evidence summaries and bounded suggestions.
- Added explicit per-field athlete acceptance and provenance clearing after manual edits.
- Advanced placement to `placement-v3` and movement placement to `movement-placement-v2` without changing the `route-session-v3` prescription algorithm.
- Added Library review entry, onboarding evidence cards, Plan and Today explanations, You provenance, backup preview counts, and diagnostics.
- Added backup schema version 17, local persistence version 15, and honest version 16 migration.
- Added exact source identity validation across current history and governed history-mutation snapshots.
- Increased deterministic coverage from 139 to 146 tests across sixteen files and browser journeys from thirty-four to thirty-six.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].

## 58. Private Alpha 0.24.0 Athlete-Reviewed Placement Exit

### 58.1 Requirement Boundary

Private alpha 0.24.0 implements the first measurable criterion-exit slice of R-101 and advances the trigger and review path of R-103. The release joins the existing `placement-verification-v1` ledger to an explicit `placement-exit-v1` assessment, then requires an athlete-authored `placement-exit-review-v1` decision. It does not silently advance, lower, or otherwise rewrite placement.

The implemented scope evaluates the cycle-level plan route only. A productive verification event whose effective movement lane differs from the cycle-level route is retained as evidence but explicitly excluded from plan-route confirmation. Automatic per-movement criterion exit remains deferred until a separate movement-specific evidence contract exists.

### 58.2 Authority Order

1. The exact `placement-v3` identity defines the assessment boundary.
2. Only `placement-verification-v1` events carrying that `placementCreatedAt` may enter the evidence snapshot.
3. Only events whose `placementRoute` equals the assessment's selected plan route may satisfy plan-route criteria.
4. Resolved source evidence controls the deterministic recommendation.
5. Pain-changing evidence has priority over supportive or incomplete evidence.
6. The athlete chooses the outcome and records a reason.
7. Reassessment may create a new placement and future plan. No checkpoint rewrites prior evidence or completed work.

### 58.3 Measurable Criteria

| Criterion | Met | Not met | Unknown |
|---|---|---|---|
| Two productive checks resolved | At least two matching-route events have final verdicts | Not applicable in version 1 | Fewer than two resolved checks |
| Current route supported repeatedly | At least two resolved checks support the route | At least two checks suggest review, or any check requires reassessment | Repeated evidence has not been established |
| No pain-changing verification event | At least one check is resolved and none requires pain-triggered reassessment | Any matching-route check requires reassessment | No resolved pain evidence exists |
| Recovery supports the hypothesis | At least two matching-route checks resolve as recovered or acceptable | At least two resolved checks suggest review | Fewer than two supportive recovery responses, or recovery is pending |

The stored route-specific exit criteria from `placement-v3` remain visible beside this measurable first slice. They are declared athlete-review prompts until a future rule maps each statement to independently validated signals. The app must never label free-text route criteria as measured merely because they are stored.

### 58.4 Recommendation Table

1. `reassessment-required` when any resolved matching-route check records pain that changed what could be trained.
2. `review-conservative` when at least two resolved matching-route checks suggest review.
3. `review-advance` when at least two checks support an introductory, reacclimation, bridge, or base-building route and the deterministic route map identifies a distinct next route.
4. `confirm-current` when at least two checks support a goal-specific route, or a transitional route whose next route is the same.
5. `hold-current` when three matching-route checks are resolved without repeated support or repeated review evidence.
6. `collect-evidence` in every other case, including pending recovery.

Advancement review maps introductory to bridge, bridge or reacclimation to base building, and base building to the athlete's stated goal route when one exists. Conservative review maps goal-specific routes to base building and maps base or bridge to reacclimation. These are review suggestions, not automatic programming changes.

### 58.5 Athlete Decisions

- `continue-current` preserves the current placement and plan route.
- `reassess-now` reopens placement at the movement-profile step. Completing it creates a new placement and future plan version.
- `defer` preserves the current route and records why more time or evidence is wanted.

A non-empty reason is required. An active workout blocks review. The same exact placement and verification-source set cannot receive a second review. Pain-changing evidence disables and rejects `continue-current`. Reassessment changes no route until the athlete completes the existing placement flow.

### 58.6 Versioned Evidence Contract

`placement-exit-v1` stores the exact placement identity and complete placement snapshot; assessment time; current, recommended, and optional suggested routes; all verification snapshots from the exact placement version; matching, resolved, supportive, review, incomplete, excluded-lane, pending-recovery, and pain-boundary evidence; all four criterion states; declared route criteria; reasons; and limitations.

`placement-exit-review-v1` stores its stable identity, placement identity, creation time, athlete decision, athlete reason, and the complete assessment snapshot. This self-contained record keeps a past decision understandable after newer workouts, corrections, or placements exist.

### 58.7 Replay and Restore Integrity

Backup schema version 18 and local persistence version 16 are current. Version 17 migration preserves existing placement history and productive verification evidence and creates no criterion-exit review.

Restore validates the source placement and every source verification event, rebuilds the complete assessment at its stored assessment time, and requires exact equality. It rejects altered recommendations, counts, criteria, reasons, limitations, routes, or evidence snapshots. It requires every verification ID to exist in the global ledger, every source placement to exist in current or governed plan and session history, and every cited first-set ID to retain the exact exercise identity in current or governed history. It also rejects `continue-current` when pain-changing evidence requires reassessment.

### 58.8 Interface Contract

Today shows a non-punitive checkpoint callout only when evidence has an actionable recommendation and that exact evidence has not already been reviewed. It routes to You and does not block training unless the separate pain gate applies.

You shows the rule version, recommendation, reason, supported or suggested route, four criterion cards, matching-route source counts, excluded different-lane count, declared criteria, limitations, latest athlete decision, and decision reason. The exact-evidence button becomes a disabled reviewed state after saving.

The review dialog defaults to the safest coherent choice, explains that no route changes silently, requires a reason, and keeps reassessment, defer, and continue visible. Plan shows the current checkpoint recommendation and evidence count inside the training contract.

### 58.9 Acceptance Tests

- Two supportive goal-route checks recommend confirming the current route.
- Two supportive bridge checks recommend reviewing advancement to base building.
- Two review-suggested checks recommend a more conservative route.
- Pain-changing evidence takes priority and rejects a forged keep-current review.
- Altered stored recommendations fail replay validation.
- A different effective movement lane is disclosed and excluded from plan-route confirmation.
- Version 17 migration invents no review.
- Backup version 18 round trips a valid review and rejects a forged assessment.
- Desktop and phone complete two checks, show four met criteria, save an athlete reason, and preserve exact source evidence.
- The phone callout and complete criterion panel remain readable and horizontally contained.

### 58.10 Verified Release Evidence

- ESLint passed.
- One hundred fifty-four deterministic tests passed across seventeen files.
- Production TypeScript and installable PWA build passed.
- Thirty-eight Playwright journeys passed across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the checkpoint callout and criterion panel after clarifying same-route confirmation as a supported current route.
- Backup version 18 round-trip, migration, replay, and forgery tests passed.
- Dependency audit, explicit key-pattern scan, and Gitleaks are required at the final publication gate.

### 58.11 Deferred Boundaries

- Thresholds require calibration from real workouts and athlete judgment.
- Movement-specific exits remain deferred and cannot borrow plan-route evidence.
- Goal-specific strength, power, hypertrophy, and event-performance criteria need deeper measurable contracts.
- A keep-current review does not authorize overload. Normal load-first progression remains separately governed.
- Automatic reclassification remains prohibited. The implemented R-103 slice detects a trigger, then routes the athlete through explicit versioned reassessment.
- Structured coach, reliable-estimate, wearable, velocity, and medical evidence are not checkpoint sources. Athlete technique video is out of product scope.
- No backend, account, Supabase project, cloud sync, AI provider, or social system is required.

### Version 1.24.0 Change Entry

- Added `placement-exit-v1` with exact placement identity, matching plan-route evidence, four measurable criteria, review recommendations, limitations, and different movement-lane exclusions.
- Added `placement-exit-review-v1` with athlete keep, reassess, or defer decisions and required reasons.
- Added Today, You, Plan, review-dialog, backup-preview, and diagnostics surfaces.
- Added backup schema version 18, local persistence version 16, and honest version 17 migration.
- Added replay, global-ledger, placement-history, first-set identity, duplicate-review, and pain-boundary validation.
- Increased deterministic coverage from 146 to 154 tests across seventeen files and browser journeys from thirty-six to thirty-eight.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].


## 59. Private Alpha 0.25.0 Exact Movement-Lane Criterion Exit

### 59.1 Requirement Boundary

Private alpha 0.25.0 implements the first exact-movement criterion-exit slice of R-092, R-098, and R-101 while advancing the explicit review trigger in R-103. It adds `movement-placement-exit-v1` and `movement-placement-exit-review-v1` without weakening the cycle-level `placement-exit-v1` contract from Chapter 58.

The cycle-level assessment may still interpret matching plan-route checks across protected movements. The movement-level assessment has a stricter authority boundary: only productive checks carrying the exact canonical exercise ID and exact `movement-placement-v2` snapshot may satisfy that movement lane. Plan-route agreement, movement family, a neighboring variation, another protected anchor, or general athlete experience cannot confirm an exact movement lane.

No movement checkpoint changes load, repetitions, sets, placement, route, plan, or progression directly. It produces a replayable recommendation and requires an athlete-authored decision. Reassessment remains the only path to a new placement and future plan version.

### 59.2 Lane-Scoped Verification Quota and Sequence

The initial one-to-three productive-check contract is now scoped to one placement version plus one exact movement identity.

1. Determine the active `placementCreatedAt`.
2. Read the generated session's immutable `movementPlacement.exerciseId`.
3. Build the lane key from that exact exercise ID. A legacy session without movement placement uses the separate `plan` lane.
4. Count only existing verification events from the same placement version and lane key.
5. Create another check only when that lane has fewer than three events and that exact session has no existing check.
6. Assign `sequence` as the current exact-lane count plus one.

Bench check one and squat check one are therefore both valid. A squat check cannot consume bench's second or third verification opportunity. Backup uniqueness is placement identity plus movement lane plus sequence, not placement identity plus sequence alone.

Global profile summaries may report total checks across lanes, but they must not display a false global `x of 3` quota. Workout and recovery prompts name the exact movement and show that lane's sequence. Each movement card reports its own resolved checks out of three.

### 59.3 Exact Movement Assessment Contract

`movement-placement-exit-v1` requires:

- the complete exact `placement-v3` source snapshot;
- the complete exact `movement-placement-v2` source snapshot found inside that placement;
- every `placement-verification-v1` event from the placement version for disclosure and replay;
- a valid assessment timestamp.

The scoring subset contains only events whose stored `movementPlacement.exerciseId` equals the assessed movement. Every other movement event is retained in the source snapshot and counted as `excludedOtherMovementChecks`, but contributes zero criterion evidence.

The assessment stores placement and movement identity, current route, recommendation, optional suggested route, complete source snapshots, exact-lane collected and resolved counts, support, review, and incomplete counts, excluded-other-movement count, pending recovery, pain-boundary state, four criterion states, reasons, and limitations.

### 59.4 Measurable Exact-Lane Criteria

| Criterion | Met | Not met | Unknown |
|---|---|---|---|
| Two exact-movement checks resolved | At least two exact-lane events have final source-linked verdicts | Not applicable in version 1 | Fewer than two exact-lane checks have final verdicts |
| Movement lane supported repeatedly | At least two resolved exact-lane checks support the lane | At least two exact-lane checks suggest review, or any exact-lane check requires reassessment | Repeated exact-movement support is not established |
| No pain-changing movement check | At least one exact-lane check is resolved and none requires pain-triggered reassessment | Any exact-lane check requires reassessment | No resolved exact-lane pain evidence exists |
| Movement recovery supports the lane | At least two exact-lane checks resolve as recovered or acceptable | At least two exact-lane checks suggest review | Fewer than two supportive exact-lane recovery responses, or recovery remains pending |

These criteria interpret a programming hypothesis. They do not diagnose pain, provide medical clearance, or establish that another variation transfers safely.

### 59.5 Recommendation and Route Mapping

Recommendation priority matches the safety order in Chapter 58 but uses the exact movement's selected route:

1. `reassessment-required` when any resolved exact-lane check contains pain-changing evidence.
2. `review-conservative` when at least two resolved exact-lane checks suggest review.
3. `review-advance` when at least two exact-lane checks support an introductory, reacclimation, bridge, or base-building lane and the route map identifies a distinct next lane.
4. `confirm-current` when at least two exact-lane checks support a goal-specific lane, or a lane whose mapped next route is unchanged.
5. `hold-current` when three exact-lane checks resolve without repeated support or repeated review evidence.
6. `collect-evidence` otherwise, including pending recovery.

Movement advancement maps introductory to bridge; bridge or reacclimation to base building; and base building to the placement goal route when one exists. Conservative review maps goal-specific routes to base building and base or bridge to reacclimation. A map result is a review suggestion only.

### 59.6 Athlete Decision and Duplicate Review Contract

`movement-placement-exit-review-v1` stores a stable review ID, placement identity, exact exercise ID, creation time, `continue-current`, `reassess-now`, or `defer`, a required athlete reason, and the complete self-contained movement assessment.

- `continue-current` records that the athlete accepts retaining the current movement lane. It authorizes no overload or prescription change.
- `reassess-now` opens the current movement-profile onboarding step. Only completion creates a new placement and future plan version.
- `defer` preserves the current lane and records why the athlete wants more time or evidence.
- Pain-changing exact-lane evidence disables and rejects `continue-current`.
- An active workout blocks review.
- The same placement, exercise, and exact-lane source-event set cannot receive a duplicate review.
- New exact-lane evidence creates a new evidence key and may earn a later review without rewriting the earlier decision.

### 59.7 Interface and Queue-Advancement Contract

Workout names the exact movement check and lane sequence. Today names the same movement in optional recovery. You lists every event with movement identity and sequence, reports total checks across exact lanes without a false global cap, and provides one expandable lane card per protected movement.

Each movement card shows route, confidence, reasons, exact-history provenance, unknowns, deterministic recommendation, resolved exact checks, suggested or supported lane, latest athlete decision, and the reason-required review action. The review dialog shows all four exact-lane criteria, route mapping, choices, pain boundary, and explicit evidence limitations.

Today prioritizes an actionable checkpoint for the next session's movement. If the completed movement leaves the front of the queue, any still-unreviewed earned movement checkpoint remains visible instead of disappearing merely because a different movement is next. Plan reports how many movement lanes are ready for athlete review and the total resolved exact checks.

### 59.8 Replay, Backup, and Migration Integrity

Backup schema version 19 and local persistence version 17 are current. `movementPlacementExitReviews` is a separate ledger from cycle-level `placementExitReviews`. Version 18 migration preserves all existing plan-route reviews and productive verification evidence and creates no movement review.

Restore validates every movement review, source placement, source movement placement, source verification event, global verification ID, completed first-set source ID, and exact exercise identity. It rebuilds the movement assessment at the stored assessment time and requires exact equality. It rejects altered exercise identity, recommendation, route, counts, criteria, reasons, limitations, sources, unsafe keep-current decisions, and duplicate sequence numbers inside one exact lane. The same sequence number remains valid in different exact lanes.

### 59.9 Acceptance Tests

- Two supportive checks for one exact goal-specific movement recommend confirming that movement lane.
- Two supportive checks for one transitional exact movement recommend the correct next lane.
- Support from another protected movement contributes zero evidence and is counted as excluded.
- An exact pain-changing check takes priority and blocks keep-current.
- Altered movement identity, recommendation, route, or source snapshot fails replay validation.
- Bench and squat can each own check sequence one inside the same placement version.
- One lane can own sequence one and two without exhausting another lane's quota.
- Version 18 migration invents no movement review.
- Backup version 19 round trips a valid movement review and rejects forged evidence.
- Desktop and phone complete two exact bench checks, retain the earned bench checkpoint after squat becomes next, inspect four met criteria, save an athlete reason, and preserve the unchanged bench placement route.
- Global summaries remain honest when total checks exceed one lane's three-check limit.

### 59.10 Verified Release Evidence

- ESLint passed.
- One hundred sixty deterministic tests passed across seventeen files.
- Production TypeScript and installable PWA build passed.
- Forty Playwright journeys passed across desktop Chromium and the 390 by 844 phone project.
- Full-resolution phone review passed for the exact movement checkpoint and complete criterion-review dialog.
- Backup version 19 round-trip, version 18 migration, lane-sequence, replay, and forgery tests passed.
- Dependency audit, explicit key-pattern scan, and Gitleaks are required at the final publication gate.

### 59.11 Deferred Boundaries

- The two-check support and review thresholds require calibration against real workouts and athlete judgment.
- Goal-specific strength, power, hypertrophy, and event-performance success measures need deeper measurable contracts.
- Movement-family and neighboring-variation evidence transfer remains prohibited until separately researched, bounded, and athlete-reviewed.
- A checkpoint does not automatically apply a route change, add load, add repetitions, or add sets.
- Structured coach, reliable-estimate, wearable, velocity, and medical evidence are not checkpoint sources. Athlete technique video is out of product scope.
- Movement-specific volume tolerance and muscle-specific tolerance remain deferred.
- No backend, account, Supabase project, cloud sync, AI provider, or social system is required.

### Version 1.25.0 Change Entry

- Added exact-lane verification quotas and sequences for one to three checks per protected movement.
- Added `movement-placement-exit-v1` with strict exact-exercise evidence isolation, four criteria, route recommendations, exclusions, and limitations.
- Added `movement-placement-exit-review-v1` with athlete keep, reassess, or defer decisions and required reasons.
- Kept earned movement checkpoints visible after the workout queue advances.
- Added Workout, Today, You, Plan, review-dialog, backup-preview, and diagnostics surfaces.
- Added backup schema version 19, local persistence version 17, and honest version 18 migration.
- Added lane-scoped replay, source identity, sequence uniqueness, pain-boundary, duplicate-review, and forged-evidence validation.
- Increased deterministic coverage from 154 to 160 tests across seventeen files and browser journeys from thirty-eight to forty.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].

### 59.12 Private Alpha 0.25.1 Exact-Lane Substitution Integrity

A protected-primary replacement changes the exact movement being trained and therefore cannot finish, confirm, or consume the active placement check that was created for the original movement. Before the session can record completion evidence, the substitution transaction removes only the active verification event whose `placementCreatedAt` and `sessionId` match the current workout.

- The cancelled check stores no verdict, first-set evidence, recovery request, or movement-exit credit.
- The cancelled check consumes no exact-lane quota or lasting sequence. A later exact exposure can receive the next valid sequence from the retained events.
- The selected replacement still owns its completed sets, exact history, prescription, substitution event, outcome, and source-set provenance.
- The original protected movement remains `substitutedFrom`, receives no completed-set or placement credit, and keeps its progression clock frozen.
- Secondary, priority, maintenance, and optional substitutions do not cancel the primary placement check.
- Returning to the original movement later in the same workout does not resurrect the removed check. A later exact session can verify it without ambiguity.
- Workout shows an accessible exact-check cancellation message naming the original lane and confirming that replacement history still counts.
- `placement-verification-v1`, backup schema version 19, and local persistence version 17 remain unchanged because this patch prevents invalid evidence before it enters those persisted contracts.

Acceptance requires a browser journey that proves an active Competition Bench Press check existed before substitution, requires protected-primary confirmation, changes to Coffin Press, shows the lane-cancellation explanation, saves Coffin Press work with `originalExerciseId` provenance, and finishes with no placement verification event for the cancelled bench check. Pure tests must also prove that only the matching active event is removed while other sessions and resolved history remain unchanged.

### Version 1.25.1 Change Entry

- Added transactional cancellation of an active exact-movement check when its protected primary is replaced.
- Preserved replacement training credit, substitution provenance, and the original movement's frozen progression clock.
- Added an accessible in-workout explanation because active workouts render outside the standard app-shell toast host.
- Added two deterministic cancellation tests and strengthened the protected-primary desktop and phone journey.
- Kept backup schema version 19 and local persistence version 17 unchanged.
- Increased deterministic coverage from 160 to 162 tests across seventeen files; forty desktop and phone browser journeys remain green.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].

## 60. Private Alpha 0.26.0 Linked Calendar and Exact Exposure History

### 60.1 Requirement Boundary

This release implements the first operational slice of R-072 and R-113. Progress must let an irregular athlete answer two different questions without collapsing them into one timeline:

1. **Calendar clock:** On which dates was training planned, moved, stopped, imported, or completed?
2. **Completed-exposure clock:** In what order did the athlete actually complete this exact canonical movement, and how many calendar days separated those exposures?

The two clocks are linked by stored session identity and source-set identity. Neither clock may fabricate completed work, award progression, create missed-work debt, or silently convert a calendar week into a training exposure.

### 60.2 Data Authority and Derivation

`calendar-exposure-v1` is a pure deterministic read model. Its only authorities are the existing canonical session ledger, completed source-set history, exact exercise IDs, and the athlete-authored fixed-event field. It creates no second history table and changes no programming state.

- Planned opportunity truth comes from stored sessions and their planned dates and statuses.
- Actual training truth comes only from completed source sets and their completion dates.
- A completion links to a stored plan only when its canonical `sessionId` resolves to that session.
- Imported or otherwise unlinked completion remains valid training history and is labeled as having no stored plan.
- Exercise names are presentation metadata. Exact exposure membership is decided only by canonical exercise ID.
- All volume-load totals reconcile from completed source sets as `sum(actual load x actual repetitions)`.
- The view may describe change between exposures, but it has no authority to prescribe the next load, repetitions, or sets.

### 60.3 Calendar View Contract

Progress provides a Sunday-first, six-row, forty-two-cell calendar grid for the selected month, including bounded adjacent-month cells needed to preserve the grid. Previous month, next month, and current month controls retain a selected date and use distinct accessible names.

Each date may independently show:

- stored planned opportunities;
- completed source-set activity;
- moved, deferred, expired, or stopped plan states;
- linked completion on the same date;
- linked completion earlier or later than its planned date, with signed drift translated into plain language;
- imported or completed activity with no stored plan;
- exact completed sets, repetitions, volume load, and contributing exercise names.

Month summaries report planned opportunity count, completed activity count, and moved-or-stopped count. These are distinct measures and must not be presented as an adherence score. Selecting an empty date shows `No stored training event` and explicitly states that the date creates no missed-work debt and says nothing about readiness.

### 60.4 Exact Completed-Exposure Sequence

The exposure axis is an ordered sequence of completed sessions for one exact canonical exercise ID. Family members, aliases that resolve to another canonical ID, and neighboring variations cannot enter the sequence.

For each exposure, the read model stores or derives:

- one-based chronological sequence number;
- canonical exercise ID and display name;
- canonical session ID;
- earliest completed timestamp for the exact movement in that session;
- calendar-day gap from the previous exact exposure;
- completed set count and repetition sum;
- reconciled volume load;
- heaviest completed load;
- maximum repetitions performed at that heaviest load;
- estimated one-repetition maximum using the bounded existing Epley display formula;
- average recorded RIR;
- quality-confirmed set count;
- complete source-set ID list;
- imported-history status.

The interface renders newest exposure first while preserving the true chronological sequence number. The first exposure is labeled as the first exact exposure rather than assigning a fake gap.

### 60.5 Descriptive Change Labels

Change labels summarize what differs from the immediately prior exact exposure using the product's progression vocabulary in this descriptive priority:

1. load changed;
2. repetitions changed when load did not;
3. sets changed when load and repetitions did not;
4. volume load changed when the preceding dimensions do not explain the difference;
5. held or mixed when no single higher-priority description is valid.

These labels do not award a PR, prove readiness, or authorize progression. The progression engine, exact-lane eligibility, pain gates, readiness, equipment, and athlete control remain the prescription authorities.

### 60.6 Fixed-Event Countdown

The countdown is enabled only by an athlete-authored, valid ISO calendar date in `YYYY-MM-DD` form inside the stored fixed-event text.

- Missing event input displays `No fixed event declared` and creates no deadline.
- Text without a parseable valid ISO date remains visible as athlete-authored text and asks for a valid date.
- Invalid dates such as an impossible month or day remain unparsed.
- A valid future date shows exact local calendar days remaining.
- The current date is labeled as today.
- A past date shows exact calendar days past.
- The event date never reorders completed exposures or creates progression credit.

### 60.7 Interface and Accessibility Contract

The linked-clock panel appears in Progress after the selected-period facts. A two-button pressed-state control switches between `Calendar` and `Exposure order`. Calendar date buttons expose their date, planned count, completed set count, and volume load. The current-month control has the accessible name `Show current month` so it cannot conflict with primary Today navigation.

Phone layouts retain all date cells, selected-date detail, exact movement controls, exposure metrics, and guardrail copy without horizontal overflow. Empty, unparsed, imported, unlinked, moved, and first-exposure states must be legible without color alone.

### 60.8 Persistence, Backup, and Replay

No new persisted object is necessary because every value replays from already governed sessions, completed sets, placement input, and exercise identity. Backup schema version 19 and local persistence version 17 therefore remain unchanged. A restore of the same canonical data must reproduce the same calendar links, drift, exact exposure order, gaps, and countdown state for the same local date.

### 60.9 Acceptance and Verification

Pure tests must prove:

- planned and actual dates remain separate while session identity links them;
- earlier or later completion produces exact calendar drift;
- moved opportunities and imported unlinked work remain explicit;
- exact movement sequences reject neighboring movements;
- load, repetition, set, volume, and held descriptions follow the declared priority;
- fixed events distinguish missing, unparsed, invalid, upcoming, today, and past states.

Desktop and 390 by 844 phone journeys must prove the calendar, selected completed date, exact Competition Bench Press exposure order, source-derived metrics, absent-event state, athlete-supplied ten-day countdown, accessible current-month control, zero console errors, and horizontal containment. Full-resolution phone screenshots must be reviewed for both axes.

### 60.10 Verified Release Evidence and Deferred Boundary

Private alpha 0.26.0 adds `calendar-exposure-v1`, six deterministic timeline tests, and one desktop-plus-phone browser journey. The verified release gate is lint, 168 deterministic tests across eighteen files, production PWA build, forty-two Playwright journeys, full-resolution phone review, zero dependency vulnerabilities, clean diff validation, explicit secret scanning, and Gitleaks over the directory and Git history.

This release does not implement automatic missed-workout replanning, calendar drag-and-drop, a compliance score, future event pathway compression, macrocycle or annual timeline editing, family-transfer inference, cloud synchronization, social calendars, notifications, or AI-generated prescriptions. It makes existing truth visible and linked; it does not broaden training authority.

### Version 1.26.0 Change Entry

- Added a linked 42-cell calendar for planned opportunities, actual completed work, plan-to-actual drift, moved states, and unlinked imported activity.
- Added exact canonical exercise exposure order with gaps, per-session metrics, source IDs, and descriptive load-first change labels.
- Added explicit missing, unparsed, upcoming, today, and past fixed-event countdown states without inventing dates.
- Kept calendar and exposure axes descriptive and separate from progression authority.
- Kept backup schema version 19 and local persistence version 17 unchanged because the feature replays from governed canonical data.
- Increased deterministic coverage from 162 to 168 tests across eighteen files and browser coverage from forty to forty-two desktop and phone journeys.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].
## 61. Private Alpha 0.27.0 Missed-Opportunity Queue Rebuild

### 61.1 Product Boundary

Private alpha 0.27.0 turns one planned but unstarted opportunity into an explicit schedule decision. It does not treat a calendar gap as training, infer that an athlete failed, or rewrite completed history. The decision engine may move and reduce only open `planned` or `deferred` sessions. Completed, partial-primary, partial-without-primary, stopped, and expired sessions remain in the ledger unchanged.

This is the first executable slice of R-052 through R-060. It solves the immediate family, work, time, travel, sleep, illness, pain, equipment, motivation, and other interruption flow while retaining conservative boundaries for later readiness, equipment, muscle-dose-gap, fixed-event, and manually pinned priority logic.

### 61.2 Missed-Opportunity Check-In Contract

The athlete can open `I missed this opportunity` from Today and provide five decision-changing facts:

1. whether no training happened or different unlogged training happened;
2. the interruption reason;
3. the next realistic calendar opportunity;
4. the minutes likely available, from 15 through 90;
5. whether the constraint ended, continues, or is uncertain.

Optional context is limited to 500 characters. No answer awards completed-set, exposure, volume, PR, or progression credit. Different unlogged training must be logged or imported before it can count. Invalid or past next-opportunity dates, out-of-range time, missing sessions, and terminal sessions are rejected without mutation.

### 61.3 Durable Decision Event

Every accepted check-in appends one `MissedOpportunityEvent` under `missed-opportunity-v1`. The event stores:

- immutable event, session, mesocycle, and plan-version identity;
- recorded time, original planned time, and prior session status;
- the complete athlete input and optional note;
- continuity before and after;
- consecutive miss count and selected adaptation mode;
- open queue order before and after;
- selected next session and exact primary movement;
- latest completed exact-primary exposure and calendar days since it;
- human-readable reasons;
- every session date, duration, status, and set-count change;
- terminal session identities that were preserved;
- completed-set counts before and after;
- total open planned sets before and after.

The event is evidence, not a mutable summary. Today, Plan, Progress, export, restore, reload, and future audits all replay the same stored decision.

### 61.4 Deterministic Open-Queue Algorithm

The first-slice queue algorithm performs the following ordered work:

1. Validate the target as an unstarted planned or deferred session.
2. Freeze the completed-set ledger and collect every open session without deleting terminal sessions.
3. Find the latest completed source set for each open session's exact canonical primary movement. Never borrow family or neighboring-variation history.
4. Rank open sessions by calendar days since that exact exposure. A primary with no completed exact baseline remains unresolved and receives conservative priority. Original planned time and source order break ties.
5. Place the highest-priority session on the athlete's declared next opportunity.
6. Space the remaining open queue from the declared weekly opportunity count.
7. Compress only the first session to the declared available minutes using the governed time-compression rule.
8. Remove optional work from the first session when disruption repeats or the constraint is continuing or uncertain.
9. Return the originally missed session to planned status on its new date. Preserve the missed original date in the append-only event.
10. Reject any result that changes completed-set count or increases total open planned sets.

This creates no catch-up debt. A shorter first session may reduce open work. It may never add sets merely to replace what the calendar missed.

### 61.5 Continuity and Adaptation Modes

The initial deterministic modes are:

- `defer-one`: one missed opportunity with no stronger reacclimation signal;
- `rebuild-sequence`: two consecutive missed opportunities since the latest completed work;
- `reacclimation-review`: three or more consecutive misses, or ongoing or uncertain illness or pain.

One ended family, work, time, travel, equipment, motivation, or similar disruption does not imply physiological fatigue. Repeated misses or a continuing or uncertain non-medical constraint move stable continuity to interrupted. Three misses, or ongoing or uncertain illness or pain, move continuity toward returning. Existing returning continuity is never silently upgraded by a missed-opportunity decision.

These are versioned product heuristics. They do not diagnose injury or illness and require real-workout calibration.

### 61.6 Completed Truth and Partial Credit

The rebuild uses completed source sets as the sole exposure truth. A partially completed session remains terminal and keeps exactly the primary, secondary, or accessory sets actually logged. Missing portions remain missing and cannot be manufactured by the schedule event. Progression for one exact movement may continue from its own completed comparable work while an unperformed movement's clock remains frozen.

The engine records source-set conservation as `completedSetCountBefore` and `completedSetCountAfter`. Restore rejects a mismatch even if an altered backup has a recomputed outer checksum. Open planned set count must be finite and non-increasing.

### 61.7 Interface Contract

Today provides the decision modal and a persistent `Latest schedule adaptation` proof card. The card names the rule and mode, next session, date, minutes, exact-primary gap, continuity change, miss sequence, completed-set conservation, planned-set change, and full reason list.

Plan provides `Latest queue rebuild`, the reason, constraint state, next date, unchanged completed truth, no-catch-up proof, top ranking reason, and an expandable per-session move replay.

Progress keeps the original missed calendar date visible as `Missed opportunity · moved`, links it to the new date, and renders the current planned session on its new date. A missed date and a completed session on the same day remain separate facts.

All states must be understandable without color, fit the 390 by 844 phone viewport without horizontal overflow, and remain useful after reload.

### 61.8 Persistence, Backup, and Migration

Local persistence version 18 adds `missedOpportunityEvents` and defaults older local state to an empty event ledger. Backup schema version 20 exports and restores the full event array, reports its count in preview, validates unique event identity and session references, and applies `missedOpportunity-v1` replay invariants. Schema version 19 migrates with an empty event array and invents no missed-workout history.

### 61.9 Acceptance and Verification

Pure tests must prove exact-primary overdue ordering, first-session time fit, no catch-up volume, terminal-session identity preservation, repeated-miss sequence rebuilding, illness and pain reacclimation, zero credit for unlogged training, invalid-date and terminal-session rejection, replay validation, completed-set tamper rejection, schema-19 migration, and original-date calendar replay.

Desktop and phone journeys must prove all five check-in facts, persistence version 18, unchanged session and source-history counts, append-only event creation, completed-set conservation, non-increasing open planned sets, next-session identity, Today proof, Plan replay, original-date Progress evidence, reload persistence, no console errors, and no horizontal overflow. Phone visual review must include the check-in, Today proof, Plan audit, and calendar record.

### 61.10 Deferred Boundary

This release does not yet combine muscle-dose gaps, current readiness, live pain restrictions, selected equipment profile, fixed-event compression, fatigue interaction with following work, athlete preference, or manual pinning into the queue rank. It does not automatically import reported outside training, expire stale optional work beyond the first-session reduction, apply a medical return protocol, edit macrocycles, synchronize devices, or use a language model. These remain visible requirements, not implied behavior.

### Version 1.27.0 Change Entry

- Added the first executable conditional missed-opportunity check-in and deterministic open-queue rebuild.
- Added source-set conservation, no-catch-up validation, exact-primary recency ordering, continuity modes, and append-only decision replay.
- Added persistent Today, Plan, and Progress explanations including the original missed calendar date.
- Advanced backup schema from 19 to 20 and local persistence from 17 to 18 with non-inventing migrations.
- Increased deterministic coverage from 168 to 177 tests across nineteen files and browser coverage from forty-two to forty-four desktop and phone journeys.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].

## 62. Private Alpha 0.28.0 Athlete-Controlled Next-Session Priority

### 62.1 Purpose and Authority

Private alpha 0.28.0 completes the manual-pin clause of R-060 without turning the athlete's preference into hidden AI behavior. During the missed-opportunity check-in, the athlete may keep the exact-exposure recommendation or explicitly choose one open session to lead the rebuilt queue.

The pin is a deliberate override of the first queue position only. It does not manufacture exposure, change completed history, increase planned sets, alter exercise loads, or silently change the remaining priority order.

### 62.2 Versioned Input and Decision Rule

`missed-opportunity-v2` adds `preferredNextSessionId` to the full version 1 input and evidence contract.

- `null` means ForgePath selects the first session from completed exact-primary recency.
- A session ID means the athlete explicitly pins that open planned or deferred session.
- A missing, terminal, stale, or unknown session ID rejects the rebuild without mutation.
- A valid pin must become `nextSessionId` and the first member of `queueAfter`.
- Exact-primary recency, original planned time, and source order continue to rank all remaining open sessions.

The first explanation states that the athlete pinned the session and that exact-exposure recency still owns the remainder. The session's own exact-primary gap remains visible even when it was not the engine's automatic first choice.

### 62.3 Interface and Athlete Control

The missed-opportunity modal adds `Which session should lead?` with:

- `Recommend from completed exposure` as the default;
- one `Pin [session title]` option for every current open session;
- guardrail copy explaining that only the first choice is overridden.

Today and Plan replay the pin as the top reason. The choice survives reload, export, and restore. Phone layouts retain the full field, explanation, and proof card without horizontal overflow.

### 62.4 Integrity, Backup, and Migration

The validator accepts historical `missed-opportunity-v1` events and current version 2 events. Version 2 requires explicit preference evidence, including `null`. Restore rejects a preference whose session is unknown, was not in `queueBefore`, or does not match `nextSessionId`.

Backup schema version 21 and local persistence version 19 are current. Version 20 backup migration preserves all version 1 decisions exactly and does not invent pins. New decisions use version 2.

### 62.5 Acceptance and Verification

Deterministic tests prove automatic ordering remains unchanged, a valid bench pin leads while the remaining squat and deadlift order still follows exact recency, stale pins reject, forged next-session identity rejects, and version 20 backups retain version 1 decisions. The complete suite contains 180 tests across nineteen files.

The existing desktop-plus-phone interruption journey now pins the Bench Powerbuilding Session even though the automatic exact-recency choice differs, verifies version 2 evidence, confirms the first open session equals the stored pin, checks the visible explanation, reloads the result, and retains all 0.27.0 source-set and no-debt proofs. All forty-four browser journeys pass.

### 62.6 Deferred Boundary

The pin does not yet screen or reorder against an equipment mismatch, active pain restriction, fixed-event requirement, downstream fatigue conflict, or other safety gate. Starting the session still passes through existing equipment and pain-aware controls. Future queue work must decide whether a hard contraindication blocks a pin or turns it into a substitution review without silently ignoring athlete intent.

### Version 1.28.0 Change Entry

- Added an optional athlete-controlled first-session pin to `missed-opportunity-v2`.
- Preserved exact-exposure ordering for the remaining queue and all completed-truth and no-catch-up invariants.
- Added stale-pin and forged-pin rejection plus version 1 compatibility.
- Advanced backup schema from 20 to 21 and local persistence from 18 to 19 with a non-inventing version 20 migration.
- Increased deterministic coverage from 177 to 180 tests while retaining forty-four complete desktop and phone journeys.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].

## 63. Private Alpha 0.29.0 Equipment and Safety Eligibility for Schedule Priority

### 63.1 Purpose and Authority

Private alpha 0.29.0 closes the highest-risk gap left by the athlete-controlled priority release. A missed-opportunity rebuild may now recommend or accept only a session whose protected primary can actually be performed at the active training location and is not marked irritating or avoid by the athlete's current joint-response evidence.

The rule remains deterministic, local-first, and explainable. It does not diagnose pain, infer medical clearance, borrow equipment from another location, or silently replace a protected primary. It screens the queue before schedule mutation and preserves athlete control within the safe executable set.

### 63.2 Versioned Eligibility Contract

`missed-opportunity-v3` contains a `schedule-eligibility-v1` evidence snapshot with:

- active equipment profile ID, name, and update timestamp;
- explicit safety-gate state;
- one eligibility record for every session in `queueBefore`;
- protected-primary identity and joint response;
- missing primary equipment;
- whether the session may lead;
- whether the whole planned session is executable;
- count and reasons for support work requiring review;
- exact planned-exercise IDs and names removed from the first session.

Historical version 1 and version 2 events remain valid. Version 3 decisions require the complete eligibility record and must reconcile candidate identity with the original open queue.

### 63.3 Protected-Primary Eligibility

For every open planned or deferred session, the engine resolves the protected primary by exact canonical exercise ID.

A session cannot lead when:

1. no protected primary is present;
2. the primary exercise identity is unknown;
3. one or more required equipment items are absent from the active location profile;
4. the primary is marked `irritating` or `avoid` in current joint-response evidence.

`great`, `good`, and `neutral` joint responses are eligible. This is a programming gate, not a statement about injury status or medical safety.

If no open session has an eligible protected primary, the rebuild rejects without changing sessions, continuity, preferences, or history. The athlete must change location or complete movement review before rebuilding.

### 63.4 Support-Movement Handling

Unavailable, unknown, irritating, or avoid-rated secondary, accessory, and optional movements do not invalidate an otherwise executable protected primary. They are removed from the first rebuilt session before time compression.

This ordering matters. Eligibility removal occurs first so the event can truthfully attribute the removed movements to equipment or joint-response evidence. Time compression and optional-fatigue trimming run afterward and remain separate governed causes of planned-set reduction.

The first rebuilt session is therefore executable under the active profile. Later open sessions remain in the preserved queue and receive their own eligibility evidence, but this release does not rewrite every later support movement in advance.

### 63.5 Priority and Athlete Pin Resolution

Without a pin, open sessions sort in this order:

1. eligible protected primary before ineligible protected primary;
2. fully executable session before one requiring support removal;
3. more calendar days since the latest completed exact-primary exposure;
4. earlier planned date;
5. original source order.

A requested athlete pin is validated before sorting. An eligible pin controls the first position exactly as in version 2. An ineligible pin rejects with the protected-primary reason and does not silently fall back to another session. Exact-exposure recency continues to order the remaining queue.

### 63.6 Pain and Restriction Safety Gate

Automatic rebuilding pauses before any queue mutation when the selected placement route is pain-aware modified, the placement input says pain changes movement choice, or the latest governed placement verification remains blocked.

The interface states that current pain or restriction evidence changes what can be trained, directs the athlete to reassess before rebuilding, and states that the app is not providing medical clearance. No missed-opportunity event is created while the gate is active.

### 63.7 Interface and Replay Contract

The missed-opportunity selector defaults to `Recommend an executable session`. Each open-session option names one of three states:

- ready at the active location;
- eligible primary with a stated number of support changes;
- unavailable with the first explicit reason.

Ineligible options are disabled. Today displays the active equipment profile and removed-support count in the durable rebuild proof. Plan displays the active profile and exact removed movement names. Both surfaces retain source-set conservation, no-catch-up proof, athlete-pin explanation, continuity, and full reason replay.

### 63.8 Persistence, Backup, and Tamper Rejection

Backup schema version 22 and local persistence version 20 are current. Schema version 21 migrates safely, preserves version 2 athlete pins, and invents no version 3 eligibility evidence.

Restore rejects version 3 events when candidate counts or identities do not match `queueBefore`, a candidate references an unknown session, a fully executable session is not eligible, joint-response or evidence arrays are malformed, the next session was ineligible, the active equipment profile is missing from the restored profiles, removed IDs and names do not reconcile, completed-set conservation fails, or open planned sets increase.

### 63.9 Acceptance and Verification

Pure tests must prove:

- eligible automatic ordering and valid athlete pins;
- rejection of an unavailable protected-primary pin;
- rejection when every protected primary is unavailable;
- removal of unavailable or joint-flagged support work while preserving the protected primary;
- an executable first session after filtering;
- global pain or restriction gate with no mutation;
- version 3 replay validation and tamper rejection;
- schema version 21 migration preserving version 2 decisions without invented evidence;
- current backup round trip with profile-reference validation.

Desktop and phone journeys must prove the active profile, eligibility-aware pin labels, removed movement evidence, unchanged completed source sets, non-increasing open planned sets, Plan replay, reload persistence, safety-gate no-event behavior, zero console errors, and no horizontal overflow.

### 63.10 Deferred Boundary

The priority score still does not combine current session readiness, muscle-dose gaps, fixed-event pressure, downstream fatigue interaction, preferred movement enjoyment, or learned personal transfer. Later queued sessions are not fully substituted during this first-session rebuild. Equipment aliases, plate and stack physics, per-exercise increments, cross-unit conversion, and an active body-region restriction model remain incomplete. No backend, cloud sync, or language model is required for this rule.

### Version 1.29.0 Change Entry

- Added protected-primary equipment and joint-response eligibility to `missed-opportunity-v3`.
- Added support-movement removal before time compression and exact replay of removed identities.
- Added hard pain and restriction gating with no schedule mutation or event creation.
- Preserved athlete pin authority among eligible choices and exact-exposure order behind it.
- Advanced backup schema from 21 to 22 and local persistence from 19 to 20 with a non-inventing version 21 migration.
- Increased deterministic coverage from 180 to 183 tests while retaining forty-four passing desktop and phone journeys.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].

## 64. Private Alpha 0.30.0 Fresh Readiness Evidence in Schedule Rebuilding

### 64.1 Purpose and Authority

Private alpha 0.30.0 connects explicit pre-session readiness evidence to missed-opportunity rebuilding without turning a survey into an opaque global score. The rule follows the readiness sequence in [[Readiness Fatigue and Peaking Model]]: survey evidence is an initial hypothesis, pain can stop automatic action, non-pain concerns modify fatigue or confirmation needs, and performance must still confirm the next workout.

The rule applies only to the missed session's latest pre-session survey. Missing, skipped, unanswered, future-dated, or stale evidence cannot reduce training, lower adherence, create fatigue, or imply recovery.

### 64.2 Versioned Evidence Contract

`missed-opportunity-v4` retains `schedule-eligibility-v1` and adds `schedule-readiness-v1` with:

- source survey ID and capture time;
- age in hours at the schedule decision;
- `current`, `stale`, or `missing` freshness;
- the source readiness outcome when one can be calculated;
- the effective outcome used by scheduling;
- the deterministic schedule action;
- one plain-language reason.

The freshness window is versioned at 24 hours. A future-dated survey is stale rather than silently accepted. Historical missed-opportunity versions 1 through 3 remain replayable without invented readiness evidence.

### 64.3 Missing and Stale Evidence

Readiness is `unknown` and the action is `unknown` when:

- no pre-session survey exists for the missed session;
- the survey was skipped;
- the survey contains no explicitly answered question;
- the latest answered survey is more than 24 hours old;
- the survey time is later than the decision time.

Unknown readiness causes no penalty. The existing completed-truth, continuity, equipment, exact-exposure, time, and athlete-pin rules continue normally. Stale evidence may preserve its old source outcome for audit, but its effective outcome is unknown and it has no scheduling authority.

### 64.4 Current Readiness Actions

Only explicitly answered evidence no more than 24 hours old can produce one of these actions:

| Readiness outcome | Schedule action | Effect |
|---|---|---|
| `normal` | `proceed` | Keep the rebuilt prescription and confirm normally during warm-up. |
| `confirm` | `confirm-at-warmup` | Keep the objective but require warm-up confirmation before progression. |
| `protect` | `trim-optional` | Remove optional fatigue from the first rebuilt session without adding work elsewhere. |
| `reacclimate` | `reacclimation-review` | Change the decision mode to reacclimation review and set continuity to returning. |
| `pain-aware` | `blocked` | Reject automatic rebuilding before mutation and require movement or placement review. |

A single non-pain signal may produce `confirm`, but it does not automatically reduce the plan. The current readiness classifier requires multiple adverse non-pain signals for `protect`. Warm-up and first-set evidence retain authority during the eventual workout.

### 64.5 Interaction Order

The deterministic rebuild order is:

1. reject an active placement pain or restriction gate;
2. resolve the latest survey and freshness;
3. reject fresh pain-aware readiness;
4. validate the missed session, next opportunity, equipment profile, and optional athlete pin;
5. rank eligible open sessions;
6. remove equipment-ineligible support work;
7. fit the declared time window;
8. remove optional fatigue when interruption state or current readiness requires it;
9. verify completed-set conservation and non-increasing open work;
10. store the complete versioned replay.

This order keeps safety before mutation and keeps equipment removal, time compression, and readiness fatigue reduction causally distinct.

### 64.6 Interface Contract

The missed-opportunity modal explains that answered readiness from the last 24 hours may be used and that skipped, missing, or stale evidence remains unknown.

Today adds a Readiness evidence fact showing effective outcome, freshness-aware action, and evidence age when current. Unknown evidence explicitly says `no penalty`. Plan adds the effective outcome, freshness, and full source explanation. The full reason list includes the readiness decision beside equipment, recency, time, continuity, and completed-truth reasons.

### 64.7 Persistence and Tamper Rejection

Backup schema version 23 and local persistence version 21 are current. Schema version 22 migration preserves version 3 equipment decisions and invents no readiness evidence.

Restore rejects version 4 events with malformed freshness, outcome, action, source, age, or reason; a current action that does not match its source outcome; current evidence outside the 24-hour window; stale evidence inside the window; a missing state that contains an outcome; a persisted blocked decision that should never have created an event; or a source survey ID absent from the restored survey ledger.

### 64.8 Acceptance and Verification

Pure tests prove fresh protective evidence removes optional fatigue, one adverse signal produces warm-up confirmation rather than reduction, fresh pain blocks mutation, stale pain becomes unknown without blocking, missing evidence creates no penalty, forged actions reject, source survey references reconcile, version 3 events remain valid, and schema version 22 migrates without invented readiness.

Desktop and phone journeys prove the 24-hour rule explanation, missing-is-unknown evidence, no-penalty language, Today and Plan replay, reload persistence, the independent placement pain gate, zero console errors, and horizontal containment.

### 64.9 Deferred Boundary

This release does not calculate deviations from the athlete's personal sleep, stress, or energy baseline; aggregate repeated readiness across days; classify local versus systemic fatigue; use wearable data; evaluate warm-up speed; or learn personal signal reliability. Readiness does not yet rank one otherwise eligible session above another. Muscle-dose gaps, fixed-event pressure, downstream fatigue, and complete later-session substitution remain deferred. No backend or language model is required.

### Version 1.30.0 Change Entry

- Added `schedule-readiness-v1` to `missed-opportunity-v4` with a 24-hour freshness boundary.
- Added deterministic proceed, warm-up confirmation, optional-fatigue trim, reacclimation review, blocked, and unknown actions.
- Preserved missing-is-unknown and no-survey-penalty behavior in scheduling.
- Added Today and Plan evidence plus tamper-resistant survey provenance.
- Advanced backup schema from 22 to 23 and local persistence from 20 to 21 with a non-inventing version 22 migration.
- Increased deterministic coverage from 183 to 186 tests while retaining forty-four passing desktop and phone journeys.
- Publication commit is recorded in [[Private Alpha Implementation 2026-08-10]].


## 65. Private Alpha 0.31.0 Relative Priority-Region Dose Tie-Break

### 65.1 Purpose and Requirement Authority

Private alpha 0.31.0 adds the first completed-dose signal to missed-opportunity queue ordering. It advances R-039, R-040, R-054, R-060, R-145, and R-146 without treating tonnage as muscle stimulus, prescribing catch-up work, or claiming an optimal weekly dose.

The narrow product question is: when stronger schedule factors cannot distinguish two open sessions, which session covers a declared priority region with relatively fewer completed source sets during the recent rolling window?

This is a tie-break for session order. It is not a progression decision, fatigue model, neglect diagnosis, minimum effective volume target, maximum recoverable volume target, or authorization to add sets.

### 65.2 Versioned Rule Identity

New decisions use `missed-opportunity-v5` and store nested `schedule-priority-dose-v1` evidence. Historical missed-opportunity versions 1 through 4 remain valid and are never relabeled.

The dose evidence stores:

- the fixed rolling window of 28 days;
- exact window start and end timestamps, with the decision time as the window end;
- the athlete-declared priority regions active for that decision;
- the reference completed-set count;
- one source-backed point for every declared priority region;
- one executable coverage point for every open queue candidate;
- the selected session, selected score, selected regions, whether the factor changed the winner, and a plain-language reason.

### 65.3 Completed Source-Set Calculation

Only completed set records whose completion timestamp falls inside the inclusive 28-day window enter the calculation. Planned sets, missed sessions, unlogged activity, volume load, inferred stimulus, and exercise-family transfer do not enter it.

Every completed source set belongs to exactly one broad region through its stored `primaryRegion`. This exclusive classification prevents one set from being counted twice in the schedule tie-break. The system does not use the fractional individual-muscle model here because the current question is broad priority-region representation, not a muscle-stimulus estimate.

For the declared priority regions:

`reference completed sets = maximum completed set count among declared priority regions`

`relative gap sets for region = reference completed sets - region completed set count`

If no priority regions are declared, the factor is inactive. If every declared region has zero completed sets in the window, the reference is zero and no gap is inferred. A positive difference means only that one declared priority region has fewer completed source sets than the most represented declared priority region in this same window.

The words `neglected`, `undertrained`, `deficient`, and `needs more volume` are not authorized from this evidence.

### 65.4 Executable Candidate Coverage

Each open session is evaluated against the current exercise catalog and active equipment profile. Support movements already identified for removal because of equipment or joint-response evidence are excluded before region coverage is calculated. An unavailable support movement therefore cannot make a session appear to cover a priority gap.

For each candidate, the rule stores:

- the unique declared priority regions covered by executable planned movements;
- the largest relative gap among those covered regions;
- every covered region tied at that largest gap;
- the number of executable planned sets assigned to declared priority regions.

Executable planned-set count is evidence for inspection only. It does not multiply the gap score, prescribe more work, or allow a high-set session to outrank a stronger scheduling factor.

### 65.5 Schedule Priority Order

The deterministic order for open sessions is:

1. an explicit valid athlete next-session pin;
2. eligibility of the protected primary at the active equipment location;
3. whether the whole session is executable without support removal;
4. exact-primary exposure recency, including unresolved exact baselines;
5. largest relative completed-set gap among declared priority regions the executable session covers;
6. stored planned date;
7. original source order.

The dose factor is applied only when all four stronger ranking dimensions are equal. It cannot override the athlete's pin, rescue an ineligible protected primary, outrank a fully executable session, or supersede exact-primary exposure priority.

Readiness remains a separate pre-ranking safety and fatigue layer from Chapter 64. Fresh pain can block mutation, protective readiness can trim optional fatigue, and missing readiness remains unknown. The dose rule does not reinterpret readiness.

### 65.6 No-Debt and Progression Boundary

Changing the queue winner does not increase any target. Completed source-set count must remain identical before and after the rebuild, and total open planned sets must remain unchanged or decrease. Equipment removal, time compression, repeated-interruption trimming, and protective-readiness trimming remain the only reasons open planned work may decrease in this transaction.

The selected session continues to use the normal exact-movement progression engine. Relative priority-region representation cannot award a load, repetition, set, PR, or completed exposure.

### 65.7 Explainability Interface

Today adds a `Priority dose tie-break` fact. It shows the selected relative-gap region and score when present, plus whether the factor was applied or only reviewed. The expanded `Why this order?` list includes the exact rolling-window explanation.

Plan adds a `28-day priority dose` replay card with applied or reviewed state and the complete reason. The missed-opportunity check-in explains that relative priority dose can resolve only a stronger-factor tie and never creates catch-up volume.

When an athlete pin or another stronger factor controls the result, the interface says `reviewed` and `no override`. This distinction prevents a visible region gap from being mistaken for an automatic prescription.

### 65.8 Persistence, Migration, and Tamper Boundary

Backup schema version 24 and local persistence version 22 are current. Schema version 23 migration preserves version 4 readiness-aware decisions and invents no priority-dose history.

Restore validation rejects:

- the wrong rule or window size;
- window timestamps that do not span exactly 28 days or end at the recorded decision;
- duplicate or invalid declared regions;
- counts or gaps that do not reconcile to the stored reference;
- missing, duplicate, wrong-region, or out-of-window completed source-set IDs;
- an incorrect latest completion timestamp;
- duplicate or invalid candidates;
- candidate gap scores or tied regions that do not reconcile;
- a selected score or region list that does not match the selected candidate;
- a claim that the dose factor overrode an explicit athlete pin.

The event retains the complete candidate and source-set evidence required to inspect the decision locally. No backend or language model is required.

### 65.9 Acceptance and Verification

Pure tests prove that relative dose changes an otherwise equal choice, an athlete pin remains authoritative, selected evidence is tamper-resistant, source IDs reconcile to real completed sets, version 4 events remain valid, and schema version 23 migrates without invented dose history.

The full deterministic suite passes 189 tests across nineteen files. All forty-four Playwright journeys pass across desktop Chromium and the 390 by 844 phone project. The missed-opportunity journey proves rule version 5, source-backed 28-day evidence, athlete-pin priority, Today and Plan explanations, reload persistence, completed-set conservation, and non-increasing open work.

Full-resolution phone review confirms contained and readable check-in, Today proof, and Plan replay. ESLint, TypeScript production build, PWA generation, dependency audit with zero vulnerabilities, Gitleaks, and diff whitespace validation pass.

### 65.10 Deferred Boundary

This release does not define a target regional dose, compare the athlete with population norms, infer stimulus from tonnage, use fractional muscle credit for schedule ordering, adjust for set quality or RIR, model local fatigue, account for downstream interference, or learn whether a region responds to a given dose. It also does not integrate fixed-event pressure, frequency minimums, movement preference, historical enjoyment, or longer-horizon phase priorities into the queue score.

The next coherent schedule factor is fixed-event pressure with explicit athlete-authored dates, bounded phase logic, and the same no-debt and athlete-control guarantees.

### Version 1.31.0 Change Entry

- Added `schedule-priority-dose-v1` to `missed-opportunity-v5` as a final relative-dose tie-break before planned date.
- Counted only completed source sets in an inclusive rolling 28-day window using exclusive stored primary regions.
- Preserved athlete pin, protected-primary eligibility, full executability, and exact-primary recency as stronger ranking factors.
- Excluded support work already removed for equipment or joint-response evidence.
- Added Today, Plan, modal, backup, migration, and source-provenance validation.
- Advanced backup schema from 23 to 24 and local persistence from 21 to 22 with a non-inventing version 23 migration.
- Increased deterministic coverage from 186 to 189 tests while retaining forty-four passing desktop and phone journeys.
- Published private release commit `06336129e7c2952e4645e088fbc0b4c8479208cf`; local and remote `main` match and the repository worktree is clean.

## 66. Original Training Companion, XP, and Evolution System

### 66.1 Status and Requirement Authority

This chapter specifies R-296 through R-303 and R-375 through R-376. It is a post-0.31.0 product decision and is not yet implemented in the working private alpha.

The objective is to turn long-term training consistency into a visible original character journey. The companion earns bounded experience from completed training truth, gains many levels, and can unlock a permanent four-form progression: Starting, Developed, Champion, and Apex. Levels, cosmetics, environment development, and achievement tracks continue after Apex so the game layer never presents long-term adherence as finished. The game layer supports training adherence and delight without becoming programming authority.

### 66.2 Originality Contract

The desired emotional cadence is familiar: begin with a compact determined creature, develop into a visibly more capable middle form, reveal a powerful champion form, and eventually earn a spectacular original Apex Form that communicates years of accumulated training history. This can evoke the satisfaction of classic monster growth and giant-form spectacle without copying a particular property.

Machop, Machoke, Machamp, Gigantamax, G-Max, Dynamax, and Pokémon must not appear in shipped names, descriptions, art, metadata, code identifiers, audio, marketing, or interface labels. The original companion must not reuse recognizable:

- head, face, body, limb, hand, or foot construction;
- blue or gray humanoid palette as a combined identity cue;
- head crests, wrestling briefs, championship belts, four-arm transformation, or signature poses;
- Poké Ball, evolution screen, badges, fonts, sound design, flashes, terminology, numeric level thresholds, trade mechanic, battle-only giant transformation, signature storm cloud, red energy, or G-Max visual language;
- sprite dimensions, animation frames, silhouettes, or scene composition traced from protected assets.

Before public use, retain an originality sheet showing independent silhouette exploration, construction, palette, naming, lore, animation, and side-by-side rejection of overly similar directions. Private placeholders should also use original names and shapes so temporary art does not become production debt.

### 66.3 Companion State Model

`CompanionProfile` should contain:

- stable companion ID;
- original species or family ID;
- athlete-selected display name;
- current form ID;
- current level;
- lifetime earned XP;
- XP currently available toward the next level;
- selected palette and cosmetic IDs;
- motion, sound, haptic, and visibility preferences;
- created, updated, and last-celebrated timestamps;
- current rule and asset versions.

`CompanionFormDefinition` should contain:

- stable form ID and family ID;
- sequence index of one, two, three, or four;
- original name, description, silhouette class, and asset bundle version;
- level and completed-milestone eligibility criteria;
- idle, acknowledgement, level-up, and evolution animation references;
- reduced-motion and static alternatives;
- accessibility label and non-image description.

Companion form is not athlete ability. No field may be reused as training experience, movement skill, strength tolerance, volume tolerance, readiness, continuity, or progression state.

### 66.4 XP Ledger

Every award is an append-only `CompanionXpEvent` containing:

- stable event ID;
- XP rule version;
- athlete and companion IDs;
- source type and stable source ID;
- awarded amount;
- bounded reason code and plain-language explanation;
- earned timestamp;
- supersession or correction reference when applicable.

Initial source types may include:

- completed workout;
- honestly ended partial workout;
- validated personal record;
- source-backed micro win;
- technique-quality achievement;
- return achievement;
- consistency achievement;
- recovery or learning achievement;
- completed exposure round.

Planned work, missed work, survey completion alone, friend comparison, purchases, advertisements, and unlogged activity cannot award XP. One source event may award at most one event for the same XP rule version and reason category.

### 66.5 Anti-Grind Economy

The first XP function is bounded by event category. It must not directly multiply by volume load, absolute weight, workout duration, working-set count, repetitions, bodyweight, calorie estimate, or streak length.

This prevents the companion from rewarding:

- junk volume;
- unsafe extra sets;
- training through pain;
- deliberately overstated loads or repetitions;
- avoiding appropriate deloads;
- choosing longer sessions when a short session better fits life;
- performing low-value work only to grind levels;
- completing surveys for cosmetic advantage.

A completed session may receive a bounded base award. An honest partial session may receive a smaller source-backed award so the game recognizes real work without pretending full completion. Any full-completion bonus must remain small enough that partial training is not framed as failure.

Validated PRs and achievements can add capped bonuses, but no single performance result should dominate long-term levels. The exact XP table and curve require fixture testing across strength, hypertrophy, short, long, partial, deload, travel, reacclimation, and return sessions before implementation authority is granted.

### 66.6 Level Calculation

Level derives from the sum of active XP events under one versioned curve. The system stores the rule version needed to replay historical levels after restore, correction, duplicate merge, or sync.

Requirements:

- many visible levels exist between major forms;
- visible levels and unlocks continue after the fourth form;
- early levels arrive quickly enough to teach the loop;
- later levels slow gradually without requiring unsafe training frequency;
- no level requires a PR, streak, maximum attempt, public share, payment, or survey answer;
- level never decreases because training was missed or reduced;
- corrections may supersede an invalid XP event, with the reason visible, but the interface must handle any resulting level reconciliation without shame.

The cadence may feel familiar, but do not copy another game's level cap, evolution thresholds, curve table, terminology, or formula.

### 66.7 Evolution Eligibility and Athlete Control

A major form becomes eligible only when both are true:

1. the companion reaches the versioned XP or level threshold;
2. the athlete completes the versioned breadth milestone for that form.

Breadth milestones should reward durable engagement rather than brute output. Candidate evidence includes completed exposure rounds, a mix of strength and hypertrophy sessions aligned to the plan, a return after interruption, or a set of source-backed learning and technique achievements. Final criteria remain open for calibration.

Eligibility creates an invitation. The athlete can evolve now, save it for later, preview the form, or keep the current form. Evolution is recorded as an append-only `CompanionEvolutionEvent` with prior form, selected form, eligibility snapshot, decision, timestamp, and rule version.

No missed workout, deload, illness, pain restriction, injury, childcare disruption, travel period, schedule change, or conservative programming decision may reverse a form or remove eligibility.

The fourth Apex Form is a permanent earned identity, not a temporary battle power-up. Its breadth milestone should require meaningful long-horizon participation across multiple completed cycles, interruptions or returns, training qualities, and source-backed learning milestones rather than a single huge lift, physique outcome, streak, or volume total. Exact criteria remain open for calibration and athlete review.

Reaching Apex never ends the level system. Subsequent XP may advance open-ended mastery levels, cosmetic variants, room or world development, journal emblems, and bounded celebration milestones. Post-apex rewards cannot add training authority, create stat boosts, encourage more work than prescribed, or make missed training feel like lost status.

### 66.8 Level-Up and Evolution Experience

XP is calculated only after the workout and all source records are committed. The workout result screen shows:

- XP earned and why;
- current level and progress to the next;
- any new cosmetic or form eligibility;
- a continue action that is always immediately available.

A normal level-up uses a brief original animation. A major evolution may use a longer original ceremony with silhouette transition, light, particles, sound, and haptics, followed by the new form and its original name. The Apex ceremony may briefly expand the environment, camera scale, or companion presence for spectacle, but the resulting form is permanent and independently designed. The ceremony must not imitate a protected evolution or giant-form screen, sound, clouds, energy, camera language, or terminology.

The athlete can skip, replay later, reduce motion, show celebration-only motion, mute sound, disable haptics, hide the companion, or use focused-training mode. Skipping presentation never skips saved XP or form eligibility.

No level-up or evolution presentation may:

- interrupt an active set or rest-timer action;
- cover pain, technique, equipment, or data-loss warnings;
- block workout completion or the next session;
- imply that the training prescription changed;
- require social sharing;
- prevent screen-reader or large-text access to the result.

### 66.9 Product Surfaces

- `Today`: small companion state, level, next-level progress, and optional greeting.
- `Workout`: minimal or hidden companion presence; no XP meter that encourages extra work.
- `Workout Result`: source-backed XP explanation and optional level-up sequence.
- `Progress`: lifetime level timeline, XP-event audit, forms, and correction history.
- `Plan`: optional journey marker only; companion level does not affect programming.
- `You`: companion visibility, name, cosmetics, motion, sound, haptic, focused-mode, and replay settings.
- `Achievements`: exact source event beside every XP bonus.
- `Friends`: future privacy-controlled form or level sharing without global rankings or shame.

### 66.10 Persistence and Replay

The local-first implementation must store companion profile, XP events, evolution events, rule versions, asset versions, and presentation preferences in the same versioned backup boundary as training history. Derived level and eligibility must be recomputable from the active ledger.

Restore rejects unknown source types, duplicate source awards under the same rule, negative or non-integer XP, impossible level totals, invalid form order, evolution without an eligibility snapshot, and references to missing governed source events. Offline and future cloud paths must use the same idempotency keys so reconnecting cannot duplicate XP.

If a training source is corrected or superseded, the companion ledger records a correction rather than mutating history invisibly. Cosmetic state never becomes the authority for whether a workout, PR, or achievement occurred.

### 66.11 Acceptance Tests

Before implementation is considered complete, prove:

- a completed short workout and completed long workout earn bounded fair XP;
- an honest partial session receives only its defined bounded credit;
- a missed session, planned session, survey, or extra unplanned set cannot create XP;
- the same source cannot award twice after reload, restore, or sync retry;
- history correction and duplicate merge replay XP deterministically;
- no missed week, deload, or interruption removes levels or reverses a form;
- level and athlete training placement remain independent;
- evolution requires both versioned threshold and milestone evidence plus athlete confirmation;
- the fourth Apex Form requires long-horizon breadth evidence and remains permanent without changing training authority;
- XP and meaningful cosmetic or world progression continue after Apex without a second award for the same source;
- skip, reduced motion, silent, hidden-companion, and replay-later paths preserve all training functionality;
- phone and large-text layouts keep training results readable beneath the celebration;
- originality review rejects any companion or sequence that is confusingly close to the named inspiration.

### 66.12 Deferred Decisions

- final companion family and world name;
- final four form names;
- silhouette, anatomy, palette, lore, personality, and equipment motif;
- one companion family versus several selectable archetypes;
- exact XP awards, level curve, level cap, and form thresholds;
- whether post-apex mastery levels are numerically uncapped or use renewable seasons that never reset lifetime progress;
- qualifying breadth milestones;
- cosmetic inventory and environment interaction;
- whether a companion can remain permanently in an earlier form;
- final animation grid, frame count, sound, and haptic language;
- public social visibility and moderation boundaries.

## 67. Contextual Exercise Preferences and Recommendation Control

### 67.1 Status and Requirement Authority

This chapter specifies R-304 through R-311. Private alpha 0.31.0 already implements `favorite: boolean`, separate joint response, and deterministic favorite weighting in substitutions. The five-state preference model, contextual rules, audit events, and full ranking explanations are post-0.31.0 requirements and are not yet implemented.

### 67.2 Product Contract

The athlete can say both `I generally like or dislike this exact movement` and `I want this movement only under these training conditions`. The engine uses those statements in future plans and swap recommendations while keeping safety, active restrictions, equipment, protected session purpose, and competition specificity above preference.

The system must never use one overloaded `favorite` or `avoid` field to represent preference, pain, equipment, or program eligibility. Those meanings have different authority, history, and correction behavior.

### 67.3 Domain Model

Replace the eventual boolean-only preference surface with an athlete-owned projection derived from events:

```text
ExercisePreferenceState = favorite | prefer | neutral | dislike | do-not-recommend

AthleteExercisePreference {
  athleteId
  exerciseId
  globalState
  contextRules[]
  source = athlete-stated
  activeEventId
  updatedAt
}

ExercisePreferenceContextRule {
  id
  exerciseId
  stateInContext
  goalTypes[]
  sportTypes[]
  planRoutes[]
  blockPhases[]
  exerciseRoles[]
  equipmentProfileIds[]
  fixedEventId?
  effectiveFrom?
  effectiveUntil?
  reason?
  ruleVersion
  createdAt
  retiredAt?
}
```

Empty arrays mean no restriction for that dimension. Dates use the athlete's local calendar semantics. A rule matches only when every populated dimension matches the active plan and session context. If two rules conflict, the most specific active rule wins; ties resolve to the more restrictive recommendation state and must be shown for athlete review. The global state is the fallback.

Joint response, active restrictions, equipment fit, retirement state, exercise identity, enjoyment evidence, and inferred behavior signals remain separate objects.

### 67.4 JB Initial Deadlift Rule

Seed the personal private alpha migration or onboarding review with an athlete-confirmed proposal, never a silent assumption:

- sumo deadlift global state: `do-not-recommend` or `dislike`, according to JB's final tap;
- sumo context rule: `prefer` when sport is powerlifting and phase is competition preparation or peak, with primary role allowed;
- conventional deadlift: `prefer` outside the active sumo competition context for compatible general deadlift or strength-hinge roles;
- stiff-leg deadlift: `prefer` outside the active sumo competition context for compatible posterior-chain builder or hypertrophy-hinge roles.

The app must not treat conventional and stiff-leg deadlifts as identical substitutes. Each keeps its canonical identity, exact history, intended role, prescription, fatigue profile, and progression clock.

### 67.5 Deterministic Recommendation Pipeline

For plan generation and substitutions:

1. Reject retired identities and active safety or restriction conflicts.
2. Require selected-location equipment eligibility and executable load behavior.
3. Preserve protected primary identity, competition specificity, planned role, target region or muscle, and session purpose.
4. Resolve the effective explicit preference from active context plus global fallback.
5. Suppress `do-not-recommend` from automatic output unless the matching active rule explicitly permits or promotes it.
6. Apply goal, phase, role, time, joint, fatigue, familiarity, exact-history, transfer, and response ranking.
7. Add a bounded bonus for `favorite` and `prefer`, no effect for `neutral`, and a bounded penalty for `dislike`.
8. Produce visible reason codes and tradeoffs before stable tie-breaking.

Preference cannot rescue a candidate that fails a higher gate. A favorite unavailable movement is unavailable. A favorite painful movement remains blocked. A preferred accessory cannot displace a required competition primary. A dislike can lower a viable candidate but cannot silently rewrite the plan's protected primary.

### 67.6 Protected-Primary Conflict

When the active protected primary's effective state is dislike or do not recommend, generation stops at a review state rather than replacing it. The review shows:

- protected movement and why it is protected;
- active global and contextual preference;
- current sport, goal, phase, event, and role context;
- safe available options;
- consequences for specificity and exact progression history.

Actions are `Keep This Primary`, `Change Training Context`, `Choose a New Protected Primary`, `Override for This Session`, and `Cancel`. A single-session override is stored on the plan or substitution decision and does not mutate the lasting preference.

### 67.7 Library Interaction Contract

Exercise Detail presents the global five-state control separately from joint response. `Use only in certain contexts` opens a concise rule builder with goal, sport, phase, role, location, event, date, state, and optional reason. The screen shows which rule is active now and previews `Promoted`, `Neutral`, `Lowered`, or `Hidden from automatic recommendations`.

Library filters include Favorites, Preferred, Neutral, Disliked, Do not recommend, and Context-specific. Do-not-recommend movements remain searchable and retain full exact history. Manual selection requires a lightweight explanation when it conflicts with an active rule, but never locks the athlete out of their own data.

Recommendation cards expose one of these evidence labels when relevant:

- `Promoted by your stated preference`;
- `Promoted for this training phase`;
- `Lower because you dislike this movement`;
- `Hidden outside powerlifting competition preparation`;
- `Included because the protected competition movement requires specificity`.

### 67.8 Event, Replay, and Merge Contract

Every preference mutation appends an `ExercisePreferenceEvent` containing event ID, athlete ID, canonical exercise ID, before and after global state, before and after context-rule snapshots, reason, source, rule version, creation time, and optional undo or supersession reference.

Backup and restore validate referenced exercises, enum values, rule dimensions, date order, source, and event chronology. Derived current preference must replay from the event ledger. Future cloud sync uses stable event IDs and idempotent writes.

When exercise identities merge, the merge flow previews both preference histories. The athlete chooses the surviving global state and contextual rules. The merge event records that decision, and Undo restores both original identities and histories. Historical recommendation records retain the effective preference snapshot used at decision time.

### 67.9 Stated and Inferred Evidence Boundary

Athlete-stated preference is authoritative. Behavioral evidence is stored separately and may include substitutions, optional skips, completion, enjoyment, target feel, pain, and repeated outcomes. Generated exposure frequency is not evidence of enjoyment because the app may have selected the exercise.

One skip, one swap, one irregular week, or one difficult session cannot create a dislike. Any future inferred suggestion requires comparable repeated observations, confidence, date range, evidence links, and athlete controls to confirm, reject, correct, or stop using the inference. Unknown preference remains neutral or explicitly unknown and creates no negative score.

### 67.10 Acceptance Tests

Before this chapter is implemented, prove:

- each exact movement can store and restore all five global states;
- preference and joint response can change independently;
- do-not-recommend movements disappear from automatic suggestions but remain searchable and manually selectable;
- favorite and prefer change rank only among candidates that pass higher gates;
- a sumo rule activates during declared powerlifting competition preparation and deactivates outside it;
- conventional and stiff-leg alternatives keep separate purpose, history, prescription, and progression clocks;
- a disliked protected primary opens review and is never silently replaced;
- single-session override does not change the lasting preference;
- conflicting context rules resolve deterministically and visibly;
- event replay, undo, backup, restore, duplicate merge, and sync retry preserve the correct current state;
- a skipped exercise does not create an inferred dislike;
- recommendation records retain the effective preference and reason codes used at decision time;
- desktop, phone, keyboard, large-text, and screen-reader journeys can edit, inspect, and clear contextual rules.

### 67.11 Migration and Delivery Sequence

1. Introduce the five-state domain enum and treat the existing `favorite: true` as `favorite`, `false` as `neutral` without inventing dislikes.
2. Add preference events and local persistence migration, validation, export, restore, and undo.
3. Replace the Library star-only detail with the full preference control while retaining a fast favorite action.
4. Add do-not-recommend hard suppression and bounded prefer or dislike scoring with reason codes.
5. Add contextual rule editing and active-context resolution.
6. Add protected-primary conflict review and one-session overrides.
7. Add preference filters, audit history, recommendation labels, and end-to-end accessibility coverage.
8. Only after repeated real use, evaluate inferred preference proposals without changing stated rules automatically.

### 67.12 Deferred Decisions

- exact numeric preference bonuses and penalties after private testing;
- whether global sumo state begins as dislike or do not recommend after JB's explicit choice;
- complete goal, sport, phase, and role vocabularies;
- whether an event date automatically proposes competition-preparation dates or requires manual phase confirmation;
- minimum behavioral evidence for inferred preference proposals;
- whether preference rule templates ship for common competition movements;
- whether rule editing belongs only in Exercise Detail or also in Plan review.

## 68. Phone, Laptop, and Cloud Synchronization

### 68.1 Status and Requirement Authority

This chapter specifies R-312 through R-319 and resolves the first real multi-device client direction. Private alpha 0.31.0 is responsively tested on desktop and a 390 by 844 phone viewport, supports installation as a PWA, and persists locally across reload. It has no account, cloud system of record, cross-device synchronization, handoff, or conflict reconciliation. Those capabilities remain unimplemented.

### 68.2 Product Surface Contract

Phone and laptop are both first-class private product surfaces. Phone layout prioritizes fast workout start, set entry, rest flow, substitutions, readiness, and immediate results. Laptop layout uses available space for plan editing, multi-range analytics, history, imports, data quality, and settings. Today, Plan, Progress, Library, You, surveys, workout logging, corrections, export, and recovery remain available on both.

The first real multi-device client remains the responsive installable PWA. A later native mobile client may improve distribution or device integration but must use the same IDs, domain rules, account, cloud records, and sync contract.

### 68.3 Local and Cloud Authority

The local operational store is authoritative for immediate workout execution. A mutation is successful only after its local transaction commits. Supabase Postgres remains the leading private cloud system of record for authenticated account history, cross-device convergence, relational integrity, backups, and new-device recovery.

Every mutation receives a stable ID and enters an outbox with device ID, local sequence, entity version, expected prior version, local time, timezone, schema version, rule version, and integrity data. Cloud delivery is idempotent. Acknowledgement clears pending status but never removes replay evidence.

### 68.4 Sync and Freshness Lifecycle

Clients pull incremental changes after authenticated launch, foreground resume, successful push, explicit Sync now, before taking over an existing workout, and before cloud-dependent plan or history mutations. Background sync can reduce delay but is not required for correctness.

Visible states are:

- `Saved on this device`;
- `Syncing`;
- `Synced`;
- `Offline`;
- `Needs review`.

Show pending count and last successful cloud synchronization. Only a successful authenticated cloud exchange establishes Synced. Local persistence or a generic network indicator cannot.

### 68.5 Active Workout Handoff

An online editor owns a renewable active-session lease. Another authorized device can open read-only, wait, explicitly take over, or start a different valid workout. Takeover pulls the newest events, records the handoff, and makes the previous device read-only for that session after reconnect.

Offline training remains available. If simultaneous offline branches occur, both upload. Independent append-only events merge by stable ID. Conflicting edits to the same set, slot, completion, substitution, or session state preserve both originals and enter Needs review.

### 68.6 Conflict Rules

- Duplicate delivery of the same event is an idempotent no-op after integrity comparison.
- Independent new events union without loss.
- Concurrent corrections or correction-versus-deletion preserve the source plus every attempted mutation and require review.
- Plan changes never overwrite completed or partial source truth. Reconciliation rebases future work only.
- Exercise merge conflicts pause canonical reassignment.
- Concurrent preferences or settings use expected versions and require review when the choice affects behavior.
- Derived analytics, records, companion XP, and learning features recompute from reconciled source events. They never win a conflict as stored totals.

No last-write-wins shortcut may silently discard completed training or audit evidence.

### 68.7 New Device Recovery

After authentication, a new device validates compatible schema and rule versions, downloads canonical account and training events, builds local projections, records a sync cursor, and becomes offline-capable. Hydration prioritizes identity, active plan, open workout, and recent history before older history. Partial hydration must remain labeled and cannot display incomplete lifetime totals as final.

Device revocation removes future access without removing historical source-device provenance. Export and account deletion remain separate athlete-controlled workflows.

### 68.8 Security and Privacy

Use authenticated sessions and Row Level Security for every athlete-owned cloud table. A device can sync only the authorized account. Service credentials and administrative operations remain server-side. General analytics may store app version, device class, schema version, sync cursor, latency, and error code, but not private workout content, survey text, pain notes, credentials, or free-form feedback.

### 68.9 Acceptance Gate

Before claiming multi-device readiness, prove:

- the same account produces matching source data and derived analytics on phone and laptop;
- offline phone work survives restart and reconnects without missing or duplicate sets;
- a phone-started workout can transfer to laptop through explicit takeover and finish once;
- conflicting edits on two devices preserve both versions and visibly request review;
- future plan revision on laptop cannot rewrite a phone-completed earlier session;
- corrections, deletions, merges, preference changes, records, and XP replay consistently after sync;
- a new device can hydrate from cloud and then operate offline;
- revoked devices cannot regain access;
- separate accounts cannot read or mutate one another's data;
- both form factors pass touch, keyboard, screen-reader, large-text, slow-network, reconnect, and horizontal-containment tests.

### 68.10 Delivery Sequence

1. Define Supabase schema, Auth, Row Level Security, device registry, event IDs, cursors, and migrations.
2. Replace or wrap current browser persistence with a durable transactional local repository and outbox.
3. Add authenticated push, pull, idempotency, incremental cursors, status, and diagnostics.
4. Add initial cloud hydration, device registration, and revocation.
5. Add active-session leases, explicit handoff, and offline branch reconciliation.
6. Add conflict review for sets, plans, merges, preferences, and settings.
7. Recompute analytics and records from reconciled source events and prove phone-laptop parity.
8. Pass security, recovery, performance, accessibility, and the complete multi-device gate before enabling the capability for routine private use.

### 68.11 Deferred Decisions

- exact durable browser database and migration library;
- authentication method and recovery UX;
- sync debounce, batch size, and retry backoff;
- active-session lease duration and takeover grace period;
- which low-risk preferences may resolve automatically;
- cloud retention, backup point, recovery time, and geographic requirements;
- native mobile trigger and distribution path.

## 69. Technique-Video Exclusion and Product Focus

### 69.1 Status and Authority

This chapter specifies R-320 and supersedes any older implication that athlete-facing technique videos, exercise demonstrations, video uploads, or automated form-video analysis might become a later product feature. Private alpha 0.31.0 contains no such feature, so no code or stored athlete media requires removal.

### 69.2 Product Boundary

Do not build, license, host, embed, recommend, prioritize, or market:

- an exercise-technique video library;
- form-demonstration clips inside Exercise Detail or Workout;
- creator or vendor video feeds;
- athlete technique-video uploads;
- automated form-video review, scoring, or coaching;
- video playlists, watch progress, completion, or engagement systems.

This is an intentional differentiator. Product effort belongs in individualized programming, fast logging, exact exercise history, progression, readiness, schedule adaptation, substitutions, preference learning, volume and muscle analytics, records, and explainable decisions.

### 69.3 Allowed Concise Guidance

The exclusion does not remove the minimum language required to operate the training system. Exercise Detail may contain:

- short setup notes and variation-defining modifiers;
- equipment and range-of-motion definitions needed to preserve canonical identity;
- athlete-authored cues and notes;
- concise RIR, RPE, pain, soreness, readiness, and survey anchors;
- brief safety or active-restriction messages;
- programming purpose and substitution tradeoffs.

Guidance is optional, compact, text-first, and never creates a content-consumption task. It cannot delay workout start, set logging, substitution, or completion.

### 69.4 Research Boundary

Internal research videos remain valid methodology sources. Codex may continue analyzing official RP, Dave Tate, John Meadows, Chad Wesley Smith, scientific, product, and other relevant video material to improve the documented knowledge base. Transcripts, source metadata, and research conclusions remain in the research system, not an athlete-facing video feed.

### 69.5 Data and Architecture Consequences

The athlete data model requires no technique-media storage, video transcoding, content delivery network, upload permission, moderation pipeline, form-video embeddings, computer-vision service, watch-history table, or video recommendation engine. Do not create dormant schemas or placeholder navigation for these excluded features.

Structured technique quality remains an athlete-entered field attached to completed sets or sessions. It can affect comparability and progression only through the existing deterministic evidence rules and never claims computer-vision validation.

### 69.6 Acceptance Tests and Roadmap Guard

- Exercise Detail and Workout contain no technique-video player, thumbnail, watch prompt, or upload action.
- Core navigation contains no Videos, Learn, Watch, or technique-content tab.
- Empty states and onboarding do not solicit form-video uploads.
- Placement, progression, or records do not require video evidence.
- Technique quality can still be entered, skipped, corrected, and audited as structured athlete feedback.
- Internal research-video notes are not exposed as athlete instructional content.
- Product, analytics, and privacy schemas contain no unused technique-video infrastructure.
- Any future proposal to reverse this exclusion requires a new explicit decision from JB and a Build Bible version change.

## 70. Context-Grounded Product Craft and Training Field Guide

### 70.1 Status and Authority

This chapter specifies R-321 through R-324 and governs how durable knowledge about JB becomes product craft. It authorizes bounded implementation judgment inside the existing product thesis. It does not authorize new medical claims, hidden programming authority, copied intellectual property, external publication, or unrelated scope expansion.

Before substantive interface work, the implementation must load the relevant Obsidian project context, inspect the working product, and use the repository-local `PRODUCT.md`, `DESIGN.md`, and `DESIGN.json` registers. Direct current decisions from JB and training-safety requirements remain stronger than inferred preferences.

### 70.2 Product Personality Translation

JB is the first athlete, an experienced lifter, parent, UX practitioner, designer, and game developer. The interface should therefore:

- prioritize the next useful training action over onboarding or instructional theater;
- expose evidence, uncertainty, source identity, and rule boundaries for expert inspection;
- support interrupted schedules without shame, streak pressure, or false debt;
- keep phone interactions fast while allowing deeper laptop analysis;
- use clear, compact writing without unexplained jargon or generic hype;
- make quality, responsive containment, exact identity, and visual inspection part of delivery.

The durable personality is grounded, playful, and exacting. A feature that is playful but obscures training truth fails. A feature that is exact but feels like generic enterprise software is incomplete.

### 70.3 Original Handheld Craft Boundary

The favored reference period is the Game Boy Advance era of compact adventure games, especially the emotional feel of Ruby, Sapphire, Emerald, FireRed, and LeafGreen. The product may translate:

- framed field-guide panels;
- clear directional selectors;
- compact route and status language;
- tile-like environmental composition;
- crisp limited-palette pixel art;
- earned progression moments;
- immediate, soundless, tactile feedback.

The shipped product cannot copy game titles, creatures, likenesses, silhouettes, maps, badges, fonts, logos, sounds, evolution staging, menu composition, dialogue, or other protected expression. Inspiration is a craft constraint, not an asset source. Originality review is mandatory before any new sprite or sound ships.

### 70.4 Training Field Guide Contract

Today includes one compact `TrainingFieldGuide` inside the session world. It is a projection of the deterministic engine, not a new decision system. It shows:

1. the current plan route or an honest evidence-led fallback;
2. the next earned progression target from the load, repetitions, sets, hold, protect, or reacclimation decision;
3. the decision confidence and count of completed exact-movement source sets;
4. one action that opens the full existing route explanation.

The guide cannot award experience, change a prescription, hide a pain gate, imply that low confidence is failure, borrow neighboring movement history, or display a progression unsupported by the engine. Missing exact history remains a low-confidence baseline. Numeric training data uses the modern interface typeface; compact route labels may use monospace.

### 70.5 UI Quality Gate

`npm run qc:ui` runs before lint, deterministic tests, and the production build. Its first version checks the shipped interface for copied game references, technique-video surfaces, gradient text, and thick decorative side stripes. It also requires visible keyboard-focus support, reduced-motion handling, a compact mobile breakpoint, and the three product-design registers.

This static check supplements rather than replaces browser and visual review. Every material UI feature still requires:

- desktop and 390 by 844 phone behavior;
- no horizontal overflow;
- keyboard and accessible naming review;
- zero browser errors;
- reduced-motion compatibility when motion is present;
- full-resolution visual inspection of the changed state;
- a regression journey covering the meaningful user action.

The gate must expand when a defect category repeats. It must not become a broad style enforcer that blocks necessary safety states or replaces human review.

### 70.6 Private Alpha 0.32.0 Acceptance Evidence

- Today shows Powerbuilding, the engine-derived next repetition target, high confidence, and twenty-eight exact source sets in the seeded Quick Start journey.
- `Open route notes` opens the existing explainable-session dialog and creates no parallel recommendation.
- The field guide is accessible by label, uses a 44-pixel action target, and remains contained on the 390 by 844 phone project.
- Post-onboarding focus moves into the main product instead of leaving the hidden skip link active.
- Six thick colored side-stripe callouts were converted to restrained full boundaries without changing their content or behavior.
- The automated UI boundary gate passes across sixty-two shipped interface files.
- The deterministic suite remains 189 tests across nineteen files.
- The new journey passes on desktop Chromium and the phone project, increasing full Playwright coverage to forty-six journeys.

## 71. Original Pocket-Console Sound System

### 71.1 Status and Intent

This chapter specifies R-325 through R-330. The goal is a small, delightful audio vocabulary that makes confirmed training actions feel tactile while preserving quiet, fast logging and independent product ownership. The emotional reference is a compact handheld adventure. The deliverable is not Pokémon audio and must not copy any existing creature cry, menu sound, melody, evolution sequence, victory jingle, recording, or downloadable fan asset.

Private alpha 0.33.0 uses `field-guide-synth-v1`, generated at runtime with the browser Web Audio API. No audio files, remote requests, third-party libraries, or licensed recordings are required. The pack is original source code and remains auditable alongside the interface.

### 71.2 Cue Contract

The first pack contains six semantic cues:

| Cue | Trigger | Interaction rule |
|---|---|---|
| Menu confirm | Sound preference changes from off to on | Preview acknowledgment only; never alters settings beyond the athlete's action |
| Workout start | The athlete commits to starting the selected session, or explicitly previews the pack | Plays after a user gesture and never delays readiness or navigation |
| Set complete | A work set changes from incomplete to complete | Does not play while editing, reloading, or changing a completed set back to incomplete |
| Achievement | A new earned provisional achievement appears | Requires in-workout achievements and a non-off celebration level; follows the set cue instead of colliding with it |
| Workout complete | The athlete finishes with feedback, without feedback, or with deferred feedback | Plays once for the chosen finish path and does not determine whether the session saves |
| Warning | The athlete marks a warm-up or first check as painful | Uses a low descending contour distinct from rewards; the visible pain response and safety copy remain authoritative |

All cues stay under 700 milliseconds, use a maximum programmed gain of 0.05, and pair with a visible state. Audio cannot add work, award a record, bypass a pain gate, infer survey evidence, or change progression.

### 71.3 Controls and Accessibility

- Sounds are off by default.
- You includes a labeled toggle and a preview action that can be used before opting in.
- Quiet mode has absolute presentation precedence and disables preview while active.
- Sound and quiet preferences persist through the existing local settings model and backup behavior.
- Unsupported Web Audio, a suspended context, playback failure, or device silence must fail quietly while the action completes normally.
- No instruction, warning, record, status, or button state is communicated by sound alone.
- Reduced motion and sound are independent controls. The athlete may want one, both, or neither.

### 71.4 Ownership and Asset Boundary

Do not search for, download, rip, transcode, trace, sample, recreate note-for-note, or bundle audio from a commercial game, show, soundtrack, soundboard, fan archive, or video. A file described as royalty-free still requires recorded provenance, license terms, author, acquisition date, allowed distribution, and originality review before entering the repository. The preferred first-party path is runtime synthesis or commissioned original audio with a complete source package.

The static protected-reference scan remains active across source code. Before any future audio file ships, add it to a reviewed provenance manifest and run both automated asset checks and a human similarity review. Public release additionally requires real phone-speaker, headphones, silent-mode, accessibility, and repeated-session fatigue testing.

### 71.5 Verification and Current Boundary

- Deterministic tests enumerate all six cues and enforce duration, frequency, and gain limits.
- Preference tests prove sound requires opt-in and quiet mode suppresses it.
- Browser coverage previews sound, enables it, enables quiet mode, proves preview is disabled, reloads, and proves both settings persist with zero page or console errors.
- The standard interface boundary gate passes across sixty-four shipped interface files.
- The production PWA build contains the synthesized engine as a small local chunk and makes no sound request to a network or asset host.
- Full verification for 0.33.0 is 191 deterministic tests across twenty files and forty-six desktop and phone Playwright journeys.

The first slice does not include ambient music, character cries, companion-specific motifs, volume sliders, per-cue switches, headphones detection, downloaded assets, cloud preference sync, or native haptic-audio coordination. Those features require evidence that they improve repeated real training rather than adding noise.

## 72. Hypertrophy Double Progression and Upper-Lower Templates

### 72.1 Source and Decision Boundary

This chapter specifies R-331 through R-340 from JB's `hypertrophy-app-requirements.md`. The document reinforces existing mesocycle editing, exact history, and exercise selection requirements, then adds an explicit five-to-ten-repetition double-progression option, per-exercise loading increments, upper-lower templates, and hypertrophy-oriented exercise traits.

The source does not replace ForgePath's broader programming model. A failure-based repetition target can be useful in a bounded hypertrophy context, but it is not automatically appropriate for protected strength anchors, power work, technical practice, return-to-training calibration, unstable schedules, active pain, or low-confidence readiness. ForgePath therefore models it as a selectable policy attached to an exercise or plan role.

### 72.2 Mesocycle Builder Contract

The future builder must support:

- an athlete-selected length expressed in calendar weeks;
- different available training opportunities for each week;
- standard four-opportunity upper-lower and minimalist three-opportunity upper-lower seeds;
- complete custom day structures;
- explicit exercise assignment, order, role, set prescription, repetition range, effort target, and increment for each day;
- a preview showing what will change before a version is applied;
- immutable completed and partial sessions;
- versioned replacement of future planned work only;
- criterion review that may extend, recover, complete, or pivot even when the original week count has elapsed.

The builder must keep calendar structure separate from completed exposure order. Missing a Wednesday and Friday does not grant those exposures, advance the double-progression clock, or create catch-up volume.

### 72.3 Double-Progression State Machine

Each configured exercise owns an exact-movement progression state:

1. The plan defines a lower repetition bound, upper repetition bound, effort target, qualified-set rule, and executable load increment.
2. Completed sets are evaluated only from that canonical exercise and the applicable plan version.
3. If the upper bound is reached with the configured effort evidence, usable technique, and acceptable pain, the next like exposure may add the configured load.
4. After load increases, repetitions may return toward the lower bound.
5. If the top qualification is not met, the next safe progression remains repetition-first inside this policy.
6. If readiness, recovery, continuity, time, or joint response is adverse, the engine may hold, trim, recalibrate, or leave the decision for confirmation instead of forcing progression.

The initial source example is five to ten repetitions with a failure target. Product implementation must store failure as explicit `0 RIR` or another deliberately defined effort state. Missing effort data is unknown. It cannot qualify a load increase.

### 72.4 Increment Resolution

The load increment resolution order is:

1. exact-exercise override;
2. active location and equipment-class increment;
3. conservative unit default.

The selected increment must be executable on the current equipment. A nominal 2.5-pound isolation increment is not executable when a machine stack moves only ten pounds. The interface must show the resolved increment, its source, and any rounding. Cross-unit conversion, assistance direction, bodyweight contribution, unilateral conventions, plate inventory, and machine-stack physics require their own explicit implementations.

### 72.5 Template Contract

The standard template seeds two upper and two lower opportunities. The minimalist template seeds two upper and one lower opportunity. Neither template promises optimal frequency or volume. Both must be editable and must pass through the same equipment, time, joint, preference, protected-anchor, priority-region, and maintenance-dose checks as a custom plan.

Templates may propose primary, secondary, priority, maintenance, and optional roles. They must not silently replace a protected exact strength anchor. Every selected movement retains its own history and progression clock.

### 72.6 Exercise Selection Traits

Structured hypertrophy traits should include:

| Trait | Product use | Boundary |
|---|---|---|
| Lengthened challenge | Discovery and goal-fit ranking | Not a universal superiority claim |
| Shortened-position contraction | Variety and target-feel context | Not a proxy for stimulus magnitude |
| Stability demand | Fatigue and target-focus tradeoff | Low stabilization is not always better |
| Target-muscle tension | Explainable ranking | Starts as a reviewed product heuristic |
| Joint response | Athlete-specific gate and ranking | Pain is not diagnosed |
| Equipment fit | Hard executability gate | Missing equipment cannot be ignored |
| Preference | Athlete-authored tie-break or exclusion | Separate from joint safety and familiarity |
| Exact history | Prescription and familiarity evidence | No family load borrowing |

Machine exercises can rank highly when they offer useful stability, target focus, and executable progression for the current goal. Free weights remain appropriate when specificity, skill, power, protected strength practice, equipment, or athlete preference makes them the better fit.

### 72.7 Acceptance Gate

Before R-331 through R-340 advance to implemented status, verification must cover custom week lengths, week-to-week day changes, missed opportunities, exact history isolation, top-of-range qualification, unknown effort, technique and pain gates, exercise-specific increment precedence, equipment rounding, both upper-lower templates, custom edits, backup and restore, and desktop and phone plan review.

Private alpha 0.34.0 does not implement this state machine or template editor. Existing exact history, mesocycle revision, schedule adaptation, equipment increments, and exercise catalog behavior remain valid first slices.

## 73. Cross-Device UX Audit and Task-Focus System

### 73.1 Audit Scope

This chapter specifies R-341 through R-346 and records the mobile and desktop audit completed after the 0.33.0 sound release. The review covered onboarding, Today, Plan, Progress, Library, You, and the active workout at desktop and 390 by 844 phone dimensions. It combined heuristic review, cognitive-load review, responsive visual inspection, accessibility scanning, browser journeys, console review, performance-oriented static inspection, and production verification.

### 73.2 Navigation and Context

Primary-navigation changes must reset the document and main region to the top after the destination renders, then focus the main region without producing a visible focus ring for pointer users. This establishes a predictable page transition for keyboard, screen-reader, and touch users. Lazy-loaded screens must finish rendering before browser assertions inspect their scroll state.

### 73.3 Transient Notice Contract

Notices are status feedback, not storage. They must:

- use a polite atomic live region;
- remain manually dismissible;
- clear automatically after ten seconds;
- sit at the top of compact mobile screens so the bottom navigation and workout action remain unobstructed;
- preserve the real state elsewhere in the interface or data model;
- never contain the only copy of a safety decision, saved record, or recovery action.

### 73.4 Today Task Focus

The compact Today viewport must expose the date, next-useful-win framing, local-save state, session identity, exact primary anchor, immediate progression decision, and primary start action. The hero uses a concise engine-derived objective. Full route strategy and supporting evidence remain in `Why this session?` and the Training Field Guide instead of repeating in the hero.

### 73.5 Library Information Architecture

Library's first task is finding or managing a movement. On compact screens:

- the descriptive header copy is removed after the clear page title;
- import, quality, and add actions share a compact action row;
- category cards become a horizontal, touch-scrollable strip;
- search, filters, result count, body-part filters, and equipment availability appear inside the first working viewport;
- the advanced placement-history panel follows the movement browser rather than blocking discovery.

Desktop retains the broader category grid and descriptive context because its viewport can support them without delaying the browser.

### 73.6 Active Workout Hierarchy

On phones, readiness and equipment chips remain visible while the repeated full objective is removed. If a placement warm-up response is active, it is the immediate task and every response has a 44-pixel target. The workout footer discloses completed sets. Finish remains available for control and safety, but uses secondary styling until all planned sets are complete. Completion never becomes impossible because work was partial.

The progress indicator animates with a compositor-friendly horizontal transform rather than layout-changing width transitions. Reduced-motion behavior remains authoritative.

### 73.7 Onboarding Semantics

The onboarding form is the page's `main` landmark and owns the `main-content` skip-link target. Its four visual bars expose progressbar semantics, minimum, maximum, current value, and a readable `Step n of 4` value. Decorative bars remain hidden from assistive technology.

### 73.8 Verification Boundary

Private alpha 0.34.0 preserves all training calculations, backup schema 24, and local persistence 22. Verification adds two cross-device browser journeys for task visibility, destination scroll reset, Library search visibility, workout finish hierarchy, console integrity, and horizontal containment. Full audit evidence lives in [[UX Audit 2026-08-10]].

## 74. Functional UX Integrity and Cross-Device Workflow Contract

### 74.1 No Simulated Success

Every visible control must connect to a real state transition, navigation outcome, decision surface, file action, or explicitly disabled state. A toast or notice may confirm a completed action, but it cannot substitute for that action. Static handler inventory is a release gate, and browser tests must verify the downstream result rather than only the appearance of confirmation copy.

### 74.2 Canonical Library Browse Contract

Library category cards are entry points into one canonical catalog, not decorative navigation. Body part and goal or weak point expose region facets; movement type exposes mechanical-pattern facets; training role exposes role tags; equipment activates the current-location availability view; and My movements activates exact preferred state. Entering a category clears stale browse facets before revealing the relevant filter controls. Search, facets, and favorites may then compose deliberately.

Filters expose pressed state, result count, expandable-region semantics, and one clear-all action. They never create a new exercise identity, rewrite history, or treat a related variation as the same movement.

### 74.3 Active Workout Presentation State

An active session and the currently visible screen are separate concepts. Leaving a workout hides the workout surface and returns to Today while retaining `activeSessionId`, current set completion, prescriptions, and verification evidence. Today shows one unambiguous resume action. Resume reopens the same session and must not call start logic, reset `startedAt`, recompress by a new time budget, round loads again, or create another verification event.

Finishing remains the only action that converts completed working sets into immutable history and clears the active session.

### 74.4 Real Priority Mutation

A Plan pin may reorder only unresolved `planned` or `deferred` sessions. It cannot mutate an active, completed, partial, stopped, or expired session. The selected session becomes first among unresolved opportunities while every historical object retains its original training truth. Today still gives an already active workout precedence until that workout is finished.

### 74.5 Touch-Safe Reasoning

No core explanation may depend on hover. The in-workout information action opens a native dialog that names the exact movement and discloses decision title, progression action, evidence confidence, engine explanation, and authority limits. The dialog is read-only and may not mutate work, authorize a PR chase, borrow family history, or override readiness and pain gates.

### 74.6 Responsive Acceptance Matrix

Every primary destination must be reviewed at 320 by 568, phone portrait near 390 by 844, tablet portrait near 768 by 1024, phone landscape near 844 by 390, and desktop near 1440 by 900. Page-level horizontal overflow is a release blocker.

Phone and tablet controls target 44 by 44 pixels. The 320-pixel seven-column calendar is a documented compact exception: date cells may remain 33 by 54 pixels with spacing because they exceed WCAG 2.2 AA's 24-pixel minimum and avoid a horizontally scrolling month.

### 74.7 Release Integrity

The package version, visible interface version, diagnostic rules label, backup export application version, repository README, implementation status, and audit record must agree. Release verification includes:

- static UI boundaries and a handlerless-control scan;
- deterministic unit and domain tests;
- desktop and mobile browser journeys that inspect stored downstream state;
- keyboard dialog dismissal and browser console review;
- 320-pixel, tablet, landscape, and desktop containment sweeps;
- production Lighthouse performance, accessibility, and best-practice scores;
- production PWA build, lint, dependency audit, and secret scan.

Private alpha 0.35.0 preserves backup schema 24 and local persistence 22. `workoutVisible` is a backward-compatible presentation flag. An older stored state with no flag opens an active workout as before.

## 75. Automatic GitHub Pages Hosting and Public Preview Contract

### 75.1 Main Is the Deployment Source

Every push to public source repository `main` must trigger the Pages workflow. A separate public artifact repository receives only the generated `dist` output plus the exact source commit identity so the established project URL and quality-gated release path remain stable. Manual artifact copying is not the normal release path. The workflow deploys only the exact checked-out commit and exposes both source and public artifact commits through GitHub history.

### 75.2 Quality Gates Before Publication

Pages publication is downstream of the normal deterministic UI boundary scan, lint, domain tests, production build, the full desktop and phone Playwright suite, and a dedicated Pages artifact check. A failing gate blocks deployment. The deployment job cannot run if the verification and build job fails.

### 75.3 Project-Subpath PWA Integrity

The hosted path is `/adaptive-strength-hypertrophy-app-pages/`, not the domain root. The Pages build must prefix compiled assets, favicon, web manifest, manifest launch URL, manifest scope, and service-worker navigation behavior for that path. A release check inspects the generated artifact and rejects root-only URLs that would work locally but fail on Pages.

### 75.4 Public Preview and Local Data Boundary

The source GitHub repository, artifact repository, and Pages preview are public. The source repository exposes tracked source, tests, and project-document snapshots; the artifact repository contains no editable source, project documentation, tests, or vault material. New athletes receive an empty training state, neutral movement preferences, and onboarding before any plan or workout is created. No demo athlete, completed sample set, personal preference, JB-named seed, credential, API key, private health record, or personal workout export may be compiled into the public artifact.

Pages hosting does not provide authentication, a shared database, cloud backup, phone-to-laptop synchronization, active-workout handoff, or access control. Workout state remains unencrypted browser-local storage. The interface and documentation must state this honestly, and users should not enter sensitive information on a shared device.

### 75.5 Live Release Verification

A successful workflow is necessary but not sufficient. Each substantive release must verify the final public URL without relying on an authenticated GitHub session. Verification covers HTTP availability, compiled asset loading, service-worker and manifest paths, browser console integrity, onboarding visibility, and representative mobile and desktop interaction. The release record stores the final commit, workflow run, URL, and verified boundary.

## 76. Cross-Device Typography and Vertical Rhythm Contract

### 76.1 Shared Rhythm Scale

The interface uses a four-pixel-derived spacing scale of 4, 8, 12, 16, 24, 32, and 48 pixels. Typography spacing should use these values or deliberate intermediate display-title values instead of accumulating unrelated one-off gaps. Every heading and paragraph begins without a browser-default top margin so component layouts own the vertical rhythm predictably.

### 76.2 Text Hierarchy Contracts

Display headings use readable multiline line heights, with level-one headings at least 1.04 times the font size and level-two headings at least 1.10 times the font size. Level-three headings must remain at least 1.20 times the font size. Eyebrows retain at least ten pixels before the title they introduce. A heading followed by explanatory copy retains at least eight pixels of visible separation, and standard body copy uses a relaxed reading line height near 1.6.

### 76.3 Screen and Component Application

The shared rhythm applies to onboarding, all primary destination headers, hero modules, panel headers, queue and workout cards, Library cards, Progress analytics, You diagnostics, and native dialogs. Compact components may remain dense, but they cannot collapse title-to-copy separation below eight pixels or allow heading line boxes to touch. Broad paragraph rules must exclude eyebrow labels so label-to-title spacing is not accidentally removed.

### 76.4 Responsive Acceptance

The phone layout may reduce screen-level and section-level whitespace while preserving the text hierarchy contracts. Multiline titles must remain visually distinct from supporting copy at 320-pixel and 390-pixel phone widths. Desktop retains its information density with clearer section grouping. Spacing changes cannot push the primary Today action below the first 390 by 844 viewport, create horizontal overflow, or obscure fixed navigation.

### 76.5 Automated and Visual Gate

Desktop and phone browser tests measure visible level-one through level-three heading line heights, eyebrow-to-heading gaps, and heading-to-supporting-copy gaps across Today, Plan, Progress, Library, and You, plus the pre-session dialog. The release also requires visual review of onboarding and representative screens on phone and desktop because automated measurements do not fully evaluate perceived grouping, scanability, or balance.

## 77. External Visual Authoring and Loading Motion Contract

### 77.1 Approved Authoring Tools

Higgsfield is an approved external authoring tool for original ForgePath loading moments, transitions, environment loops, celebration plates, and related visual polish when its connector or another authorized workflow is available. GPT Images and other approved tools remain valid when better suited to a still, sprite, texture, background, or controlled sequence. The tool is chosen for the creative task, but every result must meet the same product, originality, accessibility, performance, and quality gates.

The first preferred concept families are a plate stack that fills one plate at a time, a field-guide route stamp that confirms a saved decision, and a quiet gym environment whose lights or equipment activate while a real operation completes. These concepts must be authored as original ForgePath expression and cannot reproduce protected characters, silhouettes, fonts, sounds, interfaces, maps, or animation sequences.

### 77.2 Exported Asset and Provenance Boundary

Generation is a production step, not a runtime app service. An accepted visual must be exported, optimized, reviewed, and stored as a versioned local asset. Its record includes the source tool, generation date, prompt or creative brief, license or usage basis, edit history, approval state, dimensions, duration, format, and compressed size. Provider credentials, prompts containing private athlete data, and live generation requests cannot enter the browser bundle.

ForgePath remains usable when Higgsfield, GPT Images, or any other creative service is unavailable. No loading, workout, progress, survey, or save flow may depend on a provider connection.

### 77.3 Honest Loading Semantics

Do not show a loading animation for an operation that resolves immediately. A real wait shows plain written status first, then may add a visual when motion improves reassurance, continuity, or delight. The app must never add or extend a delay so an animation can finish. The visual exits or yields as soon as the operation completes, fails, or is canceled.

Loading visuals do not authorize progress, imply a successful save before confirmation, or replace error and recovery language. Training numbers, pain and readiness state, save state, and the primary action remain readable throughout.

### 77.4 Performance and Format

Prefer lightweight WebM, AVIF, WebP, PNG sequences, SVG, CSS, or canvas according to the visual. Avoid GIF when a smaller accessible format is available. Decorative media is lazy-loaded, cannot block the first useful action or largest contentful paint, and should remain under 350 KB compressed per mobile loading asset unless device testing and measured value justify a documented exception.

Every asset must crop safely across supported phone and desktop viewports, decode without errors, avoid layout shift, and have a no-media failure path. Repeated loops cannot create distracting flashes, heat, excessive battery use, or persistent GPU work after the state ends.

### 77.5 Accessibility and Interruption Budget

Every animated state includes understandable written status and a static fallback under `prefers-reduced-motion`. Meaning cannot depend on motion, color, or sound. Focus order, keyboard use, screen-reader announcements, and touch targets remain unchanged by decorative media.

Active work sets remain the lowest-decoration mode. Loading motion cannot cover prescriptions, rest controls, set logging, pain input, or the finish path. Quiet mode may suppress celebratory motion, and reduced-motion preference always overrides decorative animation.

### 77.6 Production Acceptance Gate

Before any generated animation ships, verify provenance, originality, exact dimensions, duration, looping seam, alpha or background behavior, compressed size, decode, responsive crops, reduced-motion fallback, media failure, offline behavior, focus, console integrity, and mobile performance. Review the full sequence frame by frame for anatomy, visual artifacts, unintended text, brand drift, and protected-IP resemblance. A generated preview is not an approved app asset until this gate passes.

## 78. Private Cloud Foundation and Activation Contract

### 78.1 Dedicated Project Isolation

ForgePath uses its own Supabase project. It cannot share athlete tables, Auth users, server functions, logs, backup policy, or credentials with JB-OS, Roman TD, or another product. A free-plan project limit is an operational blocker, not permission to pause, delete, or repurpose an existing system. Development is the first remote environment; staging and production become separate projects before wider private or public release.

### 78.2 Local-First Bootstrap Boundary

Private alpha 0.38.0 keeps the existing validated version 24 backup as a temporary cloud bootstrap projection. The snapshot is not the final relational training model and cannot erase the append-only event that produced it. Workout execution and deterministic coaching continue locally without Supabase. A failed cloud request retains one retryable outbox record and never rolls back the local workout.

The subsequent backend slices replace snapshot-only mutation with transactional entity events and an IndexedDB operational repository. Completed sets, corrections, deletions, substitutions, surveys, plans, preferences, and catalog identity require their own stable events before automatic merge is enabled.

### 78.3 Invite-Only Auth and Browser Credential Contract

The public Pages artifact may request a magic link only for an email already invited to the private alpha. `shouldCreateUser` remains false in the browser flow, open signup is disabled remotely, and anonymous visitors receive no cloud data. The project URL and publishable key are browser-safe configuration. Database passwords, secret keys, service-role keys, provider credentials, and personal exports cannot enter Vite variables, source control, compiled Pages assets, logs, chat, or the Obsidian vault.

### 78.4 Database Security and Append-Only Ledger

The first migration creates private athlete profile, device, sync-event, current bootstrap snapshot, and conflict tables. Every exposed table enables and forces Row Level Security, revokes anonymous access, and uses `auth.uid() = user_id` ownership. The browser may manage its own profile and active device metadata and may read its own event, snapshot, and conflict evidence. It cannot directly insert, update, or delete the append-only ledger, bootstrap snapshot, or conflict record.

The authenticated save function serializes requests per athlete, requires an active registered device, validates versions, payload form, payload size, checksum, timestamp context, app version, and rule version, and records the exact proposed payload. Exact event replay with the same checksum is a no-op. Reusing an event ID for changed content is rejected.

### 78.5 Version Conflict and Restore Authority

A save advances only when its expected base equals the current server version. A stale base creates a conflict event with expected and actual versions and both checksums, then leaves the current snapshot unchanged. No last-write-wins path is permitted.

Checking the cloud copy validates its complete ForgePath backup shape, references, migration version, and integrity checksum. Review alone does not mark the local state as based on that server version. The athlete must explicitly restore. Restore accepts the reviewed server version, clears the stale local outbox, applies the validated state, and exposes the prior local state through the existing one-step undo path.

### 78.6 Honest Interface States

The You screen distinguishes a missing dedicated project, configured but signed-out project, checking session, signed-in account, cloud request, last confirmed server version, pending outbox, validated cloud copy, and conflict. It cannot label a device `Synced` solely from network reachability, a local write, or a successful read. Only an authenticated accepted save or explicit accepted restore updates the last-confirmed state.

The interface describes explicit save and reviewed restore as the first slice. It names automatic synchronization, entity merging, new-device hydration, device revocation, and active-workout handoff as unavailable until implemented and verified.

### 78.7 Activation and Acceptance

Remote activation follows the version-controlled migration, not manual Table Editor recreation. Before enabling cloud configuration in Pages, verify invite-only Auth, anonymous denial, two-account Row Level Security isolation, unknown and revoked device denial, idempotent replay, changed-content rejection, stale-version conflict preservation, reviewed restore, local undo, offline retry, secret absence, and responsive phone and laptop UI.

This gate supplements rather than replaces Chapter 68. Passing the first snapshot and Auth tests does not satisfy the full multi-device acceptance matrix.

### 78.8 Normalized Training Core

The second migration begins the relational system of record without turning automatic synchronization on. It adds an append-only entity-event ledger and current athlete-owned projections for exercises, workout sessions, workout movements, completed sets, exact-movement notes, survey instances, survey answers, and device pull cursors.

Every normalized table enables and forces Row Level Security. Authenticated clients may select only rows owned by `auth.uid()`. Anonymous access and direct authenticated inserts, updates, and deletes are revoked. A later transactional entity-event RPC must validate the event, expected entity version, device, payload, and checksum before atomically updating a projection and cursor. Until that RPC and the local IndexedDB outbox exist, the normalized tables are migration-ready storage, not an active synchronization path.

Completed sets retain entered load and unit, normalized kilograms, repetitions, exact exercise identity, movement family, exclusive primary region, non-additive involved regions, source device, source event, version, and completion time. `volume_load_kg` is a stored generated value equal to normalized load multiplied by repetitions. Security-invoker views produce source-set facts and daily, weekly, monthly, and yearly rollups for total training and exclusive primary-region scopes. Survey answers store `answered`, `skipped`, `not-sure`, `prefer-not`, and `not-answered` explicitly, and only an answered row may contain a value.

The dedicated remote project is `ForgePath`, project reference `kdavpkphvapnckenbuyg`, in AWS `us-east-2`. It belongs to a separate approved organization and is connected to the public source repository. Five committed migrations are checksum-locked and represented by the repaired remote migration ledger. A live catalog audit confirmed fifteen of fifteen tables with forced Row Level Security, two security-invoker volume views, zero anonymous grants, zero normalized browser mutation grants, four intentional profile/device mutation grants, and one authenticated-only snapshot RPC. A fully rolled-back two-identity transaction passed identity, device, RLS, apply, replay, conflict, invariant, and isolation assertions and left zero test rows. Public signup is disabled. Browser-safe project configuration is stored only as GitHub Actions secrets outside the public source tree, and Pages compiles those values only when the `FORGEPATH_CLOUD_RELEASE_ENABLED` repository variable is exactly `true`. The private cloud release is enabled, while real invited-athlete physical phone-to-laptop recovery remains an open acceptance gate. App version 0.65.0 and backup schema 28 preserve the cloud-authoritative snapshot boundary, include athlete-approved training-block choices, direct exact-movement history, and active equipment identity, add current system catalog and untouched equipment-template merging on restore, retain durable interrupted-save recovery, persistent renewable Auth, phone Chrome continuity, and a secure rate-aware installed Home Screen session handoff, and do not claim normalized entity merge or active-workout handoff.

## 79. Exact-Movement Workout Notes and Longitudinal Recall

### 79.1 Product Purpose

Every planned movement in a workout may hold one optional athlete-authored note for that exact workout exposure. The note captures details that structured set data cannot express cleanly, including bench angle, pin position, stance, grip, tempo, eccentric or concentric duration, setup, cue, joint sensation, technical error, successful adjustment, and the reason a performance changed. It is a durable training notebook, not a disposable session text box.

### 79.2 Exact Identity Contract

A note is identified by the session, planned exercise slot, and canonical exercise ID. It stores the session title and date, canonical exercise name, mesocycle ID, plan version, microcycle number, creation time, update time, rule version, and up to 1,000 characters of text. This identity prevents one note from being copied across every set or silently moving to a substituted exercise.

If the athlete writes a note and then substitutes the planned slot, the original movement keeps its note. The replacement may receive a separate note in the same planned slot. A confirmed duplicate-exercise merge maps the note to the retained canonical identity while preserving the original exercise ID and name. Undo restores the complete pre-merge note state.

### 79.3 Workout Capture and Prior Recall

Each movement card includes a clearly labeled text area after the movement decision context and before set logging. It autosaves locally as the athlete types, displays a character count, accepts line breaks, and remains optional. Emptying the field removes that exact note. The control must remain usable by touch, keyboard, and assistive technology on phone and desktop.

When a prior note exists for the same canonical movement, the most recent earlier note appears immediately above the editor with its date, session title, and microcycle number when known. The current workout note does not replace or masquerade as the prior note. Recall sorting uses the actual session start date when available and the planned date otherwise.

### 79.4 Exercise Library Notebook

Exercise Detail includes a movement notebook before numeric exposure history. It lists the newest notes first and displays date, session, microcycle context, original identity after a merge, and the athlete's complete note text. The first slice displays the sixteen most recent entries without deleting older stored notes. The summary also shows the total note count for that canonical movement.

The notebook is distinct from set history, prescription notes, post-session survey answers, and general session notes. It provides qualitative recall alongside exact load, repetition, RIR, volume, and record history without conflating those data types.

### 79.5 Coaching and Learning Boundary

Movement notes are athlete-authored context only in private alpha 0.39.0. They never automatically add load, repetitions, sets, exercises, volume, or readiness changes. The deterministic engine may show the note for recall, but no free text is interpreted as pain clearance, completion evidence, a verified PR, or authorization to progress.

A later explicitly designed learning layer may extract proposed tags or patterns, but it must cite the source note, state confidence and limitations, preserve the original text, and require athlete review before affecting programming. Secrets or unnecessary sensitive health information should not be entered.

### 79.6 Persistence, Backup, and Cloud Projection

Local persistence version 23 stores movement notes. Backup schema version 25 includes the full note collection, validates unique identity and all session, exercise, original-exercise, and mesocycle references, rejects invalid dates and oversized text, and migrates a valid version 24 backup with an empty note collection rather than inventing history.

The existing cloud bootstrap snapshot automatically includes notes because it projects the complete validated backup state. This does not claim entity-level note synchronization or cross-device handoff. Those capabilities remain subject to Chapters 68 and 78 and the remote Supabase acceptance gates.

### 79.7 Acceptance Gate

Release requires deterministic coverage for create, update, clear, exact-slot separation after substitution, newest-first recall, merge identity preservation, schema migration, backup round trip, and forged-reference rejection. Desktop and phone browser journeys must type a note in an active workout, leave without finishing, open the exact movement in Library, verify the note and stored identity, check horizontal containment, and report zero browser errors.

## 80. Supabase Reliability and Release Evidence Contract

### 80.1 Migration History Is Product State

The remote database objects and the Supabase migration ledger must agree. Applying SQL manually without recording its timestamp, name, and exact content is drift even when every table appears correct, because later CLI comparison depends on `supabase_migrations.schema_migrations`. Every reviewed migration has a committed SHA-256 digest. Remote repair must use the exact committed file and must be verified by digest, never reconstructed from memory or copied from an editor buffer.

### 80.2 Repeatable Live Acceptance

The repository owns two production checks. The read-only acceptance audit proves migration checksums, fifteen forced-RLS tables, absence of normalized browser mutations, the exact four ownership/device mutations, two security-invoker volume views, and authenticated-only snapshot execution. The transactional drill creates two reserved test identities, exercises the authenticated role, registers one owned device, proves projection writes fail, applies a snapshot, replays it idempotently, preserves a stale conflict, proves current-snapshot invariants, proves the second identity sees no first-identity cloud rows, and then rolls back. A separate query must confirm zero reserved test users and rows remain.

### 80.3 Browser Contract and Untrusted Responses

The browser accepts only a canonical HTTPS Supabase project origin and a browser-safe modern publishable key or legacy anonymous JWT. It rejects credentialed URLs, paths, queries, fragments, ports, non-project hosts, incomplete configuration, and arbitrary secret-shaped strings. A checked-in TypeScript database contract covers every table and function currently called by the browser.

Every pending snapshot envelope must contain valid event and device UUIDs, positive device sequence, nonnegative base version, valid queue time, and a backup that passes the complete schema and integrity validator. Invalid local outbox data is removed rather than sent. The RPC result is untrusted until status, safe integer version, and exact event identity match the queued request.

### 80.4 Retry, Conflict, and Restore Invariants

A network or server failure retains the exact event ID, device sequence, base version, payload, and checksum for retry. A confirmed exact replay clears the outbox and advances local confirmed metadata once. If state changed while an earlier event waited, the older event is delivered first and the current state is then queued against the acknowledged version. A conflict retains the local outbox and local base version. Only a successful accepted save or athlete-approved restore clears pending state.

### 80.5 Release Boundary

Public signup stays disabled. The public Pages artifact receives the project URL and publishable key only when `FORGEPATH_CLOUD_RELEASE_ENABLED` is exactly `true`. The switch cannot be enabled until an approved athlete accepts a real invitation, an uninvited address cannot create an account, phone and laptop complete explicit save/check/restore with integrity and undo, and offline retry recovers without data loss. This manual checkpoint path is not automatic synchronization, entity merge, new-device hydration, or active-workout handoff.

### 80.6 Algorithmic Data Coverage

The validated whole-state snapshot includes athlete and placement inputs, settings, equipment profiles, canonical exercises and preferences, sessions, completed source sets, movement notes, surveys and explicit missingness, deferred feedback, personal-record projections, corrections, cycle reviews, substitutions, placement verification and exits, missed-opportunity events, mesocycles, and active plan and session identities. This preserves the current deterministic algorithm inputs across a reviewed restore. Interface-only state such as whether the workout screen is visibly open is not part of the restorable contract and cannot be represented as active-workout handoff.

### Version 1.48.0 Change Entry

- Added R-377 through R-383 and Chapter 80 for migration-ledger integrity, repeatable live acceptance, typed browser contracts, outbox and response hardening, rolled-back isolation proof, and the remaining release gate.
- Repaired the remote Supabase migration ledger from exact committed migration files and verified both SHA-256 digests.
- Disabled public signup and verified persistence after reload.
- Passed six live read-only acceptance checks and nine fully rolled-back authenticated sync and isolation checks, then proved zero test rows remained.
- Advanced the working application to private alpha 0.39.1 while preserving backup schema 25, local persistence 23, explicit snapshot save, reviewed restore, and the honest boundary around automatic sync.

## 81. Clean Local Testing Reset Contract

### 81.1 Reset Scope

The athlete may explicitly clear all ForgePath training truth stored by the current browser. The operation removes completed sets, sessions, movement notes, surveys, deferred feedback, records, mesocycles, corrections, cycle reviews, substitutions, placement verification and exit events, missed-opportunity events, active identities, and recovery snapshots. It must not contact or mutate Supabase, another browser, another device, or an exported backup.

### 81.2 Foundation Retained

The reset retains the canonical exercise catalog, default equipment templates, application settings defaults, and the minimum neutral athlete shell needed to render onboarding. No completed set, PR, session, or prior plan may survive. Onboarding must create the first new mesocycle and sessions from the athlete's new answers rather than recover a demonstration plan.

### 81.3 Destructive Confirmation and Recovery Boundary

The interface must name the categories being deleted, state that the action is permanent for the current browser, recommend export before deletion, and require a distinct confirmation action. The prior local restore snapshot is also removed so Undo cannot silently resurrect bug-test data after the athlete chose a clean slate.

### 81.4 Acceptance Gate

An automated browser journey must begin with populated demonstration data, invoke the visible reset flow, return to onboarding, and verify zero sessions, sets, notes, surveys, feedback, records, plans, corrections, review events, substitutions, placement events, missed-opportunity events, active identities, and recovery snapshot. It must also prove that exercises and equipment templates remain available.

### Version 1.49.0 Change Entry

- Added R-384 and Chapter 81 for a true browser-local clean testing reset.
- Replaced the misleading demonstration-profile reset action with a destructive, fully enumerated clear-and-restart flow.
- Advanced the working application to private alpha 0.39.2 while preserving backup schema 25, local persistence 23, the closed cloud release gate, and the no-Supabase-mutation boundary.

## 82. Deep Exercise Catalog and Full-Library Substitution

### 82.1 Research Translation

Public RP Hypertrophy materials support an expanding equipment-aware library, athlete-controlled exercise choice, custom movements, and stimulus-to-fatigue judgment. Public Juggernaut material supports exercise selection by weak point, training phase, main-lift relationship, and recovery cost. ForgePath uses those principles as research inputs without copying either product's proprietary catalog, wording, videos, or private recommendation logic.

The product order is:

1. preserve the planned role, primary target, movement relationship, equipment eligibility, joint response, and exact history;
2. show six strongest educated matches with visible reasons and tradeoffs;
3. let the athlete open the full compatible catalog and search names, aliases, families, patterns, body regions, roles, and equipment;
4. require explicit protected-primary confirmation when specificity changes;
5. prescribe from the selected movement's exact history or use a conservative load-discovery baseline;
6. freeze the original movement's progression clock and never copy its load.

### 82.2 Catalog Boundary

Private alpha 0.40.0 ships 154 canonical built-in movements across squat, hinge, horizontal and vertical push, horizontal and vertical pull, isolation, and carry patterns. Coverage includes competition and close variations, weak-point and reduced-range work, specialty bars, accommodating resistance, leg press and other stable machine options, unilateral work, cables, dumbbells, bodyweight, calves, arms, and trunk.

The first required leg-press family contains `45-Degree Leg Press`, `Horizontal Leg Press`, and `Single-Leg Press`. `Leg Press` is an alias of the 45-degree canonical identity so ordinary search finds it without creating a second progression clock. The 45-degree version is a squat-pattern quadriceps movement with glute involvement and requires the `leg press machine` equipment identity.

Every built-in movement has an immutable ID, canonical name, aliases, family, broad pattern, primary and contributing regions, equipment requirements, concise purpose description, and role tags. Built-in muscle-dose attribution uses the protected catalog taxonomy when an older exact override is not present. This remains a programming heuristic, not a claim of measured activation.

### 82.3 Existing-Browser Migration

Local persistence version 24 merges missing system exercises and seeded equipment into an existing browser. The merge preserves athlete favorites, five-state joint response, personal aliases, retired or merged state, every custom movement, and every athlete-owned equipment profile. Seeded commercial, home, and travel profiles can gain new system equipment without replacing athlete increments or constraints. Backup schema remains version 25 because the exported state shape is unchanged.

### 82.4 Replacement Interaction

The replacement dialog opens on `Best matches`, capped at six for fast in-gym choice. `Browse full library` exposes every compatible, non-retired movement that satisfies the active location and current joint-avoid boundary. Search is immediate and semantic across catalog metadata. The athlete can return to the ranked set without losing the current reason or protected-primary confirmation state.

The full library is an athlete-authority path, not a way to bypass equipment or safety constraints. A search with no compatible result explains the active boundary. A selected substitute receives its own exact-history prescription or baseline calibration, appears in the substitution ledger, and never inherits the replaced movement's load.

### 82.5 Acceptance Gate

- The seeded catalog contains exactly 154 unique immutable IDs and unique canonical names with no exact cross-exercise alias collision.
- `Leg Press` finds the 45-degree, horizontal, and single-leg family in Exercise Library.
- A commercial-gym squat can be replaced by 45-degree leg press from full-library browse on desktop and 390 by 844 phone layouts.
- The protected-primary confirmation still blocks the first unconfirmed selection.
- The replacement begins with zero-load conservative calibration when no exact leg-press history exists.
- Existing athlete favorites, joint response, personal aliases, custom movements, and custom equipment profiles survive the local version 24 catalog migration.
- Every built-in movement receives deterministic muscle-dose metadata, and custom movements remain unmapped until athlete-reviewed.
- No horizontal overflow, console error, athlete-facing technique video, competitor asset, or copied competitor expression ships.

### Version 1.50.0 Change Entry

- Added R-385 through R-387 and Chapter 82 for a deep original exercise catalog and searchable full-library workout substitutions.
- Expanded the built-in catalog from 22 to 154 canonical movements, including three leg-press identities and broad strength, powerbuilding, hypertrophy, machine, unilateral, cable, bodyweight, arm, calf, and trunk coverage.
- Added local persistence version 24 catalog merging that preserves athlete preferences, aliases, custom movements, and custom equipment profiles.
- Added deterministic muscle-dose fallback, catalog uniqueness checks, leg-press substitution rules, and phone plus desktop full-library journeys.
- Advanced the working application to private alpha 0.40.0 while preserving backup schema 25, the closed cloud release gate, and exact-movement progression integrity.

## 83. Plain-Language Life-Aware Planning and Library Preferences

### 83.1 Athlete Language

Ordinary screens use starting-plan check, main-lift starting plan, training round, training block, and missed workout. Placement, movement lane, microcycle, mesocycle, and missed opportunity remain valid internal model names, but they cannot appear unexplained in athlete-facing decisions.

### 83.2 Volume-Debt Boundary

A missed or partial workout preserves only completed source sets. Unfinished planned sets earn no volume, records, progression, or experience and are never copied into later workouts as work the athlete owes. An unfinished priority can be rescheduled at a recoverable dose, which protects the training goal without repaying every missed set. The current training round may extend, hold, or recover. Repeated plan-to-actual differences may inform an athlete-approved future training-block version.

### 83.3 Library Interaction

Every movement is a visibly bounded card with a full-width, minimum 44-pixel details row and downward chevron. Every movement also exposes a written three-state programming preference: preferred, neutral, or avoid. The same state is visible and editable in the movement detail.

Preferred movements receive a deterministic ranking benefit. Avoided movements are excluded from newly selected secondary work, accessories, and substitution recommendations. Preference remains separate from joint response. Marking an existing protected main lift avoid records a conflict but does not silently remove it; the athlete must approve a training-block revision.

### Version 1.51.0 Change Entry

- Added the Life-Aware Plan contract and plain-language training-cycle terminology.
- Defined volume debt and prohibited automatic catch-up work.
- Reorganized Library cards with stronger boundaries and a touch-safe bottom details control.
- Added preferred, neutral, and avoid programming preferences with deterministic generation and substitution effects.
- Advanced the working application to private alpha 0.53.0 with 345 deterministic tests; browser journeys remain pending in the current restricted local environment.

## 84. Feedback-Gated Progression and Volume Contract

### 84.1 Evidence Unit

Movement progression evaluates the latest exact prescribed exposure as one unit. The unit cannot be completed with older sessions, athlete-added sets, drop-set reductions, or myo-rep mini-sets. The decision stores its source session, source set identities, comparable exposure count, excluded athlete-added sets, known RIR count, confirmed-quality count, feedback source, unknown inputs, confidence, reasons, and rule version.

### 84.2 Ordered Movement Decision

The order is pain, return or reacclimation, protected readiness, latest-target ownership, confirmed technique and effort, hard-session feedback, load, repetitions, recovered sets, then hold. Load is available at the top of the range when the smallest executable increment is no more than ten percent of the current target and effort is controlled. Repetitions advance below the top of the range. A set can be proposed only after repetitions are capped, the load jump is too large, three comparable prescribed exposures exist, continuity is stable, readiness is normal, effort is acceptable, stimulus is low, end fatigue is manageable, and between-session recovery finished early.

### 84.3 Ordered Muscle-Volume Decision

Pain, declining exact comparable performance under fatigue, poor between-session recovery, conflicting stimulus, and high fatigue are evaluated before provisional volume landmarks. A muscle below MEV receives no automatic increase unless exact comparable performance is preserved and recovery finished early. Athlete-added sets and reduced-load technique blocks count toward completed dose but are excluded from performance qualification. Deload and pain changes cannot increase sets, and an unperformed zero-set final round cannot create a deload.

### 84.4 Missingness and Setup Identity

Skipped or unanswered feedback is null evidence. It never becomes zero pain, poor technique, zero RIR, good recovery, or noncompliance. Muscle performance compares only shared canonical movement and setup keys. Incline angles remain separate keys. A change of movement or angle creates unknown comparable performance while retaining all completed dose.

### 84.5 Athlete Authority

Every progression, volume, recovery, deload, or next-round output is a proposal. The athlete approves future changes. A known pain threshold disables the continue-progress cycle choice. Hold and recovery remain available. Free-text notes never authorize change, and no output constitutes diagnosis or medical clearance.

### 84.6 Acceptance Gate

Release requires adversarial tests for incomplete latest sessions, missing RIR, skipped technique and pain, athlete-added-only work, excessive equipment increments, hard-session feedback, protected readiness, the recovered set fallback, exact exercise and angle isolation, conflicting stimulus, poor recovery and declining performance below MEV, monotonic pain and deload changes, and zero-set final rounds. Full, quick, minimal, deferred, skipped, phone, desktop, cloud-boundary, and live Pages paths must also pass.

## 85. Longitudinal Athlete Simulation and Cloud Lifecycle Contract

### 85.1 Purpose

ForgePath must prove that individually sensible rules remain sensible after months of accumulation. Release acceptance therefore includes a deterministic year-scale athlete replay using production domain functions, not a simplified test-only progression model. The replay preserves exact dates, sessions, completed sets, surveys, decision evidence, records, analytics, and serialized state.

### 85.2 Stable Athlete Path

The stable reference path begins with an owned baseline and runs 52 exact weekly exposures. It verifies the repetition-to-load cadence, executable increments, unchanged set count unless the recovered-set gate is independently satisfied, exact latest-exposure evidence, and append-only history. Athlete-added work is included periodically to prove it appears in completed dose while remaining excluded from automatic overload qualification.

### 85.3 Irregular-Life and Return Path

The disrupted path includes multiple missed family opportunities, an extended round, an expired maximum span, a recovery recommendation, and a three-week return gap. The acceptance result must preserve old records, remove no completed work, create no catch-up debt, and reduce only current targets through reacclimation. Stable progression may resume only after a new completed exposure confirms the smaller return prescription.

### 85.4 Recovery, Pain, and Setup Path

Unknown feedback holds volume rather than inventing recovery. Declining performance stacked with high fatigue or poor recovery reduces dose. Pain blocks overload and proposes a safer option without diagnosis. Different canonical exercises and recorded setups remain different performance lanes. A 45-degree incline exposure retains dose but cannot prove improvement over a 30-degree incline exposure.

### 85.5 Confidence Maturity

Confidence must be earnable through ordinary successful use. Four repeated explicit recovery answers can establish the recovery-response lane without requiring placement checks. Six resolved, time-stamped opportunities can establish schedule fit without requiring a missed workout. A missed-opportunity record remains useful constraint evidence. Surveys with no recovery answer and skipped questions remain unknown.

### 85.6 Analytics and Backup Conservation

The sum of every completed repetition multiplied by actual load must reconcile across daily, rolling, monthly, quarterly, yearly, and all-time projections. Record sources remain completed set identities. An identical replay produces an identical state and checksum. Checksum canonicalization follows transported JSON semantics, including omission of undefined object properties, so a newly exported file can always verify after serialization.

### 85.7 Production Supabase Acceptance

The rollback fixture represents 52 weeks, 156 sessions, and 624 completed sets in one whole-state snapshot. It must pass authenticated device registration, snapshot apply, idempotent replay, stale conflict preservation, normalized projection write denial, and second-athlete isolation. The final statement is `rollback`. A separate production query must return zero for the reserved test users, profiles, devices, events, conflicts, and snapshots before the release can be called clean.

### 85.8 Responsive Acceptance

Desktop and 390 by 844 phone journeys load a 52-week state, select All time, render yearly volume, expose exact movement history and all four confidence lanes, and preserve horizontal containment with no browser errors. The visual output must reconcile to the known fixture totals rather than merely display nonzero values.

### 85.9 Honest Boundary

This contract proves deterministic recommendation behavior, year-scale state, backup transport, whole-snapshot cloud persistence, Row Level Security, conflict preservation, and cleanup. It does not prove automatic entity merge, background synchronization, active-workout handoff, or real invited-athlete new-device recovery. Those require separate physical-device and account acceptance.

## 86. Persistent Release Notification and Safe Refresh Contract

### 86.1 Detection

Every open ForgePath page compares its exact compiled source identity with the uncached public `source-version.txt` marker. It checks on startup, once per minute while visible, and whenever the page regains focus, becomes visible, or reconnects. A missing, offline, malformed, or local-only marker never creates a false update state.

### 86.2 Athlete Notice

A confirmed source mismatch displays one persistent, responsive, screen-reader-announced `Update ready` notice across authentication, loading, onboarding, primary navigation, and active workouts. It clearly asks the athlete to refresh and provides one `Refresh now` action. It has no dismiss control, because every athlete must remain aware that the loaded build is no longer current.

### 86.3 Training Conservation

For an authenticated open journal, refresh first serializes any pending cloud save. A save failure stops navigation, leaves the notice visible, and explains that the latest change has not reached Supabase. The release prompt never silently discards an active workout or treats an unconfirmed save as complete.

### 86.4 PWA and Shared-Origin Isolation

The service worker uses prompt activation rather than silently replacing the page. Refresh unregisters only the worker controlling the current ForgePath scope, removes only ForgePath-named caches, and opens a cache-busted ForgePath URL. It must never unregister Roman TD or another GitHub Pages application's worker or remove another application's cache merely because both share one origin.

### 86.5 Acceptance

Deterministic tests cover exact marker comparison, worker update request, scope-limited repair, cache isolation, the persistent action, no-update silence, and save-failure retention. Desktop and 390 by 844 phone journeys prove the notice wording, refresh action, non-dismissibility, and horizontal containment. Pages verification proves the published marker matches the tested source.

## 87. Passwordless Entry and Durable Interrupted-Save Recovery

### 87.1 Authentication Boundary

An athlete enters an invited email and selects `Log in with email`. Public account creation remains disabled and the response does not reveal invitation membership. A new or signed-out browser must prove control of the address through Supabase's time-limited confirmation link. The renewable session then persists on that browser until explicit sign-out. Email knowledge alone never establishes an authenticated identity, and no approved address is hardcoded into the public client.

### 87.2 Local Staging Before Cloud Confirmation

Every state mutation in a cloud-authoritative build creates an integrity-protected whole-state pending snapshot before the 800-millisecond upload delay. The snapshot is account-scoped, device-identified, sequenced, based on the last confirmed server version, and stored durably enough to survive refresh, browser crash, or operating-system process kill. The normal Zustand training-state writer remains disabled in production.

### 87.3 Confirmation and Same-Device Ordering

A successful or idempotently replayed Supabase event advances the confirmed server version and removes only the exact acknowledged pending event. If a newer mutation replaced the outbox while the older request was in flight, the newer payload remains and is safely rebased onto the confirmed version. A failed request retains the exact event for retry.

### 87.4 Startup Recovery and Conflict Boundary

Authenticated startup compares the pending payload with the verified cloud snapshot. An identical payload accepts the cloud copy and clears the duplicate. A pending event whose base version still equals the cloud version is replayed before the app opens. A divergent pending payload and newer cloud version preserve both, block editing, explain the conflict, and offer a download of the local recovery copy. No last-write-wins path may erase training.

### 87.5 Truthful Status

Production surfaces use only `Saved to private cloud`, `Saving to private cloud`, `Cloud save needs attention`, or `Checking private cloud`. Local test mode remains explicitly labeled. `Saved on this device` may describe the local test build but may not appear as the production cloud result. A pending recovery copy is not a confirmed cloud save.

### 87.6 Honest Remaining Boundary

This chapter proves interrupted-save durability for the newest whole-state snapshot. It does not prove browser storage isolation from other applications on a shared GitHub Pages origin, complete offline startup, multi-day offline operation, normalized event merge, active-workout takeover, device revocation, or physical phone-to-laptop acceptance. A dedicated origin is required before any athlete outside the owner-controlled test group is invited.

### 87.7 Acceptance

Four hundred thirty-three deterministic tests cover invitation-only email entry, neutral account-membership responses, durable staging, idempotent retry, same-device ordering, startup replay, divergent-copy preservation, interface-only update suppression, and a 10,000-set recovery-size boundary. Eighty-six desktop and phone journeys remain green. Production status copy is truthful across normal navigation and an active workout.

## 88. Installed Home Screen Authentication Handoff

### 88.1 Platform Boundary

A newly installed iOS Home Screen web app is a separate storage context from the browser that installed it. ForgePath must not claim that Chrome, Safari, or another default-browser verification automatically copies its local Supabase session into the installed app. The manifest retains a stable application identity, scope, and start URL, but manifest identity alone does not transfer Auth storage.

### 88.2 Verified Session Bridge

When the installed app requests an email link, its redirect identifies the Home Screen setup flow. The athlete's default browser completes the normal invited-email verification. A recently verified browser session may then create one random twenty-character code drawn uniformly from a thirty-two-character alphabet. The code carries 100 bits of entropy, expires after five minutes, and replaces any prior active code for that user. If that browser already has a renewable ForgePath session, the installed app may open the transfer page there and create a code without sending another email.

### 88.3 Credential Safety

The browser hashes the code with SHA-256 before sending it to Supabase. Only the digest, user identity, creation time, expiry, and redemption time exist in the server-only table. Anonymous and authenticated browser roles have no table grants or policies. Access tokens and refresh tokens never enter the clipboard, redirect URL, database row, or GitHub Pages storage bridge.

### 88.4 Single-Use Redemption

The installed app hashes the entered code and calls the handoff function from the approved ForgePath origin. The function atomically marks an unexpired, unredeemed digest as used, resolves the owning invited Auth user with the service role, and creates a server-generated magic-link token hash. If token creation fails, the function conditionally releases only that still-current redemption claim while the code remains unexpired, allowing one safe retry. The installed app verifies the token hash through Supabase Auth and receives its own renewable local session. Reuse after successful token creation, expiry, malformed input, and unapproved origins fail closed. Structured failure codes let the client distinguish missing or stale browser proof, an invalid code, and a temporary token-generation failure without revealing invitation membership.

### 88.5 Email Delivery and Retry Control

ForgePath disables the send action for sixty seconds after a request and tells the athlete to use the newest email instead of generating replacements. Supabase email-send throttling and connection request throttling are separate states and never imply that the athlete account is locked. The built-in Supabase sender remains a narrow private-testing dependency with a low project-wide quota; custom SMTP and delivery monitoring remain required before wider athlete onboarding.

### 88.6 Acceptance

Release requires deterministic code generation, normalization, hashing, create, and redemption tests; browser coverage for both default-browser callback and standalone entry surfaces; a checksum-matched fifth migration; fifteen forced-RLS tables; no browser grants on the handoff table; the deployed function with legacy gateway JWT verification disabled in favor of its application-level checks; invalid-code and origin-denial probes; and a final exact-device walkthrough from email request through a refreshed installed app.

## 89. Phone Chrome Authentication and Release Continuity

### 89.1 Normal Browser Session

Phone Chrome is a complete ForgePath client, not an installation prerequisite or temporary callback surface. An invited-email link opened in the same normal Chrome profile establishes one renewable Supabase session in Chrome's durable browser storage. Refreshes, focus changes, reconnection, app-shell updates, and ForgePath-scoped service-worker cleanup must not clear that session. Incognito, cleared site data, explicit sign-out, and server revocation correctly require a new proof.

### 89.2 Email-Link Context

The login screen tells the athlete to open the newest email link in the same normal browser profile and to avoid Incognito or an email-app preview. An iPhone athlete who wants Chrome must make Chrome the default browser before requesting an installed-app setup link. A browser profile and an installed iOS Home Screen app remain separate storage contexts even when Chrome initiated the installation.

### 89.3 Mobile Form and Retry Behavior

Invited-email entry and Home Screen code redemption are semantic forms. The phone keyboard Go or Done action submits the visible step, and email, capitalization, correction, spelling, and one-time-code hints must match the field's purpose. The send action starts a ForgePath-scoped sixty-second cooldown before the network request and persists its expiry through refreshes and browser restarts so navigation cannot accidentally reopen the button early.

### 89.4 Viewport and Installation

The authentication surface uses dynamic viewport height, iPhone safe-area padding, stable manifest identity, standalone display metadata, and at least 44-pixel actions. Installed-app identity and update behavior must remain scoped to the ForgePath project path. These presentation rules do not alter Auth or cloud-data authority.

### 89.5 Engine Acceptance

Every release runs the complete browser suite in desktop Chromium, Android-style mobile Chromium, and an iPhone WebKit engine. Local development may remove only the production `upgrade-insecure-requests` directive required to prevent WebKit from upgrading loopback Vite modules to a nonexistent HTTPS server; the production Pages artifact retains the directive and is served only over HTTPS. Exact-device iPhone Chrome login, restart, update, and Home Screen transfer remain the final physical acceptance gate.

## 90. Training-Block Blueprint and Athlete-Approved Movement Contract

### 90.1 Whole-Block Preview

Before a training block is applied, the Plan screen shows the number of planned rounds, final review, weekly training days, approximate planned minutes, planned working sets, and every movement assigned to every day. Each movement exposes its written Primary, Secondary, Accessory, or Tertiary role, purpose, set and repetition target, optional incline setup, and whether it remains a ForgePath suggestion or an athlete choice. Estimates never enter completed dose or progression evidence.

### 90.2 Block-Level Choice

The athlete may replace a main lift, secondary builder, accessory, or tertiary movement once in the blueprint. Eligible choices respect the active equipment profile, avoid excluded movements, and prevent duplicates inside one session. A protected primary change updates the block anchor; a nonprimary change becomes an explicit athlete-authored movement override. Applying the draft creates a new immutable plan version and replaces only future planned work.

### 90.3 Stable and Adaptive Boundaries

Movement identity, role, priority purpose, and block-level incline angle remain stable in later training rounds until the athlete approves a new revision. The progression and life-aware engines may still propose load, repetitions, recoverable dose, scheduling, extension, or recovery from completed evidence. No adaptive rule may silently swap the athlete's chosen movement or count planned block totals as completed work.

### 90.4 Angle Identity

Incline-compatible movements accept an optional zero-to-ninety-degree back-pad angle. A block choice applies to all planned sets and remains editable per set during the workout. Clearing the value returns it to untracked rather than zero degrees. Progression and performance continue to compare only the same exact movement and recorded angle.

### 90.5 Completion and Reuse

Completing a block preserves its blueprint as the starting point for the next draft. Saved avoid preferences, exact completed-set pain, and exact technique feedback may label a movement Keep suggested, Review suggested, Change suggested, or Keep or change. These labels explain their evidence and never perform a replacement. The athlete decides whether to reuse or change each movement and supplies a reason before activating the next version.

### 90.6 Persistence and Acceptance

Backup schema 27 stores block movement overrides and optional incline choices inside the cloud-authoritative snapshot. Version 26 migrates without inventing choices. Validation rejects unknown exercises, duplicate override slots, invalid session or slot indices, protected-primary conflicts, invalid sources, and out-of-range angles. Acceptance requires deterministic generation and round-to-round replay, backup round trip and tamper tests, interactive component coverage, desktop and compact-phone visual inspection, top-reset dialog behavior, keyboard and screen-reader labels, zero console warnings, and zero horizontal overflow.

## 91. Direct Exact-Movement Historical Performance Entry

### 91.1 Entry Surface

Every active Exercise Library movement exposes one progressive-disclosure past-performance form inside its existing detail surface. The athlete chooses the exact movement first, then enters a past training date, set count, repetitions, weight, and pounds or kilograms. The interaction stays inside the movement detail and does not open a nested modal.

### 91.2 Effort, Setup, and Optional Context

Effort accepts RIR, RPE, or unknown. ForgePath preserves the athlete's raw scale and value, converts known RPE into the shared deterministic RIR scale, and labels the conversion before save. Incline-compatible movements accept a zero-to-ninety-degree back-pad angle. Technique from one to five and pain or irritation from zero to five are paired optional quality evidence; both remain unknown when either is omitted. Session name and a bounded setup note may preserve grip, equipment, tempo, or other useful context.

### 91.3 Truth and Programming Authority

Saving creates exact completed-set records for the selected movement and date. It does not create a planned workout, imply plan completion, infer readiness or recovery, or validate quality from numbers alone. Exact completed history becomes eligible for personal records, placement evidence, movement calibration, and future exact-movement load selection under the existing deterministic rules. Different incline angles remain separate comparison lanes.

### 91.4 Audit and Athlete Control

Each group receives a stable entry identity, source label, entry timestamp, raw units, raw effort scale, optional context, and contiguous set positions. The action creates a visible `history-entered` audit event and may be undone. Existing correction and deletion controls remain available per set. Correcting one set updates that set's current RIR provenance without requiring every set in the original group to remain numerically identical.

### 91.5 Persistence and Migration

Backup schema 28 validates direct-entry provenance, prevents a row from claiming both CSV import and Library entry sources, and carries the records through the existing cloud-authoritative whole-state snapshot. Version 27 migrates without inventing direct history. No new Supabase table, browser mutation grant, or Edge Function is required, and the same pending-save recovery boundary protects the snapshot during refresh or application updates.

### 91.6 Responsive Acceptance

The form previews the exact set count, load, repetitions, effort, and optional angle before save. Compact phones use a one-column form and full-width actions with native date and numeric inputs. Release acceptance covers deterministic validation and conversion, backup round trip and tamper rejection, correction compatibility, undo, exact programming evidence, desktop Chromium, mobile Chromium, iPhone WebKit, console integrity, persistence, and horizontal containment.

## 92. Freak Athlete Home Gym Programming

### 92.1 Equipment Profile

Home Gym is the default environment for a new athlete. The seeded profile explicitly contains the Freak Athlete Hyper Pro, ABX bench, and Leg Developer. It also contains the generic adjustable-bench, leg-extension-machine, and lying-leg-curl-machine capabilities used by deterministic availability checks, so equivalent equipment remains compatible and brand language never becomes a hidden eligibility lock.

### 92.2 Canonical Exercise Identity

The catalog includes an exact ABX Chest-Supported Dumbbell Row separate from the machine Chest-Supported Row and high-elbow Helms Row. Leg Extension, Single-Leg Extension, and Lying Leg Curl preserve their canonical histories while adding bounded Freak Athlete and Hyper Pro search aliases. Catalog migration adds new system identities and aliases without changing stable IDs, athlete preferences, custom movements, or completed sets.

### 92.3 Angle-Aware ABX Setups

Incline pressing and chest-supported adjustable-bench rows may record an optional back-pad angle per set. The known ABX positions are 0, 15, 22, 30, 37, 45, 52, 60, 67, 75, and 85 degrees. These are touch shortcuts only; any value from 0 to 90 remains valid. Progression, personal-record, and comparison logic uses only the exact movement and same recorded angle. Untracked and mixed-angle work remains completed dose but never becomes false single-angle evidence.

### 92.4 Programming Preference and Athlete Control

When the active Home Gym profile contains the corresponding Freak Athlete implement, ABX chest-supported rows rank higher for declared back work, and Leg Developer extensions and curls rank higher for declared quadriceps and hamstring work. This equipment preference applies only inside the athlete's selected priority or maintenance regions. Pain, avoid status, equipment eligibility, protected main lifts, and athlete-approved block changes remain stronger boundaries.

### 92.5 Persistence and Acceptance

Cloud and backup shape remain at schema 28 because the feature adds system catalog and equipment-template data without adding athlete-record fields. Cloud restore re-merges the current system catalog and untouched seed profiles before use while preserving the active location and athlete-owned profiles. Local persistence version 26 triggers the same merge for browser test state. Acceptance covers catalog identity uniqueness, profile upgrade behavior, home availability, deterministic programming preference, exact-angle separation, branded Library search, all ABX preset controls, desktop Chromium, mobile Chromium, iPhone WebKit, console integrity, and horizontal containment.

## 93. Generated Navigation and Movement Icon System

### 93.1 Destination Family

Today, Plan, Progress, Library, and You use five original emblems authored as one GPT Images atlas and exported as transparent local PNG assets. Their calendar, route map, rising plate stack, open movement guide, and athlete bust metaphors share the ForgePath evergreen, bone, lime, and effort-orange palette. Phone navigation uses a readable 26-pixel presentation, desktop uses 24 pixels, and no image receives a decorative drop shadow.

### 93.2 Movement-Family Art

The Exercise Library uses twenty matching generated emblems for press, hinge, squat, machine, row, pull, shoulder, arm, calf, trunk, carry, and general dumbbell families. A deterministic mapping chooses the asset. Each visible exercise name, saved setup, and catalog identity remains authoritative; the emblem provides orientation only and must not imply exact angle, grip, machine geometry, or safe technique.

### 93.3 Written Level Badge

The avatar badge spells out `Level` and the current journal number. It sits below the athlete inside the avatar footprint, remains horizontally contained at every supported size, uses no shadow, and does not obscure the face. The accessible avatar label continues to describe the journal form and Forge level in full.

### 93.4 Asset Lifecycle and Failure Boundary

The accepted source atlases, authoring tool, prompt direction, generation date, processing history, and truth boundary live beside the product specification. Cropped transparent runtime exports live under `public/icons/` and are precached by the existing PWA build. GPT Images is an authoring tool only: no key, SDK, or request ships to the browser. Missing art cannot remove a written destination label, exercise name, state, or control.

### 93.5 Acceptance

Release acceptance verifies all five destination asset paths, more than ten rendered movement-family images, empty decorative image alternatives inside labeled semantic wrappers, the exact written Level label, `box-shadow: none`, avatar containment, console integrity, and horizontal containment across desktop Chromium, mobile Chromium, and iPhone WebKit. Visual review checks the actual compact-phone navigation, Library cards, contact sheet, and athlete profile rather than relying only on file existence.

## 94. Anatomical and Movement Image Accuracy

### 94.1 Body-Region Identity

Library browse and filter controls use thirteen original body-region emblems. Chest, back, traps, shoulders, quadriceps, hamstrings, glutes, biceps, triceps, forearms, calves, trunk, and whole body use the front or rear view that makes the selected anatomy most legible. One effort-orange target is the visual authority, and the written region label remains the semantic authority.

### 94.2 Preference Symbol

The top-level `My preferences` card uses a standard blue thumbs-up inside a quiet rounded boundary. It is not reused as an exercise preference value by itself: preferred and avoid controls retain written labels and separate thumbs-up and thumbs-down states.

### 94.3 Movement-Specific Mapping

The image map distinguishes materially different postures and equipment. Push-up, parallel-bar dip, rear-delt fly, back extension, kettlebell swing, split squat, lunge, step-up, leg press, hack squat, hip abduction, hip adduction, Nordic curl, pull-up, pullover, upright row, face pull, shrug, sled work, seated calf raise, and tibialis raise no longer inherit misleading broad-family scenes. Specific movement words win before generic equipment or pattern words, including Smith-machine split squat and leg-press calf raise boundaries.

### 94.4 Asset Integrity and Runtime Boundary

The release contains five destination files, thirteen body-region files, forty movement files, six location files, four athlete-form files, and the ForgePath mark. Automated QC validates the required inventories, PNG signatures, dimensions, transparency-capable color type, SVG structure, and referenced paths before lint, deterministic tests, or compilation. GPT Images remains an authoring tool only, with source atlases and prompt direction retained beside the specification and no runtime provider dependency.

### 94.5 Rendered Acceptance

Browser acceptance opens onboarding and all five primary destinations, asserts every rendered image has completed with nonzero natural dimensions, verifies no page creates horizontal overflow, and checks the exact body-region and representative movement asset paths. The matrix covers desktop Chromium, mobile Chromium, and iPhone WebKit. Final visual review includes body-region, movement-supplement, category-card, filter-chip, exercise-grid, and location-art screenshots.

## 95. Separate Traps Library, Programming, and Dose

### 95.1 Taxonomy and Library Contract

`traps` is a first-class body region beside Back and Shoulders. Library Body part browsing exposes its own chip, written label, movement count, and rear-view emblem that highlights only the upper, middle, and lower trapezius. Back continues to represent lats and non-trapezius upper-back work. A movement may belong to both regions when its mechanics materially involve both.

### 95.2 Canonical Movement Base

The direct trap base includes Barbell Shrug, Dumbbell Shrug, Trap Bar Shrug, Cable Shrug, Machine Shrug, Chest-Supported Dumbbell Shrug, Cable Y-Raise, and Prone Trap Raise. Cable Upright Row, face pulls, Farmer Carry, and Yoke Walk remain primary work for their written regions but appear under Traps as secondary contributors. This gives home and commercial athletes direct upper-, middle-, and lower-trapezius options without pretending every row or deadlift is trap isolation.

### 95.3 Programming and Split Integration

Traps is selectable as a Plan priority or maintenance region. It belongs to upper and pull split emphasis, is accepted by schedule priority-dose validation, and can receive direct available accessory work during deterministic mesocycle generation. Existing athlete approval, exact exercise choice, equipment fit, pain, dislike, and protected-anchor boundaries remain unchanged.

### 95.4 Dose, Analytics, and Starting Landmarks

The individual-muscle layer adds `trapezius` as a dedicated upper-body lane. A direct trap movement credits one trap set-equivalent, secondary involvement credits one-half, and generic upper-back work remains separate. High-level volume still rolls Traps into Upper body. Starting weekly landmarks are MV 4, MEV 6, MAV 14, and MRV 20 before athlete volume-tolerance scaling; they are reference points only and cannot overrule recovery, pain, performance, or athlete approval.

### 95.5 Identity, Migration, and Acceptance

Barbell Shrug retains its stable ID, so completed sets, notes, preferences, aliases, and progression history do not split. System-catalog merge replaces protected taxonomy while preserving athlete-owned fields and appends the five new canonical movements. Local test persistence advances to 27 to run that merge for existing profiles. Backup schema stays 28 because the cloud-authoritative snapshot already carries the complete validated catalog and training state without a database-contract change.

Acceptance verifies 248 unique canonical movements, at least eight direct trap movements, thirteen body-region assets, transparent image integrity, dedicated trapezius credit, upper and pull split membership, priority programming under Home Gym equipment, preservation-safe catalog merge, rendered Traps browsing, zero console errors, and horizontal containment across desktop Chromium, mobile Chromium, and iPhone WebKit.

### Version 1.47.0 Change Entry

- Activated the dedicated ForgePath Supabase project in a separate approved organization without modifying JB-OS or Roman TD.
- Applied the five-table private cloud foundation and the nine-table normalized training-core migration transactionally.
- Added exercises, sessions, movements, completed sets, movement notes, survey missingness, entity events, device cursors, and security-invoker daily through yearly volume views.
- Verified fourteen of fourteen tables with forced Row Level Security, zero anonymous grants, zero normalized browser mutation grants, eighteen athlete ownership policies, two volume views, and one snapshot RPC.
- Connected browser-safe project values through private GitHub Actions secrets, placed their Pages compilation behind an explicit release switch, and configured the hosted Pages URL plus local development redirects.
- Kept the working app at 0.39.0 because automatic entity synchronization, IndexedDB, account invitation, live two-account isolation, and phone-laptop handoff remain incomplete.

### Version 1.46.0 Change Entry

- Added R-375 and R-376 and expanded the original companion from three forms to four permanent forms: Starting, Developed, Champion, and Apex.
- Translated the desired giant-form spectacle into an independently designed Apex ceremony and permanent companion identity without using protected names, anatomy, clouds, energy, battle mechanics, or transformation language.
- Required long-horizon breadth evidence plus athlete confirmation for Apex eligibility rather than one large lift, physique outcome, streak, or volume total.
- Required levels, cosmetics, environment development, journal emblems, and bounded milestones to continue after Apex without granting training authority or encouraging excess work.
- Kept the working application at private alpha 0.39.0 because the companion economy and character assets remain specified but unimplemented.

### Version 1.45.0 Change Entry

- Added R-368 through R-374 and the exact-movement workout note and longitudinal recall contract.
- Added autosaving, 1,000-character movement notes with prior-note recall inside every workout movement card.
- Added a newest-first Movement Notebook and total note count to exact Exercise Library detail.
- Preserved independent note identity through substitutions and preserved original exercise identity through merge and undo.
- Advanced backup schema from 24 to 25 and local persistence from 22 to 23 with a non-inventing version 24 migration.
- Advanced the working application to private alpha 0.39.0 with 201 deterministic tests and fifty-eight desktop and phone browser journeys.

### Version 1.44.0 Change Entry

- Added R-362 through R-367 and the private cloud foundation and activation contract.
- Added a dedicated-project isolation rule and preserved JB-OS and Roman TD unchanged when Supabase reported the free-project limit.
- Implemented the first invite-only Auth client, device registry, retry outbox, append-only sync ledger, bootstrap snapshot, conflict table, and idempotent authenticated save function.
- Added explicit cloud save, integrity-validated review, athlete-confirmed restore, and truthful pending and conflict states to the You screen.
- Added version-controlled migrations, Row Level Security checks, remote activation gates, GitHub Actions configuration hooks, and the backend runbook.
- Advanced the working application to private alpha 0.38.0 while preserving backup schema 24 and local persistence 22.

### Version 1.43.0 Change Entry

- Added R-361 and the external visual authoring and loading motion contract.
- Approved Higgsfield, GPT Images, and other suitable tools as production inputs while keeping the shipped app provider-independent.
- Defined plate-stack, route-stamp, and gym-environment loops as preferred first concept families.
- Required honest wait semantics, local exported assets, provenance, originality, reduced-motion fallback, responsive behavior, performance budgets, and frame-by-frame review.
- Kept the working application at private alpha 0.37.0 because no generated animation has shipped yet.

### Version 1.42.0 Change Entry

- Added R-360 and the cross-device typography and vertical rhythm contract.
- Added a shared four-pixel-derived spacing scale and standardized screen, hero, panel, card, and dialog text hierarchy.
- Increased multiline heading line heights and corrected component-level gaps that had collapsed below eight pixels.
- Added two browser journeys covering all primary destinations and the pre-session dialog on phone and desktop.
- Advanced visible and backup application metadata to private alpha 0.37.0 without changing backup schema 24 or local persistence 22.

### Version 1.41.0 Change Entry

- Added R-355 through R-359 and the automatic GitHub Pages hosting contract.
- Added a main-branch workflow gated by deterministic checks and all desktop and phone browser journeys, then restricted publication to a compiled public artifact repository through a repository-scoped deploy key.
- Added a project-subpath PWA build and generated-artifact verification.
- Replaced the JB-named fresh seed with a neutral Demo Athlete seed while preserving existing browser state.
- Advanced visible and backup application metadata to private alpha 0.36.0 without changing backup schema 24 or local persistence 22.

### Version 1.40.0 Change Entry

- Added R-347 through R-354 and the functional UX integrity contract.
- Replaced Library placeholder category behavior with real canonical filters and corrected preferred-movement browsing.
- Added touch-safe progression reasoning, active-workout leave and resume, and real unresolved-session priority mutation.
- Aligned backup export metadata and every visible release label at private alpha 0.35.0.
- Verified 191 deterministic tests across twenty files, fifty-two desktop and phone journeys, zero horizontal overflow at the acceptance matrix, production Lighthouse 100/100/100 desktop and 98/100/100 mobile, zero high dependency vulnerabilities, and zero secret findings.

### Version 1.39.0 Change Entry

- Added R-341 through R-346 and the cross-device task-focus contract.
- Corrected navigation scroll and focus, onboarding landmark semantics, compact transient notices, Today objective density, Library mobile discovery, and active-workout completion hierarchy.
- Replaced layout-changing workout progress width animation with a horizontal transform.
- Advanced the verified application to private alpha 0.34.0 with 191 deterministic tests across twenty files and forty-eight browser journeys.

### Version 1.38.0 Change Entry

- Added R-331 through R-340 from JB's hypertrophy requirements source.
- Defined selectable exact-movement double progression, verified top-of-range qualification, per-exercise increment precedence, editable upper-lower templates, and structured hypertrophy exercise traits.
- Preserved failure-based work as a bounded policy rather than a universal progression rule.
- Recorded existing exact history, mesocycle, schedule, and equipment behavior as partial foundations while leaving the new policy and templates honestly unimplemented.

### Version 1.37.0 Change Entry

- Added R-325 through R-330 and the original audio ownership boundary.
- Implemented `field-guide-synth-v1` with six short runtime-synthesized cues and no downloaded recordings.
- Added opt-in, preview, quiet-mode precedence, persisted controls, silent fallback, and meaningful training-event wiring.
- Added deterministic duration, frequency, gain, and preference tests and extended the existing desktop and phone controls journey.
- Advanced the verified application to private alpha 0.33.0 with 191 deterministic tests across twenty files and forty-six browser journeys.

### Version 1.36.0 Change Entry

- Added R-321 through R-324 and the durable context-to-product authority boundary.
- Added repository-local product and design registers with an explicit original handheld field-guide North Star.
- Implemented the evidence-backed Today Training Field Guide as a projection of existing route and progression rules.
- Added the standard UI boundary quality command and made it part of `npm run check`.
- Corrected post-onboarding focus handoff and replaced six generic thick side-stripe callouts.
- Increased desktop and phone Playwright journeys from forty-four to forty-six while retaining 189 deterministic tests.

### Version 1.35.0 Change Entry

- Added R-320 and made athlete-facing technique videos, demo feeds, uploads, and automated form-video analysis explicitly out of scope.
- Revised placement and fast-workout language so video evidence is not merely deferred.
- Preserved compact text-first cues, structured athlete feedback, and internal methodology video research.
- Removed the exercise-demonstration licensing decision and the need for athlete-media infrastructure.

### Version 1.34.0 Change Entry

- Added R-312 through R-319 and the build-ready phone, laptop, and cloud-sync specification.
- Made both phone and laptop first-class core product surfaces and selected the responsive PWA as the first real multi-device client.
- Defined local-first commits, authenticated cloud convergence, visible sync states, active-workout handoff, conflict preservation, new-device recovery, and account isolation.
- Added a strict multi-device acceptance gate and recorded that responsive local operation exists while actual synchronization remains unimplemented.

### Version 1.33.0 Change Entry

- Added R-304 through R-311 and the build-ready contextual exercise-preference specification.
- Defined favorite, prefer, neutral, dislike, and do-not-recommend as distinct exact-movement states.
- Separated preference from joints, pain, restrictions, equipment, identity, enjoyment, and inferred behavior.
- Added goal, sport, phase, role, location, event, and date-specific preference rules, including JB's sumo competition-preparation example.
- Defined deterministic recommendation authority, protected-primary conflict review, event replay, migration, merge behavior, and acceptance tests.
- Recorded the existing boolean favorite and joint-response behavior as a verified first slice while keeping the richer system honestly unimplemented.

### Version 1.32.0 Change Entry

- Added R-296 through R-303 and the build-ready original companion specification.
- Defined bounded completed-workout XP, anti-grind invariants, level replay, three-stage evolution eligibility, athlete confirmation, and post-workout presentation.
- Kept companion progression separate from training placement, readiness, programming, and safety authority.
- Added non-punitive continuity, accessibility, reduced-motion, skip, replay, and focused-training controls.
- Established a strict originality boundary that uses Pokémon references only as emotional shorthand and prohibits copied names, likenesses, mechanics, thresholds, and presentation.
- Feature remains specified and unimplemented after private alpha 0.31.0.
