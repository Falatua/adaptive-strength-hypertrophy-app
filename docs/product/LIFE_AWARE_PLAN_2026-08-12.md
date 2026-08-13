# ForgePath Life-Aware Plan

Status: product contract for private alpha 0.53.0

## The athlete promise

ForgePath adapts the plan to the life the athlete actually lived. It preserves completed work, records missed work honestly, and uses the difference between the plan and reality to improve future programming. It does not shame the athlete, invent completed volume, or turn missed work into work they owe.

## Plain-language terms

| Athlete-facing term | Technical term | Meaning |
| --- | --- | --- |
| Starting-plan check | placement verification | A short review of how a completed main-lift workout compared with the app's initial expectation. |
| Main-lift starting plan | movement placement lane | The starting difficulty for one exact main lift. Bench, squat, and deadlift may start differently. |
| Training round | microcycle | The smallest group of important workouts that covers the current training priorities. Usually about a week, but not locked to Monday through Sunday. |
| Training block | mesocycle | Several training rounds aimed at one larger adaptation, such as strength, hypertrophy, powerbuilding, or a return to training. |
| Missed workout | missed opportunity | A planned workout that could not happen. It records a schedule constraint and earns no training credit. |

Internal technical terms can remain in code, database fields, and research notes. Athlete-facing screens use the plain-language term first and explain any technical term that is genuinely necessary.

## What volume debt means

Volume debt is the idea that if the plan prescribed 15 sets and the athlete completed 9, the remaining 6 sets are owed and should be repaid later. That can lead to doubling a later workout, cramming accessories into an already-fatiguing day, or forcing a higher-volume week merely to restore a planned total.

ForgePath does not use volume debt.

- The 9 completed sets stay completed and count normally.
- The 6 unfinished sets receive no volume or progression credit.
- The 6 sets are not copied into the next workout.
- Future sessions may be moved, reordered, shortened, or replaced, but only because that creates a better executable plan, not because the athlete owes work.
- If the original training priority still needs an exposure, ForgePath can preserve or reschedule that priority at a recoverable dose. This is protecting the goal, not repaying every missed set.

## Life-Aware decision flow

### 1. Record reality

The system stores completed sets, partial sessions, skipped questions, readiness, pain, available time, equipment, and the athlete's stated reason for a schedule change. Unknown information remains unknown.

### 2. Protect completed truth

Completed workouts, exact exercise identities, notes, records, and survey answers are immutable historical evidence. A schedule rebuild can only change unfinished future plans.

### 3. Rebuild the next useful opportunity

The next workout is selected from current priorities and filtered by the athlete's next realistic date, available minutes, location and equipment, pain or joint flags, and recent fatigue. The rebuild can move, reorder, compress, substitute, hold, or expire unfinished plans.

### 4. Make no automatic progression claim

Passing a calendar date does not earn load, repetitions, sets, experience points, or training-round completion. Progression uses completed work. The normal priority remains load first, repetitions second, and sets third, with athlete approval and recovery gates.

### 5. Learn at three horizons

#### Current training round

- If the important workouts were completed and recovery is acceptable, propose the next round and an eligible progression.
- If important work remains and the maximum span has not passed, propose extending the round or holding the same targets.
- If fatigue, pain, illness, or a long interruption makes continuation inappropriate, propose a recovery or return round.
- Never add catch-up volume.

#### Current training block

- One missed workout is a local schedule event, not proof the block is wrong.
- Repeated misses, repeated time compression, or recurring recovery trouble become a pattern.
- At the athlete-approved block review, compare planned opportunities, completed opportunities, completed sets, actual duration, pain, effort, and recovery.
- A new block version may propose fewer weekly sessions, shorter sessions, reduced baseline volume, different exercise choices, or a slower progression cadence.
- The prior version and completed history remain intact.

#### Long-term development

- Compare what the athlete planned with what they repeatedly completed and recovered from.
- Learn realistic schedule capacity by season and context without labeling the athlete unmotivated.
- Preserve earned strength and exercise history through irregular periods.
- Increase ambition when the athlete repeatedly completes and recovers from the plan; reduce friction when the plan repeatedly exceeds real capacity.

## Example

An athlete plans Monday squat, Wednesday bench, and Friday deadlift. The children are sick, so Wednesday and Friday cannot happen.

1. Monday squat remains completed and counts normally.
2. Wednesday and Friday receive no completed sets or volume.
3. The following week does not begin with the missed bench and deadlift sets stacked onto new workouts.
4. ForgePath examines the next realistic opportunity and may put bench first because it is an important unfinished exposure, then deadlift, while keeping each workout recoverable.
5. The current training round can stretch beyond seven days. It has not progressed merely because a new Monday arrived.
6. If this disruption is isolated, the broader training block may stay unchanged.
7. If two-session weeks repeatedly replace the planned three-session schedule, the next block review can propose a two-session base plan with an optional third workout. The athlete approves or rejects that change.

## Acceptance rules

- No missed workout may create completed set, repetition, load, volume, record, progression, or experience credit.
- No rebuild may change a completed workout.
- No rebuild may increase a later session solely to repay missed planned sets.
- The app must distinguish preserving an important lift exposure from repaying all missed volume.
- Training-round and training-block recommendations remain suggestions until the athlete approves them.
- Mobile and desktop must show the same reasoning and preserve the same source data.
- Athlete-facing copy must avoid unexplained placement, lane, exposure-round, microcycle, and mesocycle jargon.
