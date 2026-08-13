---
type: backend-runbook
tags: [fitness, app, supabase, postgres, auth, sync, operations]
created: 2026-08-10
updated: 2026-08-13
status: cloud-account-controls-deployed-acceptance-pending
confidence: verified-live-transactional
---

# ForgePath Supabase Backend Runbook

## Current Boundary

Private alpha 0.54.0 makes the validated version 25 snapshot cloud-authoritative for invited accounts. A dedicated remote project exists in a separate approved Supabase organization: `ForgePath`, project reference `kdavpkphvapnckenbuyg`, AWS `us-east-2`. JB-OS and Roman TD Global Leaderboard were not modified, paused, deleted, or reused.

The local foundation includes:

- three checksum-locked versioned migrations in `supabase/migrations`;
- fourteen forced Row Level Security tables and two security-invoker volume views;
- an invite-only email and password gate, invitation setup, and password recovery flow that does not create public accounts;
- stable device identity and version metadata;
- a memory-only retry payload for cloud builds;
- an idempotent authenticated snapshot function;
- version conflict preservation with no silent overwrite;
- automatic verified launch hydration, serialized checksum-deduplicated saves, and conflict preservation;
- recently reauthenticated reset that deletes all caller-owned ForgePath rows but preserves the login;
- a deployed authenticated Edge Function that permanently deletes the caller's Auth account and cascaded app data without exposing the server credential;
- a deployment path for browser-safe Supabase configuration;
- automated static database-boundary checks;
- checksum-locked migration history plus read-only and rolled-back production acceptance scripts;
- a checked-in TypeScript contract for every table and RPC the browser currently uses;
- a normalized entity ledger, device cursors, exercises, sessions, movements, sets, notes, survey records, and explicit missingness;
- source-set daily, weekly, monthly, and yearly total and exclusive primary-region volume rollups.

The first two migrations were applied transactionally on 2026-08-11. The third account-control migration and its exact ledger statement were applied on 2026-08-13, and the `delete-account` Edge Function was deployed from the checked-in source. Because the original SQL Editor applications did not populate the Supabase CLI ledger, `supabase_migrations.schema_migrations` was repaired from the exact committed files. All three remote statement payloads are represented by the SHA-256 manifest. The established live proof covers fourteen forced-RLS tables, zero anonymous grants, zero normalized browser mutation grants, four intentional profile/device mutation grants, two security-invoker volume views, and the authenticated snapshot RPC. The new reset RPC is authenticated only, self-scoped through `auth.uid()`, exact-confirmation gated, and rejects JWTs older than five minutes.

Production and local redirect URLs are configured. Public signup is disabled and persisted after a hard reload. The approved athlete invitation was sent on 2026-08-12 and remains unaccepted. The private release gate is enabled for the approved invitation acceptance window, but this is not approval for wider cloud release. During the activation audit, the GitHub browser-key secret was found to contain plain-English instruction text instead of a Supabase key. The secret was corrected from the existing browser-safe dashboard key without exposing it to source, logs, or the vault. The deployment workflow now validates the gate, URL, and browser-safe key shape before it can build Pages.

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
- RLS: athlete A cannot select, insert, update, or invoke data as athlete B.
- Anonymous access: the public Pages visitor cannot read any ForgePath table.
- Idempotency: replaying the same event ID and checksum produces no duplicate event or version.
- Tampering: reusing an event ID with different content is rejected.
- Conflict: a stale base version creates a preserved conflict and does not replace the current snapshot.
- Device boundary: an unknown or revoked device cannot push.
- Recovery: a verified cloud copy restores on a second browser, creates a local undo point, and retains backup integrity.
- Offline: no durable browser training copy is created. Unconfirmed in-memory changes remain visibly unsaved and retryable while the page stays open.
- Status truth: only a successful authenticated push or reviewed restore changes the last-confirmed cloud state.
- Secrets: no database password, secret key, service-role key, or personal export appears in source, compiled assets, logs, Pages, or the vault.

## Repeatable Production Checks

1. Run `npm run qc:backend` to verify local migrations, the SHA-256 manifest, invite-only local config, deployment gate, and both audit scripts.
2. Run `supabase/audits/forgepath_acceptance.sql` read-only after every remote migration. Every returned `passed` value must be true.
3. Run `supabase/audits/forgepath_transactional_sync_test.sql` for release candidates. It operates as two authenticated identities and ends with `rollback`.
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
