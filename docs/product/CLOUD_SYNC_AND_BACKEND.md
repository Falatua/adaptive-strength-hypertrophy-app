---
type: product-process
aliases: [Adaptive Training Data Backend, Supabase Training App Architecture]
tags: [fitness, app, backend, database, supabase, postgres, privacy, learning]
created: 2026-08-09
updated: 2026-08-13
status: cloud-authoritative-private-alpha
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: product-decision
---

# Data Backend, Storage, and Learning Architecture

## Direct Answer

The first disposable prototype can run on a local database. The first real multi-device or multi-user version should use a structured backend. Supabase is the current leading recommendation because this product needs relational Postgres data, authentication, per-user authorization, server-side functions, migrations, backups, and an optional vector-search path in one system.

The current owner-approved architecture is:

1. Supabase Postgres as the private cloud system of record.
2. In-memory client state for the open session, with no durable browser copy of training history, plans, surveys, notes, settings, or recovery payloads.
3. Supabase Auth plus Row Level Security for user isolation.
4. Server-side functions for privileged rules, sync reconciliation, exports, and optional AI-provider calls.
5. Versioned SQL views or background jobs for daily through annual aggregates and learning features.
6. Optional pgvector only for research retrieval or semantic note search, not for authoritative workout truth.

No separate data warehouse, vector database, or foundation-model training pipeline is required for the first useful product.

The browser may retain the renewable Supabase Auth session and harmless device and server-version metadata. Those values are not athlete training records. Offline durable training is intentionally not part of this cloud-only decision. If Supabase is unavailable, the app must say the save is incomplete and retain only the current in-memory state long enough to retry. It must not label unconfirmed work as saved.

## Cloud-Authoritative Account Slice, 2026-08-13

Private alpha 0.59.0 uses an authenticated cloud gate and automatic whole-state snapshot persistence. An invited athlete enters only the invited email and opens the private time-limited link Supabase sends. The athlete product has no password setup, password sign-in, or password recovery route. The request disables account creation, returns a generic response that does not reveal invitation membership, and routes verified links back to ForgePath. Public signup remains disabled.

On authenticated launch, ForgePath verifies and hydrates the latest Supabase snapshot before opening training. When no remote copy exists, it uploads the current state once. A legacy browser copy is read only for this one migration and is deleted only after Supabase confirms the save. Afterward, the Zustand persistence writer is disabled for cloud builds, and the retry payload exists only in memory. Automatic saves are serialized, checksum-deduplicated, versioned, and conflict-preserving.

Account controls are split by privilege. `reset_forgepath_data('RESET')` is an authenticated, recently reauthenticated, self-scoped database function that deletes every ForgePath row for the caller while preserving the Auth account. `delete-account` is an authenticated Edge Function that verifies the caller, recent JWT issue time, exact confirmation, allowed origin, and then uses the server-only Auth Admin client to delete that caller. `on delete cascade` removes the related ForgePath rows. No privileged key enters the browser bundle.

This slice does not yet claim normalized entity mutation, automatic multi-writer merge, offline durable workouts, active-workout handoff, device revocation UI, or a completed physical phone-to-laptop acceptance drill. The snapshot remains the cloud source of truth until those later contracts are proven.

## Phone and Laptop Product Decision

The first real private multi-device release must serve both phone and laptop through one private account and one canonical training history.

The current responsive PWA remains the fastest first client because it already runs on both form factors and shares one TypeScript domain engine. It should be optimized as:

- phone-first during warm-up, active sets, rest periods, substitutions, immediate feedback, and quick review;
- laptop-enhanced for plan editing, long-range charts, exercise-history exploration, imports, data-quality review, and settings;
- core-feature complete on both so the athlete is never forced onto a particular device to finish a normal training task.

Native mobile distribution can still follow when device features, reliability testing, or public distribution justify it. Cloud identity and sync contracts must remain client-independent so the responsive web client and any future native client use the same authoritative records.

