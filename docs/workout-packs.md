# Workout pack publishing

Current workflow: app **1.0.79**, pack format **1**, workout-plan format **7**. Pack import was introduced in 1.0.58; members need the current community build to get the management and navigation described here. A local commit does not publish that build. Once members have a compatible app, distributing new weekly packs does not require another app release. See the [release checklist](release-checklist.md).

## Weekly distribution

Use **Cycle N · Week M** as the displayed edition and **`<track>-cycle-N-week-M.workout-pack.json`** as the filename. The pack ID matches the filename without `.workout-pack.json`; the track ID stays `momentum`, `forge`, or `rise`. For example, `forge-cycle-4-week-3` displays as **Cycle 4 · Week 3** under Forge.

Cycle/week labels describe the supplied programming, not a calendar schedule. Do not assign a start date, end date, or Sunday boundary without confirmation. Corrections use a new ID/file with an `-r2` suffix and the display label **Cycle 4 · Week 3 (corrected)**.

1. Update the individual `.workout.json` templates under `workouts/<track>/` from the supplied programming. Preserve exercise IDs for history continuity. Keep personalized benchmark targets as PR-based instructions until the actual formulas are known.
2. Give the distribution a unique pack ID and a clear edition label. For example, use `forge-cycle-5-week-1` and `Cycle 5 · Week 1` when those values are confirmed. Do not infer a training week from screenshot dates.
3. Build one self-contained pack, in the same Lower Body, Dip, Pull, Push order as the built-in tracks:

   ```sh
   node scripts/build-workout-pack.mjs forge forge-cycle-5-week-1 'Cycle 5 · Week 1'
   ```

4. Run `node scripts/test-workout-packs.mjs` and `node scripts/verify-release.mjs`. Review all prescription changes against the source.
5. Share the resulting JSON as a file attachment with the community. Users download it into Files/Downloads, then choose **Manage packs → Import workout pack** in the workout chooser. No account or upload to a server is involved.

The builder refuses to overwrite a distribution. Use a new ID for a correction, such as `forge-cycle-5-week-1-r2`, and an edition label such as `Cycle 5 · Week 1 (corrected)`. Keep original distributed files so re-importing an older edition remains reproducible.

The current distribution uses the user's provisional **Cycle 4 · Week 3** designation for all three available sets:

| Track | Pack file in `workouts/packs/` |
| --- | --- |
| Momentum | `momentum-cycle-4-week-3.workout-pack.json` |
| Forge | `forge-cycle-4-week-3.workout-pack.json` |
| Rise | `rise-cycle-4-week-3.workout-pack.json` |

Each contains its four existing strength workouts in Lower Body, Dip, Pull, Push order, with prescriptions unchanged. Optional Cardio remains shared by the app. Individual source workout files remain importable.

The earlier `forge-2026-09-03.workout-pack.json` is retained unchanged so existing imports remain reproducible. Importing the newly named Forge pack adds a separate edition; it does not rename the older import or copy its personal edits. If they no longer need its edits, testers may remove the earlier **Distributed 3 Sep 2026** edition. Momentum and Rise packs similarly coexist with their built-in **Starter Pack**; creating these files does not automatically import them or replace the built-in library.

## File format

```json
{
  "format": "workout-timer-pack",
  "version": 1,
  "id": "forge-cycle-5-week-1",
  "track": { "id": "forge", "name": "Forge" },
  "edition": "Cycle 5 · Week 1",
  "workouts": [
    { "id": "lower-body-focus", "workout": { "...": "complete version 7 workout plan" } }
  ]
}
```

The example's workout object is a placeholder; the real pack embeds every complete plan and needs no linked files or network requests. Pack format version 1 is separate from workout-plan version 7 and the app release version.

- Keep the track ID stable across weeks to group editions in one track.
- Keep workout IDs stable within the track; keep exercise IDs stable inside plans.
- Give each distributed edition a globally unique pack ID. The same ID/content is a no-op on re-import. Different content with an existing ID is rejected, leaving the stored edition unchanged.
- Use lowercase letters, numbers, and hyphens for IDs. Track IDs are at most 40 characters; pack/workout IDs at most 80. Names and edition labels are at most 60 characters.
- A pack supports 1–20 workouts and a maximum import file size of 512 KB. Individual workouts retain the 100 Ki-character serialized-plan and 20,000-timer-step limits.
- The device library supports at most 52 packs and a serialized size of 2 Mi characters. Browser storage limits may be lower; failed writes report an error and do not partially import a pack.

