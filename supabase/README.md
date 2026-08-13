# ForgePath Supabase Foundation

This directory is the version-controlled source for the dedicated ForgePath cloud project. The first migration creates the private-alpha account, device, append-only snapshot event, bootstrap snapshot, and preserved conflict tables. The second migration adds the first normalized training core: exercises, sessions, movements, completed sets, movement notes, explicit survey missingness, an append-only entity ledger, device cursors, and daily through yearly volume views. The third migration adds a recently reauthenticated, self-scoped data reset. The authenticated Edge Function deletes an account through the server-only Auth Admin API. Every exposed athlete table enables and forces Row Level Security.

The normalized tables are server-written projections. Authenticated browsers may read only their own rows, but cannot insert, update, or delete the projection or ledger directly. The future entity-event RPC must atomically validate one event, advance the entity version, update the projection, and advance the device cursor before automatic synchronization is enabled.

The browser receives only the project URL and publishable key. Never place a database password, secret key, legacy service-role key, or provider API key in this repository, a Vite variable, GitHub Pages, or the Obsidian vault.

The dedicated production project is ForgePath. Its migration history is repaired and checksum-locked to `migrations/manifest.json`; `audits/forgepath_acceptance.sql` provides the repeatable read-only production proof. Do not reuse the JB-OS or Roman TD database.

Production Auth must remain invite-only: disable public signup, manual identity linking, and anonymous sign-ins; require email confirmation; enable only the email provider; keep the GitHub Pages URL in the redirect allow list; and enforce a minimum 12-character password containing lowercase and uppercase letters, digits, and symbols. The browser may mark password setup in user metadata for interface routing only. Authorization must continue to use `auth.uid()` or server-controlled app metadata, never user metadata.

Follow `docs/product/SUPABASE_BACKEND_RUNBOOK.md`. Apply migrations from version control, run the acceptance audit after each deployment, and do not recreate the schema manually in Table Editor.
