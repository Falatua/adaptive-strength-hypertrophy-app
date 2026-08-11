---
type: product-spec
aliases: [Adaptive Training App Product Experience, Dashboard and Exercise Library Spec]
tags: [fitness, app, dashboard, exercise-library, equipment, time-budget, onboarding]
created: 2026-08-09
updated: 2026-08-10
status: exploring
project: "[[Adaptive Strength and Hypertrophy App]]"
confidence: from-user
---

# Product Navigation, Dashboard, Exercise Library, and Time-Aware Programming

## Product Experience Principle
The app should feel like a living portrait of the athlete, not a spreadsheet with workout totals. It should show what the system knows, what it is still learning, why it made a recommendation, and where the athlete can correct it.

The interface must make four things easy:
1. Know what to do today.
2. Understand whether progress is occurring.
3. Understand what the app has learned about the athlete.
4. Change exercises, goals, equipment, time, preferences, or constraints without fighting the program.

## Visual Experience Layer

The product uses an original 2D pixel training-adventure style for characters, environments, body-part and movement-type emblems, exercise and equipment sprites, reactions, badges, maps, and celebrations. Clean modern interface typography and controls remain authoritative for sets, loads, timers, charts, surveys, warnings, history, and explanations.

The pixel layer should make the app memorable and entertaining without making workout logging slower or less legible. Character, motion, sound, and decorative intensity are configurable, with reduced-motion and focused-training options.

Detailed system: [[Pixel Training Adventure Visual and Interaction System]].

## Product-Wide Survey Controls

No survey gates navigation or training. Every onboarding, readiness, warm-up, during-session, post-session, weekly, monthly, and block question can be skipped individually. Every survey can be skipped as a whole.

Persistent fast paths include:
- `Start Workout Now`;
- `Quick Check`;
- `Skip This Question`;
- `Skip Survey`;
- `Finish Without Survey`;
- `Remind Me Later`, when deferred feedback is enabled.

Settings allow full, quick, minimal, off, or ask-each-time defaults by survey type. Missing answers remain unknown and reduce personalization confidence without reducing access or creating a negative score.

## Primary Navigation

### Today
The fastest route into the next useful workout.

Primary actions:
- `Start Today's Workout`
- `Start Without Check-In`
- `I Have Less Time`
- `Change Equipment Location`
- `Swap a Movement`
- `Review Why This Session`
- `Report Pain or Limitation`

Today should show:
- current session objective;
- available-time selector;
- readiness survey;
- primary, secondary, and accessory structure;
- estimated duration;
- what is protected if time becomes limited;
- what changed from the original plan and why.

### Plan
The rolling program and current block.

Views:
- next-session priority queue;
- rolling week;
- block overview;
- strength-anchor exposures;
- muscle-priority allocation;
- missed or deferred work;
- deload, reacclimation, or peak status;
- edit goals and schedule.

The plan should not imply that Monday's missed work must be completed on Tuesday. It should show what was preserved, moved, merged, or dropped.

After a missed session, Plan should open a conditional game-plan card with:
- what was actually completed;
- which exercise progression clocks advanced or stayed frozen;
- why the session changed;
- next realistic availability and time;
- current stable, interrupted, or returning state;
- the recommended rebuilt sequence;
- `Rebuild My Week`, `Move This Session`, `Keep Only the Primary`, `Let It Go`, and `Pin Next Priority` controls.

### Progress
The detailed athlete dashboard with time-range controls:
- `Today`
- `7 Days`
- `Week`
- `28 Days`
- `Month`
- `3 Months`
- `Year`
- `All Time`

### Library
The personalized exercise catalog, movement relationships, equipment eligibility, substitutions, and exercise-response history.

### You
The editable athlete model:
- goals;
- strength anchors;
- muscle priorities;
- training experience;
- exercise preferences;
- joint and injury considerations;
- equipment locations;
- normal time availability;
- schedule patterns;
- units and display preferences;
- what the app believes and confidence.

## Progress Dashboard

The dashboard should be modular. Cards can be opened, reordered, hidden, or pinned. Every graph should explain its metric and allow the user to change the time range.

### Progress Command Bar
Persistent controls:
- time range;
- compare with prior period;
- filter by exercise, movement pattern, muscle, workout type, location, or block;
- switch between planned and completed work;
- switch between total, average, trend, and comparable-exposure views;
- add a personal note to the timeline.

### 1. Current Direction
A concise top card answering:
- Are strength anchors progressing, holding, rebuilding, or declining?
- Are priority muscles receiving their intended dose?
- Is the athlete stable, interrupted, returning, fatigue-limited, or peaking?
- What is the best next progress opportunity?

This card must not collapse everything into one misleading readiness or progress score.

### 2. Volume Explorer
Interactive graphs with selectable measures:
- volume load or tonnage;
- working sets;
- direct muscle sets;
- fractional muscle sets;
- challenging sets by RIR band;
- repetitions;
- exposure frequency;
- session duration;
- planned versus completed work.

Graph modes:
- daily bars;
- weekly line;
- rolling 7-day line;
- monthly bars;
- rolling 28-day line;
- yearly cumulative and monthly distribution;
- block overlay showing hypertrophy, strength, deload, reacclimation, and peak phases.

The graph should reveal whether a volume increase came from more weight, more repetitions, more sets, more sessions, or a different exercise mix.

#### Body Region and Area Views

The athlete can view volume at several levels:

- whole body;
- upper body;
- lower body;
- trunk and core;
- chest, back, shoulders, arms, quads, hamstrings, glutes, calves, adductors, and abductors;
- arms expanded into biceps, triceps, and forearms;
- individual muscles where the exercise taxonomy supports meaningful attribution;
- custom saved views such as `Pressing Muscles`, `Posterior Chain`, or `Powerlifting Support Work`.

Every region can be opened to reveal its child regions and contributing exercises. The user can compare upper versus lower, arms versus torso, one muscle against its target range, or the same region across two periods.

The interface must distinguish three calculations:

1. `Exercise volume-load`: each completed set belongs once to its exercise and exclusive primary region. This prevents one compound set from multiplying across chest, shoulders, and triceps.
2. `Region-involvement volume-load`: show all movement tonnage in which a selected region was a primary or secondary contributor. This is useful for questions such as “How much loaded work involved my arms?” but is explicitly non-additive because the same bench set can appear in chest, shoulders, and triceps lenses.
3. `Muscle dose`: direct and fractional set credits can appear under every relevant muscle. Parent-region totals sum the child credits once and never re-credit the original set.

Overlapping filters such as `Upper Body` plus `Arms` are analytical lenses, not additive totals. The interface must label overlap and disable a misleading combined sum. Every chart should disclose whether it displays exclusive exercise volume-load, non-additive region-involvement volume-load, direct sets, fractional set equivalents, hard sets, repetitions, or exposure frequency.

### 3. Muscle Balance Map
A front-and-back body map with selectable periods.

