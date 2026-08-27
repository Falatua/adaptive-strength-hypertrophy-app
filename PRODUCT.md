# Product

## Direct Historical Performance Entry

An athlete who begins ForgePath with useful training history must be able to open an exact movement in the Exercise Library and add a truthful past performance without creating a fake planned workout. The first complete flow captures training date, number of sets, repetitions, weight, pounds or kilograms, RIR or RPE, and an optional incline angle. Optional technique, pain or irritation, session name, and setup note add useful context without becoming required onboarding friction.

Every entered set belongs to the exact selected movement and appears in completed history, records, placement evidence, and later exact-movement load selection. RPE is preserved as the athlete entered it while the deterministic engine converts it to the shared RIR scale. Skipped effort, technique, or pain remains explicitly unknown. The system does not infer readiness, recovery, plan completion, or quality from numbers alone.

Direct history is reversible and auditable. The athlete sees a complete preview before saving, may correct or delete individual sets later, and may undo the latest entry or correction. Entries persist through the same validated cloud-authoritative snapshot as completed workouts and survive app updates, refreshes, and backup migration.

## Register

product

## Users

The first user is JB, an experienced strength and hypertrophy athlete, parent, UX practitioner, designer, and game developer whose training schedule can change because of children, sleep, pain, work, travel, and available equipment. He knows how to lift and does not need a technique-video course. He needs a fast, trustworthy training tool that preserves progress across irregular real life and becomes more personally useful through completed work and explicit feedback.

Later private users may have different training ages and goals, but the product should still assume they value control, clear reasoning, and honest evidence over generic coaching theater.

## Product Purpose

ForgePath is a private adaptive strength and hypertrophy operating system. It protects meaningful strength anchors, allocates recoverable hypertrophy work, records exact completed training, adapts schedules without inventing debt, and explains what changed. It should work quickly during a workout on a phone and support deeper planning and analysis on a laptop. Success means the athlete always understands the best next useful action, retains longitudinal truth, and can correct the system without fighting it.

## Brand Personality

Grounded, playful, exacting.

The interface should feel like an experienced training partner with the quiet delight of a beloved handheld adventure. It can be warm, clever, and collectible, but never childish, loud for its own sake, or vague about training truth.

## Anti-references

- Generic dark fitness SaaS with neon gradients, interchangeable cards, bodybuilding stock imagery, and gym-bro copy.
- Exercise-video libraries, instructional feeds, form uploads, or video-first workout flows.
- A superficial game skin that adds points, streak pressure, clutter, or mascot interruptions without improving the training experience.
- Direct copies of Pokémon creatures, names, maps, badges, menus, sounds, fonts, evolution screens, or other protected expression.
- Glossy AI-looking art, inconsistent sprites, melted anatomy, fake pixel art, random decoration, and unreviewed generated assets.
- Interfaces that hide uncertainty, silently rewrite history, punish missed workouts, or imply that more work is always better.
- Dense dashboards that require reading every card before the athlete can act.

## Design Principles

1. Training first, adventure second. The active set, next action, and safety state always outrank decoration.
2. Familiar craft, original world. Draw emotional and visual lessons from Game Boy Advance-era adventures while creating independent characters, places, symbols, language, and progression.
3. Show the truth and its source. Completed work, estimates, unknowns, recommendations, and learned hypotheses stay visibly distinct and auditable.
4. Make irregular life feel supported. Missed training, reduced sessions, and returns should produce calm adaptation, not shame or broken streaks.
5. Earn delight through progress. Use pixel moments, micro wins, companion reactions, and world changes only when a real source-backed event justifies them.
6. Build for JB-level scrutiny. Verify responsive behavior, accessibility, data conservation, exact identity, sprite quality, copy, and edge cases before delivery.

## Athlete-Controlled Dose and Technique

- Weekly volume and deload outputs are suggestions. The athlete explicitly approves any future-plan change; ForgePath never silently edits a session from an analysis screen.
- Good-day extra work remains unrestricted while the workout is active and pain has not changed training. Every added set or movement is visibly athlete-authored, counts as completed dose, and can inform the next microcycle or mesocycle review without automatically earning more work.
- Straight sets are the foundation. Primary movements and secondary builders remain straight-set work so their progression and fatigue stay comparable.
- Drop sets, myo-reps, and supersets may be suggested only on stable accessory or tertiary work, no more than two technique blocks per session. Each suggestion states its purpose: time efficiency, a controlled late-session pump, or concentrated additional volume.
- Supersets require zero catalogued muscle overlap. Myo-reps and drop sets belong late in a movement, with the leading set retaining the progression target while every completed mini-set or drop still counts toward dose.
- A first-time athlete starts with a blank training record. Established-history scenarios are test fixtures, never user-facing demo data.

