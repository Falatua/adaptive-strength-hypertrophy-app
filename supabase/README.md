# ForgePath Supabase Foundation

This directory is the version-controlled source for the dedicated ForgePath cloud project. The first migration creates the private-alpha account, device, append-only snapshot event, bootstrap snapshot, and preserved conflict tables. The second migration adds the first normalized training core: exercises, sessions, movements, completed sets, movement notes, explicit survey missingness, an append-only entity ledger, device cursors, and daily through yearly volume views. Every exposed athlete table enables and forces Row Level Security.

The normalized tables are server-written projections. Authenticated browsers may read only their own rows, but cannot insert, update, or delete the projection or ledger directly. The future entity-event RPC must atomically validate one event, advance the entity version, update the projection, and advance the device cursor before automatic synchronization is enabled.

The browser receives only the project URL and publishable key. Never place a database password, secret key, legacy service-role key, or provider API key in this repository, a Vite variable, GitHub Pages, or the Obsidian vault.

The dedicated production project is ForgePath. Its migration history is repaired and checksum-locked to `migrations/manifest.json`; `audits/forgepath_acceptance.sql` provides the repeatable read-only production proof. Do not reuse the JB-OS or Roman TD database.

Follow `docs/product/SUPABASE_BACKEND_RUNBOOK.md`. Apply migrations from version control, run the acceptance audit after each deployment, and do not recreate the schema manually in Table Editor.