Private alpha 0.39.1 preserves the first cloud foundation and includes exact-movement notes inside the validated version 25 bootstrap snapshot, but it does not yet meet the full multi-device requirement. The dedicated ForgePath project, both committed migrations, repaired checksum-matched migration history, and live acceptance scripts are active. Public signup is disabled, and GitHub Actions secrets hold the browser-safe project configuration outside the public source tree. Pages compilation remains release-gated until one approved athlete invitation and the real phone-to-laptop recovery drill pass. The existing client includes device identity, a validated local retry outbox, idempotent snapshot events, a protected bootstrap snapshot, preserved version conflicts, and reviewed restore. Until the remaining private Auth and physical-device gates pass, phone and laptop still create independent local states on the public preview. Automatic entity-level synchronization, note-level convergence, and workout handoff remain later phases.

## Cross-Device Sync Contract

### One Account and Device Registry

Every authorized installation receives a stable device ID tied to the authenticated athlete account. The device registry stores app version, schema version, sync cursor, last successful push and pull, last seen time, and revocation state. A lost or retired device can be revoked without deleting its historical event provenance.

### Local Commit Before Cloud Acknowledgement

Every workout mutation commits transactionally to the local operational store before the interface confirms success. The same transaction appends an outbox record containing:

- stable event and entity IDs;
- athlete and device IDs;
- entity version and expected prior version;
- local occurrence time and timezone;
- device sequence;
- schema, rule, and calculation versions;
- mutation payload and integrity checksum;
- retry count and last attempt status.

Workout execution never waits for the network. Authenticated cloud acknowledgement marks an outbox record delivered but never deletes the source event required for replay.

### Pull and Freshness Triggers

Each client pulls incremental changes:

- after authenticated launch;
- when returning to the foreground;
- before opening an existing in-progress workout on another device;
- before plan generation, plan replacement, or history mutation when connectivity exists;
- after a successful push;
- when the athlete explicitly selects `Sync now`.

Background delivery is an optimization, not a correctness dependency. If the operating system suspends the app, foreground resume must complete the same pull and reconciliation safely.

### Visible Sync States

The interface distinguishes:

- `Saved on this device`: local commit succeeded and cloud delivery is pending;
- `Syncing`: authenticated push or pull is active;
- `Synced`: the outbox is empty and the latest cloud cursor was acknowledged;
- `Offline`: local training remains available and pending changes are counted;
- `Needs review`: an authoritative conflict or incompatible version prevents automatic reconciliation.

Show the last successful cloud sync time and pending item count in You and wherever an unresolved state affects workout handoff. A network reachability hint alone never proves cloud sync. Only a successful authenticated cloud response can establish the synced state.

### Active Workout Handoff

An online device starting or resuming a workout claims a short renewable session-edit lease. Other devices show the session, originating device, last update, and one of these actions:

- `Open Read Only`;
- `Take Over Here`;
- `Wait for Sync`;
- `Start a Different Workout`, if the plan permits it.

Takeover pushes the first device's known state, expires or supersedes its lease, pulls the latest session events, and creates a recorded handoff event. The prior device becomes read-only for that session after it next reconnects unless the athlete explicitly takes over again.

Offline logging remains allowed because the app cannot depend on a lease server during training. If two offline devices change the same session, both branches upload. Independent new set events merge by stable identity. Conflicting edits to the same set, slot, completion state, or substitution enter `Needs review` with both originals preserved.

### Conflict Matrix

- independent new sets, surveys, notes, and append-only events: union by stable ID;
- retry of the same event: idempotent no-op after integrity comparison;
- same completed set corrected differently: preserve original plus both correction events and request athlete review;
- one device deletes while another corrects the same set: preserve both events and request review;
- plan revised on one device while another completes the prior plan: retain completed source truth and both plan versions, then rebase only future work;
- exercise merge or split conflicts: pause canonical reassignment until review;
- preference, profile, or setting changed concurrently: compare expected versions, show both values, and require a chosen current state when behavior could change;
- derived analytics or records: never merge as authority, recompute from reconciled source events and current calculation versions.

No generic last-write-wins policy may remove completed work, history, or audit evidence.

### New Device and Recovery

After authentication, a new device downloads the athlete profile, canonical catalog customizations, plans and versions, open sessions, completed source events, preferences, surveys, decisions, mutations, records definitions, sync metadata, and required derived-view inputs. It validates schema and rule compatibility before exposing editable state, builds local projections, records the hydration cursor, and then becomes offline-capable.

Large histories hydrate in safe stages: identity and current plan first, active workout and recent history second, then older history and derived caches. The interface must never show partial historical totals as complete while hydration is still running.

