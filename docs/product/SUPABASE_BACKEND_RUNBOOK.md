---
type: backend-runbook
tags: [fitness, app, supabase, postgres, auth, sync, operations]
created: 2026-08-10
updated: 2026-08-10
status: blocked-on-dedicated-project
confidence: verified-local-foundation
---

# ForgePath Supabase Backend Runbook

## Current Boundary

Private alpha 0.38.0 contains the first cloud foundation, but no remote ForgePath project exists yet. Supabase reported that Falatua's Org is at its limit of two active free projects. Those projects are JB-OS and Roman TD Global Leaderboard. Neither may be paused, deleted, or reused without an explicit owner decision.

The local foundation includes:

- one versioned migration in `supabase/migrations`;
- five Row Level Security protected tables;
- an invite-only browser sign-in flow that does not create public accounts;
- stable device identity and version metadata;
- a local retry outbox;
- an idempotent authenticated snapshot function;
- version conflict preservation with no silent overwrite;
- integrity-validated cloud review and an athlete-confirmed restore with a local undo point;
- a deployment path for browser-safe Supabase configuration;
- automated static database-boundary checks.

It does not yet claim automatic synchronization, entity-level merge, active-workout handoff, complete new-device hydration, device revocation UI, or multi-account isolation proof against a live backend.

## Provisioning Decision Required

Choose one before remote work continues:

1. Upgrade Falatua's Org and create a dedicated ForgePath development project.
2. Pause an existing project only after verifying its current use, exports, and recovery plan.
3. Create ForgePath in another owner-approved Supabase organization.

A dedicated project is required. Shared tables inside JB-OS or Roman TD would violate the Build Bible's environment-isolation and least-privilege boundaries.

## Remote Activation Sequence

1. Create a project named `ForgePath Development` in the approved organization and choose the nearest appropriate region.
2. Keep the database password in the owner's password manager. Do not paste it into source, Vite, GitHub Pages, Obsidian, or chat.
3. Link the repository to the project with the Supabase CLI.
4. Review the migration, then apply it with `supabase db push`.
5. Generate TypeScript database types from the linked schema and commit the generated type file.
6. In Authentication URL Configuration, set the Site URL to the hosted Pages URL and allow both the hosted URL and local Vite URL as redirects.
7. Disable open public signup for the hosted private alpha. Invite the approved athlete account from the dashboard.
8. Add `FORGEPATH_SUPABASE_URL` and `FORGEPATH_SUPABASE_PUBLISHABLE_KEY` as private source-repository Actions secrets. These are the only Supabase values compiled into the browser.
9. Run the full local and remote acceptance gates below.
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
- Offline: local training remains usable when Supabase is unreachable and the outbox remains visible.
- Status truth: only a successful authenticated push or reviewed restore changes the last-confirmed cloud state.
- Secrets: no database password, secret key, service-role key, or personal export appears in source, compiled assets, logs, Pages, or the vault.

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
