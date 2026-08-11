---
type: requirements-register
aliases: [Adaptive Training App Requirements, App Requirements Register]
tags: [fitness, app, requirements, source-of-truth, continuity]
created: 2026-08-09
updated: 2026-08-10
status: active
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: from-user
---

# App Requirements Register

## Purpose
This is the canonical traceability index for every durable requirement JB states about the app. Detailed models live in the linked project notes, but no user requirement is considered captured until it appears here.

## Standing Continuity Rule
- After every substantive conversation about this app, update this register and the relevant detailed project note in the same turn.
- Record user requirements, decisions, corrections, research findings, assumptions, open questions, and superseded ideas.
- Preserve JB's intended meaning rather than storing raw transcripts.
- Mark provenance as `from-user`, `research-supported`, `product-decision`, `heuristic`, or `open`.
- Never store passwords, secrets, or unnecessary sensitive health details.
- Treat the Obsidian project as canonical. Chat history is temporary context.

## Requirements

### R-001 Hybrid Training Foundation
- Status: captured
- Provenance: from-user
- Requirement: Combine the useful adaptive-strength and powerbuilding ideas associated with JuggernautAI and the muscle-level hypertrophy progression ideas associated with the RP Hypertrophy App into an original personal system.
- Detail: [[Adaptive Strength and Hypertrophy App]]

### R-002 Lifelong Personalization
- Status: captured
- Provenance: from-user
- Requirement: The app should keep learning about the athlete forever so week-to-week and month-to-month inputs continually improve future programming.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-003 Daily, Weekly, and Monthly Volume
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: Track training volume daily, weekly, and monthly using `sets x reps x load` for uniform work and the sum of `actual reps x actual load` for logged sets.
- Product refinement: Also provide rolling 7-day, rolling 28-day, exercise, muscle, session, and training-block views.
- Detail: [[Progression and Volume Model]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] includes Today, rolling 7-day, rolling 28-day, calendar-month, calendar-year, and all-time source-set volume views.

### R-004 Volume Context
- Status: implemented-partial
- Provenance: research-supported and product-decision
- Requirement: Do not treat tonnage as the only workload or progress measure. Pair it with sets, reps, top and average load, RIR/RPE, estimated strength, muscle exposure, pain, technique, duration, and completion.
- Detail: [[Progression and Volume Model]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] pairs selected-period volume with completed sets, repetitions, average actual load, sessions, active days, movement, body region, and record context. RIR, pain, duration, technique, and broader quality lenses remain incomplete.

### R-005 Progression Priority
- Status: captured
- Provenance: from-user
- Requirement: First attempt to progress load or weight. If that is not currently possible, progress repetitions. If load and repetitions cannot progress and recovery supports more dose, consider another set.
- Detail: [[Progression and Volume Model]]

### R-006 Progression Safety Valve
- Status: captured
- Provenance: research-supported refinement
- Requirement: The system may hold, reduce, substitute, deload, or reacclimate when recovery, pain, technique, attendance, or performance does not support overload. Adding a set is not the default response to poor recovery.
- Detail: [[Progression and Volume Model]]

### R-007 Undulating Comparisons
- Status: captured
- Provenance: from-user
- Requirement: Account for undulating training and compare like exposures with like exposures, such as heavy day to heavy day rather than heavy day to volume day.
- Detail: [[Progression and Volume Model]]

### R-008 Recent Training Continuity
- Status: captured
- Provenance: from-user
- Requirement: Progression must distinguish steady recent training from irregular training caused by children, sleep, injuries, work, travel, illness, or other life constraints.
- Product refinement: Separate long-term training age from recent stable, interrupted, or returning status.
- Detail: [[Progression and Volume Model]]

### R-009 Irregular-Schedule Programming
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Do not assume rigid Monday-to-Sunday adherence. Maintain a rolling priority queue and select the next best session from available time, exposure recency, recovery, pain, missed work, recent workload, and current goals.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-010 Micro Progress
- Status: captured
- Provenance: from-user
- Requirement: Measure and organize baby progress, including one extra repetition on the final set, a useful added movement, or another small improvement that compounds over time.
- Detail: [[Micro Progress and Long-Term Wins]]

### R-011 Multiple Valid Win Types
- Status: captured
- Provenance: product-decision
- Requirement: Recognize load, repetition, capacity, movement, technique, range-of-motion, consistency, recovery, and pain-free execution wins without treating arbitrary extra work as progress.
- Detail: [[Micro Progress and Long-Term Wins]]

### R-012 Pre-Session Survey
- Status: captured
- Provenance: from-user
- Requirement: Present a short ten-question survey before every session covering sleep, eating, current feeling, aches or pain, and other readiness or schedule factors that can affect the workout.
- Detail: [[Session Feedback and Learning Loop]]

### R-013 Post-Session Survey
- Status: captured
- Provenance: from-user
- Requirement: Collect short post-session feedback about difficulty, muscle response, joint feel, technique, fatigue, time fit, and anything the workout log missed.
- Detail: [[Session Feedback and Learning Loop]]

### R-014 Readiness Confirmation
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Use the pre-session survey as a hypothesis and confirm it through warm-up and workout performance. Except for pain or safety overrides, feeling tired alone should not automatically reduce the session.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: Private alpha 0.30.0 gives answered pre-session evidence no more than 24 hours old bounded schedule authority. One adverse non-pain signal requires warm-up confirmation without reducing the plan, multiple signals may remove optional fatigue, and fresh pain blocks automatic rebuilding. Warm-up and first-set confirmation remain active in the workout. Personal-baseline deviation and learned signal reliability remain incomplete.

### R-015 Exercise Preference and Joint Response
- Status: captured
- Provenance: from-user
- Requirement: Repeatedly learn whether the athlete likes a movement, feels it in the intended muscles, experiences joint discomfort, wants to keep it, or wants it replaced.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-016 Changing Goals
- Status: captured
- Provenance: from-user
- Requirement: Ask periodically whether strength, physique, muscle-priority, health, schedule, or other goals have changed and update programming accordingly.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-017 Feedback on Program Difficulty
- Status: captured
- Provenance: from-user
- Requirement: Allow the athlete to say a recommendation was too easy and should be pushed more, or too hard and should be adapted. Treat the response and any override as labeled learning data.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-018 Multi-Cadence Questioning
- Status: captured
- Provenance: product-decision
- Requirement: Learn through session, event-triggered, weekly, monthly or rolling-28-day, and training-block feedback.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-019 Adaptive Question Budget
- Status: captured
- Provenance: product-decision
- Requirement: Ask questions when answers can change decisions. Keep a small safety and readiness core, add conditional follow-ups, and avoid survey burden that lowers adherence or answer quality.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-020 Always Pursue Useful Progress
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Always seek a useful form of progression. Depending on conditions, the best frontier may be load, repetitions, recovered sets, technique, movement skill, range of motion, consistency, schedule fit, reduced pain, recovery, or rebuilding tolerance.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-021 Explainable Learning
- Status: captured
- Provenance: product-decision
- Requirement: Show what inputs affected each recommendation, what comparable history was used, what changed, why it changed, and confidence. Do not pretend a few personal sessions continuously fine-tune a large AI model.
- Detail: [[Session Feedback and Learning Loop]]

### R-022 Stale Information
- Status: captured
- Provenance: product-decision
- Requirement: Preserve history but reduce the influence of stale goals, preferences, injury constraints, and old response patterns as the athlete changes.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]

### R-023 Private Personal Data
- Status: captured
- Provenance: product-decision
- Requirement: Treat sleep, pain, health, schedule, and training history as private. Default to private or local storage and never use it for a shared model without explicit permission.
- Detail: [[Session Feedback and Learning Loop]]

### R-024 Obsidian Continuity
- Status: captured
- Provenance: from-user
- Requirement: Store the full evolving app concept, decisions, detailed rules, corrections, research, and open questions in the Obsidian Brain so future sessions continue learning rather than restarting.
- Detail: this register, [[App Build Reference Index]], and [[Adaptive Strength and Hypertrophy App]]

### R-025 Four-Methodology Research Curriculum
- Status: active
- Provenance: from-user
- Requirement: Conduct deep, continuing research into Dave Tate, John Meadows, Mike Israetel, and Chad Wesley Smith so the app is informed by serious expertise in bodybuilding, powerbuilding, exercise selection, and exercise programming.
- Detail: [[Methodology Research Hub]] and the four linked coach profiles

### R-026 Layered Methodology Synthesis
- Status: captured
- Provenance: product-decision
- Requirement: Do not average the coaches into one generic program. Apply each methodology at the layer where it is strongest, then resolve conflicts from the athlete's goal, specificity, fatigue, joint response, schedule, and personal evidence.
- Detail: [[Methodology Synthesis and App Translation]]

### R-027 Evidence and Doctrine Separation
- Status: captured
- Provenance: from-user and research-standard
- Requirement: Develop PhD-level reasoning discipline by separating coach doctrine, research-supported principles, product decisions, personal hypotheses, and open uncertainty. Preserve source links, limitations, conflicts, and confidence.
- Detail: [[Exercise Science Evidence Map]]

### R-028 Research-Informed Exercise Selection
- Status: active
- Provenance: from-user and product-decision
- Requirement: Exercise selection and sequencing should be fueled by the methodology research, including specificity, weak-point value, target-muscle stimulus, stability, joint tolerance, range of motion, fatigue cost, movement preference, and block purpose.
- Detail: [[Methodology Synthesis and App Translation]]

### R-029 Continuing Knowledge Base
- Status: active
- Provenance: from-user
- Requirement: Treat methodology study as an ongoing curriculum that becomes more complete over time and continually improves the future application outline and programming logic.
- Detail: [[Methodology Research Hub]]

### R-030 Multi-Format Deep Research Corpus
- Status: active
- Provenance: from-user
- Requirement: Study official coach articles, elitefts material, legal books and PDFs, scientific literature, YouTube lectures, and other long-form primary sources rather than relying on summaries.
- Detail: [[Research Corpus and Source Quality Register]]

### R-031 Volume as Multi-Dimensional Dose
- Status: captured
- Provenance: research-supported and from-user
- Requirement: Track tonnage as requested, but treat volume as productive dose with diminishing returns. Pair it with muscle sets, direct and fractional contribution, load, repetitions, effort, movement, range, technique, joint cost, and recovery.
- Detail: [[Deep Research Training Methodology and Readiness 2026-08-09]]

### R-032 Multi-Signal Readiness With Performance Confirmation
- Status: implemented-first-slice
- Provenance: research-supported and product-decision
- Requirement: Use pre-session feedback as an initial readiness estimate, compare it with the athlete's baseline, and confirm or revise it from warm-up and first-work-set performance. Except for pain or safety, no single survey item decides the session.
- Detail: [[Readiness Fatigue and Peaking Model]]
- Implementation: Private alpha 0.30.0 stores fresh, stale, or missing readiness provenance and maps fresh normal, confirm, protect, reacclimate, or pain-aware outcomes to bounded schedule actions. One non-pain adverse signal produces confirmation rather than automatic reduction. Personal-baseline comparison, repeated-signal aggregation, and calibrated reliability remain incomplete.

### R-033 Fatigue Classification and Targeted Response
- Status: captured
- Provenance: product-decision informed by research and coach frameworks
- Requirement: Distinguish local muscular, joint or connective-tissue, axial or movement-pattern, systemic, and schedule-related fatigue so the app can reduce or substitute the relevant stress instead of making every session globally easier.
- Detail: [[Readiness Fatigue and Peaking Model]]

### R-034 Distinct Preparedness and Peak States
- Status: captured
- Provenance: research-supported and product-decision
- Requirement: Model acute readiness, accumulated fatigue, preparedness, and peak state separately. Peaking requires a declared performance date and date-specific taper logic.
- Detail: [[Readiness Fatigue and Peaking Model]]

### R-035 Evidence Provenance and Confidence
- Status: captured
- Provenance: product-decision
- Requirement: Store the source type, general-evidence confidence, personal-evidence confidence, data quality, uncertainty, and the evidence that would change each major training recommendation.
- Detail: [[Deep Research Training Methodology and Readiness 2026-08-09]]

### R-036 Continuing Literature Refresh
- Status: active
- Provenance: from-user and product-decision
- Requirement: Keep the research corpus current through new studies, legally acquired books, coach material, and JB's personal training outcomes. Record conflicts and supersede old conclusions explicitly.
- Detail: [[Research Corpus and Source Quality Register]]

### R-037 Clickable Product Navigation
- Status: captured
- Provenance: from-user
- Requirement: Provide clear separate menus, buttons, and clickable items for today's training, the rolling plan, progress, the exercise library, and the editable athlete profile.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-038 Multi-Horizon Progress Dashboard
- Status: implemented-private-alpha-horizons
- Provenance: from-user
- Requirement: Provide detailed progress views for today, daily history, rolling seven days, week, rolling 28 days, month, quarter, year, and all time.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] includes Today, last 7 days, rolling 28 days, calendar month, calendar quarter, calendar year, and all time. Calendar-quarter charts aggregate completed source sets into visible monthly points.

### R-039 Interactive Volume and Progress Graphs
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: Graph tonnage, working sets, direct and fractional muscle sets, challenging sets, repetitions, exposure frequency, session duration, planned versus completed work, and block phase. Explain whether changes came from load, repetitions, sets, frequency, or exercise mix.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] graphs selected-period volume load and exclusive body volume with completed sets, repetitions, activity, matched-window comparison, calculation reconciliation, and an exact-movement mix explaining volume, set, repetition, session, and share changes. Dose-v1 also compares dated stored-session set intentions with completed source sets linked to those session IDs, preserves completed history with no stored plan as a separate known quantity, and exposes unknown planned load. Muscle-dose-v1 adds selected-range individual direct and secondary muscle set-equivalents with exact source drilldown. Muscle-plan-dose-v1 compares intended direct and secondary set credit with linked completed credit while preserving unmapped plan gaps and unlinked history. Schedule-priority-dose-v1 now uses exclusive completed regional set counts inside a rolling 28-day window as a bounded missed-opportunity tie-break. Muscle trend charts, challenging-set qualification, duration, plan revisions, imported-plan mapping, and causal progression-driver decomposition remain incomplete.

### R-040 Movement and Muscle Intelligence
- Status: implemented-partial
- Provenance: from-user
- Requirement: Show which movements and patterns the athlete performs most, which muscles are emphasized, maintained, neglected, over target, or uncertain, and whether builder-versus-tester balance matches current goals.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] shows the highest-volume exact movement, a ranked exact-movement mix, and current-priority attention as represented, outside-window, or no-history evidence with contributing exercises and last-exposure recency. Dose-v1 adds primary-region intended-set versus linked-completed-set status. Muscle-dose-v1 adds seventeen individual muscles, direct and secondary exposure, zero-exposure visibility, conserved area rollups, unmapped evidence, and exact contributing exercise and set provenance. Muscle-plan-dose-v1 adds intended-versus-linked individual-muscle evidence. Schedule-priority-dose-v1 records recent relative representation across declared broad priority regions and can resolve only an otherwise equal queue choice. Custom movements can receive an explicit athlete-reviewed mapping without name or body-part inference. Zero, below-plan, or relatively lower evidence is not automatically labeled neglect or converted into catch-up volume. Pattern balance, calibrated dose thresholds, builder-versus-tester analysis, and longitudinal athlete-specific calibration remain incomplete.

### R-041 Enjoyment and Behavior Learning
- Status: captured
- Provenance: from-user
- Requirement: Learn what the athlete reports enjoying and what behavior shows they reliably complete, skip, modify, or choose. Keep stated and inferred preference separate and allow correction.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-042 Personalized Exercise Library
- Status: captured
- Provenance: from-user
- Requirement: Provide an exercise library where the athlete can add, choose, change, favorite, avoid, temporarily disable, substitute, or create movements while tracking target-muscle feel, joint response, enjoyment, performance, fatigue, equipment, setup, and personal notes.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-043 Primary Secondary Accessory Session Structure
- Status: captured
- Provenance: from-user
- Requirement: Organize sessions into a protected primary movement, a secondary movement selected to build the primary movement or limiting capacity, and accessories ranked as required support, high-value hypertrophy, maintenance, or optional work.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-044 Traceable Builder Relationships
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Every secondary movement must identify the primary movement it supports, intended weak point or mechanism, similarity, expected fatigue and time cost, joint response, evidence, and personal transfer confidence. Treat transfer as a testable hypothesis.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-045 Equipment and Location Profiles
- Status: implemented-generation-aware-local-slice
- Provenance: from-user
- Requirement: Store available machines, bars, racks, plates, dumbbells, cables, attachments, specialty equipment, load increments, and constraints by home, commercial gym, travel, hotel, bodyweight, or custom location. Never prescribe unavailable equipment.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] stores named commercial, home, travel, hotel, bodyweight, and custom profiles with exact equipment, constraints, units, and five load-increment classes. Private alpha 0.21.0 also snapshots the selected profile into the mesocycle and every newly generated session, filters secondary and accessory choices before the first queue exists, and shows protected-anchor conflicts before confirmation. Today, Workout, and Library continue to enforce the active profile. Plate inventory, stack topology, cross-unit conversion, and full profile-version history remain deferred.

### R-046 Equipment-Aware Substitution
- Status: implemented-generation-and-substitution-slice
- Provenance: product-decision
- Requirement: When location, equipment, pain, or availability changes, substitute while preserving session role, primary relationship or target muscle, joint compatibility, stimulus, fatigue, time budget, and user preference as closely as possible.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] filters unavailable candidates before scoring, explains active-location fit, revalidates the final choice, and stores the location in the substitution event. Private alpha 0.21.0 applies the same conservative availability rule during initial route generation. Private alpha 0.29.0 also removes unavailable or joint-flagged support work from the first missed-opportunity rebuild while preserving the protected primary and storing exact removal evidence. Protected primary anchors remain visible and require athlete review rather than being silently replaced. Full post-swap rest, warm-up, fatigue, and later-session recalculation remain incomplete.

### R-047 Time-Budgeted Workout Construction
- Status: captured
- Provenance: from-user
- Requirement: Let the athlete declare available workout time and generate the best useful session that fits it. Protect safe warm-up and the primary movement first, then the highest-value secondary work and accessories within realistic rest and setup time.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-048 Dynamic Session Compression
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Allow the athlete to shorten the session while training. Rebuild the remaining work, preserve the primary objective, remove low-value transitions or optional volume, explain what changed, and reprioritize deferred work without calling the session a failure.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-049 First-Use Taste Picker and Athlete Contract
- Status: captured
- Provenance: from-user
- Requirement: Use an onboarding survey to learn age, optional body measures, experience, goals, primary lifts, priority muscles, pain and joint considerations, equipment, schedule, available time, movement preferences, training style, and current baselines. Show the inferred athlete model for correction before generating the first program.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-050 Transparent Athlete Understanding
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Show what the app believes about the athlete, including productive movements, joint-friendly choices, enjoyment, time patterns, recovery relationships, neglected priorities, and builder transfer. Every insight must show evidence, confidence, date range, programming effect, and correction controls.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-051 Personal Session-Time Learning
- Status: implemented-partial
- Provenance: product-decision
- Requirement: Learn actual exercise, rest, setup, transition, location, and session durations so future 15-, 30-, 45-, 60-, 75-, and 90-minute prescriptions are realistic for the athlete.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] provides editable 30-, 45-, 60-, 75-, and 90-minute mesocycle targets plus 15- through 75-minute same-day compression. Generated previews fit the declared target, but learning from observed setup, rest, transition, and exercise timing remains deferred.

### R-052 Completed-Exposure Progression Clock
- Status: implemented-private-alpha
- Provenance: from-user and product-decision
- Requirement: Advance progression from completed comparable exposures rather than calendar weeks. Planned but unperformed work cannot earn load, repetition, set, volume, or adaptation credit.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]

### R-053 Conditional Missed-Workout Check-In
- Status: implemented-private-alpha
- Provenance: from-user
- Requirement: When a planned session is missed, ask whether the athlete trained, why the session changed, when the next realistic opportunity is, how much time will be available, and whether the disruption is over, continuing, or uncertain.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]

### R-054 Automatic Conditional Replanning
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: Rebuild the following session and week from actual completed work, current continuity, overdue priorities, readiness, time, equipment, and the cost of further delay. Do not continue an untouched linear calendar plan.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]
- Implementation: Private alpha 0.31.0 retains fresh-readiness actions and adds source-backed relative priority-region dose after stronger queue factors tie. Protective evidence removes optional fatigue, reacclimation evidence changes the mode, fresh pain blocks mutation, and missing or stale evidence remains unknown. Relative dose can change order but cannot add work or progression. Fixed-event pressure and downstream-fatigue interaction remain incomplete.

### R-055 No Automatic Catch-Up Volume
- Status: implemented-private-alpha
- Provenance: product-decision
- Requirement: A missed workout creates no volume debt. Do not double sets, combine several high-fatigue sessions, or cram every missed accessory into the next week merely to restore the spreadsheet.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]

### R-056 Per-Movement Progression Independence
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Freeze progression for missed exercises and session types while preserving eligibility for completed movements. Overall interruption may lower aggressiveness, but it must not falsely freeze or progress every lift together.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]

### R-057 Partial-Session Credit
- Status: implemented-private-alpha
- Provenance: product-decision
- Requirement: Credit completed primary, secondary, and accessory work independently. If the primary was completed but accessories were skipped, the primary exposure remains valid and only completed sets enter volume totals.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]

### R-058 Reason-Specific Missed-Training Response
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Distinguish family or childcare, work, time, travel, sleep, illness, pain, equipment, and motivation disruptions because they imply different recovery, substitution, safety, and return decisions.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]
- Implementation: Private alpha 0.29.0 prevents automatic rebuilding while governed pain or restriction evidence changes movement choice and uses the selected equipment profile to exclude an impossible protected primary or remove impossible support work. Broader reason-specific recovery calibration remains incomplete.

### R-059 Stable Interrupted and Returning Replan States
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Recalculate whether training is stable, interrupted, or returning after missed exposures. Repeat, cautiously progress, reduce, substitute, or reacclimate from the last completed comparable work and current performance.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]

### R-060 Explainable Session Priority Queue
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Rank the next session from block priority, protected lifts, days since exposure, muscle-dose gaps, fatigue interaction, time, equipment, pain, preference, and delay cost. Show why one overdue session was chosen over another and allow manual pinning.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]
- Implementation: Private alpha 0.31.0 retains equipment eligibility, athlete pin control, and the 24-hour readiness contract, then adds rolling 28-day relative priority-region dose as a final tie-break before planned date. The hierarchy is pin, eligible primary, fully executable session, exact-primary recency, relative dose, planned date, and source order. Dose cannot override a stronger factor, add work, or claim neglect. Fixed-event pressure, preference scoring beyond the explicit pin, and downstream-fatigue rank factors remain incomplete.

### R-061 Hierarchical Training Cycle Architecture
- Status: captured
- Provenance: from-user and research-supported
- Requirement: Organize programming through sessions, microcycles, mesocycles, macrocycles, annual plans, and a multiyear or quadrennial strategic horizon so short-term exercise decisions visibly serve longer-term goals.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]

### R-062 Canonical Cycle Definitions
- Status: captured
- Provenance: research-supported and product-decision
- Requirement: Use one explicit internal definition for every cycle level because coaching sources use inconsistent durations and labels. Preserve external terminology as source aliases without allowing it to change the app's data meaning.
- Detail: [[Deep Research Training Cycle Architecture 2026-08-09]]

### R-063 Objective and Success Criteria at Every Level
- Status: implemented-mesocycle-slice
- Provenance: from-user and product-decision
- Requirement: Every session and cycle must declare its dominant objective, maintained qualities, parent-goal relationship, entry criteria, progression model, success criteria, duration bounds, and exit or recovery decision.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] stores and edits mesocycle objective, dominant adaptation, maintenance qualities, entry criteria, progression model, target exposure rounds, minimum productive exposures, success criteria, exit plan, timing assumptions, and plan version. Parent macrocycle and long-horizon criteria remain deferred.
- Review implementation: Exposure-round reviews now expose qualified work, unresolved work, exact volume, effort, pain, calendar bounds, recommendation, athlete decision, and required reason. Automatic parsing of free-text success criteria remains deferred.

