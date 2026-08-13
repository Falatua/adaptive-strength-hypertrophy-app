# Life-Aware Planning and Ongoing Calibration Research

Status: product research and implementation contract for ForgePath private alpha 0.56.0

Date: 2026-08-13

Confidence: mixed. High for broad principles, moderate or low for universal numeric thresholds.

## Executive conclusion

ForgePath should not infer lost fitness from a missed calendar day, assign a fixed percentage reduction from one readiness answer, or present one global confidence score. The evidence supports a more careful system:

1. Completed training is the adaptation evidence. Planned but unfinished work is schedule evidence.
2. External schedule disruption, acute readiness, pain or illness, and a long return gap are different states and require different decisions.
3. Training frequency can often be redistributed when volume is equated, which supports rolling opportunities and shorter sessions when real life changes.
4. Autoregulation is useful as a bounded adjustment method, but it does not justify a black-box daily score or automatic plan rewrite.
5. Subjective monitoring can be sensitive, while objective and subjective measures may disagree. ForgePath should use both and preserve the disagreement.
6. Detraining and return responses vary too much for a universal `days missed = percent lost` equation. Old performance becomes less current, not false.
7. Confidence should be attached to a specific decision and its sources: exact-lift prescription, schedule fit, recovery response, and volume tolerance.

## Evidence synthesis

### Productive dose and the no-debt rule

A resistance-training prescription only causes adaptation when work is performed. Research on minimum effective dose shows that relatively small but completed doses can still produce meaningful strength gains, although the evidence is narrow and the gains may be suboptimal. This supports preserving a short, high-priority session instead of abandoning a constrained day or compensating later with every missed set.

Volume and training frequency should not be treated as interchangeable moral scores. Meta-analyses suggest higher frequency does not independently create clearly greater hypertrophy or strength when volume is equated. Frequency remains useful for distributing work, skill practice, fatigue, and session length. For ForgePath, that means a two-session week is not automatically inferior if it is the sustainable container for the required work.

Product rule: unfinished volume is not owed. The engine may preserve a priority exposure at a recoverable dose, but it may not copy all missed sets forward.

### Autoregulation and readiness

Systematic reviews of autoregulated resistance training find RIR, RPE, APRE, and velocity-based approaches can perform similarly to or sometimes better than fixed percentage prescriptions. The evidence is not strong enough to make one method universally superior. The useful product interpretation is bounded adjustment: use current evidence to confirm, hold, trim, or cautiously progress a session while preserving its purpose.

Subjective wellness measures are often sensitive to training stress, but they do not consistently correlate with common objective measures. A poor sleep or stress answer should therefore increase monitoring and uncertainty, not automatically reduce load. Warm-up and work-set performance can confirm or contradict the pre-session prior.

Sleep-loss meta-analysis reports an average performance effect across heterogeneous studies, not a reliable personal penalty. ForgePath must not convert a sleep answer into an automatic percentage reduction. Repeated personal evidence plus performance change can justify a stronger future proposal.

Product rule: no single non-safety survey answer controls the session. Pain remains a separate safety boundary. Skipped answers remain unknown.

### Missed sessions, gaps, and return to training

Detraining evidence is heterogeneous by age, training status, measure, and interruption length. Some strength can persist through long interruptions, and retraining can restore performance faster than first acquisition, but precise universal decay timelines are not well supported.

Product rule: ForgePath uses a re-entry confirmation when exact performance is stale. It does not erase long-term training age, demote an experienced athlete to novice, or prescribe a fixed regression based only on elapsed days.

### RIR and measurement quality

RIR estimates tend to become more accurate closer to failure and under heavier or lower-repetition conditions, but accuracy varies. Training experience alone does not guarantee accurate estimation. Estimated 1RM and load-velocity models also depend on the exercise, load range, method, and device.

Product rule: RIR is useful evidence, not ground truth. Confidence increases through repeated comparable exposures, complete effort and quality feedback, recency, and context match. Exact exercise and recorded setup remain the comparison identity.

### Individual baselines and meaningful change

Sports-monitoring frameworks emphasize individual baselines, normal variability, context, and measurement error. A change must be large enough to distinguish signal from typical variation before a system should claim it learned a stable relationship.

Product rule: early ForgePath confidence is categorical and source-backed, not a fake probability. Stable patterns require repeated observations. Contradictions create an explicit learning need rather than being averaged away.

## Life-Aware engine contract

### Separate interruption types

