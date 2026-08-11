# ForgePath Supabase Foundation

This directory is the version-controlled source for the dedicated ForgePath cloud project. The first migration creates the private-alpha account, device, append-only sync event, bootstrap snapshot, and preserved conflict tables. Every exposed table enables and forces Row Level Security.

The browser receives only the project URL and publishable key. Never place a database password, secret key, legacy service-role key, or provider API key in this repository, a Vite variable, GitHub Pages, or the Obsidian vault.

The current free Supabase organization already contains two active projects and cannot create ForgePath until an owner upgrades, pauses a project, or creates the project in another appropriate organization. Do not reuse the JB-OS or Roman TD database.

When a dedicated project exists, follow `docs/product/SUPABASE_BACKEND_RUNBOOK.md`. Apply migrations from version control and do not recreate the schema manually in Table Editor.