### R-064 Exposure-Based Elastic Microcycles
- Status: implemented-criterion-review-slice
- Provenance: from-user and research-supported
- Requirement: Define a microcycle as the smallest complete recurrence of required exposure roles rather than automatically a Monday-through-Sunday week. Allow it to extend within explicit limits, then complete, waive, expire, or replan unresolved work without creating volume debt.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] protects required anchor exposures, separates calendar pace from exposure completion, stores explicit round numbers, derives seven-day target and fourteen-day maximum dates, supports extension inside the bound, and expires unresolved work during recovery without volume debt. Required-role waiver and explicit substitution at the maximum remain deferred.

### R-065 Criterion-Driven Mesocycles
- Status: implemented-review-first-slice
- Provenance: research-supported and product-decision
- Requirement: Progress, extend, recover, complete, pivot, or end a mesocycle from completed productive exposures, performance, fatigue, joint response, schedule stability, and success criteria rather than calendar duration alone.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] makes criteria, target exposure rounds, protected anchors, priorities, maintenance qualities, and recovery or exit intent executable and editable. The deterministic review now proposes progress, hold, extend, recover, or complete from round completion, target and maximum dates, known effort, and pain. The athlete chooses an eligible action with a reason or pivots through a new immutable plan version. Deeper multi-round statistics remain deferred.

### R-066 Outcome-Driven Macrocycles and Annual Plans
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Build macrocycles as sequences of mesocycles leading to a major outcome, test, competition, or review, while using a separate annual plan to map one or more macrocycles plus known family, work, travel, and low-availability periods.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]

### R-067 Long-Horizon and Quadrennial Strategy
- Status: captured
- Provenance: from-user and research-supported
- Requirement: Support one-to-four-year or longer planning, with a quadrennial representing exactly four years. Store strategic goals, annual milestones, event windows, health constraints, and review dates while avoiding false precision about exercises, sets, and loads years in advance.
- Detail: [[Deep Research Training Cycle Architecture 2026-08-09]]

### R-068 Progression and Periodization Separation
- Status: implemented-first-slice
- Provenance: from-user and research-supported
- Requirement: Treat load, repetition, and set progression between comparable exposures as distinct from linear periodization, undulation, block emphasis, and conjugate development. Load-first progression may operate inside any coherent longer structure.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] keeps the load-first progression engine separate from editable powerbuilding, strength, hypertrophy, and reacclimation mesocycle emphasis.

### R-069 Concurrent and Sequential Compatibility
- Status: implemented-partial
- Provenance: research-supported and product-decision
- Requirement: Allow concurrent methods inside a microcycle while priorities change sequentially across mesocycles. Store the dominant quality, maintenance qualities, minimum doses, fatigue interactions, and intended transfer rather than forcing one permanent periodization ideology.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] stores one dominant adaptation with protected anchors, priority regions, and maintenance regions, then generates concurrent primary, secondary, priority, and maintenance work. Longer sequential phase potentiation remains deferred.

### R-070 Fixed Event and Elastic Goal Replanning
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Let non-event cycles slide within useful bounds, but preserve fixed competition or test dates. When time is lost before a fixed event, spend buffer and remove lower priorities rather than compressing missed high-fatigue work into the remaining calendar.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]

### R-071 Planned Versus Actual Cycle History
- Status: implemented-mesocycle-slice
- Provenance: product-decision
- Requirement: Store planned and actual dates, exposure counts, state changes, revisions, reasons, and superseded versions for every cycle so the app can learn from what actually happened without rewriting history.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] stores immutable mesocycle versions, effective dates, status, revision reason, superseded-plan link, generated session IDs, and actual completed or partial session outcomes. Rich actual-duration and state-transition analytics remain incomplete.
- Review implementation: Append-only cycle-review events now store plan version, round, recommendation, reasons, evidence, athlete decision, athlete reason, generated sessions, and expired sessions.

### R-072 Cycle Dashboard and Dual Time Axes
- Status: implemented-linked-calendar-and-exposure-first-slice
- Provenance: from-user and product-decision
- Requirement: Show current objectives from session through long horizon, planned versus actual duration, completed and missed exposures, cycle state, revisions, outcome confidence, and both calendar-time and exposure-sequence graphs.
- Detail: [[Hierarchical Training Cycle and Goal Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] shows the active mesocycle, plan version, objective, protected qualities, calendar estimate, exposure clock, current queue, partial outcomes, and revision history. Private alpha 0.26.0 adds separate linked calendar-date and exact completed-exposure views, plan-to-actual drift, moved or stopped states, exact source-set activity, and calendar gaps between completed movement exposures. Macrocycle, annual, long-horizon, editable cycle timelines, missed-work replan controls, and confidence depth remain deferred.
- Review implementation: Plan now shows round number, target and maximum dates, criterion recommendation, qualified sessions, evidence summary, eligible decision controls, and append-only review history.

### R-073 Honest Long-Term Evidence Boundary
- Status: captured
- Provenance: research-supported and product-decision
- Requirement: Present periodization and long-range forecasts as revisable hypotheses. Explain that much of the resistance-training literature is short-term and does not establish exact annual or quadrennial predictions.
- Detail: [[Deep Research Training Cycle Architecture 2026-08-09]]

### R-074 Deterministic Training Authority
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Implement training calculations, progression eligibility, cycle state, missed-workout behavior, equipment and time constraints, and safety boundaries as deterministic, testable application logic rather than delegating them to a language model.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-075 Layered Personal Learning
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Distinguish rule execution, simple statistical personalization, retrieval from the knowledge base, and language-model generation. Explain that lifelong learning initially means accumulated athlete data and calibrated inference rather than continual foundation-model fine-tuning.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-076 Optional AI Use Cases
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Reserve optional AI for interpreting free-text or voice feedback, retrieving cited methodology, explaining decisions, summarizing time periods, identifying useful questions, and proposing bounded alternatives.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-077 Provider-Neutral AI Gateway
- Status: captured
- Provenance: product-decision
- Requirement: Isolate OpenAI, Anthropic, or future local-model integrations behind one provider-neutral server interface so model choice can change without rewriting the training engine.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-078 Correct API Credential Model
- Status: captured
- Provenance: from-user and verified product documentation
- Requirement: Distinguish an OpenAI API project key from the Codex product and a separate Anthropic API key from Claude or Claude Code subscriptions. Never assume a consumer or coding-assistant subscription grants production API access.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-079 Server-Side Secret Management
- Status: captured
- Provenance: verified product documentation and security requirement
- Requirement: Keep every provider key in the backend environment or a secrets manager. Never place keys in browser code, mobile bundles, Obsidian, analytics, logs, or screenshots. Separate development and production credentials.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-080 Versioned Runtime Knowledge Base
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Preserve Obsidian as the development source of truth, then export approved research into a versioned application knowledge base with source identity, confidence, retrieval passages, citations, and the exact knowledge version used for each answer.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-081 Retrieval Before Fine-Tuning
- Status: captured
- Provenance: product-decision
- Requirement: Use full-text or semantic retrieval to supply relevant approved knowledge at request time. Do not treat fine-tuning as the default mechanism for storing an evolving research corpus or personal workout history.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-082 Structured and Validated AI Output
- Status: captured
- Provenance: product-decision
- Requirement: Require strict schemas for AI output that could affect application behavior. Validate ranges, allowed actions, citations, authoritative logged data, safety policy, and confirmation requirements before accepting any proposal.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-083 AI Cannot Directly Mutate Training Truth
- Status: captured
- Provenance: product-decision
- Requirement: Free-form model text cannot directly change load, repetitions, sets, pain state, cycle completion, progression eligibility, permissions, or historical records. The deterministic engine remains authoritative.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-084 Offline and Provider-Failure Operation
- Status: implemented-core-no-ai-slice
- Provenance: product-decision
- Requirement: Logging, surveys, volume, progression, cycle state, and beginning or completing a workout must work without cloud AI. Use deterministic explanations and queue optional summaries when a provider times out or is unavailable.
- Detail: [[AI Integration and Decision Engine Architecture]]
- Implementation: Workout logging, surveys, volume, progression, missed-workout adaptation, historical correction, exercise merges, plan revisions, and cycle reviews run deterministically in the local PWA without any AI provider.

### R-085 AI Privacy and User Control
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Minimize athlete data sent to a provider, use privacy-preserving identifiers, preserve export and deletion, document current provider retention behavior, and allow cloud AI to be disabled without losing the core product.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-086 AI Cost and Latency Budget
- Status: captured
- Provenance: product-decision
- Requirement: Do not call AI per set or repetition. Use event-based calls, bounded context, timeouts, retry limits, reusable summaries, model routing, and per-user usage budgets while measuring quality, latency, and cost.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-087 AI Evaluation and Change Governance
- Status: captured
- Provenance: product-decision
- Requirement: Test every AI feature against representative training cases for correctness, schema validity, citation support, pain and safety failures, prompt injection, cost, latency, and user acceptance. Preserve regression cases and version every prompt, model, and schema change.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-088 Required AI Architecture Outline Chapter
- Status: captured
- Provenance: from-user
- Requirement: The eventual application-development outline must contain a dedicated AI, Knowledge Base, and Decision Engine chapter comparing deterministic rules, statistical learning, optional OpenAI or Anthropic integration, credentials, retrieval, privacy, fallback behavior, cost, evaluation, and phased delivery.
- Detail: [[AI Integration and Decision Engine Architecture]]

### R-089 First-Use Training Placement Survey
- Status: implemented-route-generation-first-slice
- Provenance: from-user
- Requirement: Use the beginning onboarding survey to determine the athlete's appropriate entry point in the programming system before generating the first cycle.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] adds a four-stage skippable starting profile with Quick Start and Import History, then stores a versioned placement hypothesis before updating the initial plan metadata. Route-specific exercise rewriting remains deferred.

### R-090 Experience and Current Preparedness Separation
- Status: implemented-first-local-slice
- Provenance: from-user and product-decision
- Requirement: Assess long-term training experience separately from recent continuity, current strength and volume tolerance, movement skill, schedule stability, pain, and evidence quality. Past experience alone does not prove current readiness, and a recent interruption does not erase skill.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] stores training experience separately from recent continuity, movement skill, strength tolerance, volume tolerance, schedule stability, and data confidence. Missing current evidence lowers confidence and never erases experience.

### R-091 Multi-Dimensional Athlete Level
- Status: implemented-starting-profile-slice
- Provenance: product-decision
- Requirement: Store separate one-to-five or descriptive statuses for training experience, movement skill, recent continuity, intensity tolerance, volume tolerance, schedule stability, and data confidence rather than one global beginner-to-advanced score.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] persists seven separate one-to-five dimensions with placement inputs and backup replay. Movement-family and muscle-specific tolerance remain deferred.

### R-092 Per-Movement Placement
- Status: implemented-exact-anchor-placement-and-exit-first-slice
- Provenance: product-decision
- Requirement: Assess skill and current capacity by lift and movement family. An experienced athlete may enter advanced programming for familiar primary lifts while using introductory progression for a new movement.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] adds `movement-placement-v2` for every protected exact anchor. Each movement separately stores skill, heavy-work tolerance, recent evidence, family context, confidence, reasons, unknowns, selected route, and any athlete-accepted exact-history review. `route-session-v3` uses the movement route to change executable session prescriptions while exact movement history remains separate. `movement-placement-exit-v1` now evaluates that exact movement's productive checks without borrowing plan-route, family, neighboring-variation, or other-anchor evidence, and `movement-placement-exit-review-v1` requires athlete keep, reassess, or defer control. Imported-history inference without review, adjacent-variation transfer, muscle-specific tolerance, and automatic route application remain deferred.

### R-093 Multiple Entry Cycle Routes
- Status: implemented-route-session-generation-first-slice
- Provenance: from-user and product-decision
- Requirement: Support introductory skill, reacclimation or return, bridge or calibration, base building, hypertrophy or powerbuilding, strength, power, event-specific, and pain-aware modified entry routes.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] selects introductory, reacclimation, bridge, base-building, hypertrophy, powerbuilding, strength, power, event-specific, or pain-aware routes. Private alpha 0.22.0 generates distinct versioned prescriptions for the plan route and for each protected exact movement's effective route, with equipment-compatible support work and executable loads. Pain-Aware Modified Entry generates no automatic queue. Route calibration, criterion exits, and automatic reclassification remain incomplete.

### R-094 Direct Entry for Prepared Athletes
- Status: implemented-placement-first-slice
- Provenance: from-user
- Requirement: Do not require well-trained, recently consistent athletes to begin at level one or complete an introductory or bridge cycle when current evidence supports direct entry into strength, power, hypertrophy, powerbuilding, or event-specific development.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] allows direct goal-specific entry when current experience, skill, continuity, tolerance, schedule, and evidence support it, and explains why a generic lower route was rejected.

### R-095 Minimum Necessary Bridge
- Status: implemented-placement-first-slice
- Provenance: from-user and product-decision
- Requirement: Use a bridge or calibration cycle only when current capacity, data quality, exercise familiarity, or goal transition is meaningfully uncertain. Keep it as short and productive as the evidence permits.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] selects bridge and calibration only for meaningful goal, continuity, skill, tolerance, or data uncertainty and stores one-to-three-session productive verification. Automatic bridge exit remains deferred.

### R-096 Experienced Returner Reacclimation
- Status: implemented-placement-first-slice
- Provenance: product-decision
- Requirement: An experienced athlete returning from a meaningful gap should restore current tolerance through familiar movements and conservative effort without being treated as a technical novice. Allow faster advancement when performance confirms retained ability.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] gives returning athletes a reacclimation route while preserving their independent experience score and explaining why they are not generic beginners.

### R-097 Direct Strength and Power Prerequisites
- Status: implemented-survey-prerequisite-first-slice
- Provenance: from-user and product-decision
- Requirement: Direct strength entry requires relevant skill, recent consistent exposure, current performance evidence, sufficient work capacity, manageable pain, realistic schedule, and an aligned goal. Direct power entry additionally requires relevant explosive skill, an adequate strength base, and a true power objective.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] requires current experience, skill, intensity tolerance, continuity, evidence, schedule, pain state, and aligned goal for direct strength or power selection. Movement-specific and explosive-skill evidence remains deferred.

### R-098 Productive Placement Verification
- Status: implemented-exact-movement-productive-verification-first-slice
- Provenance: product-decision
- Requirement: Treat survey placement as a hypothesis and confirm it during the first one to three productive sessions through warm-ups, submaximal reference sets, RPE or RIR, technique, time fit, completion, pain, and recovery. Do not require a maximal test or a wasted beginner detour.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] now creates `placement-verification-v1` events during the first one to three productive sessions per exact protected movement lane. It persists optional warm-up response, the exact movement-placement snapshot, lane-scoped sequence, first completed primary source set, target-versus-actual load, repetitions and RIR, completion, duration, readiness, difficulty, technique, pain, time fit, optional recovery, deferred-feedback replay, and an explainable verdict. Pain-changing evidence pauses the next automatic start. Bench and squat may each own check one, and no movement consumes another movement's quota. Automatic reclassification remains prohibited.

### R-099 Explainable Placement Contract
- Status: implemented-starting-profile-slice
- Provenance: from-user and product-decision
- Requirement: Before programming begins, show the recommended entry route, supporting evidence, confidence, uncertain inputs, verification plan, and why lower or higher routes were not selected.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] shows route, confidence, reasons, uncertain inputs, verification plan, exit criteria, and explicit lower and higher route comparisons before entry.

### R-100 Athlete Placement Control
- Status: implemented-first-local-slice
- Provenance: from-user and product-decision
- Requirement: Let the athlete confirm placement, correct history, begin more conservatively, request a more aggressive test, or change the goal. Store the override as learning data without allowing it to bypass hard safety constraints.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] lets the athlete confirm, choose a more conservative route, request faster submaximal verification, correct or import history, change the goal, or reassess later. Pain-aware priority cannot be bypassed by the aggressive-test decision.

### R-101 Criterion-Based Entry Cycle Exit
- Status: implemented-plan-and-exact-movement-criterion-exit-first-slice
- Provenance: product-decision
- Requirement: End or advance introductory, bridge, reacclimation, base-building, strength, power, hypertrophy, and event-specific entry cycles through route-specific success and readiness criteria rather than fixed duration alone.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] adds `placement-exit-v1` for the plan route and `movement-placement-exit-v1` for each exact protected movement. Both expose resolved-check, repeated-support, pain-boundary, and recovery criteria and can recommend collect, hold, confirm, advance review, conservative review, or reassessment. The movement rule admits only events carrying the same canonical exercise ID and counts every other movement as excluded. `placement-exit-review-v1` and `movement-placement-exit-review-v1` require athlete keep, reassess, or defer decisions with a reason. No recommendation silently changes programming. Calibrated thresholds and fully measurable goal-specific performance criteria remain deferred.

### R-102 Imported History for Placement
- Status: implemented-exact-history-placement-first-slice
- Provenance: product-decision
- Requirement: Allow imported training logs, recent working sets, structured coach history, and reliable estimates to improve placement confidence and bypass unnecessary calibration while preserving source date and data quality. Athlete-facing video import or technique analysis is excluded by R-320.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] imports completed-set CSV history after validation and canonical movement review while preserving date, original name, source file, row, source unit, RIR missingness, and occurrence-aware fingerprint provenance. `placement-history-v1` now summarizes only exact exercise history inside a transparent 42-day window and proposes bounded evidence-confidence or heavy-work-tolerance scores. The athlete must accept each field separately before `placement-v3` uses it. Numeric-only imports cannot confirm skill, technique, pain, recovery, or medical readiness, and they cannot earn the highest suggestions without repeated quality-confirmed work. Structured coach history, reliable-estimate import, family transfer, and automatic calibration bypass remain deferred. Athlete technique video is out of product scope.

### R-103 Ongoing Placement Reclassification
- Status: implemented-plan-and-movement-trigger-manual-versioned-slice
- Provenance: from-user and product-decision
- Requirement: Reassess placement after interruptions, new goals, new primary movements, injury or illness, schedule or equipment changes, repeated target mismatch, improved evidence, and cycle completion. Preserve historical skill separately from current tolerance.
- Detail: [[Onboarding Training Status and Entry Cycle Placement]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] now detects repeated productive support, repeated mismatch, mixed evidence, and pain-changing checkpoint states for both the matching plan route and each exact protected movement lane. An earned movement trigger remains visible after a different movement becomes next. The athlete must explicitly keep, defer, or reopen placement with a reason. Completing reassessment supersedes the prior mesocycle, creates a new active version, and moves only future sessions. Silent automatic reclassification and direct checkpoint-to-program mutation remain prohibited.

### R-104 Continuous Competitor Product Intelligence
- Status: captured
- Provenance: from-user
- Requirement: Maintain an active research program for RP Hypertrophy, JuggernautAI, and later relevant products across official updates, app-store releases, help documentation, public communities, hotfixes, recurring complaints, and roadmap signals.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-105 Evidence-Class Separation
- Status: captured
- Provenance: product-decision
- Requirement: Store official facts, verified creator statements, app-store behavior, community reports, and inference as separate evidence classes. Never present a Reddit claim or roadmap guess as a confirmed product fact.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-106 Versioned Product Change Ledger
- Status: captured
- Provenance: product-decision
- Requirement: Track each competitor release by date, version, user problem, feature change, algorithm change, reliability fix, known limitation, and source so product evolution can be compared over time.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-107 Community Problem Taxonomy
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Organize public community feedback into durable themes such as interruptions, session length, history, analytics, exercise coverage, load increments, input literacy, warmups, bugs, price, and support rather than storing disconnected anecdotes.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-108 Roadmap Confidence Labels
- Status: captured
- Provenance: product-decision
- Requirement: Mark roadmap items as released, officially announced, planned without date, inferred, community-requested, or unknown. Include the statement date and verify release before treating an announcement as shipped.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-109 Patch and Regression Learning
- Status: captured
- Provenance: product-decision
- Requirement: Study the hotfix tail after competitor releases and convert relevant failures into rollout, migration, replay-test, feature-flag, monitoring, and rollback requirements for this app.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-110 Meaningful Release Notes
- Status: captured
- Provenance: product-decision
- Requirement: Our release notes must explain the user problem, changed behavior or rule, affected population, data migration, tests, known limitations, and rollback status instead of relying on generic bug-fix language.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-111 Feedback-to-Roadmap Loop
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Connect surveys, support requests, app reviews, feature requests, behavior telemetry, and community themes to a reviewable product backlog with evidence counts and visible decision status.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-112 Cross-Cycle Continuity
- Status: captured
- Provenance: from-user and competitor-learning
- Requirement: Carry exercise performance, load and repetition history, RIR calibration, joint response, enjoyment, timing, substitutions, muscle dose, and recommendation outcomes across mesocycles, blocks, interruptions, and long movement absences.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-113 Calendar and Exposure History
- Status: implemented-linked-calendar-and-exact-exposure-first-slice
- Provenance: from-user and competitor-learning
- Requirement: Provide linked calendar-date, completed-exposure-sequence, and fixed-event-countdown views so an irregular athlete can see both when training occurred and where each movement sits in its actual progression.
- Detail: [[Conditional Schedule Adaptation and Missed Workout Game Plan]]
- Implementation: Private alpha 0.26.0 adds deterministic `calendar-exposure-v1`: a forty-two-cell monthly calendar for stored planned opportunities, completed source sets, moved or stopped states, linked drift, and unlinked imported work; an exact-canonical-exercise sequence with calendar-day gaps, source IDs, sets, repetitions, load, volume, RIR, and quality evidence; and missing, unparsed, upcoming, today, or past fixed-event states. Empty dates create no debt, and neither view awards progression or borrows family movements.

### R-114 Direct Session Time Budget
- Status: captured
- Provenance: from-user and competitor-learning
- Requirement: Accept the athlete's available minutes as a direct prescription constraint. Do not require them to misstate training frequency, omit work silently, or manipulate feedback to obtain shorter sessions.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-115 Executable Load Increments
- Status: implemented-generation-aware-local-slice
- Provenance: from-user and competitor-learning
- Requirement: Store exercise and location-specific load increments, cable or machine conventions, dumbbell availability, plate math, assistance direction, and unilateral logging so every prescribed load can actually be performed.
- Detail: [[Progression and Volume Model]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] stores separate barbell, dumbbell, cable, machine, and other increments per location, uses them during initial route generation, progression, and substitutions, rounds targets to executable multiples before the queue is confirmed, and sets the load-input step. The exact generating increment table and unit are stored with the plan and session. Plate math, cross-unit conversion, assistance direction, unilateral rules, maximum inventory, and per-exercise overrides remain deferred.

### R-116 Semantic Exercise Library
- Status: captured
- Provenance: from-user and competitor-learning
- Requirement: Model exercise families and variants by movement pattern, muscles and regions, joint profile, equipment, session role, weak-point hypothesis, fatigue cost, time cost, and substitution equivalence rather than maintaining a flat list of names.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-117 Custom Exercise Parity
- Status: captured
- Provenance: product-decision
- Requirement: A custom exercise must support the same history, muscle mapping, role, equipment, joint feedback, progression, timing, substitution, and analytics fields as a built-in exercise.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-118 External Activity and Concurrent Training Context
- Status: captured
- Provenance: from-user and competitor-learning
- Requirement: Allow endurance work, sport, conditioning, physical labor, travel, and unusual life stress to affect fatigue interpretation and schedule planning without automatically treating all outside activity as equivalent.
- Detail: [[Readiness Fatigue and Peaking Model]]

### R-119 Feedback Literacy and Calibration
- Status: captured
- Provenance: competitor-learning and product-decision
- Requirement: Teach RIR, RPE, soreness, pump, pain, and readiness with concise anchors; store answer confidence; and compare self-report with warmup and work-set evidence before increasing trust in that signal.
- Detail: [[Session Feedback and Learning Loop]]

