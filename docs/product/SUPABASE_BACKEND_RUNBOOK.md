---
type: backend-runbook
tags: [fitness, app, supabase, postgres, auth, sync, operations]
created: 2026-08-10
updated: 2026-08-26
status: cloud-account-controls-deployed-acceptance-pending
confidence: verified-live-transactional
---

# ForgePath Supabase Backend Runbook

## Current Boundary

Private alpha 0.62.0 makes the validated version 26 snapshot cloud-authoritative for invited accounts, adds persistent safe update notification, preserves the newest unconfirmed snapshot through a browser or operating-system kill, explicitly stores the renewable Auth session in durable browser storage, and securely establishes a separate renewable session in the installed iOS Home Screen app after Safari verifies the invited email. A dedicated remote project exists in a separate approved Supabase organization: `ForgePath`, project reference `kdavpkphvapnckenbuyg`, AWS `us-east-2`. JB-OS and Roman TD Global Leaderboard were not modified, paused, deleted, or reused.

The current GitHub project-site URL shares the parent `falatua.github.io` browser origin with other project sites. Service-worker scope and cache naming protect refresh behavior but do not isolate local storage, IndexedDB, or a Supabase browser session from another script on that origin. Keep this release within the owner-controlled test group. A dedicated ForgePath origin plus redirect, session, recovery, and phone-laptop acceptance is required before inviting external athletes.

The local foundation includes:

- five checksum-locked versioned migrations in `supabase/migrations`;
- fifteen forced Row Level Security tables and two security-invoker volume views;
- an invite-only email-link gate with account creation disabled, generic non-enumerating responses, and no athlete-facing password route;
- stable device identity and version metadata;
- one account-scoped durable retry snapshot that is removed after authenticated cloud confirmation;
- an idempotent authenticated snapshot function;
- version conflict preservation with no silent overwrite;
- automatic verified launch hydration, serialized checksum-deduplicated saves, and conflict preservation;
- recently reauthenticated reset that deletes all caller-owned ForgePath rows but preserves the login;
- a deployed authenticated Edge Function that permanently deletes the caller's Auth account and cascaded app data without exposing the server credential;
- a deployed `pwa-handoff` Edge Function that stores only a SHA-256 digest, requires a recently verified session to create a 100-bit code, atomically redeems it once within five minutes, and returns a server-generated token hash only to the approved app origin;
- a deployment path for browser-safe Supabase configuration;
- automated static database-boundary checks;
- checksum-locked migration history plus read-only and rolled-back production acceptance scripts;
- a checked-in TypeScript contract for every table and RPC the browser currently uses;
- a normalized entity ledger, device cursors, exercises, sessions, movements, sets, notes, survey records, and explicit missingness;
- source-set daily, weekly, monthly, and yearly total and exclusive primary-region volume rollups.

The first two migrations were applied transactionally on 2026-08-11. The account-control migration and its exact ledger statement were applied on 2026-08-13, followed by the snapshot-contract migration. The Home Screen handoff migration and exact ledger statement were applied on 2026-08-26. The `delete-account` and `pwa-handoff` Edge Functions were deployed from their checked-in sources. Because the original SQL Editor applications did not populate the Supabase CLI ledger, `supabase_migrations.schema_migrations` was repaired from the exact committed files. All five remote statement payloads are represented by the SHA-256 manifest. The established live proof covers fifteen forced-RLS tables, zero anonymous grants, zero normalized browser mutation grants, four intentional profile/device mutation grants, two security-invoker volume views, and the authenticated snapshot RPC. On 2026-08-13 the transactional proof was expanded to a 74,375-byte JSON payload representing 52 weeks, 156 sessions, and 624 sets; all ten identity, RLS, apply, replay, conflict, payload, and isolation checks passed. A separate query returned zero reserved test users, profiles, devices, events, conflicts, and snapshots after rollback. The reset RPC is authenticated only, self-scoped through `auth.uid()`, exact-confirmation gated, and rejects JWTs older than five minutes. The 2026-08-26 read-only acceptance audit returned true for all ten checks, including the exact fifth migration digest, fifteen of fifteen forced-RLS tables, and zero handoff-table grants to browser roles. The public handoff endpoint rejects malformed and expired codes, denies unapproved origins, disables only the legacy gateway JWT check, and performs its own create and redeem authorization inside the function.

Production and local redirect URLs are configured. Public signup is disabled and persisted after a hard reload. On 2026-08-26 the live Auth endpoint accepted the approved admin address with account creation disabled and sent the private passwordless confirmation email. This verifies allow-list eligibility without hardcoding the address into the public client or repository. The live Sessions page reports no user-session timebox, no inactivity timeout, 3,600-second renewable access tokens, compromised refresh-token detection enabled, and a 10-second reuse interval. The private release gate is enabled for the approved invitation acceptance window, but this is not approval for wider cloud release. During the activation audit, the GitHub browser-key secret was found to contain plain-English instruction text instead of a Supabase key. The secret was corrected from the existing browser-safe dashboard key without exposing it to source, logs, or the vault. The deployment workflow now validates the gate, URL, and browser-safe key shape before it can build Pages.