### Multi-Device Acceptance Gate

Before calling the app multi-device ready, prove on at least one phone viewport and one laptop viewport:

1. sign in to the same account and receive matching source data and analytics;
2. start offline on the phone, complete sets, reconnect, and create each set exactly once;
3. start on phone, sync, take over on laptop, and finish without losing or duplicating work;
4. edit the same set differently on both devices and receive a preserved visible conflict;
5. revise a future plan on laptop while completing an older planned session on phone without rewriting the completed session;
6. correct, delete, merge, undo, and replay records consistently across both devices;
7. restore a new device entirely from cloud history and continue offline afterward;
8. revoke one device while preserving its historical provenance;
9. verify that two separate athlete accounts cannot read or alter one another's records;
10. pass responsive, keyboard, touch, screen-reader, large-text, slow-network, and reconnect checks.

## Why a Real Backend Is Warranted

This app does not only store workouts. It must retain relationships among:

- athletes and changing goals;
- canonical exercises, aliases, variations, and merges;
- equipment and locations;
- plans, cycles, sessions, and planned work;
- completed sets and exact exercise exposure clocks;
- optional surveys and explicit missing or skipped states;
- pain, joint feel, target-muscle feel, fatigue, enjoyment, and recovery;
- exercise substitutions and athlete overrides;
- recommendation inputs, rule versions, alternatives, and outcomes;
- personal correlations and confidence;
- research claims and knowledge-base versions;
- exports, corrections, deletions, and audit history.

These are relational and time-dependent records. Flat files or one large JSON object would make history, merging, privacy, analytics, and migrations fragile.

## Important Principle: More Data Is Not Automatically Better

Useful learning requires:

- accurate exercise identity;
- completed rather than merely planned work;
- comparable exposures;
- explicit missingness rather than invented values;
- timestamps, units, time zones, and source context;
- stable rule and schema versions;
- enough repeated outcomes to support a conclusion;
- athlete consent and correction controls;
- retention of the decision that was made and what happened afterward.

Ten clean comparable exposures can be more useful than hundreds of mislabeled sets or incomplete surveys. The database must optimize for trustworthy longitudinal evidence, not maximum collection.

## Storage Layers

### Layer 1: Local Operational Store

Purpose:
- start and complete workouts without connectivity;
- save every set immediately;
- preserve in-progress sessions after a crash or app restart;
- run survey-free, AI-free deterministic rules;
- queue changes for later sync.

Candidate technology depends on platform:
- mobile or desktop: SQLite;
- browser-first: IndexedDB or another durable local database;
- cross-platform framework: its mature SQLite binding plus a sync queue.

### Layer 2: Supabase Postgres System of Record

Purpose:
- account and cross-device history;
- relational integrity;
- secure private athlete data;
- canonical exercise and program state;
- recommendation provenance;
- server-side aggregates and statistical features;
- export, correction, deletion, backup, and migration.

Supabase currently provides a full Postgres database, Auth, Row Level Security integration, Edge Functions, Storage, database extensions such as pgvector, and paid backup options. It is not a proprietary training algorithm. The data model and SQL remain portable Postgres concepts.

### Layer 3: Derived Analytics and Learning Features

Derived data includes:
- daily, weekly, rolling, monthly, yearly, and all-time volume;
- exclusive body-region volume-load;
- non-additive region-involvement tonnage;
- direct and fractional muscle-set estimates;
- estimated strength and comparable-exposure trends;
- completion, substitution, pain, recovery, and time-fit patterns;
- candidate personal correlations with confidence and sample size;
- feature snapshots used by a recommendation.

Derived values must be reproducible from immutable or append-preserving source records plus a versioned calculation definition. Never store only the current total.

### Layer 4: Optional Knowledge Retrieval

Approved training research exported from Obsidian can use Postgres full-text search first. pgvector may later support semantic retrieval for methodology questions, free-text notes, or research passages. Embeddings are search aids, not the source of truth for sets, progression, pain state, permissions, or completed sessions.

## Recommended Core Data Domains

### Identity and Privacy
- `users`
- `athlete_profiles`
- `privacy_preferences`
- `survey_preferences`
- `consent_versions`
- `data_export_requests`
- `data_deletion_requests`

