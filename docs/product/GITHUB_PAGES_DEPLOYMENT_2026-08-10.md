---
type: deployment-verification
aliases: [ForgePath GitHub Pages Deployment]
tags: [fitness, app, github-pages, deployment, qa, pwa]
created: 2026-08-10
updated: 2026-08-11
status: verified-live
app_version: 0.39.1
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: verified
---

# GitHub Pages Deployment 2026-08-10

## Outcome

ForgePath private alpha 0.39.1 uses GitHub Pages as its continuously updated hosted preview. The source repository `Falatua/adaptive-strength-hypertrophy-app` is public as of 2026-08-11. Every push to its `main` branch triggers one workflow that verifies the application, builds for the artifact repository's project subpath, and publishes only after every gate passes. The separate public repository `Falatua/adaptive-strength-hypertrophy-app-pages` remains the compiled hosting target so the existing quality-gated URL and deployment path stay stable.

Hosted URL: `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`

## Automatic Release Path

1. Check out the exact `main` commit.
2. Install locked dependencies with `npm ci`.
3. Run UI boundaries, backend schema boundaries, lint, 210 deterministic tests, and the normal production build.
4. Install Chromium and run all fifty-eight desktop and phone browser journeys.
5. Build the PWA for `/adaptive-strength-hypertrophy-app-pages/`.
6. Inspect the generated HTML, manifest, and service worker for Pages-safe paths.
7. Use a dedicated write-enabled deploy key scoped only to the public artifact repository.
8. Replace that repository's tracked artifact with `dist`, add the exact source SHA, and push one deployment commit.
9. Let the public repository's configured Pages source deploy the new artifact.

Any failure prevents the deployment job from starting. A manually copied branch is not the normal release path.

## Hosting and Privacy Boundary

- The GitHub source repository is public and shareable.
- The artifact repository and Pages URL are public and shareable.
- The source repository publicly exposes its tracked source, tests, and project-document snapshots. The artifact repository still receives only compiled files and `source-version.txt`. Obsidian vault material, local exports, and untracked files are not published.
- A new browser receives a neutral Demo Athlete seed and enters onboarding.
- Each hosted browser currently stores its own state locally because the ForgePath cloud release switch is intentionally closed.
- The compiled client contains a dormant invite-only authentication and explicit snapshot-sync foundation. Cloud configuration is browser-safe and optional; no project URL or publishable key was shipped in this release.
- The live ForgePath database exists and passes its migration, RLS, RPC, replay, conflict, and simulated isolation gates, but cloud backup, phone-to-laptop recovery, background hydration, device revocation UI, automatic merge, and active-workout handoff are not active on the hosted preview.
- Clearing browser site data removes that browser's state unless the athlete exported a backup first.
- No credentials, API keys, private exports, or identifiable friend data belong in the compiled artifact.

## Public Source Transition 2026-08-11

- Source repository visibility changed from private to public at JB's request.
- A full redacted Git-history scan covered 59 commits and found no credential leaks before the visibility change.
- Unauthenticated GitHub and Pages requests both returned HTTP 200 after the change.
- The source repository homepage now points to the live Pages URL.
- The cloud release variable remains unset, so this visibility change does not activate Supabase in the hosted bundle or enable public athlete signup.
- The existing artifact repository, project-subpath URL, and quality-gated deployment workflow remain unchanged.

## Local Verification

- Standard production build passes.
- The Pages build prefixes compiled resources under the public artifact repository's project subpath.
- `manifest.webmanifest` launches and scopes the PWA to `/adaptive-strength-hypertrophy-app-pages/`.
- The generated service worker contains the navigation fallback.
- The Pages artifact check rejects root-only asset references.
- The CI phone project uses an exact 390 by 844 viewport, and the Today composition preserves buffer above the fold for the primary start action across runner font and timing variation.

## Verified 0.39.1 Release Evidence

- Private source release: `42f0eec63ae21f595d0be889004f559a0e07b632`.
- Successful private-source workflow: `31507800273`.
- Public compiled-artifact commit: `32d20faf486c6ecbf41523d8de703bbfc15bcf2a`.
- Successful public Pages workflow: `31508592285`.
- Live `source-version.txt` exactly matched the private source release and the app root returned HTTP 200.
- The compiled artifact contains `Release gate closed` and `0.39.1 private alpha` but does not contain the ForgePath Supabase project reference.
- Fresh 1440 by 900 desktop and 390 by 844 phone contexts completed Quick Start, opened You, displayed the closed release gate and working local backup, had zero horizontal overflow, and produced zero console or page errors.
- An existing Chrome tab initially showed the prior 0.39.0 service-worker shell, then received 0.39.1 on the next navigation without clearing workout storage. This matches the auto-update PWA contract and is recorded so stale installed shells are not mistaken for failed cloud synchronization.

## Verified 0.39.0 Release Evidence

