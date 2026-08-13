# Longitudinal Product Simulation Audit

Date: 2026-08-13  
Status: implemented and release-gated for ForgePath private alpha 0.58.0  
Scope: 52-week progression replay, irregular-life recovery, volume and safety decisions, analytics conservation, backup integrity, browser rendering, and production Supabase rollback acceptance

## Outcome

ForgePath now has an executable long-term acceptance model rather than a collection of one-session examples. The deterministic replay runs 52 exact weekly bench exposures through the production progression engine, adds occasional athlete-chosen work, stores post-session recovery feedback, and advances targets only through the current `progression-v2` hierarchy. Separate paths cover three missed weeks, reacclimation, fatigue, pain, missing feedback, a 30-degree to 45-degree incline change, an incomplete training round, and a conservative recovery round.

The stable replay produced 52 decisions in the expected repeating pattern: repetitions, repetitions, load. Seventeen load increases were earned, no set increase was invented, and the next target moved from 175 lb for four repetitions to 260 lb for five repetitions while remaining at four prescribed sets. Athlete-added sets remained visible as dose but never appeared in the evidence that earned a progression.

The production Supabase acceptance stored a synthetic 52-week payload containing 156 sessions and 624 completed sets. The 74,375-byte JSON document was applied once, accepted as an idempotent replay, preserved as the current copy when a stale write conflicted, and hidden from a second authenticated identity. The entire test ended with `rollback`. A separate production query then confirmed zero reserved test users, profiles, devices, events, conflicts, and snapshots.

## Defects Revealed and Corrected

### Recovery confidence could never mature from ordinary feedback

Before this audit, the recovery-response lane could reach only four of five evidence dimensions from post-session answers. It required two separate placement-verification recovery checks to become well calibrated, even after months of explicit recovery answers. The corrected lane counts only surveys that actually answer a recovery question, permits four repeated recovery answers to establish the lane, and leaves surveys without recovery information unknown.

### Stable attendance could never fully calibrate schedule fit

Before this audit, one schedule-fit evidence point required a recorded missed opportunity. A perfectly consistent athlete therefore remained capped below well calibrated. The corrected lane accepts either a constraint-aware missed-opportunity record or six resolved opportunities as evidence that the schedule fits. Disruption remains informative without being rewarded.

### Optional undefined fields could invalidate an exported backup

The checksum previously included object properties whose value was explicitly `undefined`, but JSON transport removes those properties. A backup could therefore fail its own integrity check after serialization. Checksum canonicalization now omits undefined object properties, matching the exported JSON and Supabase snapshot transport. A regression test covers the exact failure.

## Long-Term Invariants

1. Completed history is append-only during recommendation calculation.
2. Movement progression cites only the latest exact prescribed exposure.
3. Athlete-added work counts as completed dose but cannot earn automatic overload.
4. Load is earned at the top of the repetition range, repetitions fill the range first, and a set is available only when load and repetitions are unavailable and recovery evidence supports dose.
5. Missed work never becomes catch-up volume. Only the unfinished future queue may be rebuilt.
6. Returning athletes keep prior records while current prescriptions reacclimate.
7. Missing effort, quality, stimulus, fatigue, or recovery information remains unknown.
8. Pain blocks overload and produces a reduction, substitution, or recovery suggestion.
9. Exercise and recorded setup identity stay exact. A 45-degree incline exposure cannot prove progress over a 30-degree exposure.
10. Deload, volume, frequency, and block changes remain recommendations requiring athlete approval.
11. Daily, weekly, monthly, yearly, and all-time views must conserve the same completed set volume.
12. Records remain source-backed and deterministically reproducible.
13. Backup export, JSON serialization, parse, and restore must preserve the same athlete state and checksum.
14. Cloud replay must be idempotent, stale conflicts must not overwrite current data, and Row Level Security must isolate athletes.
15. Synthetic cloud acceptance must finish with an independent zero-residue proof.

## Executable Evidence

- `src/domain/longitudinal-athlete-simulation.test.ts`: five longitudinal scenarios covering 52-week progression, life interruption, safety and volume, criterion-based cycles, analytics, records, confidence, backup, and deterministic replay.
- `src/domain/ongoing-confidence-engine.test.ts`: explicit recovery-answer maturity, non-recovery unknown semantics, and stable schedule-fit maturity.
- `src/domain/backup.test.ts`: JSON-canonical optional-field checksum regression.
- `tests/e2e/longitudinal-use.spec.ts`: desktop and phone rendering of 208 completed sets across 52 active days and 223,460 lb of volume load.
- `supabase/audits/forgepath_transactional_sync_test.sql`: production 52-week snapshot transport, idempotence, conflict preservation, cross-athlete isolation, and rollback.

## Honest Boundary

This proves deterministic rules, a year-scale local state, browser usability, whole-snapshot production transport, Row Level Security, replay, conflict preservation, and cleanup. It does not prove automatic entity-level merge, background multi-device synchronization, active-workout phone-to-laptop handoff, or a real invited athlete’s new-device recovery. Those remain separate acceptance gates requiring real account and physical-device evidence.