### R-120 Mid-Program Recalibration Without History Loss
- Status: captured
- Provenance: competitor-learning and product-decision
- Requirement: Let the athlete change stress, schedule, equipment, time, goals, pain constraints, frequency, and volume tolerance during an active program, preview the effect, and preserve the prior plan and history.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-121 Fast Core Workout Path
- Status: captured
- Provenance: competitor-learning and product-decision
- Requirement: Keep start, log, adjust, substitute, and finish actions fast and reliable. Use only concise, optional text or visual definitions when they materially help logging or feedback literacy. Do not add an exercise-technique video library, instructional content feed, or video-first workout flow.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-122 Portable Athlete History
- Status: captured
- Provenance: product-decision
- Requirement: Support export and restore of sets, sessions, surveys, exercise definitions, equipment, cycle state, learned insights, and recommendation provenance in an open documented format.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-123 Multi-Methodology Knowledge Graph
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Represent people, organizations, sources, claims, principles, methods, contexts, exercises, product behaviors, community problems, app rules, personal observations, and releases as linked versioned knowledge rather than one undifferentiated AI brain.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-124 Preserve Methodological Identity and Conflict
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Keep Israetel, Tate, Meadows, Smith, scientific evidence, competitor behavior, and personal evidence distinguishable. Preserve conflicts and resolve them by context instead of averaging them into generic advice.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-125 Provenance and Knowledge Versioning
- Status: captured
- Provenance: product-decision
- Requirement: Every durable claim and recommendation must retain source, date, authority, confidence, applicable context, conflicts, product translation, knowledge version, and supersession history.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-126 Originality and Copyright Boundary
- Status: captured
- Provenance: product-decision
- Requirement: Learn from public principles and observed product behavior without copying private algorithms, paid templates, copyrighted source text, proprietary code, or a living coach's identity or voice.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-127 Recommendation Provenance
- Status: captured
- Provenance: product-decision
- Requirement: Store the rule-engine version, knowledge-base version, athlete-model version, input snapshot, selected action, rejected alternatives, citations, confidence, and later outcome for every material programming recommendation.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-128 Community-Derived Regression Scenarios
- Status: captured
- Provenance: competitor-learning and product-decision
- Requirement: Maintain permanent test fixtures for missed weeks, irregular ten-day microcycles, two-hour prescribed sessions, impossible load increments, unavailable equipment, inaccurate RIR, conflicting warmup targets, mid-cycle goal changes, and exercise-history continuity.
- Detail: [[Competitive Product Evolution RP Hypertrophy and JuggernautAI 2026-08-09]]

### R-129 Complete Local Book Corpus Ingestion
- Status: captured
- Provenance: from-user
- Requirement: Read, analyze, and synthesize every book present in the supplied strength-training folder, then preserve the durable knowledge in Obsidian for future programming and app design.
- Detail: [[Strength Training Book Corpus 2026-08-09]]

### R-130 Page-Level Coverage and File Integrity
- Status: captured
- Provenance: product-decision
- Requirement: Record title, source path, page count, extraction method, coverage state, and file identity so a future scan replacement or missing source can be detected.
- Detail: [[Research Corpus and Source Quality Register]]

### R-131 Per-Book Doctrine Profiles
- Status: captured
- Provenance: product-decision
- Requirement: Preserve each author's model, methods, app translations, limitations, and conflicts in a separate profile rather than blending the books into one authority.
- Detail: [[Strength Training Book Corpus 2026-08-09]]

### R-132 Claim Currency and Stale-Risk Labels
- Status: captured
- Provenance: research-standard
- Requirement: Label historical, contested, high-risk, and awaiting-verification claims so older textbook mechanisms never silently override current evidence or safety guidance.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-133 Dynamic Correspondence Exercise Taxonomy
- Status: captured
- Provenance: book-derived and product-decision
- Requirement: Store target task, direction, amplitude, accentuated range, force magnitude, force timing, muscular action, resistance type, technical similarity, and transfer mechanism for exercises and variations.
- Detail: [[Methodology Synthesis and App Translation]]

### R-134 Multidimensional Training-Load Vector
- Status: captured
- Provenance: book-derived and research-supported
- Requirement: Store volume-load beside hard sets, repetitions, relative intensity, RIR or RPE, top and average load, range of motion, quality or velocity, time, density, role, and fatigue or joint cost.
- Detail: [[Strength Training Book Corpus 2026-08-09]]

### R-135 Conservative Working-Max Model
- Status: captured
- Provenance: book-derived and product-decision
- Requirement: Maintain programming working max separately from true max and estimated max, with conservative updates and visible confidence.
- Detail: [[Chad Wesley Smith The Juggernaut Method 2.0]]

### R-136 Performance-to-Load Conversion
- Status: captured
- Provenance: book-derived and product-decision
- Requirement: Convert qualifying overperformance into the next executable load only when technique, comparable exposure, equipment increments, and projected-capacity safeguards permit it.
- Detail: [[Progression and Volume Model]]

### R-137 Personal Transfer Hypotheses
- Status: captured
- Provenance: book-derived and product-decision
- Requirement: Treat every secondary movement's proposed benefit to a primary movement as a testable hypothesis with mechanism, confidence, comparable exposures, and observed outcomes.
- Detail: [[Methodology Synthesis and App Translation]]

### R-138 Experience-Dependent Variation
- Status: captured
- Provenance: book-derived and research-supported
- Requirement: Favor stable skill practice and broad preparation for novices, then allow more targeted variation and sequencing as experience and evidence justify complexity.
- Detail: [[Strength Training Book Corpus 2026-08-09]]

### R-139 Contextual Deload and Restoration
- Status: captured
- Provenance: book-conflict and product-decision
- Requirement: Select scheduled, situational, exposure-based, or event-driven restoration from fatigue, readiness, history, event proximity, and personal response instead of enforcing one doctrine.
- Detail: [[Readiness Fatigue and Peaking Model]]

### R-140 Key Adaptation Indicators
- Status: captured
- Provenance: book-derived and product-decision
- Requirement: Define a small set of goal-specific leading and outcome indicators, detect stalls, and make explainable programming detours without discarding history.
- Detail: [[Multi-Methodology Training Intelligence Brain]]

### R-141 Technical Quality Floor
- Status: captured
- Provenance: book-derived and product-decision
- Requirement: Load, repetition, or set progression counts only when the exercise's technique, range, and intended execution remain above its defined quality floor.
- Detail: [[Progression and Volume Model]]

### R-142 Force-Time and Power Objective
- Status: captured
- Provenance: book-derived and product-decision
- Requirement: Support force-time, starting-strength, acceleration, and rate-of-force-development objectives separately from maximal load or hypertrophy objectives.
- Detail: [[Yuri Verkhoshansky Fundamentals of Special Strength Training in Sport]]

### R-143 Specialized Method Eligibility
- Status: captured
- Provenance: book-derived and safety-decision
- Requirement: Gate shock methods, extreme eccentrics, maximal isometrics, accommodating resistance, supra-maximal tools, and frequent max-effort rotation by experience, skill, equipment, supervision, joints, recovery, and objective.
- Detail: [[Methodology Synthesis and App Translation]]

### R-144 Corpus Gap Disclosure and Refresh
- Status: captured
- Provenance: verified-source-gap and product-decision
- Requirement: Expose missing pages, OCR uncertainty, incomplete editions, and stale evidence, then support replacement and re-synthesis when a more complete or current source becomes available.
- Detail: [[Research Corpus and Source Quality Register]]

### R-145 Multi-Level Body Region Volume Views
- Status: implemented-private-alpha-core
- Provenance: from-user
- Requirement: Let users analyze completed volume by whole body, upper body, lower body, trunk, arms, major regions, and individual muscles across daily through all-time ranges.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] provides whole-body totals, upper body, lower body, arms, trunk, major primary-region, and seventeen individual-muscle views across the implemented time horizons. Dose-v1 shows intended and linked completed primary-region set dose. Muscle-dose-v1 shows direct and secondary completed-set credit while preserving zero-exposure and unmapped states. Muscle-plan-dose-v1 adds intended and exact-session-linked completed credit across the same All, Upper, Lower, Arms, and Trunk lenses. Schedule-priority-dose-v1 reuses exclusive broad-region completed sets for a source-backed 28-day relative queue signal without treating it as target dose. Greater muscle-head depth remains deferred.

### R-146 Overlap-Safe Volume Aggregation
- Status: implemented-private-alpha-core
- Provenance: product-decision
- Requirement: Count each completed set once in exclusive exercise volume-load, offer a clearly non-additive region-involvement tonnage lens, and represent direct and fractional muscle dose separately while summing hierarchical child regions once.
- Detail: [[Progression and Volume Model]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] counts every completed set once in exact exercise, time-series, primary-region, and high-level volume-load views, then visibly reconciles all totals. Muscle-dose-v1 separately labels non-additive individual-muscle rows, preserves direct and secondary components, and makes whole, upper, lower, arms, and trunk parents count each source set once at its highest eligible child credit. Schedule-priority-dose-v1 cites each completed set in at most one declared priority-region point and restore rejects duplicate or wrong-region attribution. A separate non-additive region-involvement tonnage lens remains deferred.

### R-147 Region Drill-Down and Custom Views
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Allow drill-down from a body region to child muscles, contributing exercises, and completed sets, plus saved custom groups with visible overlap rules.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] provides All, Upper, Lower, Arms, and Trunk filters, individual-muscle rows, contributing exercise dose, latest exposure, completed source-set counts, and on-demand exact source-set identifiers with visible overlap rules. Saved custom groups and a graphical parent-to-child body navigator remain incomplete.

### R-148 Extensive Strength Variation Catalog
- Status: captured
- Provenance: from-user
- Requirement: Ship a deep powerlifting and powerbuilding exercise catalog covering board, pin, block, deficit, specialty-bar, grip, stance, tempo, pause, range-of-motion, and accommodating-resistance variations.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-149 Structured Exercise Identity
- Status: implemented-partial
- Provenance: product-decision
- Requirement: Identify every movement with an immutable canonical ID, family ID, original name, aliases, and structured implement, position, angle, grip, stance, range, start, tempo, pause, resistance, and laterality modifiers.
- Detail: [[Methodology Synthesis and App Translation]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] uses stable canonical IDs, names, families, aliases, patterns, regions, equipment, roles, custom status, and merge-retirement state. Custom name and taxonomy edits retain the same canonical ID, while built-in taxonomy remains protected except for athlete-managed aliases. The full modifier taxonomy remains deferred.

### R-150 Exact Exercise History Timeline
- Status: implemented-partial
- Provenance: from-user
- Requirement: Every exercise page must show its complete exact-movement history, including dates, work sets, loads, repetitions, effort, volume, technique, pain, joint response, objective, role, block, location, and equipment context.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Exercise Detail shows exact dates, individual work sets, load, repetitions, known or unknown RIR, volume, technique, pain, preserved original merge identity, and imported source name, file, and row provenance. Objective, block, location, and equipment context remain incomplete.

### R-151 Last Exposure Snapshot and Reuse
- Status: implemented-snapshot-only
- Provenance: from-user and product-decision
- Requirement: Show the last completed exposure and days since use, then allow the athlete to reuse its setup, add the movement to a future session, compare exposures, or open the original workout.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Library cards and Exercise Detail show the latest exact exposure and full recent history. Setup reuse, future-session insertion, exposure comparison, and original-workout navigation remain deferred.

### R-152 Exact Versus Family History Separation
- Status: implemented-exact-only
- Provenance: product-decision
- Requirement: Keep progression clocks and last-exposure facts exact to the movement while offering related variation-family history as a separately labeled comparison.
- Detail: [[Progression and Volume Model]]
- Implementation: Progression, history, and records remain exact to the canonical movement. A separately labeled family-comparison view remains deferred.

### R-153 Proactive Duplicate Detection
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: Search for existing system and custom exercises while the athlete types or imports a movement, then warn about exact and probable duplicates before saving.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Custom movement entry warns while typing and requires a meaningful distinction before an exact match can be created separately. Catalog editing checks the proposed name and every alias against active system and custom identities, exact collisions are blocked before save, and Data Quality converts connected probable pairs into cleanup groups. Completed-history CSV import auto-maps only one exact canonical name or alias, shows deterministic probable evidence, and requires an athlete-selected active canonical movement for every uncertain or unmatched source name before commit.

### R-154 Deterministic Exercise Matching
- Status: implemented-partial
- Provenance: product-decision
- Requirement: Use normalized names, aliases, spelling tolerance, word order, structured identity fields, and fuzzy similarity as the primary duplicate engine, with optional AI limited to uncertain nickname interpretation.
- Detail: [[AI Integration and Decision Engine Architecture]]
- Implementation: The local deterministic matcher uses normalized names, aliases, equipment-word normalization, containment, patterns, and identity-modifier guards. The CSV importer reuses exact name and alias authority, exposes probable containment evidence, and does not auto-map uncertain identities. Spelling tolerance, word-order scoring, deeper structured fields, and uncertain nickname handling remain deferred.

### R-155 Duplicate Resolution Controls
- Status: implemented-partial
- Provenance: product-decision
- Requirement: Offer use-existing, add-alias, mark-distinct, merge-histories, and create-anyway actions, requiring a meaningful disambiguator when a high-confidence match is intentionally kept separate.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: The private alpha supports use existing, direct alias editing, documented create-separate for an exact match, connected-group review, athlete-selected canonical target, multi-source merge, and undo. Exact name or alias collisions are blocked during catalog edits. The initial-create disambiguator is required for exact matches. More nuanced high-confidence thresholds remain deferred.

### R-156 Safe and Reversible History Merge
- Status: implemented-local-first-slice
- Provenance: product-decision
- Requirement: Never silently merge or delete exercise history. A merge must preserve original entered names, logs, timestamps, notes, provenance, and an auditable undo path.
- Detail: [[Multi-Methodology Training Intelligence Brain]]
- Implementation: Confirmed merges preserve source exercise rows, original set identity, timestamps, history, aliases, future-plan consequences, athlete anchors, an append-oriented event, and exact undo. One reviewed connected group can retire multiple duplicate source identities into one selected canonical target in a single event. Cross-device conflict resolution and richer set-note provenance remain deferred.

### R-157 Custom Exercise Full Parity
- Status: implemented-partial
- Provenance: from-user and product-decision
- Requirement: Custom exercises receive the same analytics, history, progression, body-region attribution, aliases, duplicate protection, and relationship modeling as system exercises.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Custom movements participate in search, duplicate checks, exact history, volume, records, regions, preference, and merge. Athletes can edit custom names, families, aliases, movement types, primary regions, equipment, descriptions, and optional athlete-reviewed direct and secondary muscle mappings while retaining the stable history ID. Mapping choices include source, review timestamp, validation, audit, backup, replay, and undo. Full builder relationship modeling and historical mapping-version attribution remain deferred.

### R-158 Exercise Library Data Quality
- Status: implemented-duplicate-first-slice
- Provenance: product-decision
- Requirement: Provide a non-blocking maintenance view for probable duplicates, orphaned aliases, conflicting names, fragmented variation families, incomplete taxonomy, and custom movements that now match catalog entries.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: The Data Quality view collapses connected probable duplicate and catalog-match pairs into athlete-reviewable cleanup groups. The athlete chooses one identity to keep and can merge every other connected identity in one reversible event. Catalog editing exposes related candidates and blocks exact identity collisions without silently merging. Orphan aliases, family fragmentation, incomplete taxonomy, and bulk review across several unrelated groups remain deferred.

### R-159 Athlete Movement Override
- Status: implemented-active-workout-slice
- Provenance: from-user
- Requirement: Every programmed movement must provide a visible change action before and during training, while preserving the athlete's final authority within pain, safety, equipment, and feasibility constraints.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Every active programmed movement has a visible Change action. The athlete can choose an eligible active replacement, while avoided and retired movements are excluded. A broader pre-session replacement surface remains deferred.

### R-160 Contextual Swap Reason
- Status: implemented
- Provenance: product-decision
- Requirement: Offer an optional one-tap reason such as pain, equipment, time, fatigue, poor target feel, variety, preference, harder, or easier so the app can rerank alternatives without forcing a long survey.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: The replacement flow offers optional reasons for pain, equipment, time, fatigue, target feel, variety, preference, harder, easier, other, or no reason. The selected reason changes deterministic scoring without forcing a survey.

### R-161 Educated Ranked Alternatives
- Status: implemented-three-tier-slice
- Provenance: from-user
- Requirement: Present Best Matches, Good Alternatives, Changes Today's Focus, and Browse Full Library rather than an unranked replacement list.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: The workout displays ranked Best Match, Good Alternative, and Changes Focus candidates with stable rank and score snapshots. Browse Full Library from inside the replacement modal remains deferred.

### R-162 Preserve Exercise Purpose
- Status: implemented-core-purpose-slice
- Provenance: product-decision
- Requirement: Rank replacements first by the role, adaptation target, target muscle, weak point, transfer mechanism, and dynamic correspondence the original exercise was meant to provide.
- Detail: [[Methodology Synthesis and App Translation]]
- Implementation: Ranking currently prioritizes movement pattern, primary body region, exercise family, overlapping role tags, and the planned slot's role and purpose. Deeper weak-point, transfer-mechanism, and dynamic-correspondence modeling remains deferred.

### R-163 Personalized Substitution Ranking
- Status: implemented-deterministic-personalization-slice
- Provenance: from-user and product-decision
- Requirement: Incorporate readiness surveys, pain, time, equipment, phase, exercise history, familiarity, joints, stimulus, fatigue, enjoyment, completion, recovery, and explicit athlete corrections into recommendation ranking.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Ranking uses the athlete's selected reason, current readiness, exact exercise familiarity, last exposure, joint response, favorite status, equipment change, and useful role tags. Repeated outcome calibration and movement-specific stimulus learning remain deferred.

### R-164 Transparent Substitution Tradeoffs
- Status: implemented-core-explanation-slice
- Provenance: product-decision
- Requirement: Every recommendation must explain why it ranks there, what purpose it preserves, what changes, personal history, equipment and time needs, confidence, and likely session impact.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Each candidate shows why it ranked, what it preserves, what changes, exact-history count and recency, score, recommendation tier, and proposed prescription. Explicit calibrated confidence and full equipment-transition cost remain deferred.

### R-165 Substitute-Specific Prescription
- Status: implemented-prescription-safety-slice
- Provenance: product-decision
- Requirement: Recalculate sets, repetitions, load or load method, effort, rest, warm-up, and duration from the selected exercise's exact history and context instead of copying the replaced exercise's load.
- Detail: [[Progression and Volume Model]]
- Implementation: A replacement with exact history receives sets, repetitions, load, and RIR from that movement's latest exact exposure and the load-first engine. A movement without exact history receives zero copied load, at least three target RIR, and a conservative calibration dose. Rest and warm-up recalculation remain deferred.

### R-166 Progression Clock Integrity After Swap
- Status: implemented
- Provenance: product-decision
- Requirement: Mark the original exercise substituted rather than completed or missed, freeze its exact progression clock, and credit the completed exposure only to the chosen movement.
- Detail: [[Progression and Volume Model]]
- Implementation: The planned slot retains the root original movement as `substitutedFrom`, completed sets credit only the selected exercise, and exact progression and record calculations remain separated by canonical exercise ID. Private alpha 0.25.1 also cancels the current session's active placement check for the original primary lane before completion, so replacement work cannot advance either the original progression clock or its placement evidence.

### R-167 Session Recalculation After Swap
- Status: implemented-duration-slice
- Provenance: product-decision
- Requirement: Recompute duration, equipment transitions, muscle dose, fatigue, joint cost, exercise relationships, and which later work remains, shrinks, moves, or expires after a substitution.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: ForgePath recalculates the replacement's set count, estimated exercise minutes, and total session duration. Equipment-transition order, fractional muscle dose, relationship effects, and automatic shrinking or expiry of later work remain deferred.

### R-168 Substitution Learning Event
- Status: implemented-local-event-slice
- Provenance: from-user and product-decision
- Requirement: Store the original movement, candidates, ranking reasons, selected movement, swap reason, current context, recalculated prescription, completed performance, post-session response, and athlete corrections as a durable learning event.
- Detail: [[Multi-Methodology Training Intelligence Brain]]
- Implementation: A durable local event stores the original and selected exercise, planned slot, role, purpose, optional reason, readiness, time and equipment context, top candidate snapshots, original and replacement prescriptions, method and explanation, completed source set IDs, outcome, completion time, and available post-session difficulty, stimulus, technique, pain, and enjoyment evidence. The Library exposes the current event ledger.

### R-169 Evidence Threshold for Recommendation Learning
- Status: instrumented-not-yet-learning
- Provenance: product-decision
- Requirement: Let repeated successful or unsuccessful substitutions change future ranking, but prevent one isolated choice or bad day from materially rewriting the athlete model.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]
- Implementation: Version 0.7.0 captures durable outcome evidence but does not yet let one or many events rewrite future candidate weights. Repeated-event thresholds, decay, correction effects, and calibrated promotion or demotion remain deferred, so one isolated choice cannot currently distort the athlete model.

### R-170 Protected Primary Movement Swap
- Status: implemented-active-workout-slice
- Provenance: product-decision
- Requirement: Require stronger confirmation and disclose objective or specificity changes when replacing a protected primary movement, while still supporting a safe informed override and honest session adaptation.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: A primary replacement is blocked until the athlete explicitly confirms that specificity and the exact progression clock change. The same educated ranking and safe prescription path then remains available. If the original primary owns an active exact-movement placement check, the swap removes only that current check, consumes no lane quota, preserves other and resolved checks, and visibly explains that the replacement still earns its own history.

### R-171 Universal Survey Optionality
- Status: implemented-session-slice
- Provenance: from-user
- Requirement: Every onboarding, pre-session, warm-up, during-session, post-session, recovery, weekly, monthly, and block survey must be optional and skippable as a whole.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: Pre-session and post-session surveys can be skipped as a whole, warm-up confirmation retains Skip, onboarding has a direct-start route, and survey settings can disable the session surveys. Recovery, weekly, monthly, and block survey surfaces remain deferred.

### R-172 Per-Question Skip
- Status: implemented-pre-post-slice
- Provenance: from-user
- Requirement: Every individual survey question must offer Skip and Not Sure, with Prefer Not to Answer where appropriate, without requiring a reason.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: Every visible pre- and post-session question offers Skip, Not sure, and Prefer not. Untouched questions are stored separately as `not-answered`. Conditional safety detail, body maps, and the same controls on later review surveys remain deferred.

### R-173 Immediate Training Access
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Provide Start Workout Now, Start Without Check-In, and Finish Without Survey paths so data collection never blocks beginning, continuing, or completing training.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]
- Implementation: Today offers immediate survey-free start whenever surveys are available, the ask-each-time chooser includes Start workout without check-in, and post-session ask mode includes Finish workout without survey. Off mode bypasses its modal automatically.

### R-174 Survey Mode Preferences
- Status: implemented-pre-post-slice
- Provenance: product-decision
- Requirement: Let the athlete choose full, quick, minimal, off, or ask each time separately for onboarding, readiness, warm-up, during-session, post-session, and review surveys.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: The athlete can independently set pre- and post-session surveys to Full 10, Quick 5, Minimal 3, Off, or Ask each time. Onboarding, warm-up, during-session, recovery, and review cadence preferences remain deferred.

### R-175 Missing Is Unknown
- Status: implemented-session-slice
- Provenance: product-decision
- Requirement: Never interpret a skipped answer as good, bad, normal, pain-free, motivated, recovered, adherent, or any other response. Store it as unknown.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: Only explicit scale or number interactions produce `answered`. Skip, not sure, prefer not, and untouched defaults store null with distinct unknown status. Readiness and quality validation read answered values only, and backup restore rejects a non-null unknown response.

### R-176 Known Safety State Persistence
- Status: implemented-existing-state-slice
- Provenance: product-decision
- Requirement: Skipping a safety or pain question does not erase an active known flag or restriction, but it also does not create a new condition or claim.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: Skipping pain does not create a pain-free claim and does not change durable exercise joint-response or avoid flags. A dedicated athlete-level active injury and restriction model remains deferred.

### R-177 No Survey Penalty or Nagging
- Status: implemented-session-slice
- Provenance: from-user and product-decision
- Requirement: Survey skipping must not reduce access, readiness, adherence, motivation, recovery, completion, streaks, or functionality and must not trigger repeated unwanted reminders or shame.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: Skipped and disabled surveys do not block training, completion, volume, records, exercise changes, plan access, or progression. No survey reminders, shame language, adherence penalty, or streak penalty exists in the private alpha.