Each muscle or region can show:
- completed sets versus personal target range;
- direct and indirect contribution;
- days since last useful exposure;
- recent performance trend;
- average recovery and soreness;
- joint limitations affecting the region;
- status: emphasized, maintained, neglected, over target, or uncertain.

Neglect should be defined relative to the current goal and intended maintenance dose, not bodybuilding symmetry alone. A muscle is not neglected merely because another priority muscle received more work.

### 4. Movement Frequency and Rotation
Answers:
- Which movements have I performed most?
- Which movement patterns dominate my training?
- Which exercises have disappeared from the program?
- Am I repeatedly testing strength without enough builder work?
- Am I changing exercises so often that progress is difficult to evaluate?

Views:
- top movements by sessions, working sets, repetitions, tonnage, and minutes;
- push, pull, squat, hinge, carry, single-leg, trunk, isolation, and other pattern distribution;
- exercise-family rotation timeline;
- builder-versus-tester balance.

### 5. Strength Anchor Dashboard
One card per protected primary movement.

Show:
- top load;
- estimated 1RM trend;
- performance at comparable repetitions and RPE or RIR;
- successful load, repetition, and technique wins;
- primary-variation frequency;
- secondary movements currently supporting it;
- weak points being targeted;
- transfer evidence from each builder;
- fatigue and pain history;
- last specific heavy exposure;
- next planned progression frontier.

### 6. What Builds What
A relationship view connecting primary movements to secondary builders and accessories.

Example:
- `Sumo deadlift`
  - `Conventional deficit deadlift`: low-back strength, starting strength, posterior-chain demand
  - `Romanian deadlift`: hamstrings and hip extension
  - `Rows or pulldowns`: upper-back stability
  - `Trunk work`: positional strength
- `Competition bench press`
  - `Two-board press`: triceps and lockout overload
  - `Close-grip bench`: triceps with greater bench similarity
  - `Chest-supported row`: upper-back support with low systemic fatigue
- `Competition squat`
  - `Safety-bar squat`: upper-back, trunk, and squat strength with a different fatigue profile
  - `Good morning`: posterior-chain and torso strength

These relationships are hypotheses, not guaranteed transfer. Every link stores:
- intended weak point or mechanism;
- similarity to the primary movement;
- expected fatigue cost;
- joint response;
- performance trend;
- personal transfer confidence;
- coach or research provenance;
- whether the user agrees with the relationship.

### 7. Enjoyment and Adherence
The app should learn what the athlete actually enjoys rather than only what is theoretically optimal.

Show:
- favorite movements;
- movements most often completed when optional;
- exercises repeatedly skipped;
- movements rated fun, satisfying, or motivating;
- exercises that feel productive but are disliked;
- exercises enjoyed but consistently painful or excessively fatiguing;
- session formats most likely to be completed;
- preferred training length and time of day.

Enjoyment should influence adherence and selection, but it cannot override pain or the current goal without explanation.

### 8. Joint-Friendly Movement Matrix
For every joint or region, show exercises grouped as:
- consistently comfortable;
- comfortable under certain loads, ranges, grips, or setups;
- uncertain or not enough data;
- repeatedly uncomfortable;
- temporarily unavailable;
- user-blocked.

The athlete can open a movement and record whether discomfort appeared during warm-up, work sets, immediately after, or the following day.

### 9. Time and Efficiency Dashboard
Show how training behaves under real time constraints:
- planned versus actual session length;
- average setup and transition time;
- most productive exercises per minute;
- work most frequently removed from short sessions;
- progress made in 15-, 30-, 45-, 60-, and 90-minute sessions;
- time estimates by location and equipment;
- whether shortened sessions preserve the intended primary objective;
- which supersets save time without harming priority work.

### 10. Consistency and Life Context
Show:
- sessions completed;
- session opportunities used;
- interrupted and returning periods;
- rolling training frequency;
- common reasons sessions change;
- training patterns around children, work, travel, sleep, or injuries;
- the app's confidence about causal relationships.

The app should never shame the athlete for an interrupted schedule. It should reveal how the system preserved useful progress.

### 11. Micro-Win Timeline
Chronological feed of:
- load wins;
- repetition wins;
- recovered-set wins;
- cleaner technique;
- improved range of motion;
- lower RPE at the same work;
- pain-free return;
- new useful movement;
- completed short session;
- improved consistency;
- successful deload or peak.

### 12. What the App Has Learned
A transparent personal-insight feed.

Examples:
- `Your deficit deadlift has preceded improvements in your sumo starting strength, but confidence is still low because only four comparable cycles are available.`
- `You complete chest-supported rows more consistently than unsupported rows and report less low-back fatigue.`
- `After two nights below your normal sleep range, heavy squat RPE has averaged higher. Your bench performance has been less affected.`
- `Thirty-minute sessions are most successful when the primary movement and one paired secondary movement are protected.`
- `You report better knee comfort after five to eight minutes of cycling and controlled leg curls before squat-volume sessions.`

Every insight needs:
- evidence used;
- confidence;
- date range;
- whether it affects programming;
- `Correct`, `Not true`, `Needs more data`, and `Stop using this` controls.

### 13. Cycle and Goal Explorer
Show the active hierarchy from today's session through microcycle, mesocycle, macrocycle, annual plan, and adjustable long horizon.

For every level, show:
- dominant objective and maintained qualities;
- planned versus actual dates;
- completed, substituted, missed, waived, and expired exposures;
- current cycle state and why it changed;
- success criteria and current progress;
- fixed events, remaining buffer, and minimum viable path;
- plan version and confidence.

Allow the graph to switch between calendar time and completed-exposure sequence. A month with irregular training must look different from four completed microcycles even if both span similar calendar dates.

Detailed model: [[Hierarchical Training Cycle and Goal Architecture]].

### 14. PRs, Achievements, and Opportunities

Show:
- current all-time, yearly, block, recent, and since-return records;
- load, repetition, repetition-target load, set-scheme, estimated-strength, exact-movement volume, workout-day volume, quality, consistency, and return categories;
- PR timeline linked to original workouts and sets;
- near-term record opportunities already compatible with the plan;
- corrected, invalidated, or recalculated records;
- celebration and notification preferences.

During a workout, show the last exact exposure and at most one or two relevant opportunities. Before an eligible set, a banner can state that the planned target would produce a named record. After completion, show the prior result, new result, improvement, scope, and validation status.

Gamification is optional. Quiet mode removes sounds, haptics, animations, confetti, and live opportunity prompts while preserving the underlying record ledger.

Detailed model: [[PR Gamification and In-Workout Motivation System]].

## Exercise Library

### Library Home and Browse Hierarchy

The library cannot begin as one long alphabetical list. Its home screen offers clear ways to find a movement:

1. `Body Part`
2. `Movement Type`
3. `Training Role`
4. `Goal or Weak Point`
5. `Equipment`
6. `My Movements`
7. `Recently Used`
8. `Browse All`

