# Progression and Feedback Audit, 2026-08-13

Status: implemented and release-gated for ForgePath private alpha 0.57.0

## Outcome

ForgePath now treats progression as an athlete-approved proposal produced from the latest exact prescribed exposure, current readiness, and explicitly answered post-session feedback. The audit replaced permissive or ambiguous paths with `progression-v2` and `volume-progression-v2`. No recommendation mutates completed history, silently changes an open workout, or treats a skipped answer as a bad answer.

## Research Translation

The rules follow the public principles described by Renaissance Periodization while remaining an original implementation:

- RP describes small load increases when a movement is ready, with repetitions used when the available load increment is too large. ForgePath implements load first, then repetitions, then a narrowly gated set increase.
- RP describes set decisions as a combination of target-muscle stimulus or pump, performance, soreness or recovery, and fatigue. ForgePath requires compatible signals instead of letting one favorable answer overrule poor recovery.
- RP warns that temporary sleep or stress disruption should not be confused with reaching a true recoverability limit. ForgePath holds or confirms a target from current readiness and does not erase earned capacity from one hard day.
- RP describes deloads as fatigue-management tools. ForgePath presents them as proposals, prevents a deload from mathematically adding work, and never creates a deload from a missed zero-set round.

Primary public references:

- RP Strength Help Center, “How does the app determine when to add weight, reps, and sets?” https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets
- RP Strength, “Training Volume Landmarks for Muscle Growth” https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth
- RP Strength, “In Defense of Set Increases Within the Hypertrophy Mesocycle” https://rpstrength.com/blogs/articles/in-defense-of-set-increases-within-the-hypertrophy-mesocycle
- RP Strength Help Center, “Does the app automatically place deloads?” https://help.rpstrength.com/hc/en-us/articles/33510413024279-Does-the-app-automatically-place-deloads
- RP Strength, “Progressing for Hypertrophy” https://rpstrength.com/expert-advice/progressing-for-hypertrophy

These sources inform the model but do not establish that ForgePath reproduces RP Hypertrophy’s proprietary algorithm.

## Decision Order

1. Pain or a return from a long gap blocks overload and routes to reduction, substitution, or reacclimation.
2. A protected-readiness day holds the target. It cannot add repetitions as a side effect.
3. The latest prescribed exposure must own every current target set. Older sets cannot fill gaps in an incomplete latest workout.
4. Harder-than-expected, maximal-difficulty, excessive-fatigue, low-technique, or near-failure evidence holds the target.
5. At the top of the rep range, a load increase is proposed only when the smallest available increment is no more than ten percent of the current target and effort supports it.
6. Below the top of the range, one repetition is the next proposal when effort supports it.
7. One set is considered only when repetitions are already capped, the available load jump is too large, at least three comparable prescribed exposures exist, readiness and continuity are stable, stimulus is low, fatigue is manageable, and between-session recovery finished early.
8. Otherwise the target holds and the interface names the missing evidence.

The ten-percent load-increment boundary is a ForgePath private-alpha heuristic, not an RP physiological law. It is versioned so longitudinal decisions remain explainable and can be recalibrated from athlete evidence.

## Muscle-Volume Order

1. Pain, declining comparable performance under fatigue, and poor between-session recovery outrank all volume landmarks.
2. Missing feedback never becomes zero pain, good recovery, or poor technique.
3. Performance compares only the same canonical movement and recorded setup, including incline angle.
4. Athlete-added sets and reduced-load technique blocks count as completed dose but do not automatically earn progression.
5. Conflicting pump and target-stimulus answers hold volume.
6. Falling below a provisional minimum-effective landmark does not force more work. An increase still requires preserved comparable performance and early recovery.
7. A one- or two-set increase requires aligned low-to-moderate stimulus, manageable fatigue, early recovery, and known non-declining performance.
8. Deload and pain proposals are monotonic reductions. They can never increase the current set count.

## Defects Corrected

- The set-progression branch was unreachable under the prior ordering.
- The latest incomplete workout could borrow prescribed sets from older sessions.
- Skipped technique and pain answers were stored as zeros and interpreted as negative evidence.
- Unknown RIR could be interpreted as failure-level effort.
- Athlete-added work could help earn automatic overload.
- Very large equipment increments could be proposed without a relative-size guard.
- Post-session difficulty and fatigue were not connected to load or repetition progression.
- Protected readiness could still add repetitions.
- Cycle review could treat unknown pain as no pain.
- Three sessions in one round could be displayed as three training rounds.
- Muscle performance could compare different exercises or incline angles.
- Conflicting stimulus answers could still add sets.
- Sets could be added without explicit between-session recovery.
- Low landmark counts could override poor recovery or declining performance.
- Pain reduction and deload math could increase a low current set count.
- A missed final round could manufacture a deload.
- The duration question rendered one button per minute instead of a usable numeric input.

## Authority and Learning Boundary

Recommendations are suggestions. The athlete must approve a future training-round or training-block change. Completed history is immutable except through an explicit correction workflow. Free-text notes remain recall context and do not authorize programming changes. Unknown answers lower confidence only. Known pain at the conservative cycle threshold disables the continue-progress choice while leaving recovery and hold choices available.

## Verification Matrix

Deterministic tests cover fresh baselines, incomplete latest sessions, athlete-added-only work, unknown RIR, skipped quality, load-first progression, oversized increments, repetition fallback, the recovered set gate, hard-session holds, readiness holds, pain gates, exact setup isolation, conflicting feedback, poor recovery below landmarks, decline below landmarks, monotonic reduction and deload, zero-set final rounds, and pain-aware cycle eligibility.

Browser acceptance covers full, quick, minimal, and skipped feedback; independent question skipping; the between-session recovery item; a numeric actual-duration field; athlete approval language; desktop and 390-by-844 phone layouts; console errors; and cloud/public artifact boundaries.

## Honest Limitations

- Volume landmarks are provisional coaching priors, not measured individual physiology.
- The engine uses deterministic categorical confidence, not a validated probability of success.
- Recovery remains self-reported and is not inferred from a wearable.
- The first private athlete still needs longitudinal use to calibrate thresholds against real outcomes.
- Real invited-athlete phone-to-laptop acceptance, active-workout handoff, and automatic normalized entity merge remain separate release gates.