### Exercise Knowledge
- `exercises`
- `exercise_aliases`
- `exercise_modifiers`
- `exercise_muscles`
- `exercise_regions`
- `exercise_relationships`
- `exercise_merge_events`
- `equipment_profiles`
- `equipment_items`

### Planning and Cycles
- `goals`
- `program_versions`
- `cycles`
- `planned_sessions`
- `planned_exercises`
- `progression_states`
- `working_max_history`

### Completed Training
- `workout_sessions`
- `workout_exercises`
- `workout_sets`
- `exercise_substitution_events`
- `session_adjustment_events`
- `pain_and_joint_events`
- `time_and_interruption_events`

### Feedback
- `survey_instances`
- `survey_answers`
- `survey_response_status`
- `exercise_feedback`
- `session_feedback`
- `recovery_observations`
- `athlete_corrections`

Skipped, not-sure, and prefer-not-to-answer are explicit response states. They are not encoded as neutral numeric answers.

### Decisions and Learning
- `recommendation_decisions`
- `decision_input_snapshots`
- `decision_candidates`
- `decision_reason_codes`
- `rule_engine_versions`
- `knowledge_base_versions`
- `derived_feature_snapshots`
- `personal_hypotheses`
- `hypothesis_evidence`
- `recommendation_outcomes`
- `pr_definitions`
- `pr_records`
- `pr_opportunities`
- `achievement_events`
- `pr_validation_events`
- `pr_notification_events`

Every material recommendation should retain the inputs available at that moment, the rule version, selected action, rejected alternatives, confidence, athlete override, and later outcome.

PR records retain their source workout and set IDs, normalized units, metric and scope, comparison context, calculation version, validation state, corrections, and supersession history. Local and cloud implementations use the same record-definition version.

### Optional Social Layer

- `social_profiles`
- `friend_requests`
- `friendships`
- `social_groups`
- `social_group_memberships`
- `blocks`
- `social_visibility_preferences`
- `shared_activity_events`
- `shared_activity_event_details`
- `shared_pr_events`
- `shared_achievement_events`
- `social_reactions`
- `social_notification_preferences`
- `social_notification_events`
- `challenge_definitions`
- `challenge_participants`
- `challenge_attempts`
- `challenge_results`

The social layer stores sanitized projections, not friend permissions on private workout tables. A private workout may produce a validated record or achievement. Only an explicit athlete sharing choice creates a social event containing the approved field set and visibility.

Social events preserve source provenance and validation state so corrections, invalidated records, share revocation, friendship removal, and blocking can update or remove the projection without deleting the owner's private workout.

Detail: [[Friends Social Progress and Challenge System]].

## Raw Events, Current State, and Derived Views

Use three related forms:

1. `Event history`: what happened, when, under which version, with original entered values preserved.
2. `Current state`: the latest active athlete, exercise, plan, and progression state for fast app use.
3. `Derived views`: reproducible summaries, trends, and learning features.

Corrections should append or version changes instead of silently rewriting history. Exercise merges can update canonical references while preserving original entered names and an undo path. Planned work and completed work remain separate.

## Learning Pipeline

The early learning loop does not require model training:

1. Capture a clean event.
2. Normalize units and exercise identity.
3. Update deterministic state and aggregates.
4. Build comparable-exposure features.
5. Evaluate simple personal trends or statistical hypotheses.
6. Require a minimum sample and display uncertainty.
7. Use qualified features in the next deterministic recommendation.
8. Record the decision and later result.
9. Let the athlete correct the conclusion.

An optional language model can interpret notes or explain decisions, but it receives a bounded summary rather than the full database. The model does not train itself from every new row.

## Supabase Security Contract

- Use Supabase Auth for user identity.
- Enable Row Level Security on every client-accessible athlete-data table.
- Scope policies by authenticated user ID and test them with multiple accounts.
- Keep secret or service-role credentials server-side only because they can bypass Row Level Security.
- Put OpenAI, Anthropic, billing, and other private keys in server-side secrets.
- Use authenticated server functions for privileged calculations and exports.
- Separate development, staging, and production projects.
- Collect the minimum sensitive pain, health, and lifestyle data needed for the feature.
- Provide export, correction, and deletion.
- Log privileged access and destructive operations.
- Maintain independent logical exports in addition to platform backups.
- Apply Row Level Security to every relationship, share, reaction, notification, and challenge table.
- Authorize each social read through current friendship or group membership, per-event visibility, block state, revocation state, and approved shared fields.
- Never let a social client join from a shared event into a friend's private workout, survey, pain, readiness, or athlete-model rows.