#### Browse by Body Part

The body-part tree follows the same muscle and region taxonomy used by volume analytics:

- whole body;
- upper body and lower body;
- chest, back, shoulders, arms, trunk, glutes, quads, hamstrings, adductors, abductors, and calves;
- arms expanded into biceps, triceps, and forearms;
- back expanded into lats, upper back, spinal erectors, and other supported subregions;
- shoulders expanded into front, lateral, and rear deltoids;
- individual muscles only where classification is meaningful enough to support programming.

A body-map view and a conventional list view lead to the same results. Selecting a region shows movements where it is primary first, then clearly separates movements where it is a secondary contributor. The interface never implies that a compound movement belongs to only one muscle.

#### Browse by Movement Type

The movement-type tree includes:

- squat and knee-dominant;
- hinge and hip-dominant;
- horizontal press;
- vertical press;
- horizontal pull;
- vertical pull;
- elbow flexion;
- elbow extension;
- shoulder abduction, extension, rotation, and scapular work;
- knee extension and knee flexion;
- hip extension, abduction, adduction, and rotation;
- calf and ankle work;
- trunk flexion, extension, lateral flexion, rotation, and anti-movement work;
- single-leg work;
- loaded carries;
- jumps, throws, sprints, and explosive work when supported;
- locomotion, conditioning, rehabilitation, and other explicitly labeled categories.

Broad push, pull, squat, hinge, carry, single-leg, trunk, and isolation groupings remain available as fast top-level shortcuts. More precise mechanical categories appear after drill-down.

#### Browse by Training Role

- primary strength anchor;
- competition or test movement;
- secondary builder;
- hypertrophy compound;
- accessory or isolation;
- technique or skill practice;
- activation or warm-up;
- rehabilitation or return-to-training;
- power or speed development;
- conditioning or work capacity.

#### Browse by Goal or Weak Point

Examples include:

- bench lockout and triceps;
- bench off the chest;
- squat out of the hole;
- squat upper-back or torso strength;
- deadlift floor speed;
- deadlift lockout;
- posterior-chain hypertrophy;
- upper-back stability;
- lat width;
- shoulder hypertrophy;
- joint-friendly pressing;
- low-fatigue muscle work;
- short-session options.

Weak-point groupings are hypotheses supported by exercise properties, methodology provenance, and eventually personal transfer evidence. They are not universal promises.

#### My Movements

Fast collections include:

- favorites;
- works well for me;
- preferred for this body part;
- preferred for this equipment location;
- recently used;
- not used recently;
- never tried;
- custom movements;
- temporarily unavailable;
- avoided or user-blocked;
- painful or conditionally comfortable;
- saved primary builders.

### Shared Taxonomy for Browsing and Recommendations

The full library, `Add Movement`, `Change Movement`, and recommendation engine use one canonical taxonomy. They do not maintain separate body-part lists or recommendation-only categories.

Every exercise can have multiple discoverability tags while retaining one canonical ID and one history. A close-grip bench press can appear under:

- chest and triceps;
- horizontal press;
- secondary builder;
- bench lockout or triceps goal;
- barbell equipment;
- bench-press variation family.

These are views of one record, not duplicate exercises. The primary and secondary muscle fields, movement pattern, role, equipment, modifiers, and goal relationships determine where the movement appears.

Custom exercises must be classified into this same structure. The creation flow suggests likely fields from the name and selected equipment, then lets the athlete confirm, correct, or mark a field unknown. The app never invents confident muscle or movement tags merely to complete the form.

### Library Browsing
After choosing any starting category, the athlete can refine with faceted filters:

- body region, body part, primary muscle, and secondary muscles;
- broad pattern and precise movement type;
- training role and tester, builder, or both;
- goal, target lift, and weak-point relationship;
- equipment and equipment location;
- joint compatibility;
- favorite, avoided, new, custom, or unavailable;
- repetition range and loading style;
- stability, complexity, and skill demand;
- fatigue and joint cost;
- expected setup and completion time;
- suitable for short sessions;
- eligible for supersets or intensity techniques;
- current phase, planned slot, and progression eligibility when browsing from a workout.

Active filters appear as removable chips with result counts. Breadcrumbs show the current path, such as `Body Part > Arms > Triceps > Barbell`. `Clear All` and one-tap backtracking prevent dead ends.

Results can be sorted by:

- best match;
- recommended for me;
- body-part relevance;
- movement-type relevance;
- most recently used;
- strongest personal history;
- joint comfort;
- enjoyment;
- lowest fatigue cost;
- shortest expected time;
- alphabetical name.

Additional navigation:
- recently used, not used recently, and never used;
- exact exercise versus variation family;
- custom versus system exercise;
- possible duplicate, linked alias, or canonical record;
- search by common name, nickname, alias, equipment, modifier, or target lift.

Search is available from every library and recommendation screen. Search-as-you-type recognizes common names, aliases, abbreviations, spelling variants, specialty bars, equipment, body parts, muscles, movement types, training roles, and weak points. Results still display their category path so a name match does not lose context.

When a filter combination has no result, the app explains which constraint removed the final options and offers reversible relaxations such as another available implement or a related movement pattern. It does not silently ignore pain, equipment, or role constraints.

The system catalog should support a deep powerlifting and powerbuilding library rather than only generic commercial-gym movements. Examples include two-board press, three-board press, coffin press, cambered-bar press, cambered-bar row, pin and rack variations, paused and tempo variations, deficit pulls, block pulls, specialty-bar squats, accommodating resistance, and grip or stance variants.

### Canonical Exercise Identity

An exercise is not identified only by its display name. Every system and custom exercise receives an immutable canonical ID plus structured identity fields:

- base movement family;
- movement pattern;
- implement or specialty bar;
- bench angle, body position, support, and machine;
- grip or stance;
- range-of-motion modifier such as board height, blocks, pins, deficit, or partial range;
- start condition such as dead start, paused, touch-and-go, or stretch-shortening cycle;
- tempo and pause prescription;
- resistance profile such as straight weight, bands, chains, or reverse bands;
- bilateral, unilateral, alternating, or assisted execution;
- aliases, nicknames, spelling variants, and the original user-entered name.

This structure allows two-board and three-board press to share a bench-press family while retaining separate exact histories. It also prevents `Incline Bench`, `Incline Bench Press`, and `Barbell Incline Press` from accidentally becoming three unrelated progression clocks when they describe the same movement.

### Exercise Detail Page
Each movement should display and allow editing of:
- name and aliases;
- demonstration and technique cues;
- movement pattern;
- equipment required;
- primary and secondary muscles;
- primary, secondary, accessory, or flexible role;
- associated strength anchors;
- intended weak point or transfer mechanism;
- variation family;
- range-of-motion standard;
- preferred setup, grip, stance, bar, machine, or attachment;
- load increments available;
- safe RIR range;
- target repetition ranges;
- typical rest and duration;
- personal performance history;
- joint-feel history;
- target-muscle feel;
- enjoyment;
- stimulus and fatigue ratings;
- usual recovery time;
- substitutions;
- personal notes;
- app confidence.
- current records, recent bests, PR history, and the closest progression-eligible opportunity;