### R-178 Deferred Post-Session Feedback
- Status: implemented-private-alpha-core
- Provenance: product-decision
- Requirement: Allow partial post-session answers, immediate finish, or one optional Remind Me Later flow that expires and never blocks the next workout.
- Detail: [[Session Feedback and Learning Loop]]
- Implementation: The athlete can submit any explicit subset, leave the rest unknown, finish immediately, or choose Remind Me Later after selecting a post-session question budget. Deferral finishes and credits the workout immediately, creates one quiet local follow-up for 24 hours, never blocks the next workout, supports explicit dismissal, expires without a survey response, and replays quality-dependent records from the original completed sets only when technique and pain are explicitly answered later.

### R-179 Adaptive Question Burden
- Status: manual-controls-only
- Provenance: product-decision
- Requirement: Use repeated skip behavior only to shorten, reduce, or disable future question burden according to preference, never as evidence about training state.
- Detail: [[Lifelong Athlete Model and Adaptive Questioning]]
- Implementation: The athlete has direct persistent burden controls, but repeated skip behavior does not yet alter preferences automatically. Skip behavior remains excluded from training-state inference.

### R-180 Missing-Data Confidence and Fallback
- Status: implemented-session-slice
- Provenance: product-decision
- Requirement: When survey data is missing, use completed training, known history, and the existing deterministic plan with visibly lower personalization confidence rather than fabricating an adjustment.
- Detail: [[AI Integration and Decision Engine Architecture]]
- Implementation: Survey records store answered count, unknown count, and low, medium, or high evidence confidence. Zero explicit answers produce no readiness label, and skipped or sparse evidence keeps the baseline deterministic plan with visibly low survey confidence.
- Schedule implementation: Private alpha 0.30.0 records missing or stale readiness as an explicit unknown action with no penalty. Old source outcomes remain audit-only and cannot change the rebuilt plan.

### R-181 Survey-Free Core Operation
- Status: implemented-private-alpha-core
- Provenance: from-user and product-decision
- Requirement: Logging, programming, exercise changes, progression, volume, scheduling, and workout completion must remain functional when the athlete disables or skips all surveys.
- Detail: [[AI Integration and Decision Engine Architecture]]
- Implementation: Onboarding, logging, time compression, exercise substitution, progression, volume, scheduling, records, achievements, workout completion, export, and restore function when pre- and post-session surveys are both off.

### R-182 Structured Persistent Backend
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Use a relational persistent backend for the first real multi-device or multi-user product so years of training, feedback, decisions, and corrections remain queryable and trustworthy.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-183 Supabase Leading Backend Candidate
- Status: captured
- Provenance: verified-product-capability and product-decision
- Requirement: Evaluate Supabase first because it provides full Postgres, Auth, Row Level Security, server functions, Storage, extensions, and backup paths while keeping the core schema portable.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-184 Local Offline Workout Store
- Status: implemented-browser-equivalent-private-alpha
- Provenance: product-decision
- Requirement: Maintain a local SQLite or equivalent durable operational store so sets, surveys, substitutions, and workout completion remain fast and reliable without connectivity.
- Detail: [[Data Backend Storage and Learning Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] uses versioned local browser persistence for the private PWA. SQLite or an equivalent native operational store remains required before native or wider private distribution.

### R-185 Conflict-Aware Cross-Device Sync
- Status: captured
- Provenance: product-decision
- Requirement: Synchronize local events with the cloud system of record through explicit IDs, timestamps, versions, retry safety, and conflict rules that never silently discard completed work.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-186 Relational Canonical Data Model
- Status: captured
- Provenance: product-decision
- Requirement: Model athletes, exercises, aliases, equipment, plans, cycles, sessions, sets, surveys, substitutions, feedback, decisions, features, and outcomes as related versioned records rather than flat files or one mutable JSON object.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-187 Event History, Current State, and Derived Views
- Status: implemented-history-mutation-first-slice
- Provenance: product-decision
- Requirement: Preserve append-oriented event history, maintain efficient current state, and calculate reproducible derived analytics from versioned definitions without storing only the latest total.
- Detail: [[Data Backend Storage and Learning Architecture]]
- Implementation: Corrections, deletions, exercise merges, exercise-catalog edits, and validated history imports append auditable events while the current local projection and source-set-derived records remain fast to read. Imports retain before and after snapshots, source-set IDs, volume consequence, source provenance, and one-step undo. Exercise edit snapshots now also preserve athlete-reviewed muscle mappings and replay completed and planned muscle projections after change or undo. A relational event store, per-set historical catalog versions, and synchronized derived views remain deferred.

### R-188 Recommendation Data Provenance
- Status: captured
- Provenance: product-decision
- Requirement: Store the input snapshot, available evidence, rule version, candidates, rejected alternatives, selected recommendation, confidence, athlete override, and later outcome for every material decision.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-189 Explicit Missingness in Storage
- Status: captured
- Provenance: product-decision
- Requirement: Store skipped, not-sure, prefer-not-to-answer, unavailable, and not-asked states explicitly rather than converting them into numeric answers or generic null ambiguity.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-190 Secure Multi-Tenant Authorization
- Status: captured
- Provenance: verified-product-capability and security-decision
- Requirement: Use authentication and tested Row Level Security on every client-accessible athlete-data table so users can access only authorized records.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-191 Server-Side Secrets and Privileged Operations
- Status: captured
- Provenance: verified-product-capability and security-decision
- Requirement: Keep database-bypass credentials, AI keys, exports, deletion workflows, and privileged calculations behind authenticated server-side code and secrets management.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-192 Versioned Aggregates and Learning Features
- Status: implemented-local-first-slice
- Provenance: product-decision
- Requirement: Produce daily through annual volume, exposure, readiness, substitution, recovery, and personal-learning features through reproducible SQL views or jobs with calculation versions and source lineage.
- Detail: [[Data Backend Storage and Learning Architecture]]
- Implementation: The current local deterministic engine reproduces source-linked multi-horizon volume, plan dose-v1, muscle-dose-v1, and muscle-plan-dose-v1 without a server. Muscle dose retains calculation versions, exact exercise or plan-slot provenance, completed source-set lineage, mapping gaps, and strict separation of linked and unlinked completion. SQL views, background jobs, readiness aggregates, longitudinal learning features, historical mapping-version replay, and server-side materialization remain deferred until the backend phase.

### R-193 Data Quality Before Data Quantity
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Optimize collection for correct identity, units, context, comparability, consent, and outcome quality rather than assuming that more rows automatically improve recommendations.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-194 Personal Learning Without Mandatory Fine-Tuning
- Status: captured
- Provenance: product-decision
- Requirement: Begin personalization with structured events, comparable exposures, SQL aggregates, calibrated statistics, confidence thresholds, and athlete corrections rather than continuously fine-tuning a foundation model.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-195 Knowledge Retrieval Separate From Training Truth
- Status: captured
- Provenance: product-decision
- Requirement: Use full-text search first and optional pgvector only for evaluated research or semantic retrieval, never as the authority for completed sets, progression, pain, permissions, or cycle state.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-196 Backup, Migration, and Recovery
- Status: implemented-local-first-slice
- Provenance: verified-product-capability and product-decision
- Requirement: Version schema migrations, maintain portable logical exports, cover database and file storage separately, define recovery objectives, and test restoration instead of assuming platform backups are sufficient.
- Detail: [[Data Backend Storage and Learning Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] includes open JSON schema version 10 with complete mesocycle revision history, history and catalog ledger, validated import events and row provenance, cycle-review ledger, PR v2 projections, local celebration preferences, the substitution-learning ledger, survey mode and evidence provenance, the deferred-feedback lifecycle, and optional custom-exercise muscle mappings. It provides deterministic integrity verification, versions 1 through 9 migration, mapping validation in current catalog and event snapshots, catalog-edit and import-event validation, imported-metadata completeness checks, replayed historical record projections, substitution validation, survey missingness and evidence reconciliation, deferred request status, expiry, resolution, and survey-reference validation, identity and reference validation, a 25 MB restore limit, pre-mutation preview, tested restore, malformed-file rejection, and one automatic pre-restore undo point. Cloud backup and public recovery objectives remain deferred.

### R-197 Athlete Data Rights and Minimization
- Status: implemented-partial
- Provenance: product-decision
- Requirement: Collect only decision-relevant personal data and provide access, correction, export, retention controls, deletion, and cloud-AI disable behavior.
- Detail: [[Data Backend Storage and Learning Architecture]]
- Implementation: [[Private Alpha Implementation 2026-08-10]] provides complete local export, local reset, restore, reason-required completed-set correction and deletion, merge undo, full-import undo, and no mandatory cloud or AI transfer. Whole-account retention controls and cloud deletion remain incomplete.

### R-198 Required Backend and Scale Chapter
- Status: captured
- Provenance: from-user and product-decision
- Requirement: The final development outline must specify the local store, Supabase decision, schema, sync, security, server functions, aggregates, learning pipeline, backups, data rights, and evidence-based thresholds before adding a warehouse, vector database, or model-training infrastructure.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-199 Data-Backed Personal Gamification
- Status: implemented-personal-first-slice
- Provenance: from-user
- Requirement: Add a gamified layer that uses validated personal training history to reveal records, near-term opportunities, achievements, and micro wins during programming and workout execution.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Private alpha 0.6.0 derives personal records, planned opportunities, achievement feedback, and micro wins from completed local history. Social and cloud-backed gamification remain deferred.

### R-200 Multi-Dimensional PR Taxonomy
- Status: implemented-core-taxonomy-slice
- Provenance: from-user and product-decision
- Requirement: Support absolute load, repetitions at load, load for a repetition target, exact set scheme, estimated strength, exact-movement volume, workout-day volume, muscle dose, density, and quality-adjusted record types.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: PR v2 separates absolute load, repetitions at an exact load, load for an exact repetition count, exact set schemes, Epley estimated strength, exact-movement session volume, and workout session volume. Muscle dose, density, and broader quality-adjusted record definitions remain deferred.

### R-201 Exact-Movement Load and Repetition Records
- Status: implemented
- Provenance: from-user
- Requirement: Track examples such as the athlete's best bench load, most repetitions at 235, and heaviest successful set of five for the exact canonical movement.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Exact canonical exercise IDs now own absolute-load, repetitions-at-load, and load-for-repetitions records with completed source-set IDs.

### R-202 Set-Scheme Records
- Status: implemented-uniform-load-slice
- Provenance: from-user
- Requirement: Recognize exact completed configurations such as 4 x 12 at 235, heaviest 5 x 5, or most total repetitions across a defined number of sets without collapsing different distributions into one result.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: The engine preserves the ordered repetition distribution and recognizes the heaviest uniform-load completion for exact schemes such as four sets of six or a mixed six, six, five, five configuration. Mixed-load scheme comparison and total-repetition-at-load definitions remain deferred.

### R-203 Estimated-Strength Records
- Status: implemented-epley-v1-slice
- Provenance: product-decision
- Requirement: Track estimated-strength records separately from verified maximums and preserve the formula, eligible repetition range, and calculation version.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Estimated strength uses the labeled Epley v1 formula for completed sets of one through twelve repetitions and remains separate from verified maximum load.

### R-204 Movement and Workout Volume Records
- Status: implemented-exact-movement-and-workout-slice
- Provenance: from-user
- Requirement: Recognize qualifying exact-movement session volume and comparable workout-day, workout-type, body-region, or block volume records while labeling them as workload achievements.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Exact-movement session volume and whole-workout session volume are labeled workload records. Workout archetype, body-region, block, and muscle-dose records remain deferred.

### R-205 Multi-Scope Record Context
- Status: implemented-all-time-slice
- Provenance: product-decision
- Requirement: Distinguish all-time, yearly, rolling, macrocycle, block, phase, recent, and since-return records so current progress remains meaningful without erasing lifetime history.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Current records explicitly use the all-time scope. Calendar-year, rolling, block, phase, and since-return record scopes remain deferred rather than being silently inferred.

### R-206 Progression-Eligible PR Opportunity Engine
- Status: implemented-prescribed-target-slice
- Provenance: from-user and product-decision
- Requirement: Compare today's planned target with current records and show the smallest executable margin to a new record only when the target is already allowed by progression, phase, technique, effort, pain, and readiness rules.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Opportunities compare exact current records with the original prescribed targets only and are paused for protect, pain-aware, or reacclimation readiness, irritating or avoided joint response, or a prescription without a retained safety repetition. Athlete-edited actual values never become app-prescribed opportunities.

### R-207 In-Workout Historical Context and Notifications
- Status: implemented-prescribed-opportunity-slice
- Provenance: from-user
- Requirement: At exercise start and before eligible sets, show the last comparable result and one or two relevant opportunities such as 180 creating a load PR after 175 last time.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Today and active-workout surfaces show the latest exact result, a planned-target opportunity when eligible, or an honest productive-hold message when no record is prescribed. Opportunity prompts are non-blocking and athlete-controlled. Advanced notification scheduling remains deferred.

### R-208 Immediate Achievement Feedback
- Status: implemented-visual-and-haptic-slice
- Provenance: from-user and product-decision
- Requirement: After a qualifying set or session, show the prior record, new result, improvement, scope, and validation state through configurable badges, haptics, sounds, animations, or confetti.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: A completed active set can produce a non-blocking provisional achievement, optional supported-device haptic, celebration-level styling, and optional pixel confetti. The saved Progress ledger shows prior and new evidence. An approved audio pack and richer animation library remain deferred.

### R-209 PR Comparability and Quality Validation
- Status: implemented-quality-confirmation-slice
- Provenance: product-decision
- Requirement: Validate records by canonical exercise, modifiers, normalized units, range, assistance, technique, tempo, effort, pain, phase, and completed work, labeling uncertain results rather than overstating them.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Current records require completed source sets and exact canonical identity. Fully validated PRs additionally require explicitly confirmed technique of at least three and pain no greater than three. A skipped or incomplete quality survey preserves the number as `numeric-only` and labels the achievement `Unverified number best`. Athlete-confirmed history correction can change this state. Unit normalization, assistance, tempo, range, phase, and richer equipment modifiers remain incomplete.

### R-210 Gamification Cannot Override Programming
- Status: implemented-first-slice
- Provenance: safety-decision
- Requirement: A record opportunity or celebration cannot independently raise load, repetitions, sets, or session stress or override a hold, deload, reacclimation, pain, technique, readiness, or phase decision.
- Detail: [[Progression and Volume Model]]
- Implementation: Record context is display-only and cannot mutate the deterministic load-first prescription, hold, reduction, protection, or reacclimation decision.

### R-211 No Junk-Volume Record Chasing
- Status: implemented-first-slice
- Provenance: safety-decision
- Requirement: Do not recommend extra low-value sets or repetitions solely to trigger a volume record. Prospective volume achievements must fit the prescribed dose and recovery budget.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: The record display never adds sets or repetitions. Volume progression remains available only through the normal progression engine and current recovery logic.

### R-212 Exact and Family Record Separation
- Status: implemented-exact-only
- Provenance: product-decision
- Requirement: Keep exact exercise records authoritative while offering separately labeled variation-family achievements that never overwrite competition or exact-movement history.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Current records are keyed to exact canonical exercise IDs. Variation-family achievements remain deferred and cannot overwrite exact records.

### R-213 Auditable PR Provenance
- Status: implemented-expanded-provenance-slice
- Provenance: product-decision
- Requirement: Store record definition, prior and new value, source workout and set IDs, scope, normalized units, context, validation, calculation version, correction state, and notification outcome.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Every current record stores definition ID, type, category, value, unit class, achieved date, all-time scope, exact exercise or whole-workout identity, source session, supporting completed set IDs, context, validation state, and PR v2 rule version. Achievement replay stores the prior value and source IDs. Historical notification delivery and normalized physical units remain deferred.

### R-214 PR Ledger and Dashboard
- Status: implemented-current-ledger-slice
- Provenance: from-user and product-decision
- Requirement: Provide current records, recent bests, all-time bests, PR history, original workout links, near-term eligible opportunities, and corrected or invalidated records by exercise and category.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Progress includes category-filtered current records, source-set counts, validation labels, a PR and micro-win timeline, and next-session safe opportunities. Direct workout deep links, superseded-record views, variation-family ledgers, and every future scope remain deferred.

### R-215 Deterministic PR Recalculation
- Status: implemented-local-first-slice
- Provenance: product-decision
- Requirement: Recompute affected records after corrected or invalidated sets, unit changes, exercise alias resolution, or approved history merges while preserving the audit trail.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Workout completion, set correction, set deletion, approved exercise merge, backup migration, and local-state migration regenerate records from completed history. Each history mutation retains before and after record projections for audit and undo.

### R-216 Athlete-Controlled Celebration
- Status: implemented-local-controls-slice
- Provenance: product-decision
- Requirement: Let athletes disable or separately configure opportunity prompts, sounds, haptics, animations, confetti, record types, scopes, sharing, and quiet mode without affecting training functionality.
- Detail: [[PR Gamification and In-Workout Motivation System]]
- Implementation: Local preferences control celebration level, quiet mode, opportunity prompts, in-workout achievements, pixel confetti, reduced motion, sounds preference, and supported-device haptics. Quiet mode changes presentation only. Type-level and scope-level notification filters and sharing remain deferred.

### R-217 Non-PR Achievements
- Status: implemented-core-deterministic-slice
- Provenance: from-user and product-decision
- Requirement: Celebrate technique, lower effort, consistency, recovery, pain-free return, reacclimation, and baseline restoration as clearly labeled achievements or micro wins rather than false strength records.
- Detail: [[Micro Progress and Long-Term Wins]]
- Implementation: Deterministic replay recognizes baseline establishment, comparable load and repetition micro wins, confirmed quality wins, movement return, and three-session consistency. Recovery, reacclimation completion, pain-free return, and more nuanced maintenance achievements remain deferred.

### R-218 Offline and Synced PR Consistency
- Status: implemented-local-replay-slice
- Provenance: product-decision
- Requirement: Calculate achievements offline when needed and reconcile them through the same versioned record definitions after cloud sync so devices do not create conflicting active records.
- Detail: [[Data Backend Storage and Learning Architecture]]
- Implementation: PR v2 and achievement v1 calculate locally from the same completed source sets and replay after correction, deletion, merge, local migration, and backup migration. Cloud sync and multi-device conflict reconciliation remain deferred.

### R-219 Optional Social Progress Layer
- Status: captured
- Provenance: from-user
- Requirement: Provide an eventual optional social layer where athletes can see selected friend training activity, progress, achievements, and shared PRs for motivation.
- Detail: [[Friends Social Progress and Challenge System]]

### R-220 Private-by-Default Social Profile
- Status: captured
- Provenance: product-decision
- Requirement: Keep profiles and training activity private until an athlete explicitly enables social participation or shares an event. Social participation cannot affect personal coaching quality.
- Detail: [[Friends Social Progress and Challenge System]]

### R-221 Mutual Friends, Removal, Mute, and Block
- Status: captured
- Provenance: product-decision
- Requirement: Begin with mutual friend relationships and support request, acceptance, decline, cancellation, mute, removal, and bidirectional blocking before considering public followers or discovery.
- Detail: [[Friends Social Progress and Challenge System]]

### R-222 Granular Activity Visibility
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Let the owner select who can see each event and how much detail it contains, including completion only, session highlight, selected achievements, selected exercise details, or a later optional full-workout view.
- Detail: [[Friends Social Progress and Challenge System]]

### R-223 Sanitized Shared Activity Events
- Status: captured
- Provenance: privacy-decision
- Requirement: Create a separate sanitized social event after an explicit sharing choice. Do not grant friends permission to query the source workout or other private athlete tables.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-224 Authorized Friend Activity Feed
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Provide an authorized feed that can show whether a friend chose to share a completed workout, session type, selected movements, milestones, PRs, return wins, or consistency achievements.
- Detail: [[Friends Social Progress and Challenge System]]

### R-225 Shared PR and Achievement Cards
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Shared record cards must identify the exact movement, important modifiers, set and repetition structure, normalized load, record category, scope, and validation state for every approved field rather than displaying an ambiguous strength claim.
- Detail: [[PR Gamification and In-Workout Motivation System]]

### R-226 Friend PR Proximity Notifications
- Status: captured
- Provenance: from-user
- Requirement: When enabled, notify an athlete that an already-planned and progression-eligible result could exceed a friend's comparable shared record, including the exact difference and comparison context.
- Detail: [[Friends Social Progress and Challenge System]]

### R-227 Progression-Eligible Social Targets
- Status: captured
- Provenance: product-decision
- Requirement: A social prompt can reveal an opportunity supported by the athlete's program but cannot independently increase load, repetitions, sets, density, or fatigue. Pain, readiness, technique, deload, reacclimation, and phase rules remain authoritative.
- Detail: [[Friends Social Progress and Challenge System]]

### R-228 Exact Exercise and Metric Comparison
- Status: captured
- Provenance: product-decision
- Requirement: Exact friend comparison requires compatible canonical exercise identity, modifiers, units, set structure, range, assistance, technique or validation state, and record-definition version. Label related variations as related rather than exact.
- Detail: [[PR Gamification and In-Workout Motivation System]]

### R-229 Exact and Scaled Challenges
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Support exact challenges and clearly labeled scaled challenges based on approved personal references such as estimated maximum, working maximum, personal baseline, or explicitly shared bodyweight when appropriate.
- Detail: [[Friends Social Progress and Challenge System]]

### R-230 Personal-Improvement and Consistency Challenges
- Status: captured
- Provenance: product-decision
- Requirement: Support fair challenge formats where friends improve against their own baselines, complete planned exposures, or build consistency without relying only on absolute-load leaderboards.
- Detail: [[Friends Social Progress and Challenge System]]

### R-231 Challenge Candidate Scheduling
- Status: captured
- Provenance: product-decision
- Requirement: Saving a friend's performance creates a candidate challenge rather than a prescription. The coaching engine must evaluate compatibility, phase, exercise identity, equipment, time, recovery, and progression eligibility before offering a future slot or scaled version.
- Detail: [[Friends Social Progress and Challenge System]]

### R-232 Social Safety and Anti-Shame Rules
- Status: captured
- Provenance: product-decision
- Requirement: Prohibit shame language, public failure badges, streak-loss punishment, junk-volume incentives, and social overrides of health or training safeguards. Every challenge can be declined, deferred, muted, or abandoned without penalty.
- Detail: [[Friends Social Progress and Challenge System]]

### R-233 Athlete-Controlled Social Notifications and Rivals
- Status: captured
- Provenance: product-decision
- Requirement: Let athletes disable or configure friend comparisons, selected friendly rivals, milestone prompts, pre-workout and in-workout opportunities, immediate pushes, digests, and all social notifications.
- Detail: [[Friends Social Progress and Challenge System]]

### R-234 Positive Reactions and Encouragement
- Status: captured
- Provenance: product-decision
- Requirement: Begin with a small set of positive reactions and save-as-challenge behavior. Treat free-text comments or messaging as a later moderation-heavy decision rather than an MVP dependency.
- Detail: [[Friends Social Progress and Challenge System]]

### R-235 No Raw Health or Survey Sharing
- Status: captured
- Provenance: privacy-decision
- Requirement: Do not share survey answers, sleep, nutrition, stress, readiness, recovery, pain, injury, medication, bodyweight, body composition, location, private notes, missed-workout reasons, or athlete-model hypotheses by default.
- Detail: [[Friends Social Progress and Challenge System]]

### R-236 Social Row-Level Security and Authorization
- Status: captured
- Provenance: security-decision
- Requirement: Protect relationship, share, reaction, notification, and challenge tables with tested Row Level Security and server-side authorization based on current friendship or group membership, blocks, per-event visibility, revocation, and approved fields.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-237 Share Revocation, Removal, and Blocking
- Status: captured
- Provenance: privacy-decision
- Requirement: Revoking a share removes it from authorized feeds without deleting the private workout. Friendship removal or blocking must remove relationship-based access and suppress future notifications promptly.
- Detail: [[Friends Social Progress and Challenge System]]

### R-238 Corrected and Invalidated Social Records
- Status: captured
- Provenance: product-decision
- Requirement: Corrections or invalidations to a source set, PR, or achievement must update, supersede, or remove the associated social card, notification, and challenge result while preserving an audit trail.
- Detail: [[Friends Social Progress and Challenge System]]

### R-239 Social Event and Challenge Provenance
- Status: captured
- Provenance: product-decision
- Requirement: Store owner, private source reference, approved shared fields, visibility, exact metric context, calculation and record versions, validation state, timestamps, corrections, revocation, and supersession for every social event and challenge result.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-240 Phased Social Rollout
- Status: captured
- Provenance: product-decision
- Requirement: Ship social only after the personal coaching and PR systems are trustworthy. Begin with mutual friends, sanitized completion or selected-PR sharing, reactions, and privacy controls; add challenges later; defer public discovery and leaderboards until authorization, moderation, and safety are proven.
- Detail: [[Friends Social Progress and Challenge System]]

### R-241 Categorized Exercise Library Home
- Status: captured
- Provenance: from-user
- Requirement: Organize the exercise library around visible entry points for Body Part, Movement Type, Training Role, Goal or Weak Point, Equipment, My Movements, Recently Used, and Browse All instead of beginning with one flat alphabetical list.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-242 Hierarchical Body-Part Discovery
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Let athletes browse from whole body to upper or lower body, major regions, muscles, and supported subregions. Show primary-muscle matches before secondary contributors while preserving compound-movement context.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-243 Hierarchical Movement-Type Discovery
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Support broad pattern shortcuts and precise movement types including squat, hinge, horizontal and vertical press or pull, joint actions, trunk actions, single-leg work, carries, explosive work, conditioning, and other explicitly labeled categories.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-244 Role, Goal, Weak-Point, and Equipment Discovery
- Status: captured
- Provenance: product-decision
- Requirement: Let athletes find movements by training role, target lift, adaptation goal, weak-point hypothesis, available equipment, and equipment location in addition to body part and movement type.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-245 Shared Library and Recommendation Taxonomy
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Use one canonical taxonomy for the full Library, Add Movement, Change Movement, and recommendation engine so recommendation groups and manual browsing never become inconsistent parallel catalogs.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-246 Multi-Category Discovery With One History
- Status: captured
- Provenance: product-decision
- Requirement: Allow one exercise to appear under every relevant body part, movement type, role, goal, equipment, and variation-family view while retaining one canonical ID, one exact history, and no duplicate progression clocks.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-247 Contextual Recommendation Grouping
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Group recommendations by the context that opened the screen. A target-muscle replacement begins with that muscle and preserved-role matches; a press replacement begins with its movement type; optional browsing can begin with body part. The athlete can switch grouping at any time.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-248 Faceted Filters, Search, Sorting, and Breadcrumbs
- Status: captured
- Provenance: product-decision
- Requirement: Provide search-as-you-type, aliases, removable filter chips, result counts, breadcrumbs, Clear All, saved personal collections, and useful sorting across body part, movement type, role, goal, equipment, joints, history, preference, fatigue, and time.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-249 Custom Exercise Taxonomy Parity
- Status: captured
- Provenance: product-decision
- Requirement: Classify custom exercises through the same body-part, muscle, movement-type, role, equipment, modifier, and goal structure as system movements. Suggest likely tags, require athlete confirmation or correction, and allow unknown rather than fabricating certainty.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-250 Explainable Empty Results and Constraint Relaxation
- Status: captured
- Provenance: product-decision
- Requirement: When no exercise satisfies the selected filters, identify which constraint removed the final options and offer reversible relaxations without silently ignoring pain, equipment, training role, or session-purpose constraints.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-251 Original 2D Pixel Training Direction
- Status: captured
- Provenance: from-user
- Requirement: Give the app, game layer, interface, and overall vibe a fun 2D pixel-adventure identity with small characters, expressive reaction icons, and entertaining visual details.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-252 Distinct Original Training World
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Translate the warmth and visual clarity of classic handheld and 16-bit adventures into a distinct strength-and-hypertrophy world without reproducing another game's characters, creatures, interface, symbols, names, world, or exact assets.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-253 Hybrid Pixel Art and Modern Training UI
- Status: captured
- Provenance: product-decision
- Requirement: Use pixel art for characters, environments, category emblems, exercise and equipment sprites, reactions, badges, maps, and celebrations. Use clean modern controls and typography for sets, loads, repetitions, timers, charts, surveys, warnings, history, and explanations.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-254 Customizable Athlete Avatar
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Provide an optional customizable pixel athlete with inclusive appearance, clothing, training-accessory, pose, and celebration options without inferring ability, gender, personality, or goals from appearance.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-255 Purposeful Supporting Characters
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Use small original coach, spotter, exercise-library, recovery, equipment, friend, or optional training-companion characters only when they support a clear product function rather than crowding the interface.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-256 Pixel Reaction and Emoji Language
- Status: captured
- Provenance: from-user
- Requirement: Create an original pixel reaction set for readiness, energy, fatigue, soreness, stress, uncertainty, enjoyment, target-muscle feel, technique, PRs, recovery, consistency, return, and friend encouragement. Pair every reaction with text and an accessible name.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-257 Pixel Translation Across Core Product Surfaces
- Status: captured
- Provenance: product-decision
- Requirement: Apply the visual world coherently to Today, Plan, Progress, Library, active Workout, surveys, achievements, and social surfaces while keeping each feature's factual training information authoritative.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-258 Exercise Taxonomy Pixel Emblems
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Create consistent pixel emblems or silhouettes for body parts, movement types, equipment, training roles, goals, and exercise families using the same canonical taxonomy as the exercise library and recommendation system.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-259 Optional Training Cycle Adventure Map
- Status: captured
- Provenance: product-decision
- Requirement: Offer an optional map view where sessions, microcycles, mesocycles, and larger goals appear as routes, chapters, or destinations. The map supplements rather than replaces the real schedule, completed-exposure sequence, and fixed dates.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-260 Evolving Personal Progress Environment
- Status: captured
- Provenance: product-decision
- Requirement: Let verified progress gradually develop an optional personal gym room, training journal, badge wall, trophy shelf, or related environment through load, repetition, volume, technique, consistency, recovery, learning, and return achievements.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-261 Non-Blocking In-Workout Delight
- Status: captured
- Provenance: product-decision
- Requirement: Keep active-workout character reactions, set-completion effects, timer animation, and celebrations brief and non-blocking. They cannot delay logging, obscure load or repetition entry, or interrupt safety actions.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-262 Distinct Pixel Achievement Language
- Status: captured
- Provenance: product-decision
- Requirement: Give load, repetitions, set scheme, volume, technique, consistency, recovery, return, and block-completion achievements visibly distinct emblems and celebrations without misrepresenting one category as another.
- Detail: [[PR Gamification and In-Workout Motivation System]]

### R-263 Pixel Friend and Challenge Presentation
- Status: captured
- Provenance: product-decision
- Requirement: Represent friends through their selected avatars and privacy-approved activity cards, distinguish exact from scaled challenges visually, and keep all friend reactions and comparisons subordinate to social authorization and personal progression rules.
- Detail: [[Friends Social Progress and Challenge System]]

### R-264 Readable Typography and Numeric Hierarchy
- Status: captured
- Provenance: product-decision
- Requirement: Limit pixel display type to short titles, badges, chapter names, and celebratory numbers. Use a highly legible interface typeface for exercise names, tables, charts, surveys, timers, warnings, and long explanations, with dynamic text support.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-265 Consistent Pixel Asset System
- Status: captured
- Provenance: product-decision
- Requirement: Define source grids, integer scaling, nearest-neighbor behavior, silhouettes, outlines, palettes, light direction, shading, animation, naming, export, and versioning before producing the full icon, avatar, sprite, and environment library.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-266 Configurable Motion, Sound, and Haptics
- Status: captured
- Provenance: product-decision
- Requirement: Support full, reduced, celebration-only, and no-animation modes plus separately optional sound and haptics. Motion cannot delay training actions and should follow device reduced-motion preferences.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-267 Accessible Pixel Experience
- Status: captured
- Provenance: accessibility-decision
- Requirement: Preserve accessible touch targets, labels, contrast, dynamic text, screen-reader behavior, chart and body-map alternatives, zoom, keyboard or switch navigation where applicable, and non-color status cues throughout the pixel presentation.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-268 Focused Training and Low-Decoration Mode
- Status: captured
- Provenance: product-decision
- Requirement: Let athletes reduce or disable decorative characters, environments, motion, sound, and celebrations without losing any logging, programming, progress, library, survey, or social functionality.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-269 Non-Punitive Cosmetic Progression
- Status: captured
- Provenance: product-decision
- Requirement: Never damage a companion or room, remove a collectible, display public failure, or create guilt because a workout was missed. Never recommend unsafe extra work solely to unlock cosmetic content.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-270 Pixel Visual Prototype Before Asset Scale
- Status: captured
- Provenance: product-decision
- Requirement: Prototype connected Today, active Workout, organized Library, and PR Result screens and test fun, legibility, speed, safety, accessibility, and visual originality before committing to a large pixel asset library.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-271 Private First Usable Release
- Status: captured
- Provenance: from-user
- Requirement: Make the first usable application private and primarily for JB rather than opening public signup or general athlete access immediately.
- Detail: [[App Build Reference Index]]

### R-272 Multi-Month Personal Incubation
- Status: captured
- Provenance: from-user
- Requirement: Expect several months of real-workout testing, retesting, experimentation, correction, and new ideas before considering a public release.
- Detail: [[App Build Reference Index]]

### R-273 Iteration Without History Loss
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Support frequent private-phase changes through versioned rules, migrations, decision provenance, correction tools, historical replay, backups, export, and regression cases so experimentation does not destroy or reinterpret prior training silently.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-274 Evidence-Gated Public Readiness
- Status: captured
- Provenance: product-decision
- Requirement: Do not treat elapsed time alone as permission to launch publicly. Require trustworthy logging, safe progression, missed-session adaptation, substitution, analytics, corrections, backup and restore, data migration, and repeated real-workout performance before inviting other athletes.
- Detail: [[App Build Reference Index]]

### R-275 RP YouTube Training Corpus
- Status: captured
- Provenance: from-user
- Requirement: Build and maintain a transcript-first research corpus from official Renaissance Periodization YouTube material related to exercise programming, strength development, bodybuilding, hypertrophy, fatigue, recovery, exercise selection, and periodization.
- Detail: [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]

### R-276 Auditable Coverage Ledger
- Status: captured
- Provenance: product-decision
- Requirement: Track exact channel snapshots, included playlists, video IDs, metadata presence, transcript presence, transcript usability, synthesis status, exclusions, and pending work so broad research claims remain auditable.
- Detail: [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]

### R-277 Transcript Quality Validation
- Status: captured
- Provenance: product-decision
- Requirement: Do not treat a transcript file as successfully reviewed until it passes semantic quality inspection. Record absent, corrupt, partial, and locally transcribed sources separately and reprocess failures when possible. Add targeted visual review when technique, range, setup, exercise demonstration, or app workflow cannot be validated from words alone.
- Detail: [[Research Corpus and Source Quality Register]]

### R-278 Relevant-Video Classification
- Status: captured
- Provenance: product-decision
- Requirement: Prioritize actionable programming, technique, recovery, fatigue, exercise-selection, and periodization content. Keep reaction, entertainment, duplicate, promotional, and unrelated material outside the core methodology tier unless it adds a distinct claim.
- Detail: [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]

### R-279 Claim and Evidence Separation
- Status: captured
- Provenance: product-decision
- Requirement: Label RP coaching doctrine, scientific evidence, app behavior, marketing claims, product inference, and JB-specific decisions separately. Coach doctrine cannot silently become scientific fact or deterministic product authority.
- Detail: [[Methodology Research Hub]]

### R-280 Publication and Update Provenance
- Status: captured
- Provenance: product-decision
- Requirement: Preserve video identity, publication context, source version, and date checked. When newer RP content revises an older recommendation, retain the history and mark the current interpretation rather than silently overwriting it.
- Detail: [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]

### R-281 Duplicate and Repackaged Source Control
- Status: captured
- Provenance: product-decision
- Requirement: Detect duplicate, clipped, reposted, and repackaged video material so one repeated claim does not falsely increase evidence confidence or waste transcript-review effort.
- Detail: [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]

### R-282 Goal-Specific Programming Extraction
- Status: captured
- Provenance: from-sources and product-decision
- Requirement: Translate RP material into explicit goal-specific rules for hypertrophy, transferable hypertrophy for strength, basic strength, peaking, recovery, and active rest rather than blending all prescriptions into one generic progression model.
- Detail: [[Mike Israetel Methodology]]

### R-283 Research-to-Regression Translation
- Status: captured
- Provenance: product-decision
- Requirement: Convert durable programming claims into explainable decision rules, contradiction tests, and representative app scenarios before allowing them to influence athlete prescriptions.
- Detail: [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]

### R-284 Continuing RP Corpus Refresh
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Continue the RP research queue beyond the 43-video foundation, audit unplaylisted relevant uploads, recheck new or revised content on dated snapshots, and update the knowledge base without claiming premature completion.
- Detail: [[Renaissance Periodization YouTube Training Corpus 2026-08-09]]

### R-285 Canonical Build Bible
- Status: captured
- Provenance: from-user
- Requirement: Maintain one highly detailed, build-oriented reference guide that organizes the entire app conversation and shapes future product design, engineering, testing, research translation, and delivery.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible]]