Supabase states that Row Level Security should be enabled on exposed tables and can be combined with Auth for row-by-row user authorization. Its documentation also warns that secret and legacy service-role keys bypass RLS and must never be placed in a browser.

## Backup and Migration Contract

- Every schema change is a versioned migration reviewed alongside rule changes.
- Seed exercise data is versioned independently from athlete-created data.
- Backups must cover both database records and any separate Storage objects.
- Paid Supabase plans currently provide daily database backups, with Point-in-Time Recovery available as an additional option. Free projects need scheduled logical exports.
- Supabase database backups do not restore deleted Storage objects, so file backups require a separate policy.
- Recovery is tested, not merely enabled.
- Export remains a documented open format such as JSON plus CSV or a portable Postgres dump.

## Server Functions and Background Work

Good server-function uses:
- secure AI-provider gateway;
- validated recommendation transaction;
- export and deletion workflow;
- account-level sync reconciliation;
- webhooks and notifications;
- short aggregation or explanation requests.

Heavy longitudinal recomputation, large imports, model training, or long-running analytics should use a background worker or scheduled database job rather than a user-facing Edge Function. Supabase documentation explicitly recommends moving heavy long-running jobs out of Edge Functions.

## Phased Recommendation

### Phase 0: Schema and Test Data
- define canonical IDs, units, timestamps, event types, survey missingness, and version fields;
- create synthetic athletes and regression fixtures;
- prove daily through yearly volume from source sets;
- prove exercise merge, substitution, missed-workout, and survey-skip behavior.

### Phase 1: Personal Working Prototype
- local SQLite or equivalent operational store;
- deterministic rules and dashboards;
- optional single-user Supabase project for backup and multi-device sync;
- no vector database, warehouse, or AI requirement.

### Phase 2: First Real Product
- Supabase Postgres as cloud system of record;
- Supabase Auth and tested Row Level Security;
- local cache plus conflict-aware sync;
- versioned migrations, logical exports, and backups;
- server-side rule transactions and optional AI gateway;
- SQL views or jobs for aggregates and simple statistical features.

### Phase 3: Learning and Knowledge Expansion
- feature snapshots and evaluated personal correlations;
- approved Obsidian knowledge export;
- full-text search first;
- optional pgvector semantic retrieval when evaluation shows a benefit;
- background workers only when workload requires them.
- optional private social foundation only after personal records and authorization are trusted: mutual friends, sanitized completion or PR sharing, mute, removal, block, and positive reactions;
- defer friend comparison prompts and challenges until exact-comparison, correction, and safety behavior are validated.

### Phase 4: Scale Only When Proven Necessary

Add a separate analytics warehouse, streaming pipeline, read replica, or dedicated model-training infrastructure only when observed workload, latency, cross-user research, or regulatory requirements justify it. Do not create a complex data platform merely because the app may eventually hold years of data.

## Current Decision

Use the responsive PWA as the first phone-and-laptop client, backed by a local operational store and Supabase as the leading private cloud system of record. Start schema and sync design now. Do not claim cross-device operation until authenticated synchronization and the multi-device acceptance gate pass. Keep the domain, storage, and sync contracts portable so a later native mobile client can use the same account and history.

## Implemented Foundation and Normalized Core, Private Alpha 0.39.1

The repository now contains a versioned Supabase migration and browser connection layer. The migration creates `forgepath_profiles`, `forgepath_devices`, `forgepath_sync_events`, `forgepath_state_snapshots`, and `forgepath_sync_conflicts`. Every table enables and forces Row Level Security, revokes anonymous access, and limits authenticated reads to `auth.uid() = user_id`. Append-only events, snapshots, and conflicts cannot be directly changed by the browser.

The authenticated `push_forgepath_snapshot` function serializes writes per athlete, requires an active registered device, checks payload shape and size, treats exact event replay idempotently, rejects event-ID content reuse, advances only from the expected server version, and preserves stale writes as conflicts without replacing the current snapshot.

