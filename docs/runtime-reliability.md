# Runtime reliability — 1.0.81

This release fixes the six code/test findings from the 4 September 2026 review. It does not redesign the interface or change workout programming, pack originals, storage keys, or the service-worker update policy.

## Result integrity

- Basic and structured sequence workouts log only completed sets. Merely showing or editing a live set creates a draft, not a completion. Skipping an exercise preserves earlier completed sets and excludes its remaining manual/timed sets. Skipped blocks stay excluded. A workout with no recordable work does not offer a fabricated session log.
- AMRAP/EMOM and grouped density blocks retain their existing prescription-and-score summaries. AMRAP completed rounds remain user-confirmed. Mixed, ungrouped for-time blocks retain completed set repetition counts rather than multiplying every exercise by the planned number of rounds.
- Historical fallback weights are converted from the previous session's unit into the current session's unit. Current-session and prescribed weights retain their existing precedence.
- History writes succeed only after IndexedDB or localStorage actually saves the session. A total storage failure keeps the session review and its values open for retry; history import reports a failure instead of counting an unwritten session as imported. Session writes store the validated representation.
- The session completion time is captured when the workout finishes, rather than when Log result is opened. For a final AMRAP, the finish time is captured when the timer ends or is ended early, before the result-confirmation screen. Existing treatment of pauses and between-block setup time in total session duration is retained.

## Timer behavior

Late callbacks carry elapsed time across consecutive timed steps. Catch-up is iterative, including large imported queues, and leaves one timer animation loop. It does not automatically complete manual sets or pass block-ready/result gates. EMOM minute deadlines remain aligned with the overall block deadline. Only the resulting visible transition is painted and sounded when catching up; missed phases do not produce a burst of queued beeps.

This corrects callback suspension while the page remains alive. It does not add recovery after the operating system discards the page. Physical iOS background/sleep behavior still needs validation; the current timers retain their monotonic clock source.

## Compatibility

Application version 1.0.81, workout-plan format 7, pack format 1, and history format 1 remain separate. Existing plans, packs, edits, and history are not migrated or rewritten.

New mixed for-time results can contain an optional positive `completedCount` on a logged set, indicating how many repetitions of that set were completed across rounds. It is validated from 1 to 100 and preserved through history save/import/export. The block's existing `rounds` field records completed full rounds; older entries without these values continue to use their existing plan-snapshot fallback. Older application releases may omit the optional per-set count when importing/exporting newer history, so use 1.0.81 or later when transferring these results.

## Verification

Run the full command list in [the release checklist](release-checklist.md).

`scripts/test-runtime-regressions.mjs` executes production functions against disposable browser/storage boundaries and controlled clocks. Coverage includes:

- Partial and fully skipped basic/structured workouts, timed warm-ups, and mixed for-time repetition counts.
- Conversion in both weight-unit directions, matching units, prescription precedence, and avoiding double conversion.
- IndexedDB success, IndexedDB failure with successful fallback, total write failure, retained review values, retry, and duplicate history merge.
- Callback gaps spanning multiple intervals, pause/resume, block-ready/manual gates, EMOM minute alignment, AMRAP expiry/early end, and fixed completion timestamps.
- A 10,000-step timed import and all 12 workout days from the current Momentum, Rise, and Forge distributions.
- Circuit, Rest, and limited Stopwatch completion after a long callback gap.

The existing logging test now checks the guide's instruction after removing markup and whitespace differences, rather than matching the removed sentence verbatim.

Browser smoke verification used an isolated local origin with app version 1.0.81: imported the real Forge pack; opened Push Focus Day; skipped the warm-up; completed Push-Up set 1 at eight reps; skipped the rest and remaining sets; skipped the density block; ended the AMRAP early and confirmed its round result; saved and inspected History. History retained just the completed main-lift set and the AMRAP score/prescription summary. The test result was labeled as a development test. No browser warnings/errors were reported.

Before publishing, check an installed iPhone/iPad: switch to FITR during timed phases and manual sets, return across multiple phase/minute boundaries, verify block gates, log after waiting on completion, and verify retained data through normal updates/offline reopening. No physical-device or normal service-worker update test is claimed by the automated suite.