- Private source feature commit: `22f1d0b30450a8fd1ec964bf9d536a9e07f95a24`.
- Successful private-source workflow: `31462496701`.
- Public compiled-artifact commit: `4e1994f89fcd18ba937a76ca985f5959c8dad78a`.
- Successful public Pages workflow: `31462938374`.
- Live URL: `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`.
- The live `source-version.txt` exactly matched the private source feature commit, and the app root returned HTTP 200.
- Fresh 1440 by 900 desktop and 390 by 844 phone sessions completed Quick Start, started the workout without a survey, wrote an exact Competition Bench Press note, left the workout active, opened that exact movement in Library, and recovered the complete note.
- Both live viewports had no horizontal overflow and produced zero console or page errors.
- Visual evidence is stored locally under `output/playwright/live-movement-notes-desktop.png` and `output/playwright/live-movement-notes-mobile.png`; these screenshots are intentionally excluded from Git.
- That release predates the dedicated backend activation, so its hosted note remained local to that browser.

## Verified 0.38.0 Release Evidence

- Private source feature commit: `fb8cc2680a38ea71f935d1de3801f1f6d91a7018`.
- Successful private-source workflow: `31460513415`.
- Public compiled-artifact commit: `961cd407e0d2597603f594575f714723e2414af9`.
- Successful public Pages workflow: `31460913708`.
- Live URL: `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`.
- The live `source-version.txt` exactly matched the private source feature commit during release verification, and the app root returned HTTP 200.
- Fresh desktop and 390 by 844 phone sessions rendered onboarding, completed Quick Start, navigated to You, and showed `Dedicated project pending`, `Local training stays available`, `Backup and recovery`, and `0.38.0 private alpha`.
- Both live viewports matched their exact widths with no horizontal overflow and produced zero console or page errors.
- Visual evidence is stored locally under `output/playwright/live-cloud-foundation-desktop.png` and `output/playwright/live-cloud-foundation-mobile.png`; these screenshots are intentionally excluded from Git.
- The backend remains unprovisioned because Falatua's Org was confirmed at its two-active-free-project limit. JB-OS and Roman TD Global Leaderboard were not modified or reused.

## Verified 0.37.0 Release Evidence

- Private source feature commit: `1195180d11e4b2ddf8de98fc9eb8cef64226d00a`.
- Successful private-source workflow: `31457517568`.
- Public compiled-artifact commit: `875d343c23e3ddc7cf92b3ba6dab8827780e47ef`.
- Successful public Pages workflow: `31457920808`.
- Live URL: `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`.
- The live `source-version.txt` matched private source feature commit `1195180d11e4b2ddf8de98fc9eb8cef64226d00a` during release verification.
- Unauthenticated HTTP checks returned 200 for the app and source identity.
- A fresh phone browser rendered onboarding, Quick Start created a neutral Demo Athlete profile, and Today rendered rules version 0.37.0.
- Across Today, Plan, Progress, Library, and You, visible headings retained at least a 1.04 line-height ratio and measured eyebrow or supporting-copy gaps retained at least eight pixels. The open pre-session dialog measured a 1.15 title line-height ratio and a ten-pixel title-to-copy gap.
- At 390 by 844, the primary start action ended at 650 pixels and fixed navigation began at 781 pixels. Desktop and phone consoles contained zero errors or warnings.
- Visual evidence is stored locally under `output/playwright/spacing-live-onboarding-mobile.png`, `output/playwright/spacing-live-mobile.png`, `output/playwright/spacing-live-desktop.png`, and `output/playwright/spacing-live-modal-desktop.png`; these screenshots are intentionally excluded from Git.

## Prior 0.36.0 Baseline Evidence

- Private source feature commit: `8257a8b6b0e94eaf6a0eefb4cf78302fee8335dc`.
- Mobile gate hardening commit: `888b5d8669d8106455a76d4e96df5f4d34da9a30`.
- Successful private-source workflow: `31455623333`.
- Public compiled-artifact commit: `4b7c3c432ff323c24dd7f115a51793955857f885`.
- Successful public Pages workflow: `31456005382`.
- Live URL: `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`.
- The live `source-version.txt` exactly matches private source commit `888b5d8669d8106455a76d4e96df5f4d34da9a30`.
- Unauthenticated HTTP checks returned 200 for the app, icon, manifest, and service worker. The manifest start URL and scope both use `/adaptive-strength-hypertrophy-app-pages/`.
- A fresh desktop browser showed onboarding, Quick Start created a neutral Demo Athlete profile, and Today rendered private alpha 0.36.0 with zero console errors or warnings.
- At an exact 390 by 844 viewport, the primary start action remained fully visible above the fixed navigation. The check-in chooser opened, Library navigation completed, and the browser console remained clean.
- Visual evidence is stored locally under `output/playwright/pages-live-desktop.png` and `output/playwright/pages-live-mobile.png`; these screenshots are intentionally excluded from Git.
