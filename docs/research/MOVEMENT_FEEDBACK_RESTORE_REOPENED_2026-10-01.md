# Reopened movement-feedback cloud-load incident, 2026-10-01

The user reports the same blocking error after the 0.84.1 release. The live source marker still matches `0fcf73f7a18986654e9f2b563633ae8fa7e95c72`. Whether the phone installed that version is not yet confirmed. The actual account snapshot has not been inspected because the Supabase management login has expired. The user was asked to finish the Supabase GitHub sign-in in Chrome. Do not describe the account as repaired based on synthetic tests.

A second real store-action reproduction saves movement feedback, substitutes the exercise occupying that workout slot, and restores through `parseCloudSnapshotRow`. The current release rejects the feedback with the exact reported provenance error, although the substitution ledger retains its original prescription.

The prepared correction accepts only an exact original prescription with the same session, planned slot, exercise, and complete source-set membership, recorded no earlier than the feedback. It neither combines source snapshots nor changes the feedback. Forged identity, missing sets, and invalid chronology remain rejected. Feedback selection now also requires the canonical exercise identity, so a reused slot cannot apply the original movement's answers to its replacement.

Validation: six focused suites passed before the expanded adversarial tests. The full run passed 593 of 595 tests with two PlanScreen timeouts; all five PlanScreen tests passed in the isolated rerun. Boundary checks, lint, TypeScript, and production build passed. No schema change, backend write, account reset, or deletion was performed. Browser release gates and actual-snapshot validation remain pending. This branch is a prepared repair, not a verified resolution of the user's account.

## Actual snapshot verification, 2026-10-06

Authenticated read-only inspection confirmed the affected account's snapshot still contains feedback for an incline barbell press from September 2, followed by a September 22 substitution to incline dumbbell press in the same planned slot. All three original feedback source sets remain in the exact substitution prescription. The deployed validator rejects this original snapshot with the reported error; the repaired cloud parser accepts it unchanged. Private local verification asserts exact equality for all surveys, completed history, and substitution events. The original snapshot was preserved locally and is excluded from source control. No database write, reset, or deletion is needed. Release 0.84.2 carries the correction; hosted release checks are required before claiming it live.

## October 6 follow-up: exhausted workout queue

The additional actual-snapshot workout journey found that Today fell back to sessions[0] when no active, planned, or deferred sessions remained. The affected snapshot contains only completed and expired sessions, so Start reopened a completed workout with Done sets. Release 0.84.3 removes that fallback, shows a Plan my next workouts action, and rejects start/readiness writes to terminal or missing sessions. Existing plan review creates the next round with fresh identifiers and explicit athlete choice.

Private local verification on desktop Chromium, mobile Chromium, and mobile WebKit follows actual snapshot restore, reload, plan review, next-round creation, start, set entry, Log set, reload, backup creation, and cloud-row parsing. It asserts every original session, history entry, survey, and substitution is preserved. No synthetic training was written to the real cloud account. Sanitized store and browser regressions are committed; the private fixture and tests remain outside the repository. Physical phone acceptance remains pending.