### R-286 Complete Requirement Traceability
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Preserve complete traceability from every stated app requirement to the Build Bible chapter, detailed source specification, implementation phase, and verification method so no thread detail disappears during development.
- Detail: [[Build Bible Requirement Traceability Matrix]]

### R-287 Build-Ready Behavioral Contracts
- Status: captured
- Provenance: product-decision
- Requirement: Define build-ready user journeys, screen contracts, state transitions, domain objects, calculations, decision order, event contracts, offline behavior, error behavior, and acceptance scenarios rather than leaving the product as a feature list.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible]]

### R-288 Phased Implementation and Quality Gates
- Status: captured
- Provenance: product-decision
- Requirement: Divide development into a private logging core, adaptive coaching core, longitudinal intelligence, optional AI, broader private testing, and later social phases, each with explicit exit gates and zero-tolerance defect classes.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible]]

### R-289 Living Specification Governance
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Treat the Build Bible as a versioned living specification. When implementation or personal testing changes a rule, update requirements, decision provenance, tests, migrations, release notes, and the Obsidian project without silently rewriting historical behavior.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible]]

### R-290 Working Private Alpha
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: Build a genuinely usable private application immediately so JB can begin testing real workout logging, feedback, progression, substitutions, and progress views while later backend and public infrastructure remain deferred.
- Detail: [[Private Alpha Implementation 2026-08-10]]

### R-291 Local-First Same-Day Delivery
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: The first working version may use a responsive installable local-first web application when that delivers the fastest trustworthy private test loop, provided domain rules remain separated and migration to durable native and cloud storage remains explicit.
- Detail: [[Private Alpha Implementation 2026-08-10]]

### R-292 Backend and AI Deferral Without Architecture Debt
- Status: implemented-boundary
- Provenance: from-user and product-decision
- Requirement: Backend, authentication, multi-device sync, and AI services may follow after the private interaction loop works, but the first build must keep deterministic rules provider-independent and document the migration boundary.
- Detail: [[Private Alpha Implementation 2026-08-10]]

### R-293 Visual Product, Not Only a Skeleton
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: The first usable app must include a coherent original visual experience across its main screens, responsive phone behavior, and the requested pixel-training-adventure character rather than shipping only data structures or an unstyled prototype.
- Detail: [[Private Alpha Implementation 2026-08-10]]

### R-294 Build Bible Implementation Authority
- Status: active
- Provenance: from-user
- Requirement: During development, repeatedly consult the Obsidian Brain, requirement register, Build Bible, and linked detailed specifications so implementation decisions remain traceable and thread details are not silently omitted.
- Detail: [[App Build Reference Index]]

### R-295 Honest Completeness and Persistent Iteration
- Status: active
- Provenance: from-user and product-decision
- Requirement: Continue building toward the complete product while clearly separating verified working behavior, partially implemented behavior, and deferred phases. Passing a first alpha must not be represented as completion of all requirements.
- Detail: [[Private Alpha Implementation 2026-08-10]]

### R-296 Original Evolving Training Companion
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Offer an optional original pixel training companion with a clear four-form growth arc that evokes the satisfying progression and late-stage spectacle of classic monster-training games without copying any existing creature, name, silhouette, anatomy, costume, icon, interface, evolution, or giant-form sequence.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-297 Completed-Workout Experience Points
- Status: captured
- Provenance: from-user
- Requirement: Award visible experience points from completed workout events so consistent use gradually raises the companion's level. XP must derive from stored training truth and remain auditable after corrections, restore, and sync.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-298 Anti-Grind Experience Economy
- Status: captured
- Provenance: product-decision
- Requirement: Use bounded session and achievement XP rather than raw tonnage, extra sets, maximum load, or workout duration so cosmetic leveling never encourages junk volume, unsafe effort, pain continuation, survey gaming, or fabricated sessions.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-299 Level and Evolution Gates
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Let the companion progress through many visible levels and eventually unlock four original forms: Starting, Developed, Champion, and Apex. Evolution eligibility must use versioned XP plus meaningful completed-exposure milestones, remain separate from athlete placement level, and require an explicit athlete confirmation rather than changing silently.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-300 Post-Workout Level-Up Sequence
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Present a fun original pixel level-up and evolution sequence only after training is safely recorded or from a later replay prompt. It cannot interrupt an active set, hide saved results, delay safety actions, or become required before the next workout.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-301 Non-Punitive Companion Continuity
- Status: captured
- Provenance: product-decision
- Requirement: Never remove XP, lower a level, reverse an evolution, weaken a companion, or shame the athlete because of missed workouts, deloads, injury, illness, childcare, travel, schedule interruption, survey skipping, or a conservative training decision.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-302 Companion Accessibility and Athlete Control
- Status: captured
- Provenance: product-decision
- Requirement: Make the companion, XP display, level-up motion, sound, haptics, and evolution ceremony optional. Provide reduced-motion, celebration-only, silent, focused-training, skip-now, and replay-later controls without removing any training functionality or earned progress.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-303 Originality and Intellectual-Property Boundary
- Status: captured
- Provenance: product-decision
- Requirement: Treat references such as Machop, Machoke, Machamp, Gigantamax, G-Max, Dynamax, and Pokémon only as shorthand for a readable four-form strength fantasy and late-stage spectacle. Do not ship those names, likenesses, four-arm progression, giant-form silhouettes, facial structures, costumes, clouds, energy, badges, sounds, fonts, terminology, thresholds, trade or battle mechanics, or other recognizable protected expression. Create and document an independently ownable creature world, Apex identity, and evolution language before public use.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-304 Exact-Movement Preference Scale
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Let the athlete assign each exact canonical exercise a stated preference of favorite, prefer, neutral, dislike, or do not recommend so recommendations can promote wanted movements and shy away from unwanted ones without deleting their history.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-305 Preference, Joint Response, and Restriction Separation
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Store exercise preference separately from joint response, pain, active medical or training restrictions, equipment availability, and exercise retirement. Disliking a movement must not be interpreted as injury, and a joint-friendly movement need not be preferred.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-306 Context-Specific Movement Rules
- Status: captured
- Provenance: from-user
- Requirement: Allow an exact movement preference to change by declared training context, including goal, sport, competition-preparation state, block or phase, exercise role, equipment location, and optional effective dates, rather than forcing one global preference for every situation.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-307 Competition-Specific Exercise Example
- Status: captured
- Provenance: from-user
- Requirement: Support a rule such as `Sumo deadlift: use during powerlifting competition preparation; outside that context prefer conventional deadlift or stiff-leg deadlift`, with the active context and alternatives visible and editable by the athlete.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-308 Preference-Aware Recommendation Authority
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Apply explicit movement preference only after safety, active restrictions, equipment eligibility, protected session purpose, and required specificity. Promote favorites among otherwise suitable candidates, deprioritize dislikes, and remove do-not-recommend movements from automatic suggestions unless the athlete explicitly searches for or selects one.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-309 Preference Explanation and Protected-Primary Conflict
- Status: captured
- Provenance: product-decision
- Requirement: Explain when preference changed a recommendation and when a higher-authority constraint overruled it. If a disliked or blocked movement is also a protected competition primary, do not silently replace it. Ask the athlete to review the plan, context, or primary-movement decision.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-310 Versioned Preference History and Correction
- Status: captured
- Provenance: product-decision
- Requirement: Store global and contextual exercise-preference changes as versioned, auditable events with scope, reason, effective dates, and rule version. Correction, undo, backup, restore, merge, and future sync must replay the active preference without rewriting older recommendation context.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-311 Stated Versus Inferred Exercise Preference
- Status: captured
- Provenance: product-decision
- Requirement: Keep athlete-stated preference authoritative and separate from behavior-inferred signals such as swaps, skips, completion, and enjoyment. One skipped exercise or one substitution must not create a dislike. Missing preference remains neutral or unknown, and any future inference must show evidence, confidence, and correction controls.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-312 Phone and Laptop Core-Feature Parity
- Status: implemented-responsive-first-slice
- Provenance: from-user and product-decision
- Requirement: Make the private app optimized for both mobile devices and laptops. Today, Plan, Progress, Library, You, workout logging, surveys, substitutions, history, and settings must remain usable on both, with layout and interaction adapted to each form factor rather than one surface acting as a reduced viewer.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-313 One Private Account Across Devices
- Status: captured
- Provenance: from-user
- Requirement: Let the athlete securely sign in to the same private account on phone and laptop and access the same canonical plans, sessions, completed sets, surveys, preferences, exercise history, records, and learning state.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-314 Local-First Cloud Synchronization
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Save workout actions locally before confirming them in the interface, queue them through an idempotent outbox, and synchronize with the cloud whenever authenticated connectivity is available so a weak connection never blocks training or loses completed work.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-315 Cross-Device Workout Handoff
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Allow an in-progress workout started on one device to be safely resumed on another after synchronization. Prevent silent simultaneous editing through visible active-device state, explicit takeover, and preserved reconciliation when offline branches collide.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-316 Honest Sync Status and Freshness
- Status: captured
- Provenance: product-decision
- Requirement: Distinguish `Saved on this device`, `Syncing`, `Synced`, `Offline`, and `Needs review`, show the last successful cloud synchronization, and refresh on launch, resume, important mutations, and before cloud-dependent decisions. Never label local-only data as cloud-synced.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-317 Conflict Preservation and Resolution
- Status: captured
- Provenance: product-decision
- Requirement: Merge independent append-only events automatically by stable ID, but preserve both originals and request review when two devices change the same authoritative set, plan, merge, preference, or active-session state. No last-write-wins rule may silently discard completed training.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-318 Cloud Recovery and Device Replacement
- Status: captured
- Provenance: from-user and product-decision
- Requirement: A newly authorized or replacement device must rebuild the athlete's current state from the cloud system of record, verify schema and rule versions, restore source-linked history and audit events, and continue offline after the initial successful hydration.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-319 Multi-Device Release Gate
- Status: captured
- Provenance: product-decision
- Requirement: Do not claim multi-device readiness until phone and laptop journeys prove account isolation, offline workout completion, reconnect without duplicates, same-session handoff, simultaneous-edit conflict preservation, correction replay, cloud restore, responsive accessibility, and matching derived analytics.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-320 No Technique-Video Product Surface
- Status: excluded-by-user
- Provenance: from-user
- Requirement: Do not build, license, host, embed, prioritize, or market an athlete-facing exercise-technique video library, form-demo feed, video upload workflow, or automated technique-video analysis. Keep Exercise Detail and active workouts focused on programming purpose, concise setup notes, personal history, prescriptions, substitutions, feedback, and progression.
- Detail: [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]]

