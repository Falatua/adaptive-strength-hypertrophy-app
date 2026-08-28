# RP Hypertrophy Intra-Workout Feedback Research, 2026-08-27

Status: researched and translated into ForgePath private alpha 0.76.0

## Research Question

How does the current RP Hypertrophy App collect intra-workout and post-workout feedback, how does that feedback affect load, repetitions, and sets, and which parts should ForgePath adopt without copying RP's interface or claiming access to its proprietary algorithm?

The public official sources consistently describe RP Hypertrophy as the current training app from RP Strength. They do not establish a separate current product named the RP Strength app with a separately documented feedback algorithm. This audit therefore treats RP Strength as the company and RP Hypertrophy as the researched app.

## Direct Screen Evidence

The two athlete-supplied screenshots show a dark full-screen feedback sheet inside an active workout. They are evidence of product behavior, not implementation instructions.

Observed question and answer structures:

- Joint pain during the named exercise: none, low, moderate, or a lot.
- Pump for the target muscle: low, moderate, or amazing.
- Hard-set volume for the target muscle: not enough, just right, pushed my limits, or too much.
- Soreness from the prior target-muscle exposure: never got sore, healed a while ago, healed just on time, or still sore.

The screenshots combine an exact exercise prompt for joint pain with muscle-group prompts for pump, volume, and soreness. They do not show the internal decision weights, nor do they prove that every question appears after every individual exercise.

## What RP Publicly Documents

### Timing and scope

RP's official help center says the app asks how the athlete is handling volume after the work for each muscle group. RP's official educational videos say soreness is answered when that muscle is trained again, not immediately after the prior workout, and pump and workload are assessed at the end of that muscle group's work. This matches the supplied screens.

This is an important distinction. RP's documented trigger is muscle-group completion. ForgePath's requested trigger is exact-movement completion. The ForgePath implementation is therefore a deliberate product adaptation, not a claim of identical behavior.

### Load and repetition progression

RP's help center says the app normally raises weight by a small percentage from week to week. When the available equipment jump would be too large, it adds repetitions instead. Actual completed performance remains an input. The public explanation does not disclose a complete numerical decision tree.

### Set progression

RP publicly describes set changes as a combined judgement from pump, soreness or recovery, and workload:

- Low stimulus, early recovery, and room for more work can support additional sets.
- A good pump, recovery on time, or reaching a useful limit supports holding sets.
- An amazing pump, still being sore, or too much workload can support fewer sets.
- `Pushed my limits` is described as a hard stop on adding sets in the following week.
- The athlete may manually add or remove sets rather than being locked into the suggestion.

The system is not simple linear progression in the sense of adding weight every workout regardless of response. It is a constrained progression loop: completed performance advances load or repetitions, while local stimulus, fatigue, and recovery regulate set dose.

### Underperformance and deloads

RP's official help center says underperformance flags can recommend easier training, while allowing the athlete to continue when the context is understood. The app also automatically places a deload at the end of a planned cycle. These are fatigue-management boundaries around progression, not evidence that every difficult exposure should be advanced.

### Post-workout details

The official sources provide strong detail on feedback captured during muscle-group completion. They do not publicly document a complete, current, separate final-workout survey with every question and internal weight. Claims about a proprietary post-workout battery beyond the supplied screens would therefore be speculation.

ForgePath already collects broader whole-session feedback at workout completion, including difficulty, comparison with expectation, end fatigue, recovery, time fit, productivity, enjoyment, actual duration, and per-muscle stimulus or pump. The correct enhancement is to add a local movement layer and retain the broader session layer, rather than replacing known ForgePath evidence with an undocumented RP assumption.

## ForgePath Translation

### Trigger and interaction

After the final set of each exact movement is logged, an inline optional panel opens beneath that movement. It scrolls into view but does not block the athlete from continuing. Saved feedback remains editable, and added work makes the saved response visibly stale.

### Questions