### Exercise History and Last Exposure

Every exercise detail page opens with a historical snapshot:

- last completed date and days since exposure;
- last completed work sets, shown set by set with load, repetitions, RIR or RPE, range of motion, and completion status;
- previous top set, average load, total repetitions, working sets, and volume-load;
- technique, pain, joint feel, target-muscle feel, and post-session response;
- session objective, role, block, location, equipment, and bodyweight context;
- personal records by load, repetitions, estimated strength, volume-load, and technical quality;
- recent trend and the next eligible progression frontier.

The page includes:
- exact-exercise history timeline;
- variation-family history timeline;
- calendar view and completed-exposure sequence;
- filters for date, block, role, location, equipment, repetition range, and effort;
- `Use Last Setup`, `Add to Next Session`, `Compare Exposures`, and `View Original Workout` actions.

If bench press was last performed ten weeks ago, the page should say that clearly and display the exact load, repetitions, sets, effort, and context from that exposure. The app must not silently substitute a related board press or incline press for the exact bench-press history, though it may offer the family history as a separate comparison.

### Duplicate Detection and Resolution

When a user creates or imports an exercise, the app searches before saving. Detection uses deterministic name normalization, aliases, spelling tolerance, word-order normalization, structured identity fields, and variation-family matching. Optional AI can help interpret an uncertain nickname, but it cannot merge records automatically.

Confidence levels:
- `Exact duplicate`: same canonical signature or an existing alias.
- `Probable duplicate`: highly similar name and matching structured modifiers.
- `Related variation`: same family but a meaningful difference such as angle, board height, specialty bar, grip, or range of motion.
- `Distinct exercise`: no material identity match.

Actions:
- `Use Existing Exercise`;
- `Add This Name as an Alias`;
- `These Are Different`, followed by the distinguishing field;
- `Merge Histories`;
- `Create Anyway`, with a required disambiguating label when confidence is high.

The system never silently merges or deletes history. A merge points old logs to the chosen canonical exercise while preserving each log's original entered name, timestamps, notes, and provenance. Merges are auditable and undoable. Custom exercises receive the same history, analytics, progression, aliases, and duplicate protection as system exercises.

### Library Data Quality

A maintenance view identifies:
- probable duplicate exercises;
- orphaned aliases;
- exercises missing muscle, equipment, or modifier data;
- conflicting records that use the same name for different movements;
- variation families whose history is fragmented;
- custom exercises that now match an expanded system-catalog entry.

The user can clean the library gradually without interrupting workout logging. Progression history should improve as identities are resolved, while the original data remains recoverable.

### Quick Exercise Actions
- `Favorite`
- `Avoid`
- `Temporarily Unavailable`
- `Painful Today`
- `Works Well for Me`
- `Does Not Hit the Target Muscle`
- `Add to Primary Builder List`
- `Use More Often`
- `Use Less Often`
- `Find a Substitute`
- `Create Custom Exercise`

### Exercise Replacement Flow
Every programmed movement has a visible `Change Movement` action before and during training. The athlete retains final selection authority within pain, safety, equipment, and session-feasibility constraints. Changing a movement should feel like an informed coaching conversation rather than losing the program's intent.

The app first uses the information it already has:
- session role and current adaptation target;
- weak point, target muscle, or transfer mechanism;
- current phase and progression goal;
- pre-session readiness, aches, pain, time, location, and equipment;
- exercise history, recency, technical familiarity, and current working capacity;
- prior joint feel, target-muscle feel, stimulus, fatigue, enjoyment, completion, and recovery;
- post-session responses from prior substitutions;
- athlete favorites, avoid list, requests for variety, and explicit corrections.

The athlete may optionally select a quick reason:
- pain or joint concern;
- equipment unavailable;
- not enough time;
- unusually fatigued;
- movement does not feel productive;
- wants variety;
- dislikes the movement today;
- wants a harder or easier option;
- other or no reason.

The reason changes recommendation ranking and becomes training data, but the user does not need to complete a long survey to make a swap.

Replacement filters should prioritize:
1. same session role;
2. same primary movement or target muscle relationship;
3. available equipment;
4. joint compatibility;
5. similar stimulus with acceptable fatigue;
6. suitable duration;
7. user preference;
8. enough familiarity for safe execution.

### Educated Recommendation Screen

Recommendations appear in tiers:
- `Best Matches`: preserve the role, objective, equipment, and expected dose most closely.
- `Good Alternatives`: preserve the main purpose with a visible tradeoff.
- `Changes Today's Focus`: safe choices that materially alter the planned stimulus or progression.
- `Browse Full Library`: athlete-directed selection with filters and compatibility warnings.

Within each tier, the athlete can switch between grouped views:

- by body part or target muscle;
- by movement type;
- by training role;
- by equipment;
- by recommendation strength.

The default grouping follows the reason the athlete opened the screen. A triceps substitution begins with triceps and preserved-role matches. Replacing a horizontal press begins with horizontal-press alternatives. Adding optional work from the Library may begin with body part. The visible filter bar always allows a different route.

Each recommendation card shows:
- why it is recommended now;
- what training purpose it preserves;
- what changes in specificity, target muscles, weak-point coverage, range, or fatigue;
- personal joint, enjoyment, completion, and recovery history;
- last exposure and previous performance when available;
- required equipment and estimated time;
- confidence and evidence source;
- the recalculated sets, repetitions, load or load method, RIR or RPE, rest, and duration if selected.

The screen should say `Preserves`, `Changes`, and `Why this ranks here` rather than hiding the decision inside one score.

### Selection and Session Recalculation

After selection, the app recalculates the prescription from the chosen exercise's exact history, variation-family context, executable load increments, current readiness, and session objective. It never copies the original movement's load blindly onto a different bar, machine, range of motion, or resistance profile.

The session then updates:
- sets, repetitions, load method, effort, rest, and warm-up needs;
- expected duration and equipment transitions;
- muscle and body-region dose;
- fatigue and joint-cost estimate;
- primary-secondary-accessory relationships;
- what later work should remain, shrink, move, or expire.

The original movement is marked `substituted`, not completed and not missed. Its exact progression clock remains unchanged. The selected movement receives the completed exposure and advances only from its own history.

### Learning From Athlete Choice

Every change creates an `ExerciseSubstitutionEvent` containing:
- original and selected canonical exercise IDs;
- session role and objective;
- recommendations shown and their ranking reasons;
- athlete-selected reason, if supplied;
- readiness, pain, equipment, time, and schedule context;
- accepted recommendation or full-library override;
- recalculated prescription;
- actual performance and completion;
- post-session joint feel, target feel, fatigue, enjoyment, and recovery;
- whether the athlete later corrected the app's interpretation.

