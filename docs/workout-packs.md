# Workout pack publishing

Workout Timer 1.0.58 adds local workout-pack import. Publish that app update once before asking testers to import packs; older builds accept only single workouts/circuits. Afterward, distributing compatible new packs does not require another app release.

## Weekly distribution

1. Update the individual `.workout.json` templates under `workouts/<track>/` from the supplied programming. Preserve exercise IDs for history continuity. Keep personalized benchmark targets as PR-based instructions until the actual formulas are known.
2. Give the distribution a unique pack ID and a clear edition label. For example, use `forge-cycle-5-week-1` and `Cycle 5 · Week 1` when those values are confirmed. Do not infer a training week from screenshot dates.
3. Build one self-contained pack, in the same Lower Body, Dip, Pull, Push order as the built-in tracks:

   ```sh
   node scripts/build-workout-pack.mjs forge forge-cycle-5-week-1 'Cycle 5 · Week 1'
   ```

4. Run `node scripts/test-workout-packs.mjs` and `node scripts/verify-release.mjs`. Review all prescription changes against the source.
5. Share the resulting JSON as a file attachment with the community. Users download it into Files/Downloads, then choose **Import workout pack** in the workout chooser. No account or upload to a server is involved.

The builder refuses to overwrite a distribution. Use a new ID for a correction, such as `forge-cycle-5-week-1-r2`, and an edition label such as `Cycle 5 · Week 1 (corrected)`. Keep original distributed files so re-importing an older edition remains reproducible.

The first Forge pack is `workouts/packs/forge-2026-09-03.workout-pack.json`, labelled `Distributed 3 Sep 2026`. Its cycle/week is unconfirmed. The four source workout files remain individually importable.

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
- A pack supports 1–20 workouts and a maximum import file size of 512 KB. Individual workouts retain the 100 KB and 20,000-timer-step limits.
- The device library supports at most 52 packs and a serialized size of 2 Mi characters. Browser storage limits may be lower; failed writes report an error and do not partially import a pack.

## Library behavior

Imported tracks join the existing track picker. If a pack targets an existing track such as Momentum, that track's selector offers both **Included workouts** and imported editions. The shared Optional Cardio entry remains supplied by the app, not duplicated in each pack.

Importing a pack selects its track and edition but does not load a day or replace the current workout. Changing tracks/editions also leaves the current workout alone. Selecting a day loads that edition's saved edit, or its original prescription when unedited. Edits persist across day changes, reloads, and offline launches. A new edition starts from its own supplied targets; edits are deliberately not copied forward across weeks.

The original pack and its personal edits are stored separately under `workoutTimerPacksV1` in local storage. Normal app/service-worker updates do not clear this key. History remains separate. The current saved workout carries a `packSource` reference so editing after reopening still updates the correct imported day; external single-workout imports are detached copies.

Removing a pack requires confirmation and deletes its stored edits, while retaining the current workout and History. Export any personal days with **Workout files → Save** before removal or clearing browser data. Bulk export of personalized packs and automatic PR calculations are not included in this first version.

## Verification before sharing

- Download the attachment on an iPhone and import through the installed PWA's file picker.
- Confirm Forge appears beside Momentum/Rise and all four days load.
- Change a PR target, switch days, return, and reopen the app; confirm the edit remains.
- Import the same pack twice; confirm no duplicate or reset.
- Import a new edition with a new ID; confirm both editions are selectable.
- Reopen offline and load an imported day; check existing History remains available.
- Export a personalized day before removing a pack.

Automated tests use the actual import, validation, persistence, and navigation functions with a simulated DOM/storage boundary. They cover invalid/oversized plans, duplicate/conflicting IDs, failed storage writes, edition isolation, imported edits, and offline catalog failure. Native Chrome testing has verified file-picker import, navigation, editing, reload, switching away and back, and the 440-pixel phone layout. Actual iPhone/PWA file-picker testing is still a separate device check.
