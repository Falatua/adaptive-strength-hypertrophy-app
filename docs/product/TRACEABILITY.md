---
type: product-traceability-matrix
aliases: [App Build Bible Traceability, Requirement Coverage Matrix]
tags: [fitness, app, requirements, traceability, build, qa]
created: 2026-08-10
updated: 2026-08-10
status: canonical-build-reference
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: verified
---

# Build Bible Requirement Traceability Matrix

## Purpose

This matrix proves that every requirement in [[App Requirements Register]] is routed into the canonical [[Adaptive Strength and Hypertrophy App Build Bible]], a detailed source specification, a delivery phase, and a verification method. A range row includes every sequential ID from its first through last ID. No number inside a listed range is excluded.

## Coverage Summary

- Total requirement headings: 311.
- Sequential range: R-001 through R-311.
- Missing IDs: none after the 2026-08-10 verification.
- Duplicate IDs: none after the 2026-08-10 verification.
- Primary implementation authority: [[Adaptive Strength and Hypertrophy App Build Bible]].
- Requirement wording and provenance authority: [[App Requirements Register]].

## Current Implementation Evidence

Private alpha 0.31.0 is the current verified implementation boundary. Evidence is recorded in [[Private Alpha Implementation 2026-08-10]] and [[Adaptive Strength and Hypertrophy App Build Bible#65. Private Alpha 0.31.0 Relative Priority-Region Dose Tie-Break]]. Version 0.31.0 adds `schedule-priority-dose-v1` to `missed-opportunity-v5`. It compares completed source-set representation across athlete-declared priority regions inside an exact rolling 28-day window and may resolve only a choice tied on athlete pin, protected-primary eligibility, full executability, and exact-primary recency. It creates no target dose, neglect claim, completed credit, or catch-up volume. Backup schema version 24 and local persistence version 22 preserve region, candidate, selection, and source-set provenance while version 23 migration retains version 4 readiness decisions without inventing dose history. Verification includes 189 deterministic tests across nineteen files, forty-four Playwright journeys across desktop and phone, production PWA build, and full-resolution 390 by 844 visual review. All verified 0.30.0 and earlier evidence remains active. R-296 through R-303 and Chapter 66 specify the original evolving training companion, but this game layer is not implemented. R-304 through R-311 and Chapter 67 specify five-state and contextual exercise preferences. The existing boolean favorite, separate joint response, and favorite-aware substitution rank are the implemented first slice; dislikes, do-not-recommend suppression, context rules, preference events, and protected-primary conflict review remain unimplemented. Personal readiness baselines, fixed-event pressure, downstream-fatigue interaction, and complete later-session substitution remain incomplete.

## Product and Training Traceability

| Requirement IDs | Requirement domain | Build Bible chapters | Detailed source | First delivery | Primary verification |
|---|---|---|---|---|---|
| R-001 to R-002 | Hybrid foundation and lifelong personalization | 1, 2, 7, 22, 29 | [[Lifelong Athlete Model and Adaptive Questioning]], [[Multi-Methodology Training Intelligence Brain]] | 1B to 1C | Longitudinal athlete fixture and correction test |
| R-003 to R-004 | Daily, weekly, monthly, rolling, and contextual volume | 6.4, 6.5, 11, 20, 22 | [[Progression and Volume Model]] | 1A to 1C | Source-set reconciliation and aggregation property tests |
| R-005 to R-007 | Load, repetitions, sets, safety valves, and undulation | 2, 10, 12 | [[Progression and Volume Model]], [[Readiness Fatigue and Peaking Model]] | 1B | Progression decision-table and like-exposure tests |
| R-008 to R-009 | Recent continuity and irregular-schedule programming | 1, 4.5, 14 | [[Conditional Schedule Adaptation and Missed Workout Game Plan]] | 1B | Stable, interrupted, and returning scenario replays |
| R-010 to R-014 | Baby progress, micro wins, and quality validation | 2, 11, 17 | [[Micro Progress and Long-Term Wins]], [[PR Gamification and In-Workout Motivation System]] | 1B | Micro-win comparability and false-positive tests |
| R-015 to R-018 | Ten-question pre and post surveys and learning loop | 4.3, 12, 13 | [[Session Feedback and Learning Loop]] | 1B | Full, partial, skipped, deferred, and warm-up-confirmation journeys |
| R-019 to R-023 | Goal change, difficulty, joint response, questioning, explainability, and privacy | 4.7, 4.8, 7, 13, 22, 24 | [[Lifelong Athlete Model and Adaptive Questioning]], [[Session Feedback and Learning Loop]] | 1B to 1C | Versioned goal, insight correction, safety, and data-rights tests |
| R-024 | Obsidian continuity | 0, 33, 34 | [[App Build Reference Index]], [[Codex Vault Protocol]] | Ongoing | Same-turn vault and session-log audit |
| R-025 to R-029 | Tate, Meadows, Israetel, Smith, evidence, and exercise-selection synthesis | 23, 29 | [[Methodology Research Hub]], [[Methodology Synthesis and App Translation]] | 0 onward | Provenance audit and rule-translation review |
| R-030 to R-036 | Multi-format research, volume dose, readiness, fatigue, peak, and continuing literature | 11, 12, 23, 29, 64 | [[Deep Research Training Methodology and Readiness 2026-08-09]], [[Readiness Fatigue and Peaking Model]], [[Exercise Science Evidence Map]] | 0 onward | Claim-classification, fresh-readiness action, missingness, pain-gate, and contradiction regression cases |
| R-037 to R-042 | Navigation, dashboard horizons, graphs, muscle attention, movement frequency, enjoyment, and learning | 5, 6.1 to 6.5, 65 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]], [[Progression and Volume Model]] | 1A to 1C | Screen acceptance, chart provenance, source-backed relative priority-dose replay, and drilldown tests |
| R-043 to R-046 | Library feedback, primary and secondary builders, equipment, and time-aware programming | 6.6, 6.7, 9, 15, 16, 51 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]] | 1A to 1B | Builder relationship, exact equipment eligibility, location persistence, substitution, and time-fit tests |
| R-047 to R-051 | First-use taste picker, athlete model, transparent learning, time estimates, and short workouts | 4.1, 4.4, 6.8, 7, 22 | [[Onboarding Training Status and Entry Cycle Placement]], [[Lifelong Athlete Model and Adaptive Questioning]] | 1B to 1C | Placement review, correction, and 15 to 60-minute session tests |
| R-052 to R-060 | Exposure clocks, missed-workout check-in, replanning, no debt, independent lifts, partial sessions, and priority queue | 4.5, 8, 14, 61, 62, 63, 64, 65 | [[Conditional Schedule Adaptation and Missed Workout Game Plan]], [[Readiness Fatigue and Peaking Model]], [[Progression and Volume Model]], [[Private Alpha Implementation 2026-08-10]] | 1B | `schedule-adaptation-engine.test.ts`, backup tamper and migration tests, calendar replay tests, and full desktop-plus-phone missed-opportunity journey. Exact-primary recency, time fit, reason state, no debt, continuity, athlete pin, equipment eligibility, support removal, pain gate, fresh readiness actions, and rolling relative priority-region dose tie-breaking are active; fixed-event pressure and downstream fatigue remain deferred. |
| R-061 to R-073 | Sessions through long horizon, elastic cycles, fixed events, dual axes, and cycle history | 4.8, 8, 14, 60 | [[Hierarchical Training Cycle and Goal Architecture]] | 1C | Cycle state-machine, calendar-versus-exposure replay, criteria, extension, and fixed-date tests |
| R-074 to R-078 | Deterministic authority, personal statistics, optional LLM, provider neutrality, and API boundaries | 19, 22, 23 | [[AI Integration and Decision Engine Architecture]] | 1B to 2 | Dependency, gateway, and no-AI fallback tests |
| R-079 to R-083 | Server-side keys, runtime knowledge export, retrieval, structured output, and offline operation | 19, 23, 24 | [[AI Integration and Decision Engine Architecture]], [[Data Backend Storage and Learning Architecture]] | 2 | Secret scanning, schema rejection, citation, and provider-outage tests |
| R-084 to R-088 | AI privacy, cost, evaluation, authority limits, and required architecture chapter | 23, 24, 27 | [[AI Integration and Decision Engine Architecture]] | 2 | Adversarial evaluation and forbidden-action tests |
| R-089 to R-094 | Experience versus preparedness, per-movement placement, and entry routes | 4.1, 7, 8, 52, 54, 56, 57, 58, 59 | [[Onboarding Training Status and Entry Cycle Placement]], [[Private Alpha Implementation 2026-08-10]] | 1B | `placement-engine.test.ts` covers mixed exact-anchor lanes, accepted exact-history fields, unknowns, conservative control, replay, forgery rejection, and legacy validity. `route-session-engine.test.ts` proves the selected exact lane changes the actual prescription. `placement-exit-engine.test.ts` proves plan-route and exact-movement checkpoints cannot borrow evidence across their declared boundaries. Family transfer remains deferred. |
| R-095 to R-103 | Direct advanced entry, short bridge, productive verification, explanation, import, exits, and reclassification | 4.1, 7, 8, 26, 48, 52, 53, 54, 57, 58, 59 | [[Onboarding Training Status and Entry Cycle Placement]], [[Private Alpha Implementation 2026-08-10]] | 1B to 1C | Conservative override, exact-lane productive verification, exact-history acceptance, `placement-exit-v1` and `movement-placement-exit-v1` criteria, athlete-reviewed decisions, pain-boundary enforcement, reassessment entry, immutable plan supersession, queue-advancement visibility, backup replay, migration, and tamper tests. Coach, video, reliable-estimate, and family evidence remain deferred. Calibrated thresholds and silent automatic reclassification remain prohibited or deferred. |
| R-104 to R-110 | Competitor source classes, updates, patches, roadmaps, and community learning | 29 | [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]] | 0 onward | Dated source ledger and claim-confidence audit |
| R-111 to R-119 | Regression learning, continuity, calendar and exposure history, load increments, semantic exercise identity, external activity, feedback, and recalibration | 7, 10, 15, 19, 22, 27, 29, 51, 60 | [[Multi-Methodology Training Intelligence Brain]], [[Progression and Volume Model]], [[Conditional Schedule Adaptation and Missed Workout Game Plan]] | 0 to 1C | Calendar-versus-exposure replay, exact-identity isolation, fixed-event states, executable-increment rounding, history portability, and recalibration tests |
| R-120 to R-128 | Data portability, cross-cycle athlete model, knowledge graph, provenance, and methodology boundaries | 7, 20, 23, 29 | [[Multi-Methodology Training Intelligence Brain]] | 1C to 2 | Export and import round-trip plus provenance traversal |
| R-129 to R-134 | Local book corpus, doctrine profiles, source integrity, dynamic correspondence, multidimensional load, and working max | 9, 10, 11, 29 | [[Strength Training Book Corpus 2026-08-09]] | 0 to 1C | Source-gap audit, load-vector tests, and working-max cases |
| R-135 to R-144 | Performance conversion, personal transfer, variation maturity, contextual deloads, technical floors, force-time goals, and method eligibility | 9, 10, 12, 15, 22, 29 | [[Multi-Methodology Training Intelligence Brain]] | 1C | Transfer-hypothesis, technical-floor, and method-eligibility tests |
| R-145 to R-150 | Region volume, overlap-safe aggregation, drilldowns, deep catalog, identity, and exercise history | 6.5, 11, 15, 65 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]], [[Progression and Volume Model]] | 1A to 1C | Aggregation conservation, exact-history tests, and source-backed 28-day region-dose tie-break replay |
| R-151 to R-158 | Exact versus family history, duplicate detection, aliasing, distinction, reversible merges, custom parity, and data quality | 4.9, 6.7, 15, 20 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]] | 1A | Duplicate creation, merge, undo, and derived-value replay tests |
| R-159 to R-164 | Athlete-controlled swaps, reason capture, ranked tiers, purpose preservation, personalization, and tradeoffs | 4.6, 16 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]] | 1B | Candidate eligibility, ranking explanation, and override tests |
| R-165 to R-170 | Substitute prescription, clock integrity, session recalculation, learning, evidence thresholds, and primary protection | 4.6, 10, 16, 22, 59.12 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]] | 1B to 1C | Blind-load-transfer, primary-intent, and active exact-lane cancellation tests |
| R-171 to R-176 | Universal survey optionality, question skipping, immediate start, modes, missing semantics, and persistent safety | 4.2, 6.2, 13 | [[Session Feedback and Learning Loop]] | 1B | Survey-free end-to-end and active-restriction persistence tests |
| R-177 to R-181 | No penalties, deferred feedback, adaptive burden, missing-data confidence, and survey-free core | 13, 22, 23, 64 | [[Session Feedback and Learning Loop]], [[AI Integration and Decision Engine Architecture]], [[Readiness Fatigue and Peaking Model]] | 1B to 2 | Reminder, confidence, missing and stale readiness no-penalty, and AI-free functionality tests |
| R-182 to R-189 | Structured backend, Supabase, local offline store, sync, relational identity, event and derived state, provenance, and missingness | 19, 20, 21, 22 | [[Data Backend Storage and Learning Architecture]] | 0 to 1B | SQLite/Postgres parity, sync, event, and null-semantics tests |
| R-190 to R-198 | Auth, RLS, server secrets, aggregates, data quality, statistics, retrieval, backups, rights, and scale gates | 19, 22, 23, 24, 28 | [[Data Backend Storage and Learning Architecture]] | 0 to 2 | Multi-user RLS, restore, export, deletion, and load-gate tests |
| R-199 to R-205 | Gamification, PR types, schemes, scopes, opportunity prompts, live context, and celebrations | 6.2, 17 | [[PR Gamification and In-Workout Motivation System]] | 1B | Valid opportunity and non-blocking celebration tests |
| R-206 to R-212 | Comparability, engine authority, anti-junk-volume, exact versus family, provenance, dashboards, and recalculation | 10, 17, 20, 22 | [[PR Gamification and In-Workout Motivation System]] | 1B to 1C | False PR, correction, merge, and authority-boundary tests |
| R-213 to R-218 | Athlete controls, non-PR achievements, offline consistency, record definitions, notifications, and quality gates | 17, 18, 19, 27 | [[PR Gamification and In-Workout Motivation System]] | 1B | Quiet-mode, offline sync, and achievement-label tests |
| R-219 to R-226 | Friends, mutual graph, visibility, sanitized sharing, feed, PR events, comparisons, and scaled labels | 20, 24, 25 | [[Friends Social Progress and Challenge System]] | 4 | Social projection and authorization tests |
| R-227 to R-234 | Personal challenges, safe scheduling, PR proximity, reactions, notifications, anti-shame, block, and revocation | 25 | [[Friends Social Progress and Challenge System]] | 4 | Challenge-engine boundary, block, and revocation tests |
| R-235 to R-240 | Social provenance, correction, RLS, moderation, phased rollout, and no core dependency | 24, 25, 26 | [[Friends Social Progress and Challenge System]] | 4 | Correction propagation, abuse controls, and core-offline tests |
| R-241 to R-245 | Library discovery, hierarchies, role and weak-point views, shared taxonomy, and one canonical history | 6.6, 15 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]] | 1A | Category, search, and identity-continuity tests |
| R-246 to R-250 | Contextual recommendation groups, facets, sorting, custom classification, and empty states | 6.6, 15, 16 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]] | 1A to 1B | Filter, ranking, unknown, and empty-result tests |
| R-251 to R-256 | Original pixel direction, hybrid UI, avatar, characters, reactions, and taxonomy emblems | 18 | [[Pixel Training Adventure Visual and Interaction System]] | 0 to 1A | Four-screen prototype and originality review |
| R-257 to R-263 | Cycle maps, evolving environment, exercise history, workout delight, achievements, friends, and asset consistency | 18, 25 | [[Pixel Training Adventure Visual and Interaction System]] | 1A to 4 | Visual regression and interruption-budget tests |
| R-264 to R-270 | Accessibility, focused mode, non-punitive progress, privacy presentation, performance, asset production, and prototype boundary | 18, 27 | [[Pixel Training Adventure Visual and Interaction System]] | 0 to 1A | Accessibility, performance, reduced-motion, and safety-copy tests |
| R-271 to R-274 | Private first release, incubation, history-preserving iteration, and evidence-gated public readiness | 3, 26, 28, 31 | [[App Build Reference Index]], [[Data Backend Storage and Learning Architecture]] | 0 to 3 | Longitudinal private-use and public-readiness gate review |
| R-275 to R-279 | RP corpus, coverage ledger, transcript quality, relevance, and evidence separation | 23, 29 | [[Renaissance Periodization YouTube Training Corpus 2026-08-09]], [[Research Corpus and Source Quality Register]] | 0 onward | Corpus ledger and semantic transcript audit |
| R-280 to R-284 | Publication provenance, duplicate control, goal-specific extraction, regression translation, and refresh | 23, 27, 29 | [[Renaissance Periodization YouTube Training Corpus 2026-08-09]] | 0 onward | Source-version, duplicate, translation, and refresh audit |
| R-285 to R-289 | Canonical Bible, traceability, build contracts, quality gates, and living governance | 0 through 34 | [[Adaptive Strength and Hypertrophy App Build Bible]], this matrix | Ongoing | Requirement-ID audit, link audit, release checklist, and session-log review |
| R-290 to R-295 | Working private alpha, local-first delivery, deferred service boundary, visual product, implementation authority, and honest iteration | 3, 18, 19, 26, 31, 32, 35 | [[Private Alpha Implementation 2026-08-10]], [[App Build Reference Index]] | 1A first slice, ongoing | Lint, domain tests, production build, desktop and phone journeys, persistence, and implementation-status audit |
| R-296 to R-303 | Original evolving companion, workout XP, anti-grind economy, level and form gates, post-workout sequence, continuity, controls, and IP boundary | 18, 66 | [[Pixel Training Adventure Visual and Interaction System]] | 1A to 1C | XP-ledger replay, anti-grind scenarios, evolution-state tests, reduced-motion journeys, accessibility review, and originality review |
| R-304 to R-311 | Exact-movement preference scale, state separation, contextual rules, competition-specific use, recommendation authority, primary conflict, event history, and inference boundary | 6.7, 7, 15, 16, 22, 67 | [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]] | 1B to 1C | Preference-state migration, context resolution, recommendation-gate, protected-primary review, replay, restore, merge, and accessibility tests |

## Delivery Phase Key

- `0`: product and architecture foundation.
- `1A`: private logging core.
- `1B`: adaptive coaching core.
- `1C`: longitudinal intelligence.
- `2`: optional AI and knowledge assistant.
- `3`: wider private multi-user readiness.
- `4`: optional friends and social.
- `Ongoing`: research, governance, documentation, and quality work that continues across releases.

## Change Rule

When a requirement is added, removed, replaced, or materially reinterpreted:

1. update [[App Requirements Register]] with provenance and status;
2. update the relevant Build Bible chapter;
3. add or change the detailed source note;
4. add an executable or manual verification route;
5. update the applicable delivery phase and exit gate;
6. rerun sequential-ID, duplicate-ID, wikilink, and omission checks;
7. record the change in [[Codex Session Log]].
