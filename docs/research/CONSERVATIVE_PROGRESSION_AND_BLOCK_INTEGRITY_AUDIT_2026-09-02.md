---
type: research-and-implementation-audit
project: ForgePath
date: 2026-09-02
status: implemented-and-under-release-verification
confidence: verified
---

# Conservative Progression and Block Integrity Audit

## Decision summary

ForgePath 0.81.0 changes progression from single-exposure promotion to confirmation-first progression. It also makes an exercise change for the full training block propagate as one versioned transaction across future workouts, the open queue, movement placement, check-in provenance, and progression ownership. A separate migration and workout-start guard clears impossible completed state only from genuinely unstarted sessions.

## First-party RP findings

Renaissance Periodization's current help article says its app uses a small weekly weight percentage, substitutes repetitions when the next equipment increment is too large, and changes sets from pump, soreness, workload, and related response. It also keeps manual athlete control. Source: [RP Help Center, How does the app determine when to add weight, reps, and sets?](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)

RP's current set-progression article describes starting near minimum effective volume, lowering RIR every week or two, and adding sets gently only when performance, recovery, and stimulus evidence support more work. It notes that advanced athletes may progress fewer sets. Source: [RP Strength, In Defense of Set Increases Within the Hypertrophy Mesocycle](https://rpstrength.com/blogs/articles/in-defense-of-set-increases-within-the-hypertrophy-mesocycle)

RP's progression article gives a four-week 4, 3, 2, 1 RIR example, while explicitly allowing longer phases to hold 3 or 2 RIR for multiple weeks. It describes small load changes, such as five pounds weekly or moving dumbbells every two to three weeks, and a gradual rise in effort. Source: [RP Strength, Progressing for Hypertrophy](https://rpstrength.com/blogs/articles/progressing-for-hypertrophy)

Mike Israetel's official RP lecture says a mesocycle may keep RIR stable or let it decline, commonly begins around 3 to 4 RIR, and ends near 0 to 1 RIR before a deload. His worked example says week 1 at 3 RIR should lead to week 2 at at least 3 and possibly 2, not directly to 1. He also describes small load increases and a single added set when recovery supports it. Source: [Renaissance Periodization, Progression Within a Mesocycle](https://www.youtube.com/watch?v=DqQqE6oZdWY)

The complete transcript was captured for traceable review at `Sources/YouTube/2026-09-02 RP Progression Within a Mesocycle/Progression-Within-a-Mesocycle-Advanced-Hypertrophy-Concepts-and-Tools-Lecture-9-DqQqE6oZdWY/transcript.txt` in the shared vault.

## ForgePath translation

| Concern | 0.81.0 rule |
|---|---|
| New workout opens checked | Planned and deferred set state is normalized at migration and again at start. Active and terminal sessions are never cleaned. |
| Exercise changes leave stale future state | Every old planned or deferred session becomes an expired audit snapshot. New sessions are generated in the current round under the new plan version. |
| Check-ins lose their source | Retired sessions keep their original IDs and complete snapshots, so existing pre-workout and movement feedback references remain valid. |
| Replacement primary borrows old confidence | The selected primary receives a new movement-placement assessment with unknown exact evidence and a conservative calibration route. |
| Actual RIR becomes next target | Future plans copy the prior prescribed RIR, never the athlete's actual RIR. Direct history without a prescription starts at 3 RIR. |
| Week 2 becomes too hard | Round 2 holds the opening RIR target. Later reductions require two exact exposures and complete supportive movement feedback. |
| Effort falls too quickly | RIR changes by at most one. Rounds 3 and 4 have a 2 RIR floor. A 1 RIR target begins no earlier than round 5. |
| Load or reps rise after one good day | The exact target must be owned in two comparable exposures. A load jump above five percent is not automatic. |
| Sets rise too quickly | Set progression requires four comparable exposures, two target confirmations, manageable fatigue, early recovery, low stimulus, and exact `Could do more` feedback. Only one set may be added. |

## Authority and limits

The cited material informs product policy but does not copy or claim to reproduce RP's proprietary app algorithm. ForgePath remains deterministic, transparent, safety-gated, and athlete-controlled. Missing feedback means unknown, pain blocks overload, and every future-plan change remains an athlete-approved proposal.

## Acceptance contract

- Legacy schema 31 can repair false completion on open workouts without changing active or completed training.
- Starting a dirty planned workout renders zero `Done` controls and restores individual `Log set` actions.
- Full-block swaps retire deferred and planned originals, preserve linked check-ins and history, keep the current round number, and create the replacement progression lane.
- A stable 52-week athlete replay now progresses at roughly half the former pace, with eight load increases rather than seventeen in the fixed acceptance scenario.
- Deterministic, cross-browser, Pages, cloud-boundary, and live-release verification must pass before the release is called shipped.