Repeated successful substitutions can raise a movement's future rank. Repeated skips, pain, poor target feel, excessive fatigue, or explicit dislike can lower it. One isolated swap should not rewrite the athlete model. Confidence grows only across enough comparable outcomes.

Primary-movement substitutions require stronger confirmation because they can change specificity and the session's protected objective. Secondary and accessory swaps can be more flexible. The app may warn that a choice changes today's goal, but it should allow a safe informed override and then adapt the remaining plan honestly.

## Primary, Secondary, and Accessory Architecture

### Primary Movement
The highest-priority movement of the session. It usually represents a protected strength anchor, close variation, or the most important hypertrophy target.

Rules:
- receives time and recovery protection;
- normally occurs early;
- carries the clearest load or performance goal;
- cannot be replaced casually;
- includes an explicit reason and current progression frontier.

### Secondary Movement
A builder selected to improve the primary movement or its limiting capacity.

Each secondary movement must answer:
- What primary movement does this support?
- What weak point, muscle, position, or skill does it build?
- Why was this movement chosen over another builder?
- How will we know whether it transfers?
- What fatigue and time cost does it create?

Examples from JB:
- Sumo deadlift primary with conventional deficit deadlift secondary to strengthen the low back, posterior chain, and start.
- Bench press primary with two-board press secondary to overload the triceps and lockout.
- Squat primary with safety-bar squat or good morning secondary to build upper-back, trunk, or posterior-chain strength.

These are candidate relationships. The app should not assume the same secondary movement helps every athlete or every weak point.

### Accessories
Accessories add muscle, address smaller weak points, improve balance, or provide lower-cost volume.

They should be ranked:
- required support;
- high-value hypertrophy;
- maintenance;
- optional finisher.

This ranking determines what survives a shorter time budget.

## Equipment and Location Model

### Equipment Profiles
The athlete can maintain multiple locations:
- home gym;
- commercial gym;
- work gym;
- travel setup;
- hotel gym;
- bodyweight only;
- custom temporary location.

Each profile stores:
- barbells and specialty bars;
- racks, benches, blocks, boards, pins, chains, and bands;
- plates and smallest load increment;
- dumbbell range and increments;
- cable stations and attachments;
- plate-loaded and selectorized machines;
- cardio and warm-up equipment;
- specialty equipment;
- unavailable or broken equipment;
- setup constraints;
- expected wait or transition cost where useful.

### Programming Rule
Only prescribe exercises eligible for the selected location. If the location changes, rebuild the session while preserving the primary objective, secondary relationship, target muscles, and time budget as closely as possible.

## Time-Aware Workout Builder

### Time Selector
The athlete can choose or change:
- 15 minutes;
- 20 minutes;
- 30 minutes;
- 45 minutes;
- 60 minutes;
- 75 minutes;
- 90 minutes or more;
- custom time;
- `I am not sure`.

The estimate must include warm-ups, realistic rest, setup changes, and the athlete's personal pace. Heavy work should not be made unsafe by pretending rest does not consume time.

### Time-Budget Priorities
1. Safety and warm-up requirements.
2. The primary movement and its minimum useful dose.
3. The highest-value secondary builder.
4. Priority-muscle accessories.
5. Maintenance work.
6. Optional finishers and intensity techniques.

### Example 30-Minute Session
- Readiness check already completed before the clock begins when possible.
- Five-minute specific warm-up and ramp.
- Primary movement with two or three productive work sets and adequate rest.
- One secondary movement selected for high transfer and low setup cost.
- Optional paired accessory only if actual time remains.
- Post-session check shortened to essential questions.

### Example 15-Minute Session
- One familiar primary or close variation.
- Minimal safe ramp.
- One or two high-quality work sets.
- Optional no-setup accessory paired only when it cannot impair the priority movement.
- Record the session as a consistency and exposure win, not a failed full workout.

### Example 60-Minute Session
- Full primary movement dose.
- Secondary builder.
- Two or three accessory slots allocated by muscle priority and recovery budget.
- Optional technique or finisher work when justified.

### Dynamic Compression During Training
If time changes mid-session, tap `I Have 10 Minutes Left`.

The app should:
- preserve remaining required primary work;
- choose whether the secondary or an accessory has higher expected value;
- remove low-priority setup changes;
- propose compatible supersets only when they do not harm the main objective;
- explain what was deferred or dropped;
- update future sessions without classifying the change as poor recovery.

### Personal Time Learning
The app learns actual duration by exercise, set, rest pattern, location, and equipment transition. It should eventually know that the athlete's three work sets of one movement take twelve minutes while another machine requires a long setup or wait.

## Onboarding Taste Picker and Entry Placement

The first-use experience should feel like building a training identity, not completing a medical intake form. It can use quick visual cards, ranking, sliders, and `not sure yet` options.

### Section 1: About You
- age;
- height and weight, optional where not needed;
- units;
- training age;
- recent consistency;
- current pain, injury, or medical constraints;
- preferred coaching tone.

### Section 2: What You Want
- maximal strength;
- muscle growth;
- powerbuilding balance;
- specific lift goals;
- priority muscles;
- health, confidence, consistency, or pain-free return;
- event or testing dates;
- push, maintain, rebuild, or recover.

### Section 3: Your Training Life
- available days or rolling opportunities;
- normal session length;
- shortest useful session;
- schedule certainty;
- common disruptions such as children, work, travel, or sleep;
- preferred training times.

### Section 4: Equipment
- choose or create equipment locations;
- select available bars, racks, plates, dumbbells, cables, machines, bands, and specialty items;
- mark load increments and meaningful constraints.

### Section 5: Movement Taste Picker
Show exercises or movement families and ask:
- love it;
- like it;
- neutral;
- dislike it;
- painful or avoid;
- never tried;
- want to learn.

Follow up only when the answer affects programming. Ask where discomfort occurs and under what setup rather than marking an entire movement family permanently bad.

### Section 6: Current Strength and Experience
- current primary movements;
- recent comfortable working loads;
- estimated or known bests, optional;
- familiar variations;
- technique confidence;
- preferred repetition ranges;
- comfort with RPE and RIR.
- total and structured training history;
- actual sessions completed over the last four, eight, and twelve weeks;
- recent intensity and sustainable weekly volume;
- time since meaningful exposure to each primary movement;
- imported logs, coaching history, or other evidence quality.

### Section 7: Starting-Cycle Placement
The app assesses training experience, recent continuity, movement skill, strength tolerance, volume tolerance, schedule stability, pain constraints, current goal, and evidence quality separately.

Possible entry routes:
- introductory skill;
- reacclimation or return;
- bridge or calibration;
- base building or general preparation;
- hypertrophy or powerbuilding;
- strength development;
- power or explosive development;
- event-specific strength or realization;
- pain-aware modified entry.