### R-321 Context-Grounded Product Judgment
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: Codex may proactively implement interface, design, writing, workflow, and quality improvements that fit JB's durable preferences, the Build Bible, and the real codebase, while preserving traceability and honestly distinguishing product decisions from direct athlete requirements.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#70. Context-Grounded Product Craft and Training Field Guide]]

### R-322 Original Handheld Adventure Craft
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Use the compact confidence, tactile selection language, framed menus, route feeling, and pixel-world charm JB loves from Game Boy Advance-era adventure games as craft references, but ship only original characters, places, symbols, names, layouts, assets, progression, and sound. The serious training interface remains modern and readable.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

### R-323 Durable Product and Design Registers
- Status: implemented
- Provenance: product-decision
- Requirement: Preserve the app's users, purpose, personality, anti-references, accessibility commitments, North Star, tokens, typography, components, and design boundaries in repository-local `PRODUCT.md`, `DESIGN.md`, and `DESIGN.json` files that are loaded before substantive interface changes.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#70. Context-Grounded Product Craft and Training Field Guide]]

### R-324 Automated and Visual UI Quality Gate
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Treat responsive visual review, keyboard focus, reduced motion, screen-reader labeling, compact mobile containment, console integrity, original-expression boundaries, technique-video exclusion, and regression automation as part of feature completion. UI quality checks must run in the standard verification command and expand as new interaction risks appear.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#70. Context-Grounded Product Craft and Training Field Guide]]

### R-325 Original Pocket-Console Sound Language
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Give the optional game layer a fun compact-handheld sound language for workout start, set completion, earned achievements, workout completion, and pain-aware warnings. Every shipped cue must be independently created and must not copy or redistribute recordings, melodies, cries, jingles, or other recognizable audio from Pokémon or another game.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#71. Original Pocket-Console Sound System]]

### R-326 Opt-In Sound Preference and Preview
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Keep sound off by default, let the athlete preview the pack before opting in, persist the preference locally, and allow disabling it without changing workouts, achievements, records, or progression.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#71. Original Pocket-Console Sound System]]

### R-327 Quiet-Mode Audio Precedence
- Status: implemented
- Provenance: product-decision
- Requirement: Quiet mode must suppress every optional sound even when the sound preference is enabled. The preview control must visibly reflect this precedence, and silence must never block an action or produce an error.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#71. Original Pocket-Console Sound System]]

### R-328 Semantic Audio Event Map
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Attach short distinguishable cues only to meaningful confirmed events. Set completion plays only on incomplete-to-complete transition, achievements require earned provisional evidence and enabled celebration, workout completion follows actual finish, and pain-aware warnings remain distinct from reward cues.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#71. Original Pocket-Console Sound System]]

### R-329 Nonessential and Low-Interruption Audio
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Keep cues brief, low-volume, and paired with visible feedback. No safety instruction, state change, record, or training decision may depend on hearing. Unsupported browsers or blocked audio contexts must fall back silently without affecting the workout.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#71. Original Pocket-Console Sound System]]

### R-330 Audio Provenance and Release Gate
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Record the sound-pack version and creation method, prohibit unreviewed downloaded audio from entering the shipped application, test duration, level, frequency, preference, and quiet-mode boundaries, and complete an originality and listening review before public release.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#71. Original Pocket-Console Sound System]]

### R-331 User-Defined Mesocycle Length
- Status: captured
- Provenance: from-user
- Requirement: Let the athlete define a mesocycle length in weeks while retaining criterion-based extension, recovery, completion, and pivot decisions. A week count is a planning bound, not proof that the work was completed.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-332 Week-Specific Training Opportunities
- Status: implemented-first-slice
- Provenance: from-user
- Requirement: Let available training days vary by week inside a mesocycle. Preserve the current completed-exposure clock, missed-opportunity adaptation, and no-volume-debt rules when a week changes.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-333 Day-Level Exercise Assignment
- Status: captured
- Provenance: from-user
- Requirement: Let the athlete inspect and deliberately assign, add, remove, reorder, or replace exercises for each training day before applying a mesocycle revision. Every future prescription must retain its plan-version reason and exact movement identity.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-334 Exact Historical Recall During Planning
- Status: implemented
- Provenance: from-user
- Requirement: When selecting or reviewing an exercise, show its latest exact completed date, sets, repetitions, loads, effort evidence, and history quality without borrowing from a variation or family.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-335 Selectable Hypertrophy Double Progression
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Offer a selectable hypertrophy double-progression policy that can begin at five repetitions and progress toward ten repetitions at a configured effort target before increasing load. Do not make failure-based work the universal policy for strength, power, technical, return-to-training, or pain-aware work.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-336 Verified Top-of-Range Load Trigger
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Increase load only when the athlete reaches the configured top of the repetition range with usable technique, acceptable pain, and explicit effort evidence. Unknown RIR or skipped feedback cannot be silently relabeled as failure or qualification.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-337 Per-Exercise Load Increment
- Status: captured
- Provenance: from-user
- Requirement: Let each canonical exercise override the location profile's default load increment. Support common five-to-ten-pound jumps for larger movements and smaller executable jumps such as 2.5 pounds for isolation work, while preserving equipment reality and units.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-338 Upper-Lower Program Templates
- Status: captured
- Provenance: from-user
- Requirement: Provide an editable standard upper-lower template with two upper and two lower opportunities, a minimalist template with two upper and one lower opportunity, and custom variations. Templates seed a plan and never replace athlete review.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-339 Structured Hypertrophy Exercise Attributes
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Add structured, reviewable exercise attributes for lengthened challenge, shortened-position contraction, stability demand, target-muscle tension, equipment, joint response, and personal preference. These traits support discovery and ranking without claiming one exercise is universally best.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-340 Context-Aware Machine Preference
- Status: captured
- Provenance: from-user and product-decision
- Requirement: Allow machine-based movements to rank highly when stability, target-muscle focus, equipment availability, joints, and the current hypertrophy goal support them. Do not encode machine superiority as a universal scientific fact or let it override safety, specificity, executable loading, or the athlete's response.
- Detail: [[Hypertrophy Double Progression and Upper Lower Templates]]

### R-341 Destination Context Reset
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Every primary-navigation change must open the destination at its top and move keyboard or assistive-technology context into the new main region. A screen must never inherit an unrelated scroll position.
- Detail: [[UX Audit 2026-08-10]]

### R-342 Non-Obstructive Transient Notices
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Notices must remain dismissible, screen-reader announced, temporary, and positioned so they do not hide the current mobile task or bottom navigation. No notice may be the only record of a state change.
- Detail: [[UX Audit 2026-08-10]]

### R-343 Above-Fold Today Action
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: On a 390 by 844 phone, Today must communicate the next session, primary anchor, immediate progression, and primary start action without requiring an initial scroll. Detailed rationale remains available on demand.
- Detail: [[UX Audit 2026-08-10]]

### R-344 Library Discovery Before Calibration Detail
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Library must prioritize find, filter, open, favorite, and add-movement tasks before advanced placement-history calibration. Phone category discovery may scroll horizontally, but search and filters must remain visible in the first working viewport.
- Detail: [[UX Audit 2026-08-10]]

### R-345 Workout Completion Hierarchy
- Status: implemented
- Provenance: product-decision
- Requirement: During an active workout, set logging and any required warm-up response are the primary tasks. Finish remains available but visually secondary until every planned set is complete, and it must disclose completed-set progress.
- Detail: [[UX Audit 2026-08-10]]

### R-346 Onboarding Landmark and Progress Semantics
- Status: implemented
- Provenance: product-decision
- Requirement: Onboarding must provide a real main landmark at the skip-link destination and expose the four-step state as an accessible progress indicator with current position.
- Detail: [[UX Audit 2026-08-10]]

### R-347 Interactive Control Integrity
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Every visible button must complete a real task, open a real decision surface, or be visibly disabled with a valid reason. A control may not simulate success through a notice when no underlying state, navigation, or data action occurred.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-348 Canonical Library Browse Piping
- Status: implemented
- Provenance: from-user
- Requirement: Body part, movement type, training role, goal or weak point, equipment, and preferred-movement browse entries must route into real canonical catalog filters. Category entry resets stale facets, exact exercise identity remains unchanged, and the visible count must reconcile to the filtered catalog.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-349 Expandable Filter Semantics
- Status: implemented
- Provenance: product-decision
- Requirement: The Library filter control must visibly expand and collapse the filter region, expose `aria-expanded`, retain explicit pressed states, and provide a single clear-all action without losing exercise history or preferences.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-350 Cross-Device Target and Containment Floor
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Core phone and tablet actions use 44-pixel targets where the wireframe permits. Compact calendar cells may use the WCAG 2.2 AA 24-pixel minimum when a seven-column 320-pixel layout would otherwise require horizontal scrolling. Every primary destination must remain horizontally contained at 320-pixel phone, phone portrait, tablet portrait, phone landscape, and desktop widths.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-351 Touch-Safe Progression Explanation
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: In-workout progression reasoning must be available without hover. A keyboard and touch-safe dialog must disclose the exact movement, decision, progression action, confidence, explanation, and authority boundary without mutating the prescription.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-352 Active Workout Leave and Resume
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: The athlete may leave an active workout to use the rest of the app and later resume it. Active session identity, completed-set flags, prescriptions, and placement-verification state must survive without restarting, recompressing, or duplicating the session.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-353 Real Next-Session Priority Pin
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Pinning an unresolved session must change the actual unresolved queue order used for the next training priority. Active and historical sessions remain immutable, and a success notice may appear only after the reorder succeeds.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-354 Release Metadata and Functional Audit Gate
- Status: implemented
- Provenance: product-decision
- Requirement: Package version, visible app and rules diagnostics, backup export metadata, README, audit record, and implementation status must agree before release. The release gate includes handler inventory, cross-device browser workflows, 320-pixel containment, production Lighthouse, console review, dependency audit, secret scan, deterministic tests, and a production PWA build.
- Detail: [[Functional UX Audit 2026-08-10]]

### R-355 Automatic Main-to-Pages Deployment
- Status: implemented
- Provenance: from-user
- Requirement: Every update merged or pushed to the private source repository's GitHub `main` must automatically publish the matching tested compiled build to the public Pages artifact repository so the hosted preview stays aligned without exposing private source or project documentation.
- Detail: [[GitHub Pages Deployment 2026-08-10]]

### R-356 Deployment Quality Gate
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: GitHub Pages deployment must wait for UI boundary checks, lint, deterministic tests, a production build, all desktop and phone browser journeys, and the Pages artifact check. Any failed gate blocks publication.
- Detail: [[GitHub Pages Deployment 2026-08-10]]

### R-357 Project-Subpath PWA Integrity
- Status: implemented
- Provenance: product-decision
- Requirement: The production PWA must load, launch, install, update, and navigate correctly from `/adaptive-strength-hypertrophy-app-pages/`, including assets, favicon, manifest start URL and scope, service worker, and navigation fallback.
- Detail: [[GitHub Pages Deployment 2026-08-10]]

### R-358 Public Preview Privacy Boundary
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: Keep the source repository private while treating the artifact repository and Pages URL as public. Publish only compiled output and source identity, never Build Bible files, tests, vault material, credentials, private exports, or a JB-named personal record seed. New browsers receive a neutral demo seed. Clearly disclose that current data is browser-local and not authenticated, encrypted, synchronized, or backed up to the cloud.
- Detail: [[GitHub Pages Deployment 2026-08-10]]

### R-359 Live Hosted Release Verification
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Do not call a Pages release complete from a green workflow alone. Verify the unauthenticated live URL on mobile and desktop, check compiled resources and browser errors, and record the final commit, workflow run, URL, and current hosting boundary.
- Detail: [[GitHub Pages Deployment 2026-08-10]]

### R-360 Cross-Device Vertical Rhythm
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Headers, subheaders, labels, and supporting text must maintain a consistent vertical rhythm on phone and laptop. Use a shared four-pixel-derived spacing scale, readable multiline heading line heights, at least eight pixels between a heading and its supporting copy, and clear separation between eyebrows, titles, body text, and following controls. Apply the contract to screens, hero blocks, panels, nested cards, onboarding, and dialogs without pushing the primary Today action below the first supported phone viewport.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#76. Cross-Device Typography and Vertical Rhythm Contract]]

### R-361 Original Generated Motion and Higgsfield Production
- Status: specified-unimplemented
- Provenance: from-user and product-decision
- Requirement: Higgsfield is an approved external authoring tool for original loading animations, transitions, environment loops, celebration plates, and visual polish when available, with GPT Images or another approved tool used when better suited. Generated media must become an optimized, versioned local app asset with provenance and originality review rather than a runtime provider dependency. Motion may represent only a real wait or completed transition, may never delay task completion, must preserve the primary training action and safety information, and requires written status, responsive behavior, failure fallback, and a static reduced-motion alternative.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#77. External Visual Authoring and Loading Motion Contract]]

### R-362 Dedicated ForgePath Cloud Isolation
- Status: implemented-foundation-blocked-remote
- Provenance: from-user and product-decision
- Requirement: ForgePath must use a dedicated Supabase project and may not share the JB-OS or Roman TD database. Development, staging, and production remain separate as the release matures. Reaching a plan limit does not authorize pausing, deleting, or repurposing another project.
- Detail: [[ForgePath Supabase Backend Runbook]]

### R-363 Invite-Only Private Authentication
- Status: implemented-foundation
- Provenance: from-user and product-decision
- Requirement: The private alpha must accept only previously invited accounts. The browser may request an email sign-in link with account creation disabled. Public Pages visitors cannot create an athlete account merely by entering an email, and local workout use remains available without an authenticated session.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#78. Private Cloud Foundation and Activation Contract]]

### R-364 Supabase Row-Level and Credential Boundary
- Status: implemented-foundation-unverified-remote
- Provenance: product-decision
- Requirement: Every exposed ForgePath table must enable and force Row Level Security, revoke anonymous data access, authorize rows through the authenticated user ID, and deny direct browser mutation of append-only events, snapshots, and conflicts. Only the project URL and browser-safe publishable key may enter the Vite bundle. Database passwords, secret keys, service-role keys, and provider credentials remain server-side and outside source, Pages, logs, chat, and Obsidian.
- Detail: [[ForgePath Supabase Backend Runbook]]

### R-365 Idempotent Local-First Cloud Event Foundation
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: A cloud save must retain a stable device ID, device sequence, event ID, expected server version, occurrence time, timezone, schema version, rule version, payload, and checksum. Failed delivery remains in a local retry outbox. Exact event replay is idempotent, event-ID reuse with changed content is rejected, and only an authenticated accepted server response advances the confirmed server version.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-366 Conflict-Preserving Cloud Review and Restore
- Status: implemented-first-slice
- Provenance: product-decision
- Requirement: A stale cloud save must create a preserved conflict and leave the current snapshot unchanged. Reading a cloud copy validates the complete ForgePath backup contract but does not authorize overwrite or change the local base version. Restoring requires an explicit athlete action, accepts that server version, clears the stale outbox, and creates the existing automatic local undo point.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#78. Private Cloud Foundation and Activation Contract]]

### R-367 Honest Cloud Rollout Status
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: The interface and release documentation must distinguish a local save, pending dedicated project, signed-out configured project, active cloud request, confirmed cloud version, retrying outbox, validated cloud copy, and preserved conflict. The first snapshot bridge cannot be called automatic multi-device sync, entity merge, hydration, device revocation, or active-workout handoff until the Chapter 68 acceptance matrix passes against a live backend.
- Detail: [[ForgePath Supabase Backend Runbook]]

### R-368 Optional Note Per Workout Movement
- Status: implemented
- Provenance: from-user
- Requirement: Every planned movement in a workout must allow one optional free-text note for that exact workout exposure. The note may capture angle, tempo, eccentric or concentric duration, setup, cue, joint feel, technical issue, successful adjustment, or another personally useful detail.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#79. Exact-Movement Workout Notes and Longitudinal Recall]]

### R-369 Exact Note Identity and Context
- Status: implemented
- Provenance: from-user and product-decision
- Requirement: Store each note against the exact session, planned slot, and canonical exercise, with session date and title, mesocycle, plan version, microcycle number, timestamps, and a versioned note rule. Do not duplicate one note across sets.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#79. Exact-Movement Workout Notes and Longitudinal Recall]]

### R-370 Prior Note Recall During Training
- Status: implemented
- Provenance: from-user
- Requirement: When the same exact movement returns in a later workout, show the most recent earlier note with its date, session, and week context near the current note field so the athlete can reuse or correct prior setup and cues.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#79. Exact-Movement Workout Notes and Longitudinal Recall]]

### R-371 Exercise Library Movement Notebook
- Status: implemented
- Provenance: from-user
- Requirement: Exercise Detail must preserve a newest-first movement notebook so week-to-week and month-to-month notes remain browsable next to exact load, repetition, set, RIR, volume, and record history.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#79. Exact-Movement Workout Notes and Longitudinal Recall]]

### R-372 Substitution, Merge, and Undo Safety for Notes
- Status: implemented
- Provenance: product-decision
- Requirement: A substitution must not silently move a note from the original exercise to its replacement. Confirmed duplicate merges may map notes to the retained canonical identity only while preserving original exercise identity, and undo must restore the complete prior note state.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#79. Exact-Movement Workout Notes and Longitudinal Recall]]

### R-373 Durable Note Persistence and Recovery
- Status: implemented-first-slice
- Provenance: from-user and product-decision
- Requirement: Movement notes must survive navigation, reload, backup export and restore, and the complete cloud bootstrap snapshot. Migration from an older backup must preserve all prior data and create no fictional note history. Automatic cross-device entity synchronization remains gated by the cloud acceptance contract.
- Detail: [[Data Backend Storage and Learning Architecture]]

### R-374 Notes Cannot Silently Program Training
- Status: implemented
- Provenance: product-decision
- Requirement: Athlete-authored free text is recall context only in the first slice. It cannot automatically add load, repetitions, sets, exercises, volume, clearance, or a PR. Any later extraction or learning system must preserve the source note, disclose confidence and limitations, and require athlete review before changing programming.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#79. Exact-Movement Workout Notes and Longitudinal Recall]]

