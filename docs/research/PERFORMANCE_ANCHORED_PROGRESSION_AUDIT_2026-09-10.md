---
type: research-audit
tags: [fitness, app, progression, research, qa]
created: 2026-09-10
updated: 2026-09-10
status: implemented
confidence: verified
---

# Performance-Anchored Progression Audit

## Reported Failure

JB supplied active-workout evidence in which a completed 185-pound performance became a 150-pound target and a projected 135-pound next target. A separate weighted movement fell from 135 to 105 to 95 pounds. Plain bodyweight pull-ups moved from 6 / 5 / 5 to 12 / 12 despite no demonstrated twelve-repetition capacity. The active workout also lacked a direct exact-movement history view.

## Primary Source Translation

Renaissance Periodization's official progression guide describes hypertrophy progression as small changes to load, repetitions, or sets, with a modest intensity increase intended to keep repetitions roughly stable rather than lowering both load and productive work. Source: [Progressing for Hypertrophy](https://rpstrength.com/blogs/articles/progressing-for-hypertrophy)

RP's official app documentation says the system usually increases weight by a few percent, increases repetitions when the available equipment jump is too large, and changes sets in response to pump, soreness, workload, and recovery feedback. Past feedback continues to inform later recommendations. Source: [How does the app determine when to add weight, reps, and sets?](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)

Mike Israetel's official RP video demonstrates the practical translation: after 100 for 10, the next small step is approximately 105 for 10 or 100 for 11. If the athlete manually chooses a lighter load, the repetition target rises; if the athlete chooses a heavier load, the repetition target falls. A materially different load requires honest RIR rather than pretending the prediction is exact. The local source transcript is stored in the shared vault under `Sources/YouTube/Renaissance Periodization Training Corpus 2026-08-09/How-To-Progress-On-Your-Lifts-For-Guaranteed-Gains-ft-RP-Hypertrophy-App-PArkkMc3iXE/transcript.txt`. Source: [How To Progress On Your Lifts For Guaranteed Gains](https://www.youtube.com/watch?v=PArkkMc3iXE)

The product translation is not a clone of RP's software. ForgePath retains its existing exact-movement, athlete-approval, missing-is-unknown, pain-first, and two-exposure confirmation rules. The useful source principle is that load and repetitions are linked expressions of demonstrated performance, and that actual completed work must become the next decision's anchor.

## Root Cause

1. `progression-v3` treated a broad returning or reacclimation state as a reason to reduce the target on every evaluation, even after a recent exact re-entry exposure.
2. Route generation applied a generic percentage to estimated strength instead of solving for a target load that matched the latest completed load, repetitions, and prescribed effort lane.
3. Returning secondary and accessory repetition floors overrode exact plain-bodyweight capacity, allowing 6 / 5 / 5 to become 12 / 12.
4. An already approved workout could preserve a stale target, but its progress path did not distinguish that mismatch from a useful conservative hold.
5. The workout showed only one condensed last-exposure fact and did not expose recent exact sessions for verification.

## Implemented Contract

- `progression-v4` applies a return reduction only when no exact exposure has been completed in the preceding fourteen days.
- Future route loads are performance-matched to the latest comparable entered exact session and rounded to the selected equipment profile.
- Plain bodyweight generation retains the exact completed set scheme. A supported review adds at most one total repetition to the lowest set.
- `movement-progress-path-v4` identifies a weighted target below ninety-five percent of recent estimated performance or a bodyweight target more than one repetition beyond the prior best set or session total. It points back to proven performance without editing the active workout.
- Every movement card includes up to five recent comparable sessions from the same exercise, setup, and load mode.

## Acceptance Matrix

| Case | Required result |
|---|---|
| Completed 185 for 8, saved target 150 for 8 | Path returns to proven performance and does not project 135 |
| Completed 135 for 8, route requests 10 repetitions | Load is translated from the completed performance rather than multiplied by an unrelated percentage |
| Completed bodyweight 6 / 5 / 5, saved target 12 / 12 | Path returns to 6 / 5 / 5 |
| Two supported bodyweight exposures at 6 / 5 / 5 | Next round is 6 / 6 / 5, not 12 / 12 |
| Recent exact exposure while profile remains returning | Ordinary hold or progression gates apply, not another reduction |
| New genuine long gap | Conservative re-entry remains available |
| Active movement history | Same exact exercise, comparable setup, and load mode only; load, repetitions, RIR, and volume remain readable |
| Current workout authority | Guidance stays display-only; athlete-entered set rows remain unchanged |

## Evidence

- 578 deterministic tests pass, including direct weighted and bodyweight regression fixtures.
- The production TypeScript and PWA build passes.
- A headed browser check shows the history disclosure in the active workout with zero current console errors.
- The desktop Chromium, Android-style mobile Chromium, and iPhone WebKit suites remain the cross-device release gate.