Do not force a well-trained and recently consistent athlete through a beginner or bridge cycle. Let that athlete begin directly in a strength, power, hypertrophy, or event-specific cycle when current evidence and goals support it. An experienced but detrained athlete may retain advanced skill while needing a short reacclimation phase.

Full model: [[Onboarding Training Status and Entry Cycle Placement]].

### Section 8: Initial Contract
Before producing the first program, show:
- what the app believes the goals are;
- primary strength anchors;
- priority muscles;
- available equipment;
- likely schedule and time limits;
- movement preferences and restrictions;
- how aggressive progression should begin;
- confidence and missing information.
- recommended entry route and why;
- what the first one to three productive sessions will verify;
- why lower or higher entry routes were not selected.

The user approves, corrects, makes more conservative, or asks to test a more aggressive placement before the first program is generated. Hard safety boundaries remain authoritative.

## Buttons and Interaction Principles
- Important actions should be visible buttons, not buried gestures.
- Every recommendation should have `Why?`, `Swap`, and `Adjust` controls.
- Every model belief should have `Correct This`.
- Time changes should be one tap.
- Exercise pain or discomfort should be recordable during the workout without abandoning it.
- Graph definitions should be one tap away.
- Dashboard cards should open into detail rather than crowding the home screen.
- The user can pin the metrics, lifts, muscles, and insights they care about most.

## Contextual Exercise Preference System

### Purpose

Exercise preference is a first-class athlete input, not a decorative star. The system must know both whether JB generally likes a movement and whether that movement fits the current training context. This prevents a competition-specific movement from being recommended year-round and prevents a disliked movement from repeatedly returning simply because it is technically eligible.

### Exact-Movement Preference States

Every canonical exercise can hold one global stated state:

- `Favorite`: actively promote among equally safe and useful candidates.
- `Prefer`: normally rank above neutral candidates.
- `Neutral`: no stated ranking effect.
- `Dislike`: retain in search and history but rank below suitable neutral or preferred options.
- `Do not recommend`: exclude from automatic programs and recommendation lists unless an explicit active context rule allows it or the athlete manually searches for and selects it.

These states attach to the immutable exercise ID, not its display name or aliases. Merging duplicate identities must reconcile the preference records explicitly rather than silently discarding either state.

### Separate Meanings

Preference, physical response, and eligibility remain different fields:

- preference answers `Do I want to do this?`;
- joint response answers `How does this exact movement tend to feel?`;
- an active pain or restriction state answers `Is this appropriate right now?`;
- equipment eligibility answers `Can I perform it here?`;
- programming context answers `Does it serve the current goal and role?`.

A movement can be a favorite that currently irritates a joint, a disliked movement that feels physically fine, or a do-not-recommend movement that remains searchable for historical review. Safety and active restrictions always outrank preference.

### Context Rule Model

An athlete may add one or more explicit rules to an exact movement. A rule stores:

- exercise ID;
- global state and in-context state;
- goal or sport, such as powerlifting, bodybuilding, general strength, or rehabilitation;
- plan route, block, or phase, such as base building, hypertrophy, strength, competition preparation, peak, or active rest;
- allowed exercise roles, such as protected primary, secondary builder, or accessory;
- optional equipment-location scope;
- optional fixed event and effective start or end dates;
- athlete-written reason;
- created, changed, and retired timestamps;
- rule version and source marked `athlete-stated`.

The app shows the active context beside the preference rather than silently changing a global button.

### JB Deadlift Example

The intended first personal rule is:

- `Sumo deadlift`: do not automatically recommend outside a declared powerlifting competition-preparation context. During that context, allow or prefer it as the competition-specific primary according to the active plan.
- `Conventional deadlift`: prefer outside sumo competition preparation when a general deadlift or strength hinge is needed and it satisfies the session purpose.
- `Stiff-leg deadlift`: prefer outside sumo competition preparation when a posterior-chain builder or hypertrophy hinge is needed and it satisfies the session purpose.

Conventional and stiff-leg deadlifts are not interchangeable. The engine must still respect their different roles, prescriptions, fatigue costs, and exact progression histories.

### Recommendation Order

The deterministic candidate pipeline applies preference in this order:

1. remove movements prohibited by pain, active restriction, or another safety boundary;
2. require exact equipment availability and executable setup;
3. preserve protected competition identity, session role, target muscle or weak point, and active plan purpose;
4. apply an explicit do-not-recommend state and any active context exception;
5. match the current goal, sport, block, phase, role, location, and date scope;
6. rank exact history, specificity, builder relationship, joint response, fatigue, time, and prior outcome;
7. promote favorite and prefer, retain neutral, and deprioritize dislike among otherwise suitable candidates;
8. show the strongest reasons, tradeoffs, and active preference rule on every recommendation card.

A disliked protected primary cannot be silently replaced. The app opens a plan-review decision explaining the conflict and lets the athlete change the active context, change the protected primary, temporarily override the preference, or keep the plan.

### Manual Choice and Learning Boundary

`Do not recommend` controls automatic output, not access to the athlete's own catalog. The movement remains searchable, its history remains intact, and the athlete may manually select it after seeing why it was suppressed. A temporary choice does not change the stored preference unless the athlete explicitly saves a change.

The app may separately observe swaps, skipped work, completion, target feel, enjoyment, joint response, and repeated outcomes. It cannot turn one skip, one replacement, or an irregular week into a dislike. Any later inferred preference must display its evidence, confidence, date range, and `Confirm`, `Not true`, and `Stop learning this` controls. Athlete-stated rules remain authoritative.

### Library and Recommendation Surfaces

Exercise Detail includes:

- the five-state global preference control;
- separate joint-response control;
- `Use only in certain training contexts` rule editor;
- active and future context badges;
- last preference change, reason, and undo;
- a preview of how the current rule affects recommendations.

Library filters include Favorites, Preferred, Neutral, Disliked, Do not recommend, and Context-specific. Recommendation cards label `Promoted by your preference`, `Lower because you dislike it`, `Hidden outside competition prep`, or `Included because the active competition plan requires specificity` where applicable.

### Current Implementation Boundary

Private alpha 0.31.0 already stores a boolean favorite and a separate five-state joint-response field. The Exercise Library exposes both controls. The substitution engine excludes joint `avoid`, raises candidates with good joint response, and adds favorite weight, especially when the athlete chooses a preference-based swap reason.

The alpha does not yet store prefer, dislike, or do-not-recommend states; contextual goal or phase rules; preference-event history; context badges; protected-primary preference review; or stated-versus-inferred preference evidence. Those are the next implementation slice defined by R-304 through R-311 and Build Bible Chapter 67.