1. Joint response: no irritation, noticeable without changing work, changed how I trained, or stopped.
2. Technique: broke down, mostly consistent, or solid throughout.
3. Target stimulus: barely felt it, moderate, or strong.
4. Load and repetitions: too light, on target, or too heavy.
5. Hard-set volume: could do more, just right, at my limit, or too much.
6. Recovery from last exact exposure: never got sore, recovered early, just recovered, or still sore. This appears only when prior exact history exists.

Technique and load fit are purposeful ForgePath additions. Pump alone can be exercise- and athlete-dependent, while a direct load-fit answer is needed to distinguish an underloaded target from a movement that delivered little local sensation.

### Decision order

| Evidence | Future suggestion consequence |
| --- | --- |
| Pain changed training or caused a stop | Block overload, pause added volume, and support a lighter target or movement review |
| Load too heavy or technique broke down | Hold load and repetition progression until the target is owned |
| Volume too much | Support a one-set reduction, bounded by the movement's maintenance floor |
| Volume at my limit | Hard-cap any set increase |
| Volume just right | Hold set count while load or repetition progression may continue |
| Could do more | Support an added-set proposal only if comparable performance and later recovery agree |
| Strong stimulus or incomplete recovery | Hold set volume rather than buying more fatigue |
| Low stimulus, early recovery, preserved performance | May support more dose after higher-priority load and repetition options are exhausted |

Completed load, repetitions, RIR, technique, and source-set truth remain the primary evidence. One subjective answer never independently earns more work.

### Provenance and authority

Every movement response stores the exact session, planned movement, canonical exercise, completed planned-set IDs, and common recorded bench angle when one exists. Exact-movement feedback overrides broad session feedback only for that lane. Missing or skipped answers remain unknown. Free text is context only.

No response edits today's work or silently changes a future plan. The panel previews the likely consequence before save, and every later program adjustment remains an athlete-approved proposal.

## Primary Sources

- RP Strength Help Center, [How does the app determine when to add weight, reps, and sets?](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)
- RP Strength Help Center, [Why is the app giving me so many sets? Long workouts](https://help.rpstrength.com/hc/en-us/articles/32600133107863-Why-is-the-app-giving-me-so-many-sets-Long-Workouts)
- RP Strength Help Center, [If I get a flag for underperformance, what do I do?](https://help.rpstrength.com/hc/en-us/articles/32435171890967-If-I-get-a-flag-for-underperformance-what-do-I-do)
- RP Strength Help Center, [Does the app automatically place deloads?](https://help.rpstrength.com/hc/en-us/articles/33510413024279-Does-the-app-automatically-place-deloads)
- RP Strength, [RP Hypertrophy App](https://rpstrength.com/pages/hypertrophy-app)
- RP Strength, [Training Volume Landmarks for Muscle Growth](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- RP Strength, [Progressing for Hypertrophy](https://rpstrength.com/blogs/articles/progressing-for-hypertrophy)
- RP Strength, [In Defense of Set Increases Within the Hypertrophy Mesocycle](https://rpstrength.com/blogs/articles/in-defense-of-set-increases-within-the-hypertrophy-mesocycle)
- Renaissance Periodization, [How Much Pump And Soreness Is Best For Growth?](https://www.youtube.com/watch?v=vKX0hFenKxM)
- Renaissance Periodization, [How Much Volume Is Right FOR YOU](https://www.youtube.com/watch?v=7JPARzebDhw)
- Apple App Store, [RP Hypertrophy](https://apps.apple.com/us/app/rp-hypertrophy/id1555614554)

## Honest Limits

- RP's complete production algorithm is proprietary and was not reverse-engineered.
- Public sources describe muscle-group completion more clearly than a separate final-workout survey.
- Pump, soreness, and perceived workload are subjective and should be interpreted with performance, safety, and recovery.
- ForgePath thresholds are versioned product heuristics that need longitudinal athlete calibration.
