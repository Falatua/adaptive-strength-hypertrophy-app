---
type: functional-ux-audit
aliases: [ForgePath Functional UX Audit 2026-08-10]
tags: [fitness, app, qa, ux, accessibility, mobile, desktop]
created: 2026-08-10
updated: 2026-08-10
status: verified
app_version: 0.35.0
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: verified
---

# ForgePath Functional UX Audit 2026-08-10

## Release Decision

ForgePath private alpha 0.35.0 passes the deep functional UX audit for the implemented local-first boundary. The audit covered control wiring, state persistence, data-path outcomes, keyboard and touch access, responsive containment, mobile and desktop wireframes, release metadata, console integrity, production performance, accessibility, security, and regression coverage.

The audit found and corrected five release-blocking defects and one release-integrity mismatch. No open blocker remains inside the implemented private-alpha scope. Cloud synchronization, authentication, AI integration, social features, and richer preference learning remain explicitly unimplemented rather than partially simulated.

## Confirmed Defects and Corrections

| Severity | Defect | User consequence | Correction | Proof |
|---|---|---|---|---|
| High | Library `Filters` button had no handler | A visible primary control did nothing | Added an expandable filter panel with `aria-expanded` and a stable controlled region | Desktop and mobile Library regression journey |
| High | Five Library category cards only showed a notice, while `My movements` searched for an unsupported `preferred:` token | Category browsing did not perform the promised task and favorites produced an empty result | Added real body-part, pattern, role, equipment, and preferred filters; category entry resets stale facets and moves to the browser | `My movements` returns 16 preferred movements; Hinge returns 4 canonical movements |
| High | Workout explanation used only a hover `title` | Progression reasoning was effectively unavailable on touch and weak for keyboard users | Added a native-dialog explanation showing the exact movement, decision, action, confidence, boundary, and engine explanation | Touch-safe dialog regression and Escape dismissal |
| High | Workout back arrow only posted a notice and could not leave the workout | The athlete was trapped in the active workout screen | Added persisted leave and resume state. Logged sets, active session identity, and training data remain intact | One logged set survives leave, Plan navigation, and resume |
| High | Plan pin announced success without changing the queue | The displayed confirmation was false and Today order did not change | Added a real open-session reorder operation and disabled pinning for the already active session | Hinge becomes the first unresolved priority in stored state |
| Medium | Backup exports still labeled the app as 0.31.0 | Diagnostics and exported metadata disagreed with the shipped build | Aligned package, visible rules, diagnostics, README, and backup metadata at 0.35.0 | Build and backup tests plus static version audit |

## Control and Data-Pipe Audit

- Audited 135 rendered button definitions across shipped React screens and components.
- Confirmed every button now has an explicit action, submit behavior, or disabled state. No handlerless button remains.
- Reviewed notice-only actions. Dismissal remains intentionally notice-only; category browsing, workout exit, and plan priority now mutate the appropriate state or navigation path.
- Verified Library filtering composes search, body region, movement pattern, training role, location availability, and exact favorite state without changing canonical exercise identity.
- Verified `Clear all` restores the 22-movement active catalog and filter categories do not inherit stale facets.
- Verified leaving a workout changes only presentation state. `activeSessionId`, completed-set flags, and the active session record remain intact.
- Verified resume does not restart the session, recompress its prescription, or create a second placement-verification event.
- Verified session pinning reorders only unresolved planned or deferred sessions. It does not move or mutate completed, partial, stopped, expired, or active truth.
- Verified the progression explanation is read-only. It cannot add sets, change a prescription, borrow another movement's history, or bypass pain and readiness gates.

## Responsive and Wireframe Audit

The five primary destinations were swept at 320 by 568, 393 by 851, 768 by 1024, 844 by 390 landscape, and 1440 by 900. All primary destinations reported zero page-level horizontal overflow.

- Phone and tablet actions use 44-pixel minimum touch targets where layout permits.
- The seven-column 320-pixel calendar retains 33 by 54 pixel day cells with spacing. This exceeds the WCAG 2.2 AA 24-pixel target minimum while preserving the full month without horizontal scrolling.
- Library category cards remain a swipeable strip on compact screens and a six-column overview on desktop.
- Filters wrap on narrow phones, remain scrollable and compact at wider widths, and expose written selected states through `aria-pressed`.
- Workout reasoning opens inside the existing contained native-dialog wireframe and does not create viewport overflow.
- Active-workout leave returns to the normal app shell with an obvious `Resume active workout` action. The navigation and session context remain visually coherent on phone and desktop.
- Desktop visual review retained the intended Pocket Training Field Guide hierarchy, readable evidence panels, original pixel accents, and clear task emphasis.

## Accessibility, Performance, and Security

- Lighthouse production desktop: Performance 100, Accessibility 100, Best Practices 100.
- Lighthouse production mobile at 390 by 844: Performance 98, Accessibility 100, Best Practices 100.
- Keyboard review confirmed focus-visible treatment, native-dialog Escape dismissal, and reachable navigation and control order.
- Browser console review across primary destinations and landscape mode found zero errors and zero warnings.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Gitleaks pre-commit scan: zero leaks.
- Static UI boundary QC passed across 64 shipped interface files.

The Impeccable detector reported two non-blocking design advisories: Inter and the Today route-grid background. Both are intentional product-register decisions. `DESIGN.md` explicitly assigns Inter to time-critical training data, and the route grid is a semantic field-guide surface rather than generic decoration.

## Automated Verification

- 191 deterministic tests passed across 20 files.
- 52 Playwright journeys passed across desktop Chromium and Pixel 5 mobile Chromium.
- The two added cross-device workflows specifically cover Library category and filter piping, touch-safe workout reasoning, active-workout leave and resume, logged-set conservation, and real Plan priority mutation.
- Production TypeScript and PWA build passed.
- Lint and automated UI boundaries passed.
- Manual browser review covered 320-pixel minimum width, phone portrait, tablet portrait, phone landscape, and desktop.

## Residual Product Boundaries

- Responsive operation is verified, but phone and laptop still use independent browser stores. Cross-device synchronization remains a future backend milestone.
- The compact calendar deliberately uses WCAG-compliant 33-pixel-wide date cells at the 320-pixel floor to preserve the complete seven-day grid.
- Rich contextual preference states beyond favorite and joint response remain specified but unimplemented.
- The UI audit does not validate medical safety, clinical outcomes, public multi-user security, or model-based coaching because those systems are not present in this release.

## Release Evidence

- Feature commit: `900010570c60981b2b2beeb58cf31f66b754ee37`
- App version: 0.35.0
- Backup schema: 24
- Local persistence: 22
- Functional audit date: 2026-08-10 America/Los_Angeles

Related: [[UX Audit 2026-08-10]], [[Private Alpha Implementation 2026-08-10]], [[Adaptive Strength and Hypertrophy App Build Bible]], [[App Requirements Register]], [[Build Bible Requirement Traceability Matrix]]