## Data and Trust Guardrails
- Age, weight, sleep, pain, schedule, and training history are private athlete data.
- Distinguish user-stated preference from behavior-inferred preference.
- Do not infer enjoyment solely because an exercise appears often in a generated program.
- Do not label a body part neglected without comparing completed work with the current goal and planned dose.
- Do not claim that a secondary movement caused primary-lift improvement from a few observations.
- Show confidence and permit correction.
- Preserve old equipment and preference states so historical sessions remain understandable.

## First Build Boundary
A useful initial product can include:
1. Today with time selection and primary-secondary-accessory workout structure.
2. Progress with daily, weekly, monthly, yearly, and all-time volume plus strength-anchor and muscle-balance cards.
3. Library with equipment filters, favorite or avoid controls, joint response, and substitutions.
4. You with goals, equipment profiles, schedule, and editable app beliefs.
5. Explainable workout compression for 30-, 45-, and 60-minute sessions.

More advanced personal-transfer inference, behavior correlations, and deep insight cards should unlock only after enough data exists.

## Open Decisions
- Whether primary navigation uses five bottom tabs or a desktop sidebar plus mobile bottom bar.
- Which dashboard cards are visible by default.
- Whether the body map starts with regions or detailed individual muscles.
- How the app estimates actual setup and equipment-wait time.
- Minimum comparable evidence required before a secondary movement receives a positive transfer score.
- Whether onboarding imports previous training logs.
- Whether exercise demonstrations are original, licensed, linked, or user-recorded.
- Which time budgets ship in the first version.
- Initial body-part depth and which individual muscles deserve separate browse pages.
- Exact movement-type vocabulary and how rehabilitation or sport-specific patterns enter the catalog.
- Whether the Library home defaults to a body map, category cards, recent movements, or a personalized combination.
- Default sort order and the number of recommendation results shown before refinement.
- Which weak-point collections ship as system-curated hypotheses in the first catalog.

Related: [[Adaptive Strength and Hypertrophy App]], [[App Requirements Register]], [[Progression and Volume Model]], [[Methodology Synthesis and App Translation]], [[Lifelong Athlete Model and Adaptive Questioning]], [[Session Feedback and Learning Loop]], [[Conditional Schedule Adaptation and Missed Workout Game Plan]], [[Hierarchical Training Cycle and Goal Architecture]], [[Onboarding Training Status and Entry Cycle Placement]], [[Pixel Training Adventure Visual and Interaction System]]

## Private Alpha 0.10.0 Analytics Baseline

ForgePath now implements Today, rolling seven-day, rolling 28-day, calendar-month, calendar-quarter, calendar-year, and all-time completed-work windows. Calendar quarter begins on the first day of the current quarter and charts monthly points through today.

The exact-movement mix reports selected-period volume load, completed sets, repetitions, session count, last exposure, volume share, and set share. Volume share is explicitly not presented as hypertrophy stimulus, enjoyment, or cross-exercise quality.

Current priority regions show represented, outside-window, or no-history evidence. Each state uses completed primary-region sets, contributing exercises, and all-time last-exposure recency. The app does not call a region neglected until a later planned-dose model can compare intended and completed exposure honestly.