## Feedback-Gated Progression

- Every progression is a proposal. The athlete approves future-plan changes; completed work and the active session are never silently rewritten.
- Progression follows the priority load, then repetitions, then sets. The latest exact prescribed exposure must own the current target before any increase is considered.
- Older sessions cannot fill missing sets in an incomplete latest exposure. Athlete-added work and reduced-load technique work count as dose but cannot automatically earn overload.
- Missing RIR, technique, pain, stimulus, fatigue, or recovery remains unknown. It may lower confidence or hold a decision, but it never becomes failure, zero pain, or poor compliance.
- Harder-than-expected work, excessive fatigue, poor recovery, pain, or declining comparable performance outranks landmark math and blocks an increase.
- A set increase is a last-resort recovered-dose option, not the default outcome of reaching a rep target. It requires repeated comparable evidence, low stimulus, manageable fatigue, early between-session recovery, and no available sensible load or repetition increase.
- Muscle performance comparisons require the same canonical exercise and recorded setup. Different movements and different incline angles remain separate evidence lanes.

## Life-Aware Planning

Athlete-facing language uses **training round** for a microcycle and **training block** for a mesocycle. Technical names may remain in schemas and research documents, but ordinary screens must define them before use and prefer the plain-language names.

- A training round is the current group of important workouts, usually about a week but allowed to stretch when life interrupts it. Calendar days schedule the work; only completed work advances the training clock.
- A training block is several training rounds serving one larger strength or hypertrophy goal. Its length is a planning estimate, not proof that the athlete completed the intended work.
- A missed opportunity means a planned workout could not be performed. It is schedule evidence, not failure, noncompliance, or completed training.
- A partial workout keeps every completed set as source truth. Unfinished sets receive no repetitions, load, volume, progression, points, or record credit.
- **Volume debt** means treating missed planned sets as work the athlete must repay later. ForgePath prohibits volume debt. It never doubles the next workout, crams missed accessories into later sessions, or adds sets merely to make the plan spreadsheet whole.
- After missed work, only open future plans may move, shorten, reorder, substitute, hold, extend, recover, or expire. Completed workouts never change.
- The current training round may extend, hold its targets, or enter recovery. The next round may progress load, then repetitions, then sets only when enough important work was completed and recovery supports the change.
- One disrupted round does not erase earned progress or automatically lower the plan. Repeated differences between planned and completed training become evidence at the next athlete-approved training-block review. The proposal may reduce weekly frequency, session length, or planned volume to match sustainable reality.
- Every future-plan change is a suggestion with a plain-language reason. The athlete approves it. Life-aware adaptation is never silent and never punitive.

Life-aware decisions separate the cause of interruption before changing training:

- Family, work, travel, time, and equipment are schedule evidence. They can move, reorder, compress, substitute, or expire open work without asserting that fitness was lost.
- Sleep, stress, fatigue, and low energy are readiness evidence. They can require warm-up or first-set confirmation and can remove optional fatigue when several current signals agree, but one answer never creates an automatic percentage reduction.
- Pain and illness use a distinct safety and return path. The app can adjust programming and suggest professional review, but it cannot diagnose or imply medical clearance.
- A long gap makes old exact performance less current. ForgePath preserves the achievement and requests a non-maximal re-entry confirmation instead of demoting the athlete or assuming a universal detraining curve.

The engine explains decisions at three horizons: what to do today, what happens to the current training round, and what repeated evidence may propose at the next athlete-approved training-block review.

## Training-Block Blueprint

