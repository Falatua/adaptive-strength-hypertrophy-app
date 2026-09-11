# Mike Israetel Long-Term Programming Audit

Date: 2026-09-10

Status: Implemented translation with ForgePath athlete-authority constraints

## Primary video corpus

- [Build YOUR OWN Training Program With RP](https://www.youtube.com/watch?v=qVbhlDw0eqM), Renaissance Periodization, 9:41
- [Mesocycle Progressions for Hypertrophy](https://www.youtube.com/watch?v=9L9pc-Pb9Bo), Juggernaut Training Systems with Dr. Mike Israetel, 10:44
- [Periodization for Bodybuilding: Macrocycle Design, Rates of Gain, Minicuts](https://www.youtube.com/watch?v=jH6QopDVRsM), Dr. Swole with Dr. Mike Israetel, 46:34
- [Is Your Exercise Selection Maximizing Muscle Gains?](https://www.youtube.com/watch?v=nLIiy62w_mY), Renaissance Periodization, 24:53

The complete analyzed runtime is 91 minutes 52 seconds. Full transcripts, captions, and metadata are stored in the shared Obsidian source archive.

## Source synthesis

1. A program is hierarchical. Sets and exercises form sessions, sessions form microcycles, accumulation plus recovery forms a mesocycle, several mesocycles can serve one development block, and blocks are sequenced across a macrocycle or training year.
2. Long-range planning begins with a needs analysis and a real endpoint. The coach works backward from that endpoint rather than filling a generic annual calendar.
3. An accumulation mesocycle starts recoverably, increases training stress only as the athlete adapts, and ends in an explicit fatigue and outcome decision. Added work should be biased toward recoverable higher-repetition volume rather than endless heavy work.
4. Volume changes depend on stimulus, soreness or recovery, performance, and fatigue together. Preserved performance and early recovery can support more work. Falling performance with accumulated fatigue supports holding, reducing, or recovering.
5. Exercise selection should prioritize the target muscle as the limiting factor, useful tension through a large range of motion, joint comfort, personal stimulus, a favorable stimulus-to-fatigue ratio, enjoyment, and the ability to progress.
6. Movement trials need time. An intermediate should generally keep a movement for roughly a mesocycle before judging it from personal response. Advanced athletes gradually build a personal menu of productive movements and choose among them according to context and fatigue overlap.
7. Stable programs can commonly run for two or three mesocycles before a larger redesign. Specialization is constrained by session quality and recovery, not by the desire to add everything at once.
8. Active rest and resensitization are needs-based. They are not generic calendar events, and advanced athletes are more likely than beginners to require them during a training year.

## ForgePath translation

- `program-horizon-v1` exposes the current mesocycle, multi-block development phase, and training-year planning rule. It records actual block and recovery evidence from the last twelve months and refuses to fabricate an annual schedule.
- `volume-progression-v4` removes the old rule that automatically converted the final planned round into a deload. The final round remains accumulation. A separate athlete-approved review decides recovery, continuation, or a new focus.
- `exercise-development-v1` assesses repeated exact movement sessions, observation span, pain, technique, target stimulus, recovery, and performance. The assessment ranks suggested builders and accessories and powers the completed-block movement review.
- New-block round count starts from continuity and training age but remains editable. This is a conservative planning default, not a capability judgment.
- An approved recovery round may reduce a bodyweight movement's set count while preserving the completed repetition scheme. It cannot convert 6 / 5 / 5 into an invented 12 / 12 prescription.

## Deliberate ForgePath boundaries

ForgePath does not copy every coaching heuristic literally. It retains stricter athlete-control rules: two comparable confirmations before ordinary overload, a bounded load increase, a single-set ceiling after repeated exact evidence, conservative RIR progression, unknown feedback remaining unknown, pain precedence, and explicit approval before a block or recovery decision changes future training.

## Acceptance

Deterministic coverage includes program hierarchy and annual missingness, stage transitions, final-round volume behavior, exact-movement learning thresholds, pain and low-stimulus review, structured-fatigue and athlete-added exclusions, recovery-round bodyweight preservation, Plan-screen horizon copy, and all prior progression regressions. All 591 deterministic tests and 168 cross-browser journeys pass locally. Hosted workflows, source-marker parity, and live behavior remain release gates before this audit is marked deployed.
