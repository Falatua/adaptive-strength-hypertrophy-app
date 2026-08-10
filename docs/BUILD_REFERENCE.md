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
- Optional ten-question readiness survey, optional ten-question post-session survey, per-question skipping, and immediate survey-free start.
- Active workout logging with local persistence.
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
- Exact exercise history, canonical IDs, aliases, duplicate warnings, preferences, and joint response.
- Reason-aware exercise replacement with ranked evidence tiers, visible purpose and tradeoffs, exact-history or conservative calibration prescriptions, protected-primary confirmation, and preserved exact-movement clocks.
- A durable substitution-learning ledger linking original and selected movements, candidate snapshots, prescriptions, completed source sets, outcomes, and available feedback.
- Daily and weekly volume, body-region views, source-backed records, and micro wins.
- Real daily, weekly, rolling-28-day, calendar-month, yearly, and all-time filters with source-set reconciliation.
- Exclusive primary-region and upper-body, lower-body, arms, and trunk volume lenses.
- Exact all-time record definitions for absolute load, repetitions at load, load for repetitions, exact set scheme, Epley estimated strength for one through twelve repetitions, exact-movement session volume, and workout session volume.
- Deterministic achievement replay for personal records, load and repetition micro wins, quality wins, baselines, returns, and consistency, with completed source-set provenance.
- Opportunity prompts calculated only from prescribed targets. Athlete-entered actuals can never be reclassified as an app-prescribed record attempt.
- Provisional in-workout achievement feedback and a corrected-history-aware Progress ledger.
- A fully validated PR requires confirmed technique and pain feedback. Survey-free sessions keep their numbers as visibly numeric-only bests.
- Athlete-controlled celebration level, quiet mode, opportunity prompts, session achievements, reduced motion, pixel confetti, sounds preference, and supported-device haptics.
- Athlete model, survey controls, focused mode, data export, and local reset.
- Version 7 open-JSON backup with expanded record definitions, celebration controls, plan, review, correction, and substitution history, integrity checks, versions 1 through 6 migration, preview, restore, malformed-file rejection, and automatic pre-restore undo.
- Original pixel-adventure visual language and installable PWA shell.
- Accurate completed, partial-primary, and partial-without-primary session states.

## Verified Journeys

- Complete onboarding and start directly at an experience-appropriate route.
- Open readiness, skip an individual question, and submit the remaining evidence.
- Start immediately without a survey.
- Log an actual set, reload the app, and recover the active session locally.
- Explain why a primary exercise is being changed, inspect ranked evidence and tradeoffs, confirm the protected-anchor change, receive a movement-specific prescription, and freeze the original exact-movement clock.
- Finish a partial session with or without feedback and update progress only from completed sets.
- Navigate Today, Plan, Progress, Library, and You on desktop and a 390 px phone viewport.
- Export a complete local backup, validate and preview it, restore it, and recover the pre-restore state.
- Switch every progress horizon and prove chart, body-lens, and headline totals equal the selected completed source sets.
- Preview a 30-minute plan revision, apply it, preserve partial history, inspect both plan versions, reload, and recover the active version from local persistence.
- Export and preview a verified version 7 backup containing expanded records, athlete celebration preferences, plan versions, the correction ledger, cycle-review history, and substitution learning.
- Confirm a planned hold remains a hold after an athlete edits actual load, then log, provisionally recognize, save, and replay a source-backed exact-movement load record.
- Turn quiet mode on, reload, and confirm the preference persists without changing training or record calculations.
- Verify the achievement and settings surfaces on desktop and phone with no browser errors or horizontal overflow.

## Deliberately Deferred

- Supabase authentication, Postgres system of record, Row Level Security, and multi-device sync.
- React Native client and SQLite migration after the private web workflow is validated.
- Cloud AI provider, research retrieval, and voice interpretation.
- Friends, social sharing, challenges, and public accounts.
- Medical integrations, wearable imports, and public-launch operations.

## Core Integrity Rules

1. Planned work never counts as completed work.
2. Missing survey data stays unknown.
3. Missed training earns no progression and creates no volume debt.
4. Exercise substitutions own their own completed history.
5. Gamification cannot change the training prescription.
6. The deterministic engine must function offline and without an AI provider.
7. Changes to rules, calculations, or exercise identity must remain versionable and testable.
