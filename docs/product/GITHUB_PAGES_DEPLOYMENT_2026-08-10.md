---
type: deployment-verification
aliases: [ForgePath GitHub Pages Deployment]
tags: [fitness, app, github-pages, deployment, qa, pwa]
created: 2026-08-10
updated: 2026-08-10
status: verification-in-progress
app_version: 0.36.0
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: verified-local
---

# GitHub Pages Deployment 2026-08-10

## Outcome

ForgePath private alpha 0.36.0 uses GitHub Pages as its continuously updated hosted preview. Every push to private source repository `Falatua/adaptive-strength-hypertrophy-app` on `main` triggers one workflow that verifies the application, builds for the public artifact repository's project subpath, and publishes only after every gate passes. GitHub's current plan does not support Pages directly from the private repository, so the separate public repository `Falatua/adaptive-strength-hypertrophy-app-pages` receives compiled files only.

Hosted URL: `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`

## Automatic Release Path

1. Check out the exact `main` commit.
2. Install locked dependencies with `npm ci`.
3. Run UI boundaries, lint, 191 deterministic tests, and the normal production build.
4. Install Chromium and run all fifty-two desktop and phone browser journeys.
5. Build the PWA for `/adaptive-strength-hypertrophy-app-pages/`.
6. Inspect the generated HTML, manifest, and service worker for Pages-safe paths.
7. Use a dedicated write-enabled deploy key scoped only to the public artifact repository.
8. Replace that repository's tracked artifact with `dist`, add the exact source SHA, and push one deployment commit.
9. Let the public repository's configured Pages source deploy the new artifact.

Any failure prevents the deployment job from starting. A manually copied branch is not the normal release path.

## Hosting and Privacy Boundary

- The GitHub source repository remains private.
- The artifact repository and Pages URL are public and shareable.
- Only compiled files and `source-version.txt` are published. Source, tests, project documents, and vault material remain private.
- A new browser receives a neutral Demo Athlete seed and enters onboarding.
- Each browser stores its own state locally. There is no shared account or shared workout database.
- Authentication, cloud backup, phone-to-laptop synchronization, active-workout handoff, server-side encryption, and private access control are not implemented.
- Clearing browser site data removes that browser's state unless the athlete exported a backup first.
- No credentials, API keys, private exports, or identifiable friend data belong in the compiled artifact.

## Local Verification

- Standard production build passes.
- The Pages build prefixes compiled resources under the public artifact repository's project subpath.
- `manifest.webmanifest` launches and scopes the PWA to `/adaptive-strength-hypertrophy-app-pages/`.
- The generated service worker contains the navigation fallback.
- The Pages artifact check rejects root-only asset references.
- Final GitHub workflow, commit, and live mobile and desktop evidence will be added after deployment completes.
