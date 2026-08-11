---
type: deployment-verification
aliases: [ForgePath GitHub Pages Deployment]
tags: [fitness, app, github-pages, deployment, qa, pwa]
created: 2026-08-10
updated: 2026-08-10
status: verified-live
app_version: 0.37.0
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: verified
---

# GitHub Pages Deployment 2026-08-10

## Outcome

ForgePath private alpha 0.37.0 uses GitHub Pages as its continuously updated hosted preview. Every push to private source repository `Falatua/adaptive-strength-hypertrophy-app` on `main` triggers one workflow that verifies the application, builds for the public artifact repository's project subpath, and publishes only after every gate passes. GitHub's current plan does not support Pages directly from the private repository, so the separate public repository `Falatua/adaptive-strength-hypertrophy-app-pages` receives compiled files only.

Hosted URL: `https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/`

## Automatic Release Path

1. Check out the exact `main` commit.
2. Install locked dependencies with `npm ci`.
3. Run UI boundaries, lint, 191 deterministic tests, and the normal production build.
4. Install Chromium and run all fifty-four desktop and phone browser journeys.
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
- The CI phone project uses an exact 390 by 844 viewport, and the Today composition preserves buffer above the fold for the primary start action across runner font and timing variation.

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