## Library behavior

Imported tracks join the existing track picker. Every track shows a Workout pack dropdown above its workout days, even before additional packs are imported. If a pack targets an existing track such as Momentum, that track's selector offers both **Starter Pack** and imported editions. The shared Optional Cardio entry remains supplied by the app, not duplicated in each pack.

Importing a different pack selects its track and edition and clears the displayed workout until a day is chosen. Change opens centered track selection immediately. Edition dropdown changes keep the current chooser layout and refresh the days beneath it; the old workout is replaced by a selection prompt. In both cases a new day must be chosen; opening/dismissing management and choosing or re-importing the same edition retain the selected day. This pending selection survives reload. Selecting a day loads that edition's saved edit, or its original prescription when unedited. Edits persist across day changes, reloads, and offline launches. A new edition starts from its own supplied targets; edits are deliberately not copied forward across weeks.

The original pack and its personal edits are stored separately under `workoutTimerPacksV1` in local storage. Normal app/service-worker updates do not clear this key. History remains separate. The current saved workout carries a `packSource` reference so editing after reopening still updates the correct day. Imported references use `{packId, workoutId}`; starter references use `{starterTrackId, workoutId}`. External individual-workout imports become personal workouts.

BuiltSimple workouts run with a five-second start delay regardless of the source file’s prep setting. Colour controls remain available. Runtime delay selection does not rewrite the original distributed file.

Starter originals and full edited copies live under `workoutTimerStarterWorkoutsV1`, recorded on first day load and keyed by track and catalog workout ID. Optional Cardio uses the same mechanism per track and is shared across that track’s editions. Restore original removes only the edited copy for the selected day, then loads the retained original; there is no change log or diff history. Failed writes leave the current editor and saved copies intact.

`workoutTimerMyWorkoutV1` and legacy current-plan storage remain for compatibility. They are not exposed as a resumable custom-workout library; do not identify old starter copies by name. `workoutTimerSelectionPendingV1` records that a day must be selected; `workoutTimerPickerInlineV1` preserves whether that pending chooser stays beside an empty workout prompt. The legacy current-plan key remains compatible. The separate More → Custom workouts screen has only New basic workout, New structured workout, and Load workout file. Returning there or reloading an active custom editor opens these choices. Save workout file creates the reusable copy; there is no Resume action. Its personal editor hides the track chooser and contains Save workout file and Back to Custom workouts. Workout returns to BuiltSimple; a larger personal library is deferred.

Use **Manage packs** in the chooser to import, see, or remove packs. Starter packs are listed alongside imported editions and cannot be removed. Successful imports return to the imported edition’s workout days. Otherwise, choose Done and select a pack in the workout chooser. Removing a pack requires confirmation and deletes its stored edits. Removing the selected pack clears the displayed day; History remains. Removing an unselected edition preserves the selected one; removing the selected edition falls back to Starter Pack or the latest remaining import in that track. Pack workouts cannot be saved as new personal workouts. Export of edited packs and automatic PR calculations are outside this release.

## Verification before sharing

- Download the attachment on an iPhone and import through the installed PWA's file picker.
- Confirm Forge appears beside Momentum/Rise and all four days load.
- Change a PR target, switch days, return, and reopen the app; confirm the edit remains.
- Import the same pack twice; confirm no duplicate or reset.
- Import a new edition with a new ID; confirm both editions are selectable.
- Reopen offline and load an imported day; check existing History remains available.
- Before removing a pack, record any edited targets you need to keep. Edited packs/days cannot be exported as custom workouts. Export History separately if you need a session backup.

Automated tests use the actual import, validation, persistence, and navigation functions with a simulated DOM/storage boundary. They cover invalid/oversized plans, duplicate/conflicting IDs, failed storage writes, edition isolation, imported edits, and offline catalog failure. Earlier native Chrome checks exercised file-picker import, editing, reload, and a 440-pixel layout; later navigation/layout changes need the current [device checklist](release-checklist.md). Actual installed-iPhone/PWA file-picker testing remains a separate check.