The PWA stores a stable device ID, device sequence, acknowledged server version, last confirmed sync time, and one retryable snapshot in local storage. The You screen supports invite-only email link sign-in, explicit save to cloud, integrity-validated cloud review, and athlete-confirmed restore through the existing automatic local undo path. Reading a cloud copy alone does not authorize a local overwrite or advance the local base version.

The second migration adds `forgepath_entity_events`, `forgepath_sync_cursors`, `forgepath_exercises`, `forgepath_workout_sessions`, `forgepath_workout_movements`, `forgepath_workout_sets`, `forgepath_movement_notes`, `forgepath_survey_instances`, and `forgepath_survey_answers`. These are athlete-owned, server-written projections backed by an append-only entity ledger. Direct browser mutation is denied. Explicit survey missingness is preserved rather than mapped to neutral data.

`forgepath_volume_facts` retains source-set identity and calculates volume load as normalized kilograms multiplied by repetitions. `forgepath_volume_rollups` derives daily, weekly, monthly, and yearly totals for the whole athlete and exclusive primary-region scopes. Both are security-invoker views so the underlying athlete Row Level Security remains authoritative.

The dedicated project is live at project reference `kdavpkphvapnckenbuyg` in AWS `us-east-2`. Its repaired migration ledger matches all four checksum-locked committed migrations. A live read-only audit verified fourteen forced-RLS tables, two security-invoker views, zero normalized browser mutation grants, four intentional profile/device mutation grants, and an authenticated-only snapshot RPC. A rolled-back two-identity transaction verified device registration, projection-write denial, snapshot apply, idempotent replay, stale conflict preservation, state invariants, and cross-athlete invisibility. A follow-up query proved the rollback left zero test rows. Public signup is disabled. The public source repository holds no credential values; browser-safe project URL and publishable-key values remain stored as GitHub Actions secrets. The public build receives them only when `FORGEPATH_CLOUD_RELEASE_ENABLED` is exactly `true`, and that private cloud release is enabled. The real invited-athlete email-link and physical phone-to-laptop recovery drill remains open. Database passwords and privileged keys were neither read nor stored.

The whole-state snapshot remains the only client-wired bridge. The normalized projections are ready for the subsequent transactional entity-event RPC and IndexedDB outbox, but automatic merging, background sync, active-workout leases, new-device staged hydration, revocation UI, and derived-view parity remain unimplemented and cannot be labeled ready.

Remote activation moved to a separate approved Supabase organization, leaving JB-OS and Roman TD unchanged. Final invite-only activation requires one approved athlete invite plus the real email-link, second-device restore, local undo, and offline retry checks. See `SUPABASE_BACKEND_RUNBOOK.md`.

## Official Sources Checked, 2026-08-10

- [Supabase Database overview](https://supabase.com/docs/guides/database/overview)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase function secrets](https://supabase.com/docs/guides/functions/secrets)
- [Supabase pgvector columns](https://supabase.com/docs/guides/ai/vector-columns)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase React Auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Supabase local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase declarative schemas and migrations](https://supabase.com/docs/guides/local-development/declarative-database-schemas)

## Open Decisions

- Exact IndexedDB repository and transaction boundary that replaces the current local-storage bootstrap bridge.
- Exact native-mobile trigger and whether later distribution uses Expo, a wrapped PWA, or both.
- Sync debounce and batching interval during an active workout.
- Session-edit lease duration, renewal cadence, and takeover grace period.
- Which non-training preferences can use deterministic version ordering instead of athlete review.
- Whether the dedicated project will live in an upgraded Falatua's Org or another owner-approved organization.
- Exact retention windows for raw notes, survey details, AI interactions, and derived features.
- Backup tier and recovery objectives for a public release.
- Whether semantic retrieval adds enough value beyond full-text search.
- Thresholds that would justify a warehouse or background-worker service.
- Whether social ships after the first real personal product or in a separate later release.
- Whether the initial social graph is mutual friends only.
- Exact share defaults, notification cadence, moderation scope, and challenge authorization rules.

Related: [[AI Integration and Decision Engine Architecture]], [[Living App Development Outline]], [[App Requirements Register]], [[Multi-Methodology Training Intelligence Brain]], [[Progression and Volume Model]], [[Friends Social Progress and Challenge System]]