It does not yet claim automatic synchronization, entity-level merge, active-workout handoff, complete new-device hydration, device revocation UI, an accepted real invitation, or a completed physical phone-to-laptop drill. The transactional database proof covers two isolated identities without leaving accounts or athlete data behind; it does not replace real invitation acceptance.

## Provisioning Decision Resolved

ForgePath was created in another owner-approved organization. This satisfies the dedicated-project boundary without changing the existing Falatua organization or sharing tables, Auth users, credentials, logs, or backup policy with JB-OS or Roman TD.

## Remote Activation Sequence

1. Create a dedicated ForgePath project in the approved organization and choose the nearest appropriate region. Completed as `ForgePath` in AWS `us-east-2`.
2. Keep the database password in the owner's password manager. Do not paste it into source, Vite, GitHub Pages, Obsidian, or chat.
3. Link the repository to the project with the Supabase CLI.
4. Review and apply the committed migrations transactionally. Completed through the authenticated SQL Editor because no database password or privileged connection string was exposed locally.
5. Keep the checked-in narrowed browser contract in `src/services/supabase.types.ts` aligned with migrations. Regenerate the complete schema type file when the CLI is linked through an approved local credential path.
6. In Authentication URL Configuration, set the Site URL to the hosted Pages URL and allow both the hosted URL and local Vite URL as redirects.
7. Disable open public signup for the hosted private alpha. Completed and verified after hard reload. Invite the approved athlete account from the dashboard after JB supplies the exact email.
8. Add `FORGEPATH_SUPABASE_URL` and `FORGEPATH_SUPABASE_PUBLISHABLE_KEY` as source-repository Actions secrets, never as tracked public source. Completed and revalidated on 2026-08-12 after correcting a malformed browser-key secret. The release gate is temporarily enabled for the approved invitation acceptance window. These are the only Supabase values eligible for browser compilation, and `npm run qc:cloud-release` now rejects missing, malformed, or server-side credentials.
9. Run the full local and remote acceptance gates below. The migration, grants, RLS, RPC, idempotency, stale-conflict, rollback, and simulated two-identity gates pass. Real invitation, email delivery, restore undo on a second physical browser, and offline recovery remain.
10. Push only after the migration, auth flow, Row Level Security, app tests, and live Pages behavior pass.

## Mandatory Remote Acceptance Gates

- Auth: an invited account receives a sign-in link and an uninvited email cannot create an account.
- Installed app Auth: a Safari-verified invited session creates one five-minute code, the Home Screen app redeems it once into its own renewable session, replay fails, and no access or refresh token appears in the clipboard or redirect URL.
- RLS: athlete A cannot select, insert, update, or invoke data as athlete B.
- Anonymous access: the public Pages visitor cannot read any ForgePath table.
- Idempotency: replaying the same event ID and checksum produces no duplicate event or version.
- Tampering: reusing an event ID with different content is rejected.
- Conflict: a stale base version creates a preserved conflict and does not replace the current snapshot.
- Device boundary: an unknown or revoked device cannot push.
- Recovery: a verified cloud copy restores on a second browser, creates a local undo point, and retains backup integrity.
- Interrupted save: every mutation stages one integrity-protected, account-scoped pending snapshot before the delayed cloud request. It survives refresh or process kill, replays only against its expected cloud version, and is removed after authenticated confirmation.
- Offline boundary: the pending snapshot provides post-kill recovery but does not yet prove complete offline startup, long-duration offline training, or automatic multi-device merge.
- Status truth: only a successful authenticated push or reviewed restore changes the last-confirmed cloud state.
- Secrets: no database password, secret key, service-role key, or personal export appears in source, compiled assets, logs, Pages, or the vault.

## Repeatable Production Checks

1. Run `npm run qc:backend` to verify local migrations, the SHA-256 manifest, invite-only local config, deployment gate, and both audit scripts.
2. Run `supabase/audits/forgepath_acceptance.sql` read-only after every remote migration. Every returned `passed` value must be true.
3. Run `supabase/audits/forgepath_transactional_sync_test.sql` for release candidates. It operates as two authenticated identities, transports a 52-week synthetic snapshot, and ends with `rollback`. All ten rows must pass.
4. Run a separate residue query for the two reserved identities. Users, profiles, devices, events, conflicts, and snapshots must all return zero.
4. Run a separate rollback-proof query for the reserved test identities and UUIDs. Every count must be zero.
5. Never repair migration history from memory. Compare the remote statement SHA-256 values with `supabase/migrations/manifest.json`.

## Next Backend Slices

1. Replace the explicit whole-state bootstrap bridge with transactional entity events and a durable IndexedDB repository.
2. Add incremental pull cursors and automatic foreground convergence.
3. Add conflict-resolution UI for source-set corrections, deletions, plan revisions, preferences, and exercise merges.
4. Add new-device staged hydration and device revocation.
5. Add renewable active-workout leases, read-only opening, and explicit takeover.
6. Recompute derived analytics from reconciled source events and compare phone and laptop results.
7. Add independent logical export and tested recovery operations before wider private access.

## Official References

- [Supabase React Auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase declarative schemas and migrations](https://supabase.com/docs/guides/local-development/declarative-database-schemas)