See [[Adaptive Strength and Hypertrophy App Build Bible#44. Private Alpha 0.10.0 Quarter and Movement-Mix Analytics]].

## Private Alpha 0.11.0 Catalog Governance Baseline

Exercise metadata can now improve without fragmenting progression history. A custom movement may change its canonical display name, family, movement type, primary body region, equipment list, setup description, and aliases while retaining the same immutable exercise ID. Completed-set names are not rewritten, so the athlete can still see what was originally logged at the time.

Built-in movements expose athlete-managed search aliases but protect the shipped name, family, pattern, body region, equipment, and description. This separates personal vocabulary from the canonical system taxonomy.

The editor checks the proposed canonical name and every proposed alias against all other active system and custom movements. It presents related candidates during editing and blocks an exact name or alias collision. Probable related variations may remain distinct and continue into the existing Data Quality review. The app never silently merges them.

Every catalog edit requires a short reason and appends a reversible event with before and after catalog snapshots, the affected source-set IDs, and a zero-volume consequence. Latest-change undo restores the exact prior catalog state. Backup schema version 10 validates this event type and migrates versions 1 through 9.

Still deferred: batch duplicate cleanup, explicit initial-create disambiguators, import mapping, orphan-alias review, family-fragmentation review, and synchronized conflict resolution.

See [[Adaptive Strength and Hypertrophy App Build Bible#45. Private Alpha 0.11.0 Auditable Exercise Catalog Editing]].

## Private Alpha 0.12.0 Connected Duplicate Cleanup

Exact duplicate warnings now create a real decision boundary. The athlete may use the existing movement immediately. To create a separate exact-match identity, the athlete must write at least ten characters explaining the meaningful setup or execution distinction. The explanation becomes the custom movement's initial distinction note.

Data Quality no longer repeats overlapping pairs as separate cleanup tasks. It treats probable-pair evidence as a graph and computes connected components. Each component becomes one group containing every active movement linked directly or indirectly by duplicate evidence. Retired identities never enter active groups.

One group review shows every connected identity, exact completed-set count, and alias count. The athlete selects the canonical identity to keep. Every other group member becomes a source in one existing multi-source merge event. The event preserves original names, histories, future-plan consequences, aliases, athlete anchors, and the exact undo snapshot.

This solves the common case where three accidental copies would otherwise require several pair merges and could leave an intermediate fragmented state. It does not create an automatic merge. The athlete still chooses the target and confirms the reason.

Still deferred: import-time mapping, orphaned alias review, incomplete taxonomy queues, bulk action across unrelated groups, and calibrated high-confidence thresholds beyond an exact match.

See [[Adaptive Strength and Hypertrophy App Build Bible#46. Private Alpha 0.12.0 Connected Duplicate Cleanup]].

## Private Alpha 0.13.0 Planned Dose Reconciliation

Progress now separates completed history from plan completion. Dated stored sessions establish intended set dose for the selected window. Only completed source sets linked to those exact session IDs count toward completion. Completed work with no stored plan remains visible in progress totals and is explicitly kept outside compliance.

The panel reports intended sets, linked completion, known planned volume, unknown planned-load sets, and unlinked completed sets and volume. Priority regions show planned and linked completed sets with `dose-v1` status. A below-plan result is descriptive execution evidence only. It does not declare neglect and does not create catch-up volume.

This is a primary-region set-dose slice. Individual-muscle and fractional-muscle dose, plan-revision provenance, historical catalog versions, import mapping, density, duration, quality, and automatic adaptation remain deferred.

See [[Adaptive Strength and Hypertrophy App Build Bible#47. Private Alpha 0.13.0 Planned Dose Reconciliation]].

## Private Alpha 0.14.0 Validated Training History Import

Library now provides an atomic completed-history CSV import. Required columns are date, exercise, load, and repetitions. RIR and source-session name are optional. Every row is validated before commit, source units are selected explicitly, and conversion into the active app unit is shown in the preview.

Only one exact active canonical name or alias may map automatically. Probable and unmatched source names require an athlete-selected canonical movement. Imported rows retain the original name, file, row, date, source unit, RIR missingness, batch, and occurrence-aware fingerprint. Two identical sets remain separate occurrences, while a repeat import skips existing occurrences.

Imported values remain numeric-only, count in completed progress, and stay separate from stored-plan compliance. The complete batch commits through one reversible ledger event.

See [[Adaptive Strength and Hypertrophy App Build Bible#48. Private Alpha 0.14.0 Validated Training History Import]].

## Private Alpha 0.15.0 Individual Muscle Dose Navigation

Progress now includes a separate `muscle-dose-v1` panel below planned-dose reconciliation. It inherits the active Day, Week, rolling 28-day, Month, Quarter, Year, or All time filter and offers All, Upper, Lower, Arms, and Trunk lenses.

The top layer reports completed source sets, mapped source sets, visibly unmapped sets, direct set-equivalents, and secondary set-equivalents. A second strip reports overlap-safe whole-body, upper-body, lower-body, arms, and trunk dose. These parent values are conserved by source-set ID and cannot be added to individual-muscle values.

Every one of the seventeen versioned leaf muscles remains visible, including zero-exposure rows. Each row shows:

- source-set count;
- latest exposure date;
- direct and secondary bar segments;
- direct, secondary, and total set-equivalents;
- tap-to-open provenance.

The provenance panel lists each contributing exercise, its latest date, source-set count, direct and secondary credit, and complete source-set identifiers. Identifiers are collapsed behind a bounded disclosure so the phone screen stays readable while the audit trail remains exact.

Unknown custom movements are never mapped by name. Their sets stay in completed volume, appear in the unmapped warning, and receive no muscle credit until a future athlete-reviewed mapping workflow exists.

The interface explicitly states that individual-muscle rows are non-additive and that set credit is a programming heuristic rather than measured activation, fatigue, recovery cost, or exact hypertrophy stimulus. Zero exposure is not labeled neglect and does not create catch-up volume.

See [[Adaptive Strength and Hypertrophy App Build Bible#49. Private Alpha 0.15.0 Individual and Fractional Muscle Dose]].

## Private Alpha 0.16.0 Custom Mapping and Planned Muscle Navigation

Custom movement creation and editing now offer an optional athlete-reviewed muscle map. The athlete chooses one direct muscle and up to eight distinct secondary muscles. The interface shows the selection count, blocks a ninth choice, records the review date and source, and never fills the mapping from a broad body-part field. Exercise Detail clearly distinguishes protected built-in mappings, reviewed custom mappings, and unmapped custom movements.

Every custom mapping edit requires a catalog-change reason, retains the stable movement ID, appears in the catalog ledger, validates in backup snapshots, and can be undone. Current completed and planned muscle views replay immediately after a mapping change.

Progress adds `Intended set credit versus linked completion` below completed muscle dose. It shares the All, Upper, Lower, Arms, and Trunk lens and shows:

- stored plans and intended source sets;
- mapped and unmapped planned sets;
- linked mapped completion;
- completed sets without a stored plan;
- planned direct and secondary credit per muscle;
- linked completed direct and secondary credit per muscle;
- completion rate, descriptive status, and source-link counts.

Interpretation copy states that set-equivalents are not tonnage or measured stimulus, that unlinked history remains valid, and that below-plan evidence does not create neglect or catch-up work.

See [[Adaptive Strength and Hypertrophy App Build Bible#50. Private Alpha 0.16.0 Athlete-Reviewed Muscle Mapping and Planned Muscle Dose]].

## Private Alpha 0.17.0 Equipment Profiles and Availability Navigation

You now contains a Training locations control surface. Each profile stores a stable name and type, exact available-equipment tags, short constraints, the load unit, and separate executable jumps for barbell, dumbbell, cable, machine, and other work. Commercial Gym, Home Gym, and Travel Setup are seeded, and athletes can add or customize profiles. The active profile controls the rest of the product.

Today names the active location and highlights every planned movement with missing requirements. Starting a conflicting session opens an explicit review rather than silently claiming the plan is executable. The athlete can cancel, edit the location, or enter the workout and resolve movements one at a time.

Workout disables input and incomplete-set logging for unavailable movements, lists the exact missing items, and opens a replacement list containing only candidates available at the active location. Library adds All equipment, Available here, and Missing equipment filters, plus exact availability in every card and detail view. Custom movement creation requires explicit equipment tags.

Availability remains exact and conservative. No profile name, exercise name, or similar-looking attachment creates an inferred match. This first slice protects completed history while making the current plan's constraints visible.

See [[Adaptive Strength and Hypertrophy App Build Bible#51. Private Alpha 0.17.0 Equipment Profiles and Executable Loads]].

## Private Alpha 0.25.1 Protected-Primary Exact-Lane Integrity

The educated replacement flow still requires explicit confirmation before changing a protected primary. When that confirmed change occurs during an active exact-movement placement check, the workout now cancels only the original movement's active check for the current placement and session.

The replacement keeps its own prescription, completed history, substitution ledger, outcome, and source-set provenance. The original movement remains substituted with a frozen progression clock and receives no replacement-derived placement evidence. The cancelled attempt consumes no retained exact-lane quota or sequence. Secondary, priority, maintenance, and optional replacements do not cancel the primary check.

Because active Workout renders outside the standard app shell, the cancellation is shown as a scoped accessible message at the top of the workout. It names the original movement lane and confirms that the replacement still earns its own training history. The rule uses no backend or AI call and changes no backup or local persistence version.

See [[Adaptive Strength and Hypertrophy App Build Bible#59.12 Private Alpha 0.25.1 Exact-Lane Substitution Integrity]].

## Private Alpha 0.26.0 Calendar and Exact Exposure Navigation

Progress now begins its irregular-schedule history experience with a linked-clock panel.

The Calendar axis provides a six-row month grid, month navigation, current-month return, selected-date detail, planned and completed markers, moved or stopped status, drift between a stored plan and actual completion, imported or unlinked activity, and exact sets, repetitions, volume, and contributing movement names. Empty dates are explicitly neutral and create no debt.

The Exposure order axis begins with exact movement buttons drawn from protected anchors and completed history. It renders one canonical exercise at a time, newest first, while preserving chronological sequence numbers, source-set counts, calendar-day gaps, heaviest load, repetitions, volume load, RIR, and quality evidence. Neighboring variations never fill an empty sequence.

The fixed-event strip distinguishes no event, unreadable or invalid dates, upcoming, today, and past. Only a valid athlete-authored ISO date produces a countdown. The panel is fully keyboard-addressable and horizontally contained at the 390 by 844 phone boundary.

See [[Adaptive Strength and Hypertrophy App Build Bible#60. Private Alpha 0.26.0 Linked Calendar and Exact Exposure History]].