### R-375 Permanent Fourth Apex Companion Form
- Status: captured-unimplemented
- Provenance: from-user and product-decision
- Requirement: Extend the original companion from three forms to four permanent forms. The fourth Apex Form should deliver the visual excitement of an enormous final transformation while remaining an independently designed ForgePath identity rather than a copied Gigantamax form or temporary battle mechanic. Eligibility requires versioned long-horizon XP, breadth milestones, and explicit athlete confirmation.
- Detail: [[Adaptive Strength and Hypertrophy App Build Bible#66. Original Training Companion, XP, and Evolution System]]

### R-376 Continued Progression After Apex
- Status: captured-unimplemented
- Provenance: from-user and product-decision
- Requirement: Reaching the fourth Apex Form must not end progression. Source-backed XP continues to advance mastery levels, cosmetics, environment development, journal emblems, and bounded celebrations without resetting lifetime progress, affecting athletic programming, or rewarding unsafe extra work.
- Detail: [[Pixel Training Adventure Visual and Interaction System]]

## Thread Coverage Audit

### 2026-08-10 Fourth Apex Companion Expansion
- Scope: User requested a fourth companion tier inspired by the continued spectacle of a Gigantamax Machamp after Machop, Machoke, and Machamp so the evolution path does not feel finished at three forms.
- Result: Expanded Build Bible Chapter 66 and R-296, R-299, and R-303; added R-375 and R-376. The original companion now has Starting, Developed, Champion, and permanent Apex forms plus continued post-apex mastery, cosmetics, and world progression.
- Status: Product specification only. Companion code, economy, original character design, animation, and asset originality review remain unimplemented.

### 2026-08-10 Exact-Movement Workout Notes Expansion
- Scope: User requested durable notes on every workout movement, including setup, angle, tempo, cues, technical discoveries, and week-to-week recall through Exercise Library.
- Result: Added R-368 through R-374 and Build Bible Chapter 79. Private alpha 0.39.0 adds autosaving exact-movement notes, prior-note recall during training, a newest-first Library notebook, substitution and merge identity protection, backup schema 25, and local persistence 23.
- Status: Implemented with 201 deterministic tests and fifty-eight desktop and phone browser journeys. Notes remain athlete-authored recall context and do not silently change programming.

### 2026-08-10 Supabase Backend Foundation Expansion
- Scope: User requested reconciliation with the original Build Bible and authorized beginning the Supabase backend while keeping the signed-in dashboard available.
- Result: Added R-362 through R-367 and Build Bible Chapter 78. Private alpha 0.38.0 adds a dedicated-project boundary, invite-only auth client, five-table Row Level Security migration, device and event metadata, retry outbox, idempotent snapshot RPC, preserved conflicts, integrity-validated cloud review, and athlete-confirmed restore.
- Status: The local code, migration, documentation, and static database security checks are implemented. Remote provisioning is blocked because Falatua's Org is at its two-project free-plan limit. The existing JB-OS and Roman TD projects were left unchanged. Automatic entity sync and workout handoff remain unimplemented.

### 2026-08-10 Higgsfield and Generated Visual Motion Expansion
- Scope: User approved using the Higgsfield connector and its broader creative integrations for special loading animations and other visual improvements that make the app more fun.
- Result: Added R-361 and Build Bible Chapter 77. Higgsfield is now an approved authoring tool, while accepted assets remain original, exported, optimized, versioned, accessible, and independent of a live generation provider. Initial concept families are a plate-stack loader, field-guide route stamp, and quiet gym-environment loop.
- Status: The production and quality contract is specified. No Higgsfield connector is exposed in the current workspace and no generated asset has been selected or shipped yet.

### 2026-08-10 Cross-Device Vertical Rhythm Expansion
- Scope: User requested a complete phone and desktop review of header, subheader, and text spacing because several elements appeared too close together.
- Result: Added R-360 and Build Bible Chapter 76. Private alpha 0.37.0 introduces a shared spacing scale, more readable multiline heading line heights, consistent screen and component text gaps, and automated phone and desktop typography measurements.
- Status: The implemented interface has been reviewed across onboarding, Today, Plan, Progress, Library, You, nested cards, and the pre-session dialog. The final hosted verification remains part of the automatic Pages release path.

### 2026-08-10 Automatic GitHub Pages Hosting Expansion
- Scope: User requested that every app update reach GitHub and GitHub Pages so the hosted site can be used for testing and shared access.
- Result: Added R-355 through R-359 and Build Bible Chapter 75. Private alpha 0.36.0 adds a quality-gated main-to-Pages workflow, subpath-safe PWA build, generated-artifact check, public-preview boundary, neutral new-visitor seed, and required live mobile and desktop verification.
- Status: Implementation and local verification are complete. Final workflow and public URL evidence are recorded in [[GitHub Pages Deployment 2026-08-10]]. Cloud accounts, shared data, access control, and cross-device sync remain deferred.

### 2026-08-10 Deep Functional Mobile and Desktop Audit
- Scope: User requested a deep bug audit across mobile and desktop covering all buttons, feature piping, workflows, and wireframes.
- Result: Added R-347 through R-354. Private alpha 0.35.0 replaces placeholder Library categories with real filters, fixes preferred-movement browsing, makes workout reasoning touch-safe, adds active-workout leave and resume, makes Plan pinning mutate the real queue, aligns backup and release metadata, and hardens compact targets and containment.
- Status: The implemented private-alpha boundary passes 191 deterministic tests, 52 desktop and phone browser journeys, 320-pixel phone, tablet, landscape, and desktop manual sweeps, production Lighthouse, console, dependency, secret, and build gates. Cloud sync and other explicitly deferred systems remain outside this pass.

### 2026-08-10 Hypertrophy Requirements and Cross-Device UX Audit
- Scope: User supplied `hypertrophy-app-requirements.md`, then requested a deep UX, UXD, and UI audit across mobile and desktop after reconciliation.
- Result: Added R-331 through R-346. The new training source is preserved as a bounded hypertrophy policy and editable template specification. Private alpha 0.34.0 corrects destination scroll and focus, onboarding landmarks and progress semantics, transient mobile notice placement, Today task density, Library discovery order and compact phone categories, active-workout hierarchy, and progress-bar animation performance.
- Status: The cross-device usability corrections are implemented and verified. Selectable double progression, per-exercise increment overrides, week-specific calendars, and upper-lower templates remain specified rather than falsely claimed as working.

### 2026-08-10 Original Pocket-Console Sound Expansion
- Scope: User requested fun sounds inspired by the Machop, Machoke, Machamp, and Pokémon feeling of the desired game layer and authorized downloading sounds that match the vibe.
- Result: Translated the request into R-325 through R-330 and an independently created `field-guide-synth-v1` pack instead of downloading protected recordings. Private alpha 0.33.0 adds six Web Audio cues, persisted opt-in, an audible preview, quiet-mode precedence, silent fallback, semantic event wiring, deterministic audio boundaries, and no network or bundled audio dependency.
- Status: The first original sound slice is implemented. A human listening pass, device-speaker calibration, final public asset review, and future original companion-specific motifs remain open.

### 2026-08-10 Context-Grounded Product Craft Expansion
- Scope: User authorized Codex to implement fitting design, UI, writing, and QC choices from durable Obsidian context and reiterated a strong preference for the Ruby, Sapphire, Emerald, FireRed, and LeafGreen era of handheld adventure craft.
- Result: Added R-321 through R-324, created durable product and design registers, implemented an original evidence-backed Training Field Guide on Today, added an automated UI boundary gate, replaced six generic thick side-stripe callouts, and corrected post-onboarding focus handoff.
- Status: Private alpha 0.32.0 implements the first slice. It does not add copied creatures, names, art, maps, sounds, or an unearned game economy. Future original companion and world work remains governed by R-296 through R-303.

### 2026-08-10 Technique Video Exclusion
- Scope: User explicitly rejected the technique-video emphasis used by other training apps and requested that it be removed or kept out of this product.
- Result: Added R-320 as an explicit scope exclusion, revised the fast-workout and imported-history requirements, removed the exercise-demonstration open decision, and separated internal methodology video research from athlete-facing product features.
- Status: No technique-video surface exists in private alpha 0.31.0. This exclusion is active immediately and should prevent future roadmap drift.

### 2026-08-10 Phone, Laptop, and Cloud Sync Expansion
- Scope: User required the app to work well on both mobile and laptop and to keep changes updated appropriately across devices through the cloud.
- Result: Confirmed responsive phone and laptop as required product surfaces and captured one-account access, local-first cloud sync, safe workout handoff, honest status, conflict preservation, new-device recovery, and an end-to-end multi-device release gate as R-312 through R-319.
- Status: The current PWA is responsively tested on desktop and phone and preserves data locally on each browser. Authentication, Supabase, cloud sync, device handoff, and cross-device conflict resolution remain unimplemented and must not be claimed.

### 2026-08-10 Contextual Exercise Preference Expansion
- Scope: User requested per-movement favorites and dislikes that influence recommendations, with sumo deadlift preferred only during powerlifting competition preparation and conventional or stiff-leg deadlifts preferred outside that context.
- Result: Captured an exact-movement preference scale, separation from joint and restriction state, goal and phase-specific rules, explicit competition-use behavior, deterministic recommendation authority, protected-primary conflict handling, versioned preference history, and stated-versus-inferred boundaries as R-304 through R-311.
- Status: The current alpha implements a boolean favorite, a separate joint-response scale, and favorite-aware substitution ranking. The richer dislike states, contextual rules, audit ledger, and recommendation explanations remain unimplemented.

### 2026-08-10 Original Training Companion Evolution Expansion
- Scope: User requested custom strength-creature sprites with workout XP, visible levels, a celebratory level-up sequence, and a three-stage growth arc inspired by the feeling of Machop to Machoke to Machamp.
- Result: Captured an original evolving companion, completed-workout XP, anti-grind economy, versioned level and evolution gates, post-workout celebration, non-punitive continuity, accessibility controls, and strict intellectual-property boundary as R-296 through R-303.
- Status: Product behavior is specified but not implemented. Final creature names, silhouettes, level curve, form thresholds, animation frames, and art-production method remain open for original design exploration.

### 2026-08-10 Private Alpha Build Expansion
- Scope: User directed Codex to begin building immediately, produce a working app the same day, defer backend and data infrastructure where necessary, use the Build Bible as the authority, include a real visual product, and continue until the larger application is complete.
- Result: Captured the working private alpha, local-first delivery decision, backend and AI migration boundary, visual-product requirement, Build Bible authority, and honest completeness rule as R-290 through R-295. The implementation and verification evidence is stored in [[Private Alpha Implementation 2026-08-10]].
- Status: A verified local private-alpha slice works. This is the beginning of implementation, not completion of the full multi-phase product.

### 2026-08-09
- Scope: All user messages in the current app-idea thread through the explicit Obsidian-continuity request.
- Result: Every currently stated user requirement is represented in R-001 through R-024 and linked to a detailed project note.
- Missing or unresolved implementation choices remain open questions rather than omitted requirements.

### 2026-08-09 Methodology Expansion
- Scope: User request for deep, continuing study of Dave Tate, John Meadows, Mike Israetel, and Chad Wesley Smith, with the goal of developing expert-level bodybuilding, powerbuilding, exercise-selection, and programming judgment.
- Result: Captured in R-025 through R-029 and linked to a research hub, four coach profiles, an evidence map, and an app-translation model.
- Status: The first primary-source synthesis is complete. The curriculum remains active and is not considered exhaustive.

### 2026-08-09 Deep Research Expansion
- Scope: User request for an extensive review of elitefts articles and books, legal online PDFs, scientific literature, and YouTube material, with particular attention to volume, load, readiness, sleep, fatigue, preparedness, and peaking.
- Result: Captured in R-030 through R-036. Created a twelve-video transcript corpus, four-valid-PDF corpus, more-than-thirty-paper scientific evidence set, full research synthesis, source-quality register, and separate readiness-fatigue-peaking model.
- Status: The current deep research pass is distilled and audited. The knowledge base remains intentionally open to legal full-book study, future studies, and personal validation.

### 2026-08-09 Product Experience Expansion
- Scope: User request for separate menus and buttons, a detailed daily through yearly dashboard, volume graphs, movement-frequency and neglected-body-part insights, enjoyment learning, a personalized exercise library, primary-secondary-accessory programming, equipment awareness, time-budgeted workouts, and a first-use taste-picker survey.
- Result: Captured in R-037 through R-051 and specified in [[Product Navigation Dashboard Exercise Library and Time-Aware Programming]].
- Status: Product structure and rules are captured. Visual design, navigation prototype, exact dashboard defaults, and implementation schema remain open.

### 2026-08-09 Missed-Workout Game Plan Expansion
- Scope: User clarified that a Monday-Wednesday-Friday program must adapt when Wednesday and Friday are missed because of children or life. The following week cannot progress linearly as though the work occurred.
- Result: Captured in R-052 through R-060 and specified in [[Conditional Schedule Adaptation and Missed Workout Game Plan]]. Progression now uses separate calendar and completed-exposure clocks, per-movement eligibility, reason-specific replanning, partial-session credit, no volume debt, and an explainable next-session queue.
- Status: The conditional logic and example week are captured. Exact gap thresholds and first executable rules remain open for personal calibration.

### 2026-08-09 Training Cycle Architecture Expansion
- Scope: User requested deep research into microcycles, mesocycles, macrocycles, quadrennials, their relationship to programming goals and exercise needs, and how they connect to linear progression and development, including Dave Tate podcasts and scientific literature.
- Result: Captured in R-061 through R-073 and specified in [[Deep Research Training Cycle Architecture 2026-08-09]] and [[Hierarchical Training Cycle and Goal Architecture]]. The model now distinguishes local progression from periodization, uses exposure-based elastic microcycles and criterion-driven mesocycles, separates macrocycles from annual plans, and limits quadrennial detail to strategic direction.
- Status: The initial exhaustive source pass and app translation are complete. Exact personal cycle bounds and maintenance doses remain open for calibration.

### 2026-08-09 AI Integration and Knowledge Architecture Expansion
- Scope: User required continuing Obsidian capture and asked whether the future app should use Claude or a “Codex API key” for knowledge understanding, ordinary conditional input-output logic, or both. The eventual outline must explain the choice.
- Result: Captured in R-074 through R-088 and specified in [[AI Integration and Decision Engine Architecture]]. The app is now deterministic-first, with simple statistical learning and an optional provider-neutral language-model layer. Obsidian is the development source, while the app receives a versioned runtime knowledge base through an intentional export and retrieval pipeline.
- Status: The conceptual boundary and phased recommendation are captured. Provider, backend, runtime search technology, and AI budget remain open implementation decisions.

### 2026-08-09 Athlete Entry Placement Expansion
- Scope: User required the first-use survey to determine the athlete's training level and whether the first program should be introductory, bridge, base-building, strength, or power. Well-trained athletes must be allowed to start at an appropriately advanced point instead of level one.
- Result: Captured in R-089 through R-103 and specified in [[Onboarding Training Status and Entry Cycle Placement]]. Private alpha 0.18.0 separates experience from current preparedness, supports ten global starting routes, permits direct strength or power entry, stores productive verification, and remains explainable and correctable.
- Status: The first global starting-profile slice is implemented. Per-movement placement, calibrated thresholds, captured diagnostic sets, imported-history inference, automatic exit evaluation, and the first product's exact definition of power remain open.

### 2026-08-09 Competitive Product Evolution and Training Brain Expansion
- Scope: User requested a deep review of RP Hypertrophy and JuggernautAI subreddits, Reddit groups, hotfixes, patches, product changes, progression, and roadmap signals, then asked that the findings improve the original multi-coach training brain.
- Result: Reviewed 42 official and community sources. Captured RP's web-to-native transition, version 0.31 planning changes, 2026 native reliability work, Juggernaut versions 2.0 and 2.5, the 2.4 through 2.6 hotfix tail, and the announced version 3 cycle. Recurring community gaps were converted into R-104 through R-128.
- Status: The first competitive product-evolution pass is distilled. RP has no located formal public roadmap. Juggernaut version 3.0 is announced but was not yet verified as released on 2026-08-09.

### 2026-08-09 Local Strength Training Book Library Expansion
- Scope: User requested complete reading, analysis, and synthesis of every book in the local Strength Training folder to improve future programming knowledge and app development.
- Result: Audited and processed all five PDFs across 897 pages. Created five book profiles and one cross-book synthesis. Added multidimensional training load, dynamic correspondence, transfer hypotheses, conservative working max, performance conversion, technical-quality gates, experience-dependent variation, contextual restoration, specialized-method eligibility, and source-gap governance as R-129 through R-144.
- Status: Every page present in the folder was processed. The supplied Zatsiorsky scan explicitly lacks printed pages 205-207, so that title is correctly marked partial rather than falsely complete.

### 2026-08-09 Volume Views, Exercise History, and Duplicate Prevention Expansion
- Scope: User requested upper-body, lower-body, arms, body-part, and area-specific volume views; an extensive powerlifting exercise library; complete historical detail for each movement; and proactive detection of accidental duplicate exercises.
- Result: Added overlap-safe regional analytics, drill-down to contributing sets, a structured exercise-variation identity, exact and family history views, last-exposure reuse, deterministic duplicate matching, user-controlled resolution, reversible merging, and a library data-quality view as R-145 through R-158.
- Status: Product behavior and data rules are captured. Exact muscle-credit fractions, the first catalog's exercise count, and merge-screen interaction design remain open for calibration and prototyping.

### 2026-08-09 Athlete-Controlled Educated Exercise Substitution Expansion
- Scope: User required freedom to change programmed movements while receiving educated recommendations that continually improve from surveys, training behavior, and outcomes.
- Result: Added visible change controls, optional swap reasons, tiered recommendations, purpose-preserving ranking, transparent tradeoffs, substitute-specific prescriptions, progression-clock integrity, session recalculation, durable substitution events, evidence thresholds, and protected-primary confirmation as R-159 through R-170.
- Status: The complete product behavior is captured. Initial ranking weights, minimum evidence thresholds, and primary-movement confirmation design remain open for calibration and prototype testing.

### 2026-08-09 Optional Survey and Immediate Training Expansion
- Scope: User required the ability to skip any individual question or complete survey at every point because some sessions need immediate training and some users do not want to provide extensive data.
- Result: Added universal survey optionality, per-question skip, immediate start and finish paths, per-cadence modes, missing-is-unknown handling, known-safety-state persistence, no penalty or nagging, deferred feedback, adaptive burden reduction, missing-data confidence, and survey-free core operation as R-171 through R-181.
- Status: Product behavior is captured. Default survey modes, deferred-feedback expiration, and whether the first release offers custom question budgets remain open for prototype testing.

### 2026-08-09 Backend, Data Storage, and Learning Architecture Expansion
- Scope: User asked whether the growing volume of workouts, surveys, feedback, adjustments, and learned relationships requires a special backend such as Supabase and required this decision in the eventual outline.
- Result: Verified current official Supabase capabilities and selected a local operational store plus Supabase Postgres as the leading first-real-product architecture. Added relational data domains, source-versus-derived separation, recommendation provenance, secure Auth and Row Level Security, server-side secrets, sync, backups, data rights, simple statistical learning, optional retrieval, and scale gates as R-182 through R-198.
- Status: Architecture and phased recommendation are captured. First client platform, local database binding, sync conflict policy, Supabase start phase, retention windows, and recovery objectives remain open implementation decisions.

### 2026-08-09 PR Gamification and In-Workout Motivation Expansion
- Scope: User requested data-backed gamification for load, repetition, movement-volume, day-volume, and exact set-scheme records, plus in-workout prompts showing the last result and how close the next valid PR is.
- Result: Added a multidimensional PR taxonomy, scope model, comparability and quality validation, progression-eligible opportunity engine, in-workout prompts, immediate celebrations, volume-chasing guardrails, exact-versus-family separation, auditable provenance, correction-aware recalculation, athlete controls, non-PR achievements, and offline consistency as R-199 through R-218.
- Status: Complete product behavior and first-release scope are captured. Exact estimated-strength formulas, mixed-set-scheme handling, notification defaults, and load normalization for non-barbell movements remain open for calibration and prototype testing.

### 2026-08-09 Friends, Social Progress, and Challenges Expansion
- Scope: User requested an eventual friend activity experience where athletes can see selected friend workouts and PRs, receive motivation from friends' development, and learn when an eligible result could beat David's, Eric's, or another friend's comparable shared performance.
- Result: Added private-by-default social profiles, mutual friendships, granular visibility, sanitized share events, authorized feeds, exact and scaled comparison, personal-improvement challenges, safe scheduling, friend PR proximity prompts, anti-shame rules, reactions, notification controls, Row Level Security, revocation, correction propagation, provenance, and phased rollout as R-219 through R-240.
- Status: Product and backend boundaries are captured. Initial relationship model, share defaults, navigation placement, challenge metrics, push cadence, and moderation scope remain open for later prototyping. Social is intentionally post-core rather than part of the first personal coaching MVP.

### 2026-08-09 Exercise Library Discovery and Recommendation Organization Expansion
- Scope: User required the exercise library and recommendation system to be organized by body part, movement type, and related categories so movements are easy to find.
- Result: Added a categorized library home, hierarchical body-part and movement-type browsing, training-role and weak-point discovery, one shared taxonomy across manual browsing and recommendations, multi-category views with one canonical history, contextual recommendation grouping, faceted filters, search, sorting, custom-exercise parity, and explainable empty results as R-241 through R-250.
- Status: Product behavior and taxonomy requirements are captured. Exact first-release category depth, body-map presentation, default sort, weak-point collections, and catalog vocabulary remain open for information-architecture prototyping.

### 2026-08-09 Pixel Training Adventure Visual Direction Expansion
- Scope: User requested a fun Pokémon-like 2D pixelated feeling for the app and game layer, including small characters, emoji-like reactions, and entertaining visual elements.
- Result: Translated the reference into an original pixel training-adventure system with a hybrid modern UI, athlete avatars, purposeful supporting characters, pixel reactions, exercise-taxonomy emblems, optional cycle maps and evolving environments, non-blocking workout delight, achievement and friend presentation, consistent asset rules, accessibility, focused-training controls, non-punitive cosmetic progression, and a four-screen prototype boundary as R-251 through R-270.
- Status: Art direction and interaction boundaries are captured. Pixel density, world structure, character scope, palette, typography, animation intensity, cosmetic rules, and asset-production method remain open for visual prototyping.

### 2026-08-09 Full Conversation Continuity and Build Handoff Audit
- Scope: User explicitly required every concept and dialogue point in the app thread to remain stored in the Obsidian Brain for later application development.
- Result: Verified 270 sequential requirement headings from R-001 through R-270 with no missing or duplicate IDs. Confirmed that every major conversation expansion has a coverage-audit entry and a linked detailed note. Created [[App Build Reference Index]] as the one-page future-session handoff, with source-of-truth order, requirement-range map, stable decisions, build boundary, recommended sequence, and standing capture rule.
- Status: Current app dialogue is durably captured and build-reference ready. The product remains in definition and research rather than implementation. Open implementation choices remain explicitly unresolved.

### 2026-08-09 Private First-Release and Incubation Decision
- Scope: User decided that the first usable app will remain private and primarily for personal testing for several months before a possible public release.
- Result: Captured private-first scope, multi-month personal incubation, history-preserving experimentation, and evidence-gated public readiness as R-271 through R-274. Updated the build handoff, project decisions, delivery phases, Hot Cache, and session log.
- Status: The private-versus-public branch is resolved. First client platform and exact private MVP boundary remain the next decisions.

### 2026-08-09 Renaissance Periodization YouTube Corpus Expansion
- Scope: User requested review, transcript analysis, and continuing synthesis of all relevant Renaissance Periodization and Mike Israetel YouTube training material so it improves exercise-programming knowledge and the Obsidian Brain.
- Result: Captured an official channel snapshot of 4,233 items, defined a 766-video high-relevance queue across 33 official playlists, stored metadata and transcripts for a 43-video programming foundation, synthesized 42 semantically usable transcripts, and openly marked one corrupted transcript pending repair. Added corpus governance and app translation as R-275 through R-284.
- Status: The foundation pass is distilled. The wider channel is an active research queue and is not falsely represented as complete.

### 2026-08-10 Canonical Build Bible Expansion
- Scope: User requested the most detailed build-oriented outline, covering every app idea, preference, requirement, research stream, product behavior, architecture boundary, screen, and delivery need from the entire thread and Obsidian project.
- Result: Added [[Adaptive Strength and Hypertrophy App Build Bible]] and [[Build Bible Requirement Traceability Matrix]]. Converted the product definition into canonical user journeys, screen contracts, domain models, state and decision engines, calculations, event contracts, technical architecture, privacy boundaries, build phases, acceptance scenarios, quality gates, and living-specification governance as R-285 through R-289.
- Status: The app is build-bible ready. Platform choice, exact private starting goal, seed exercise catalog, and calibrated numerical thresholds remain intentionally open before implementation.

## Open Decisions
- Final app name.
- First platform and smallest shippable version.
- Strength-anchor lifts.
- Strength-versus-physique priority by block.
- Direct versus fractional muscle-set counting.
- Bodyweight, assisted, cable, machine, and unilateral load normalization.
- Exact pain override and reacclimation rules.
- Post-session survey timing.
- Minimum evidence needed before personal correlations affect programming.
- User control over the rolling priority queue.
- Rules for resolving concurrent conjugate methods versus sequential phase potentiation.
- Whether activation or pre-pump work precedes a strength anchor on mixed-goal sessions.
- Exact evidence and personal-response thresholds for changing exercise classification or muscle-level volume estimates.
- Exact multi-signal thresholds for acute readiness, accumulated fatigue, and reacclimation.
- Target events and personal taper histories needed to calibrate peaking.
- Which consumer wearable inputs, if any, add predictive value beyond survey and performance data.
- Whether the first interface uses five mobile bottom tabs, a desktop sidebar, or both.
- Default progress-dashboard card order and user pinning behavior.
- Minimum evidence required before the app claims a secondary movement transfers to a primary lift.
- Whether historical training logs can be imported during onboarding.
- Which equipment and exercise catalog ships by default.
- Personal timing evidence needed to calibrate the shipped 15- through 90-minute options.
- Initial per-lift days-since-exposure thresholds for stable, interrupted, and returning states.
- Default rule for choosing between two overdue protected primary sessions.
- How long a deferred session remains valuable before it expires.
- Whether the default schedule is fixed-day, rolling, or hybrid.
- Default minimum, target, and maximum span for an exposure-based microcycle.
- Minimum completed microcycles and success signals required to complete a mesocycle.
- Whether the long-horizon interface should default to one year, four years, or an adjustable range.
- Personal minimum-maintenance doses for qualities not emphasized in the current mesocycle.
- Which life constraints should be placed on the annual plan automatically and which require confirmation.
- Whether Phase 2 uses OpenAI, Anthropic, a local model, or remains deterministic-only.
- Whether the first product uses an app-owned API project or an advanced bring-your-own-key mode.
- Runtime knowledge-base technology: local full-text search, local embeddings, private vector database, or managed file search.
- First free-text workflow that justifies an AI call.
- AI data-retention period, usage budget, latency target, and minimum evaluation threshold.
- Exact survey thresholds for introductory, reacclimation, bridge, base-building, strength, and power entry.
- Visible placement language: descriptive status, one-to-five profile, or both.
- Minimum evidence required to bypass a bridge and enter a full development cycle directly.
- Definition of power and explosive training in the first product scope.
- Competitor product-intelligence review cadence during active design and after major releases.
- Whether the first product publishes a feature-request board, known-issues page, and detailed release-note archive.
- Public cloud-backup recovery objectives beyond the verified local schema version 6 export and restore flow.
- Default muscle-credit rules for compound movements and whether users can customize them.
- Whether trunk volume appears as a separate top-level region or can optionally roll into upper or lower views.
- Minimum exercise count and specialty-equipment coverage for the first catalog release.
- Fuzzy-match confidence thresholds for exact, probable, related-variation, and distinct exercise classifications.
- Whether imported exercise-history cleanup is offered during onboarding or after the first successful workout.
- Initial substitution-ranking weights and how much athlete preference can outweigh theoretical transfer.
- Minimum comparable substitution outcomes required before future ranking materially changes.
- Exact confirmation flow when a primary-movement replacement changes the session objective.
- Default full, quick, minimal, or ask-each-time mode for each survey cadence.
- Deferred post-session reminder expiration and whether a next-day recovery prompt ships initially.
- Whether advanced users can define a maximum per-session question budget.
- Whether Supabase begins in the personal prototype or only when multi-device sync starts.
- Local database technology and local-versus-cloud conflict policy for the selected client platform.
- Exact retention, backup, recovery-time, and recovery-point objectives for public release.
- Observed query, workload, or research thresholds that would justify a warehouse or separate background-worker service.
- Exact estimated-strength formula and repetition limits for eligible PR calculations.
- Whether the first release creates records for every set scheme or only repeated schemes.
- Default live-notification frequency, celebration intensity, and quiet-mode behavior.
- Record normalization for bodyweight, assisted, cable, machine, band, and chain exercises.
- Whether the social graph remains mutual friends only or later adds followers.
- Whether Friends becomes a separate tab, a Progress subsection, or a home-feed card.
- Initial social share default and the detail levels shown during workout completion.
- Whether friendly-rival comparison requires mutual opt-in.
- Exact fair-scaling metrics for athletes with different body size, training age, and goals.
- Push-notification defaults, milestone filters, and digest cadence.
- Whether comments or messages add enough value to justify moderation complexity.
- Minimum reporting, blocking, abuse prevention, and moderation system required before any public feature.
- Whether public profiles or leaderboards fit the product at all.
- Initial body-part depth and which individual muscles receive their own browse pages.
- Final movement-type vocabulary and the boundary between mechanical pattern, training role, and exercise family.
- Whether Library opens on category cards, a body map, recent movements, or a personalized blend.
- Default recommendation grouping and sorting for body-part, movement-type, and programmed-swap contexts.
- Which system-created goal and weak-point collections ship in the initial catalog.
- Final app and original pixel-world names.
- Pixel density and era: compact handheld, 16-bit console, or a more detailed modern pixel interpretation.
- Custom avatar depth and whether original training companions belong in the first release.
- Whether visual progression centers on a gym room, journey map, journal, town, or combination.
- Initial palette, light or dark default, pixel display typeface, and modern interface typeface.
- Maximum character and animation presence during an active work set.
- Which verified achievements unlock cosmetic progress and how quickly the environment changes.
- Hand-authored, commissioned, generated-then-manually-cleaned, or combined pixel asset production.
- Exact boundary and default setting for focused-training or low-decoration mode.

## Change Log

- 2026-08-10: Added R-375 and R-376 and expanded Build Bible Chapter 66 from a three-form companion to a four-form Starting, Developed, Champion, and Apex journey. The Apex Form is permanent, earned from long-horizon breadth rather than brute performance, independently designed from protected giant-form expression, and followed by continued mastery levels and cosmetic or world development. The companion remains specified and unimplemented.

- 2026-08-10: Added R-368 through R-374 and Build Bible Chapter 79 for exact-movement workout notes. Private alpha 0.39.0 now autosaves one optional note per exact workout movement, recalls the prior note during training, preserves a newest-first Exercise Library notebook, protects substitution and merge identity, advances backup schema to 25 and local persistence to 23, and keeps free text outside automatic programming authority.

- 2026-08-10: Added R-362 through R-367 and Build Bible Chapter 78 for the first Supabase backend foundation. Private alpha 0.38.0 now includes dedicated-project isolation, invite-only Auth, a five-table Row Level Security migration, stable device and event metadata, a retry outbox, idempotent snapshot saves, preserved conflicts, integrity-validated cloud review, and athlete-confirmed restore. Remote provisioning remains blocked by the organization's two-project free-plan limit, and automatic entity sync and workout handoff are not claimed.

- 2026-08-10: Added R-361 and Build Bible Chapter 77 for Higgsfield and other approved generated-visual workflows. Loading motion must represent real latency, never create delay, remain optional and accessible, preserve training clarity, and ship as an optimized local asset with provenance rather than a runtime provider dependency.
- 2026-08-10: Added R-360 and Build Bible Chapter 76 for cross-device vertical rhythm. Private alpha 0.37.0 standardizes headline, label, supporting-copy, screen, card, and dialog spacing while preserving the phone start-action fold and existing desktop density. Verification expands to 54 desktop and phone browser journeys.
- 2026-08-10: Added R-355 through R-359 for automatic tested GitHub Pages deployment on every `main` update, project-subpath PWA integrity, public-preview privacy, a neutral new-visitor seed, and live mobile and desktop verification. Private alpha 0.36.0 preserves backup schema 24 and local persistence 22.
- 2026-08-10: Added R-347 through R-354 from the deep functional mobile and desktop audit. Private alpha 0.35.0 corrects handlerless and notice-only controls, real Library browse piping, touch-safe progression reasoning, active-workout leave and resume, unresolved-session pin mutation, cross-device touch targets and containment, and release metadata integrity. Verification includes 191 deterministic tests, 52 desktop and phone journeys, production Lighthouse 100/100/100 desktop and 98/100/100 mobile, zero high dependency vulnerabilities, and zero secret findings.
- 2026-08-10: Added R-331 through R-346 from JB's hypertrophy requirements source and the complete mobile-desktop UX audit. Private alpha 0.34.0 implements destination context reset, onboarding semantics, non-obstructive compact notices, an above-fold Today start path, Library discovery before placement calibration, and active-workout completion hierarchy. Selectable double progression, per-exercise increments, week-specific builder controls, and upper-lower templates remain specified but unimplemented.
- 2026-08-10: Added R-325 through R-330 for an original pocket-console sound language, opt-in preview, quiet-mode precedence, semantic event mapping, nonessential low-interruption audio, and provenance gates. Private alpha 0.33.0 adds `field-guide-synth-v1`, 191 deterministic tests across twenty files, and persisted sound-plus-quiet browser verification inside the existing forty-six desktop and phone journeys.
- 2026-08-10: Added R-321 through R-324 for context-grounded product judgment, original handheld-adventure craft, durable product and design registers, and automated-plus-visual UI QC. Private alpha 0.32.0 adds the Today Training Field Guide, post-onboarding focus handoff, design anti-pattern cleanup, a standard UI boundary check, 189 deterministic tests, and forty-six desktop and phone Playwright journeys.
- 2026-08-10: Added R-320 to exclude athlete-facing technique videos, exercise-demo feeds, video uploads, and automated form-video analysis. Revised R-102 and R-121 so structured history and concise optional guidance remain possible without turning the app into an instructional-content product.
- 2026-08-10: Added R-312 through R-319 for optimized phone and laptop use, one private account, local-first cloud synchronization, active-workout handoff, honest sync status, conflict preservation, cloud recovery, and the multi-device release gate. Responsive layouts are an implemented first slice; actual cross-device synchronization remains unimplemented.
- 2026-08-10: Added R-304 through R-311 for exact-movement favorites, dislikes, do-not-recommend state, context-specific exercise use, preference-aware ranking, protected-primary conflicts, auditable history, and stated-versus-inferred separation. The existing favorite and joint-response controls are an implemented first slice; contextual preference behavior remains unimplemented.
- 2026-08-10: Added R-296 through R-303 for an optional original three-stage training companion, completed-workout XP, anti-grind progression, level and evolution gates, post-workout level-up sequence, non-punitive continuity, accessibility controls, and a strict no-Pokémon-copying boundary. The feature is specified and remains unimplemented.
- 2026-08-10: Advanced R-039, R-040, R-054, R-060, R-145, and R-146 after private alpha 0.31.0 added `missed-opportunity-v5` and `schedule-priority-dose-v1`; completed-source-set comparison across athlete-declared priority regions in an inclusive rolling 28-day window; executable candidate coverage after support removal; strict priority below pin, eligibility, full executability, and exact-primary recency; applied-versus-reviewed UI evidence; no target-dose, neglect, progression, or catch-up claim; backup schema version 24; local persistence version 22; 189 deterministic tests; and forty-four desktop and phone Playwright journeys. Fixed-event pressure and downstream fatigue remain deferred.
- 2026-08-10: Advanced R-014, R-032, R-054, R-060, and R-180 after private alpha 0.30.0 added `missed-opportunity-v4` and `schedule-readiness-v1`; a 24-hour evidence window; bounded proceed, confirm, trim, reacclimation, block, and unknown actions; missing-is-unknown schedule behavior; source-survey validation; backup schema version 23; local persistence version 21; 186 deterministic tests; and forty-four desktop and phone Playwright journeys. Personal baselines, repeated-signal reliability, muscle-dose priority, fixed-event pressure, and downstream fatigue remain deferred.
- 2026-08-10: Advanced R-046, R-054, R-058, and R-060 after private alpha 0.29.0 added `missed-opportunity-v3` and `schedule-eligibility-v1`; active-profile protected-primary screening; support removal before time compression; hard pain and restriction gating; eligibility-aware athlete pins; full reason replay; backup schema version 22; local persistence version 20; 183 deterministic tests; and forty-four desktop and phone Playwright journeys. Current readiness, muscle-dose gap, fixed-event pressure, downstream fatigue, and full later-session substitution remain deferred.
- 2026-08-10: Advanced R-072 and R-113 after private alpha 0.26.0 added `calendar-exposure-v1`; linked but separate calendar-date and exact completed-exposure axes; forty-two-cell month navigation; stored-plan, actual-source-set, drift, moved, imported, and unlinked states; exact-exercise-only sequence and calendar gaps; descriptive load-first change labels; explicit fixed-event countdown states; unchanged backup schema version 19 and local persistence version 17; 168 deterministic tests across eighteen files; and forty-two desktop and phone Playwright journeys. The view creates no missed-work debt, family borrowing, fake completed weeks, automatic progression, or new programming authority.
- 2026-08-10: Strengthened R-166 and R-170 after private alpha 0.25.1 made protected-primary substitution cancel only the active check for the original exact movement and current session. Replacement work retains completed history and substitution provenance, the original progression clock remains frozen, no lane quota is consumed, secondary and accessory swaps leave the primary check intact, and the workout explains the boundary. Backup schema version 19 and local persistence version 17 remain unchanged. Verification includes 162 deterministic tests and forty desktop and phone Playwright journeys.
- 2026-08-10: Advanced R-092, R-098, R-101, and R-103 after private alpha 0.25.0 added one-to-three verification checks per exact movement lane; `movement-placement-exit-v1`; `movement-placement-exit-review-v1`; strict exact-exercise evidence isolation; other-movement exclusions; four measurable movement criteria; keep, reassess, or defer decisions with reasons; earned-checkpoint visibility after queue advancement; backup schema version 19; local persistence version 17; 160 deterministic tests; and forty desktop and phone Playwright journeys. Automatic route application, calibrated thresholds, and complete goal-specific exit measures remain deferred.
- 2026-08-10: Advanced R-101 to an athlete-reviewed plan-route criterion-exit first slice and R-103 to a criterion-triggered manual reclassification slice after private alpha 0.24.0 added `placement-exit-v1`, `placement-exit-review-v1`, four measurable criteria, matching-plan-route evidence joins, different movement-lane exclusions, keep or reassess or defer decisions with reasons, pain-boundary enforcement, backup schema version 18, local persistence version 16, 154 deterministic tests, and thirty-eight desktop and phone Playwright journeys. Movement-specific exits were delivered in 0.25.0; calibrated thresholds and silent automatic reclassification remain deferred.
- 2026-08-10: Advanced R-102 to an implemented exact-history placement first slice. `placement-history-v1` now creates exact-only, source-linked, 42-day evidence proposals for confidence and heavy-work tolerance; `placement-v3` uses only athlete-accepted fields, preserves numeric-only limitations, and rejects unknown or cross-movement source provenance.
- 2026-08-10: Advanced R-089, R-091 through R-094, R-098, and R-100 after private alpha 0.22.0 added `placement-v2`; independent `movement-placement-v1` lanes for every protected exact anchor; Skill, Heavy-work tolerance, Recent evidence, and explicit unknown inputs; `route-session-v3` executable prescriptions; exact lane evidence in productive verification; backup schema version 16; local persistence version 14; safe version 15 migration; 139 deterministic tests; and thirty-four passing desktop and phone Playwright journeys. Imported-history inference, adjacent-variation evidence transfer, movement-specific volume tolerance, automatic exits, and automatic reclassification remain deferred.
- 2026-08-10: Advanced R-045, R-046, R-093, and R-115 after private alpha 0.21.0 added deterministic `route-session-v2` equipment-aware generation; selected-location filtering for all secondary and accessory candidates; protected-anchor conflict review without silent replacement; profile-specific barbell, dumbbell, cable, machine, and other load rounding before confirmation; durable equipment snapshots on plans and sessions; backup schema version 15; local persistence version 13; safe version 14 migration; 133 deterministic tests; and thirty-four passing desktop and phone Playwright journeys. Plate and stack physics, cross-unit conversion, per-exercise increments, and complete historical profile-version replay remain deferred.
- 2026-08-10: Advanced R-089, R-093 through R-097, R-099, R-100, and R-114 after private alpha 0.20.0 added deterministic `route-session-v1` generation for all ten placement routes; route-specific roles, sets, repetitions, RIR, intensity, rest, accessory caps, warm-ups, strategies, reasons, and progression policies; exact-movement-only load sourcing; honest time fitting; history-preserving reassessment regeneration; pain-aware zero-queue behavior; route provenance; backup schema version 14; local persistence version 12; 128 deterministic tests; and thirty-two passing desktop and phone Playwright journeys. R-092 per-movement placement, real-world calibration, complete equipment-aware generation, automatic criterion exits, and athlete-reviewed reclassification remain deferred.
- 2026-08-10: Advanced R-098 after private alpha 0.19.0 added productive `placement-verification-v1` events, warm-up capture, source-linked first-set evidence, completion and post-session evidence, optional recovery, deferred-feedback replay, explainable verdicts, pain-triggered reassessment gating, backup schema version 13, local persistence version 11, 120 deterministic tests, and thirty-two desktop and phone Playwright runs. Movement-specific verification and athlete-reviewed automatic reclassification remain deferred.
- 2026-08-10: Advanced R-089 through R-091, R-093 through R-101, and R-103 after private alpha 0.18.0 added `placement-v1`, seven separate athlete dimensions, ten entry routes, skippable inputs, explicit uncertainty, route comparisons, athlete decisions, pain-aware start gating, versioned reassessment, backup schema version 12, local persistence version 10, 110 deterministic tests, and twenty-eight desktop and phone Playwright runs. R-092 remains deferred for per-movement placement, and R-101 remains instrumented rather than automatically resolved.
- 2026-08-10: Advanced R-045, R-046, and R-115 after private alpha 0.17.0 added persistent training-location profiles, exact conservative equipment eligibility, pre-workout review, blocked unavailable logging, equipment-aware substitution, executable load increments, backup schema version 11, local persistence version 9, 101 deterministic tests, and twenty-four desktop and phone Playwright runs.
- 2026-08-10: Advanced R-039, R-040, R-145, R-147, R-157, R-187, R-192, and R-196 after private alpha 0.16.0 added athlete-reviewed custom muscle mappings, strict direct and secondary validation, catalog audit and undo, backup validation, exact-session-linked planned muscle dose, composite plan identities, mapping-gap visibility, unlinked-history separation, 93 deterministic tests, and twenty-two desktop and phone Playwright runs.
- 2026-08-10: Advanced R-039, R-040, R-145, R-146, R-147, and the local slice of R-192 after private alpha 0.15.0 added versioned individual muscle-dose, seventeen leaf muscles, explicit mapping for all twenty-two built-in exercises, separate direct and secondary credit, overlap-safe parent rollups, zero and unmapped evidence, exact exercise and source-set drilldown, 89 deterministic tests, and twenty-two desktop and phone Playwright runs.
- 2026-08-10: Advanced the completed-set portion of R-102 and expanded R-150, R-153, R-154, R-187, R-196, and R-197 after private alpha 0.14.0 added atomic CSV validation, exact-only automatic identity mapping, required uncertain-name review, visible unit normalization, source and missingness provenance, occurrence-aware duplicate prevention, numeric-only import truth, reversible import events, 84 deterministic tests, and twenty desktop and phone journeys.
- 2026-08-10: Expanded R-039, R-040, and R-145 after private alpha 0.13.0 added versioned planned-set dose, exact session-linked completion, missing-plan separation, unknown planned-load reporting, future-plan exclusion, primary-region dose status, conservative interpretation guardrails, 78 deterministic tests, and eighteen desktop and phone journeys.
- 2026-08-10: Expanded R-153, R-155, R-156, and R-158 after private alpha 0.12.0 added required exact-match creation distinctions, deterministic connected duplicate groups, one-decision multi-source merge, group disappearance after cleanup, exact undo, 76 deterministic tests, and sixteen desktop and phone journeys.
- 2026-08-10: Expanded R-149, R-153, R-155, R-157, R-158, R-187, and R-196 after private alpha 0.11.0 added stable-ID custom exercise editing, protected built-in taxonomy, direct alias management, live related-movement review, exact collision blocking, reason-required catalog events, latest-change undo, backup schema version 10, versions 1 through 9 migration, and verified desktop and phone journeys.
- 2026-08-10: Advanced R-038 to all requested private-alpha horizons and expanded R-039 and R-040 after calendar-quarter aggregation, exact-movement mix, volume and set shares, contributing exercises, and goal-relative represented, outside-window, and no-history attention states were implemented and verified without relabeling tonnage as stimulus, enjoyment, or neglect.
- 2026-08-10: Advanced R-178 to its private alpha core after optional 24-hour deferred post-session feedback, non-blocking next-session access, explicit dismissal, expiry without invented answers, original-source-set quality replay, backup schema version 9, local persistence version 8, and desktop and phone journeys were implemented and verified.
- 2026-08-10: Advanced R-171 through R-178, R-180, and R-181 to honest private alpha 0.8.0 implementation slices after operational full, quick, minimal, ask-each-time, and off session modes, explicit unknown states, survey-free start and finish, time-answer session compression, evidence confidence, backup schema version 8, and desktop and phone journeys were implemented. R-179 now records the honest manual-controls-only boundary.
- 2026-08-10: Advanced R-159 through R-168 and R-170 to honest private alpha 0.7.0 implementation slices after reason-aware ranked substitutions, purpose and tradeoff explanations, exact-history and conservative calibration prescriptions, progression-clock separation, duration recalculation, durable outcome events, protected-primary confirmation, Library evidence, and backup schema version 7 were implemented and verified. R-169 is instrumented but remains intentionally not yet learning from repeated outcomes.
- 2026-08-10: Advanced R-199 through R-209, R-213, R-214, and R-216 through R-218 to their honest private alpha 0.6.0 slices after PR v2, prescribed-target opportunities, provisional achievement feedback, numeric-only uncertainty labels, quality-confirmed validation, local celebration controls, deterministic micro wins, Progress ledgers, Playwright journeys, and backup schema version 6 were implemented and verified. Existing implemented safety states for R-210 through R-212 and R-215 remain active.
- 2026-08-10: Advanced the supported parts of R-063, R-064, R-065, R-071, R-072, R-084, R-187, and R-196 after private alpha 0.5.0 added explicit exposure-round clocks, criterion recommendations, progress, hold, extension, recovery, completion, pivot entry, append-only review evidence, and backup schema version 5.
- 2026-08-10: Advanced the supported parts of R-149 through R-158, R-187, R-196, R-197, R-207, R-209 through R-213, and R-215 after private alpha 0.4.0 added source-backed records, reason-required set correction and deletion, deterministic duplicate review, reversible merge, exact replay, a visible audit ledger, latest-change undo, and backup schema version 4. R-184 remains at its existing browser-equivalent private-alpha status.
- 2026-08-10: Advanced R-051, R-063, R-064, R-065, R-068, R-069, R-071, R-072, and R-196 to their verified private alpha 0.3.0 states after editable mesocycles, deterministic preview, immutable plan revisions, future-only replacement, and backup schema version 3 were implemented and tested.
- 2026-08-10: Advanced R-003, R-004, R-038, R-039, R-040, R-145, R-146, R-184, R-196, and R-197 to verified partial or first-slice implementation states after private alpha 0.2.0 added real multi-horizon analytics, calculation reconciliation, and tested versioned backup and restore.
- 2026-08-10: Added R-290 through R-295 for the working private alpha, local-first same-day delivery, backend and AI deferral boundary, visual implementation, Build Bible authority, and honest persistent iteration.
- 2026-08-10: Added R-285 through R-289 for the canonical Build Bible, complete traceability, build-ready behavior contracts, phased quality gates, and living-specification governance.
- 2026-08-09: Added R-275 through R-284 for the RP YouTube training corpus, coverage ledger, transcript quality, relevance classification, evidence separation, update provenance, duplicate control, goal-specific rule extraction, regression translation, and continuing refresh.
- 2026-08-09: Added R-271 through R-274 for the private first usable release, multi-month personal incubation, history-preserving experimentation, and evidence-gated public readiness.
- 2026-08-09: Completed a full current-conversation continuity audit, verified R-001 through R-270 as sequential with no missing or duplicate IDs, and added [[App Build Reference Index]] as the future design and development handoff.
- 2026-08-09: Added R-251 through R-270 for the original 2D pixel training-adventure direction, hybrid modern UI, avatars, characters, reactions, exercise emblems, maps, evolving progress environments, achievement and social presentation, asset rules, accessibility, focused mode, and non-punitive progression.
- 2026-08-09: Added R-241 through R-250 for organized exercise discovery by body part, movement type, role, goal, equipment, shared recommendation taxonomy, canonical history, contextual grouping, filters, custom classification, and empty-result behavior.
- 2026-08-09: Added R-219 through R-240 for the optional friend activity feed, private sanitized sharing, comparable friend PR prompts, exact and scaled challenges, safe challenge scheduling, social authorization, anti-shame rules, corrections, and phased rollout.
- 2026-08-09: Created after a full current-thread omission audit. Added 24 traceable requirements and the standing same-turn Obsidian update rule.
- 2026-08-09: Added R-025 through R-029 for the four-coach research curriculum, layered synthesis, evidence discipline, research-informed exercise selection, and continuing knowledge-base requirement.
- 2026-08-09: Added R-030 through R-036 for the multi-format research corpus, volume as multi-dimensional dose, multi-signal readiness, fatigue classification, distinct peak state, evidence confidence, and continuing literature refresh.
- 2026-08-09: Added R-037 through R-051 for product navigation, multi-horizon dashboards, graphs, movement and muscle intelligence, exercise-library personalization, primary-secondary-accessory structure, equipment profiles, time-aware programming, onboarding, and transparent athlete insights.
- 2026-08-09: Added R-052 through R-060 for completed-exposure progression, missed-workout check-ins, automatic replanning, no catch-up volume, per-movement progression, partial-session credit, reason-specific responses, continuity states, and explainable session priority.
- 2026-08-09: Added R-061 through R-073 for hierarchical cycle planning, canonical terminology, objective and completion rules, elastic microcycles, criterion-driven mesocycles, macrocycle and annual planning, quadrennial strategy, progression-periodization separation, fixed-event replanning, cycle history, dashboards, and long-term evidence boundaries.
- 2026-08-09: Added R-074 through R-088 for deterministic training authority, layered learning, optional AI use cases, provider-neutral integrations, correct API credential boundaries, server-side secrets, a versioned runtime knowledge base, retrieval, structured validation, offline operation, privacy, cost controls, evaluations, and the required AI architecture chapter in the eventual development outline.
- 2026-08-09: Added R-089 through R-103 for first-use training placement, experience-versus-preparedness separation, multi-dimensional and per-movement levels, nine entry routes, direct strength or power entry, minimum necessary bridges, experienced-returner reacclimation, productive verification, explainable athlete control, imported history, criterion-based exits, and ongoing reclassification.
- 2026-08-09: Added R-104 through R-128 for continuous competitor intelligence, evidence separation, version and roadmap tracking, patch learning, release-note standards, cross-cycle history, direct time budgets, executable load increments, semantic exercises, external activity, feedback calibration, mid-program recalibration, data portability, the provenance-preserving multi-methodology brain, and community-derived regression tests.
- 2026-08-09: Added R-129 through R-144 after a five-book, 897-page local-library synthesis covering source integrity, per-book doctrine, claim currency, dynamic correspondence, multidimensional load, conservative working maxes, performance conversion, transfer hypotheses, variation maturity, contextual restoration, key indicators, technical quality, force-time goals, method eligibility, and source-gap refresh.
- 2026-08-09: Added R-145 through R-158 for hierarchical body-region volume views, overlap-safe aggregation, drill-down analytics, an extensive strength-variation catalog, canonical exercise identity, full movement history, exact-versus-family separation, duplicate detection and resolution, reversible merges, custom-exercise parity, and library data quality.
- 2026-08-09: Added R-159 through R-170 for athlete-controlled movement changes, contextual swap reasons, educated ranked alternatives, purpose preservation, survey and history personalization, visible tradeoffs, substitute-specific prescriptions, progression-clock integrity, full session recalculation, learning events, evidence thresholds, and protected-primary swaps.
- 2026-08-09: Added R-171 through R-181 for universal survey optionality, per-question skipping, immediate workout access, cadence-specific survey modes, missing-is-unknown semantics, persistent known safety state, no penalties or nagging, deferred feedback, adaptive question burden, missing-data confidence, and survey-free core operation.
- 2026-08-09: Added R-182 through R-198 for a structured backend, Supabase evaluation, local offline storage, cross-device sync, relational canonical records, event and derived-state separation, recommendation provenance, explicit missingness, Auth and Row Level Security, server-side secrets, versioned aggregates, data quality, statistical learning, retrieval boundaries, backup and migration, athlete data rights, and required scale gates.
- 2026-08-09: Added R-199 through R-218 for data-backed gamification, multidimensional record types, set-scheme and volume PRs, multi-scope context, eligible opportunity prompts, in-workout notifications, celebrations, comparability validation, programming authority boundaries, volume-chasing safeguards, exact-versus-family separation, provenance, dashboards, recalculation, controls, non-PR achievements, and offline sync consistency.

Related: [[Adaptive Strength and Hypertrophy App]], [[Projects]], [[Hot Cache]]