- Before the athlete starts or revises a training block, ForgePath shows the complete repeatable weekly structure: every training day, primary movement, secondary builder, accessory, tertiary movement, planned role, set and repetition target, approximate time, number of rounds, and recovery-review point.
- ForgePath suggestions are a starting blueprint, not a command. The athlete can replace a main lift, builder, accessory, or tertiary movement once at the block level instead of repeating the same change in every workout.
- A block-level movement choice, including an optional incline back-pad angle, stays stable in later training rounds until the athlete approves another revision. Load, repetitions, recoverable dose, scheduling, and recovery recommendations may adapt from completed evidence without changing that movement contract silently.
- Planned block sets, minutes, and dates are visibly estimates. They never enter completed volume, records, progression, or confidence until the work is actually completed.
- When a block finishes, ForgePath begins the next-block draft from the completed movement map. Exact completed-set feedback and saved preferences may suggest keep, review, or change, but the athlete chooses whether to reuse or replace each movement.

## Ongoing Calibration and Confidence

Calibration is a permanent learning loop, not a one-time onboarding gate. Confidence describes how much relevant evidence ForgePath has for one decision, never how capable or compliant the athlete is.

- Keep separate confidence for exact main-lift targets, schedule fit, recovery response, and volume tolerance. These areas may legitimately disagree.
- Use the states uncalibrated, early evidence, developing, well calibrated, and stale. Do not present an unsupported probability.
- Exact exercise and recorded setup identity, including incline angle where applicable, outrank neighboring movement history.
- Repeated completed exposures, recency, RIR coverage, quality and joint feedback, recovery evidence, and context match can increase confidence.
- Missing or skipped answers reduce certainty only. They never become negative readiness, motivation, recovery, pain, or adherence evidence.
- Goal, equipment, movement, setup, pain, schedule, or continuity changes trigger a focused refresh of the affected decision. They do not reset the athlete's entire history.
- Every confidence lane states its sources, limitations, and the smallest optional `Learn next` action that would reduce uncertainty.

## Exercise Preferences

- Every movement has one programming preference: preferred, neutral, or avoid. The Library presents these as clear thumbs-up and thumbs-down controls with written labels.
- Library body regions and movement patterns use original labeled ForgePath glyphs. A pattern or family icon is navigational guidance, not a claim that one generic drawing exactly depicts every exercise variation.
- Preferred movements rank higher when ForgePath selects new secondary work, accessories, or substitutions. Preference never overrides pain, equipment availability, goal specificity, or completed-history truth.
- Avoided movements are excluded from newly generated secondary work, accessories, and substitution recommendations.
- Marking a current protected main lift as avoid does not silently remove or replace it. ForgePath keeps the current plan intact, explains the conflict, and waits for the athlete to approve a training-block revision.
- Programming preference and joint response remain separate. "I do not like this" is not automatically recorded as pain, and an irritating joint response is not reduced to personal taste.

## Forge Journal Progress

- Forge levels and the Uncharted, Established, Well mapped, and Long record forms describe how much completed evidence this ForgePath journal has recorded.
- Journal progress never labels the athlete as a beginner, novice, or apprentice and never overrides stated training age, movement skill, current readiness, or athlete judgment.
- Points come only from completed work and source-backed records. They are a return-and-recall layer, not a skill score or compliance grade.

## Angle-Aware Incline Setups

- Back-pad angle is an optional per-set setup variable for incline movements that use an adjustable bench. Leaving it blank means untracked, never zero degrees.
- The workout offers common ABX back-pad positions as convenient presets while allowing any value from 0 to 90 degrees because equipment detents and real pad angles vary.
- An athlete may apply one angle to every set, build a high-to-low or low-to-high set ladder, or enter each set independently.
- Progression recommendations, volume comparisons, personal records, and micro wins compare only the same exact movement and recorded angle. A mixed-angle ladder is tracked as completed work but does not receive a misleading single-angle PR prompt.
- Angle labels describe setup evidence, not guaranteed muscle recruitment or difficulty. ForgePath does not infer that one angle is better, safer, harder, or more effective without the athlete's own comparable history and feedback.
- Completed angle setups carry into future training-block generation as editable suggestions. The athlete can change or clear them at any time.

## Accessibility & Inclusion

Target WCAG 2.2 AA for all core workflows. Support keyboard and touch input, screen readers, large text, sufficient contrast, non-color state labels, reduced motion, silent operation, optional haptics, focused-training mode, and a modern non-pixel typeface for numerical and explanatory content. Pixel art and game language are enhancement layers and can never be required to understand or complete training.