| Interruption | Examples | What ForgePath may infer | Default response |
| --- | --- | --- | --- |
| External schedule | children, work, travel, time | The original calendar no longer fits | Move, reorder, compress, or expire open work |
| Equipment/context | location or equipment changed | Some movements are not executable | Substitute or choose another eligible priority |
| Readiness uncertainty | poor sleep, stress, low energy | Today may require more confirmation | Confirm at warm-up or first work set; trim optional fatigue if several signals agree |
| Health/safety | pain or illness | Ordinary overload may be inappropriate | Review movement safety or use a recovery and return path |
| Stale exact exposure | long gap without comparable work | Old capacity is less current | Use a non-maximal re-entry confirmation |

An external interruption does not establish lost fitness. A health interruption is not merely a scheduling problem. The model must store which kind of evidence caused the decision.

### Three decision horizons

#### Today

Allowed outputs:

- proceed;
- confirm at warm-up or first work set;
- rebuild around the next executable priority;
- use a re-entry exposure;
- pause automatic programming for pain or safety review.

#### Current training round

Allowed outputs:

- continue;
- extend the round beyond seven calendar days;
- hold untouched progression targets;
- rebuild the open sequence;
- offer a recovery or return round.

The round advances from completed qualified exposures, not because Sunday passed.

#### Training-block review

Allowed proposals:

- keep the plan;
- reduce required weekly frequency;
- shorten required session duration and retain optional extra work;
- reduce baseline volume;
- slow progression cadence;
- change movement selection or location assumptions;
- use a recovery or return block.

All block changes require athlete approval and create a new future plan version. History remains immutable.

### Plan-fit evidence

The first implementation exposes these 28-day facts:

- planned opportunities;
- productive opportunities, defined as completed or primary-completed partial sessions;
- recorded missed opportunities;
- opportunity completion rate among resolved opportunities;
- planned set count;
- completed linked sets;
- completed unlinked sets, kept outside compliance;
- protected main-lift coverage;
- lower-priority sets intentionally not carried into the latest rebuilt session.

These are planning facts, not an adherence grade. A low completion rate proposes a schedule-fit conversation only after repeated evidence. It never creates punishment or catch-up work.

### Repeated-pattern decision examples

- One family interruption, constraint ended: extend or move one opportunity; keep the block.
- Two or more recent misses, constraint continuing: rebuild the open queue; do not progress missed exact lifts.
- Time is the majority reason: propose shorter required sessions at block review.
- Productive opportunities repeatedly fall below two-thirds of resolved opportunities: propose fewer required opportunities, subject to athlete approval.
- Optional sets are repeatedly removed: review baseline volume, but never call the removed sets debt.
- Pain continues: review what can be trained and route to an athlete-controlled recovery decision. Do not imply diagnosis or clearance.

These initial thresholds are product heuristics, not physiological laws. Store the rule version and refine them only from ForgePath validation and athlete feedback.

## Ongoing confidence model contract

### Confidence belongs to a decision

ForgePath maintains four first-class confidence lanes:

1. **Main-lift targets:** exact completed history for each protected movement.
2. **Schedule fit:** resolved opportunities, interruptions, actual duration, and athlete-stated constraints.
3. **Recovery response:** post-session feedback and next-day or next-opportunity recovery.
4. **Volume tolerance:** completed dose paired with muscle or session stimulus, fatigue, performance, and recovery.

The lanes may disagree. ForgePath can know bench targets well while knowing little about current schedule capacity or hypertrophy volume tolerance.

### Calibration states

| State | Meaning | Programming behavior |
| --- | --- | --- |
| Uncalibrated | No usable personal source evidence | Establish a non-maximal baseline; do not borrow from a neighbor movement |
| Early evidence | One starting observation or incomplete sources | Use broad targets and ask for one high-value confirmation |
| Developing | Repeated evidence exists but is not yet complete or broad | Make bounded proposals and show what remains uncertain |
| Well calibrated | Repeated, recent, sufficiently complete exact evidence | Use narrower recommendations while continuing to verify |
| Stale | Useful history exists outside the current evidence window | Preserve history; require a current re-entry confirmation |

`Well calibrated` does not mean permanently known. Goal, equipment, exercise setup, pain, schedule, or continuity changes can trigger a focused refresh.

### Exact main-lift evidence

For each protected movement, the first implementation uses:

- exact exercise identity;
- completed set count;
- distinct training dates;
- recency inside a 42-day review window;
- RIR coverage;
- technique and joint-quality confirmation coverage;
- dates containing progression-comparable straight, paired, top, or activation work;
- recorded bench-angle contexts where applicable;
- exact source-set IDs.

The five visible evidence marks are ordinal evidence strength, not a probability. They are earned by: any exact evidence, evidence on at least two dates, evidence on at least four dates, at least 70% effort and quality coverage, and a current exact exposure. These thresholds are transparent product heuristics and must remain versioned.

### Active learning

Each lane returns one `Learn next` request. The app should ask the smallest optional question or observe the smallest useful exposure that most reduces uncertainty. Examples:

- complete one non-maximal working exposure;
- repeat one comparable exposure on another date;
- record RIR on the next working sets;
- confirm technique and joint response;
- answer one post-session recovery check;
- pair completed volume with stimulus and fatigue feedback;
- record a time constraint when the plan changes.

The question is optional. Skipping it does not lower readiness, motivation, recovery, or adherence.

### Contradiction policy

- Poor survey, normal performance: proceed with monitoring; do not manufacture a regression.
- Normal survey, poor performance: hold or protect today and investigate.
- Athlete says recommendation was too easy and completed work supports it: test the next load-first progression.
- Athlete says it was too hard but numeric performance looks normal: keep both sources; ask whether technique, pain, or recovery explains the conflict.
- Old strong history, current re-entry underperforms: preserve the old achievement while updating current confidence.

The explanation should state both sources. Do not hide disagreement inside an average.

## What must remain deterministic

- completed-set truth;
- exact movement and setup identity;
- date windows and source IDs;
- no-volume-debt enforcement;
- session eligibility by equipment and pain boundary;
- future-only plan mutation;
- athlete approval gates;
- calibration state and evidence-mark calculation;
- backup and replay validation.

An optional language model may summarize evidence or draft an explanation. It may not invent evidence, diagnose injury, silently alter programming, or override a deterministic safety and approval boundary.

## Validation agenda

The next private-alpha studies should test:

1. Whether athletes correctly understand the difference between a moved priority exposure and catch-up volume.
2. Whether the three-horizon explanation reduces confusion after missed workouts.
3. Whether separate confidence lanes are more trustworthy than a single score.
4. Whether `Learn next` questions are useful enough to justify their burden.
5. Whether 42 days and the 2-date/4-date evidence thresholds match observed return and prediction error.
6. Whether schedule proposals correctly distinguish time pressure from recovery trouble.
7. Whether warm-up and first-set confirmation improves decisions after poor sleep or stress.
8. Whether movement setup changes, including incline angle, require a narrower context refresh.

## Primary and scholarly sources

- Androulakis-Korakakis et al. Minimum effective training dose for strength in trained men. [PubMed](https://pubmed.ncbi.nlm.nih.gov/31797219/)
- Currier et al. Resistance-training prescription network meta-analysis for strength and hypertrophy. [PubMed](https://pubmed.ncbi.nlm.nih.gov/37414459/)
- Greig et al. Autoregulation of resistance-training load and volume systematic review and meta-analysis. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35038063/)
- Jones et al. Autoregulatory versus fixed loading systematic review and meta-analysis. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33776802/)
- Saw et al. Subjective self-reported athlete well-being systematic review. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26423706/)
- Grgic et al. Resistance-training frequency and hypertrophy review. [PubMed](https://pubmed.ncbi.nlm.nih.gov/30236847/)
- Ralston et al. Weekly frequency and strength meta-analysis. [PubMed](https://pubmed.ncbi.nlm.nih.gov/30076500/)
- Carvalho and McGuigan. Training-frequency applications and microdosing in trained populations. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33886099/)
- Knowles et al. Flexible and autoregulated resistance training review. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7810043/)
- Trabelsi et al. Detraining effects on muscle size in older adults. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36360927/)
- Coratella et al. Strength and power retention and retraining after interruption. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32017951/)
- Craven et al. Recovery from resistance exercise within a microcycle. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38689583/)
- Knowles et al. Acute sleep loss and physical performance meta-analysis. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35708888/)
- Stults-Kolehmainen and Bartholomew. Psychological stress and muscular recovery. [PubMed](https://pubmed.ncbi.nlm.nih.gov/22688829/)
- Emanuel et al. RIR accuracy in trained men and women. [PubMed](https://pubmed.ncbi.nlm.nih.gov/37967832/)
- Halperin et al. RIR estimation accuracy and factors that influence it. [PubMed](https://pubmed.ncbi.nlm.nih.gov/37036795/)
- Hughes et al. RIR reliability at heavy loads. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33337690/)
- García-Ramos et al. Load-velocity prediction systematic review. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36301878/)
- Grgic et al. Resistance training to failure versus non-failure meta-analysis. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33555822/)
- Kassiano et al. Exercise variation systematic review. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35438660/)

## Evidence limitations

- Many resistance-training studies are short and use small samples.
- Trained, untrained, older, and clinical populations cannot be freely combined.
- A group-average effect is not a personal decision threshold.
- Observational monitoring associations do not establish injury prediction.
- The ForgePath 28-day plan-fit window, 42-day confidence window, 70% completeness gate, and repeated-pattern thresholds are transparent product heuristics that require private-alpha validation.
