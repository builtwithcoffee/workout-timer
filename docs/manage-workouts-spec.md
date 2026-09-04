# Manage workouts

Status: implemented in local app release 1.0.65; actual installed-iPhone smoke test remains before community rollout.

## Outcome

Give members one place to import, see, and remove workout packs, while keeping everyday workout selection quick. Reuse the existing pack format, device storage, starter workouts, and visual style.

## Entry and presentation

- Replace the chooser's **Import workout pack** button with **Manage workouts**. Show it on both the track picker and the selected track's day list, including first use.
- Remove **Remove pack** from the everyday day list.
- Keep the track chip and Workout pack dropdown above the days. Training still starts with track → pack → day.
- Open one labelled management dialog, using the app's existing dialog pattern. Make it a full-height sheet on phones and a bounded, scrollable panel on larger screens.
- Header: **Manage workouts**, with a visible **Done** button. Keep the header available while scrolling. Escape/platform Back should dismiss where supported, without exiting the app or discarding a workout; restore focus to the entry button.
- Opening or closing the manager does not load, reset, or start a workout. It is available from setup, not during an active timer or unfinished result entry.

## Screen contents

1. A primary **Import workout pack** button.
2. One short instruction: “Import the workout pack shared with the community. Imported workouts stay on this device and work offline.”
3. Packs grouped under track names, in the same order as the existing track picker.
4. Each row shows the edition, number of workout days, and its actions. Use the app's current type, colours, dividers, and comfortable touch targets.

Example content:

| Track | Edition | Details | Actions |
| --- | --- | --- | --- |
| Momentum | Starter Pack | 4 workout days · Included with app | Use pack |
| Momentum | Cycle 4 · Week 3 | 4 workout days | Use pack; Remove |
| Forge | Cycle 4 · Week 3 | 4 workout days | Use pack; Remove |
| Rise | Starter Pack | 4 workout days · Included with app | Use pack |

Render these as rows inside track groups, not as a wide table on the phone. Mark the chooser's current edition **Selected**; that badge refers to the library selection, not a workout in progress. Keep **Use pack** available to return to its days.

Starter Pack comes first within its track; imported packs follow most-recently-imported first, matching the current selector. Do not infer chronology from free-text edition names. Show no dates or counts of completed workouts.

Optional Cardio remains shared and selectable in the normal workout chooser. It is not an imported pack and does not need a management row.

## Actions

### Import

- Open the existing file picker and accept the existing workout-pack format. Cancellation leaves the manager unchanged. Keep individual workout imports in My workouts and circuit imports in Circuit.
- Validate and save using the existing importer. Keep duplicate/conflict, size, queue, and storage protections.
- On success, select the imported track and edition, close the manager, reveal its days, and show “Forge · Cycle 4 · Week 3 imported. Choose a workout day.” Focus the first day.
- A different track or edition clears the displayed workout until a day is chosen. This empty selection survives reload; the same edition keeps the current day. Save any pending imported-workout edit before switching context; if it cannot be saved, stay put and show the error.
- Re-importing an identical pack uses the same flow with “Already imported. Your edits are unchanged.” It never creates another copy.
- Show malformed-file, conflicting-edition, and storage errors inside the still-open manager, next to the import action. Do not hide them behind the dialog.
- Disable repeated import actions while reading/saving a file. Do not close the manager while a write is underway.

### Use pack

- Select that track and edition, close the manager, and reveal the normal day list.
- Save pending edits first; failed saves keep the manager open and preserve the current workout.
- Selecting a different pack clears the displayed day; it never starts a workout. Selecting the same pack retains its day. Returning from a personal workout to a pack asks for a day again.

### Remove

- Only imported packs have Remove. Starter packs remain available and cannot be removed in this first version.
- Confirm the exact track and edition: “Remove Forge · Cycle 4 · Week 3 and its saved edits from this device? Your History will remain. If this pack is selected, choose another workout afterward.” Provide **Cancel** and **Remove pack**.
- Pack edits stay with their pack; there is no Save as/new personal workout path or edited-pack export. Removal explicitly includes those edits.
- Save any pending current edit before removal. After success, refresh the manager and chooser; remain in the manager, announce the removal, and place focus on a nearby remaining row or Import.
- If removing the selected edition, fall back to Starter Pack in that track, otherwise the most recently imported remaining edition. If the track has no packs left, remove its library group and return the underlying chooser to track selection.
- Removing an unselected edition must preserve the current chooser selection. The current removal handler clears the track's edition choice unconditionally; narrow that behavior during implementation.
- Clear the displayed day when its source or selected pack is removed. Keep unrelated pack edits and History. Do not silently turn a removed pack day into a personal workout.
- A failed storage write leaves the pack and selection intact and displays the error in the manager.

## Scope and implementation size

This is a small-to-moderate feature, not a new workout subsystem. It needs one dialog, a grouped library renderer, event wiring, accessible focus handling, and import/removal feedback routed to the visible screen. Reuse the current validator, pack storage, edition selection, and file picker. No new dependencies, server, account, pack format, or data migration are needed.

Small logic work is required around removal of an unselected edition, selection fallbacks, save-before-navigation, and keeping error messages visible. These are the important parts to verify, beyond moving buttons.

Exclude search, filters, folders, drag ordering, bulk deletion, automatic downloads, a hosted pack marketplace, pack editing/export, and management of unrelated standalone workout files. The title is **Manage workouts**, but this first version manages the packs that supply the library.

## Acceptance checks

- Fresh install: Momentum and Rise starter rows appear; both Use actions work; no Remove actions are shown for starters.
- Import Forge: track and edition appear, the manager closes to its day list, the previous day is hidden, and edits/History are preserved.
- Import another week: both editions remain available in the manager and top dropdown; edits stay with their original edition.
- Existing imported libraries and the earlier dated Forge pack require no migration.
- Duplicate, invalid, conflicting, cancelled, and storage-failed imports behave clearly without losing data.
- Removing selected, unselected, last-in-track, and currently loaded source packs follows the rules above; cancellation is harmless.
- Switching through either the manager or top dropdown agrees on the selected edition, including after reload.
- After the app has cached successfully, reopening offline still allows management and loading of stored packs.
- Check a narrow iPhone viewport, long edition names, scrolling, keyboard/screen-reader labels, focus restoration, and actual installed-iPhone file-picker return behavior.
- Run the pack regression suite and release/CSP verification. Test the existing workout and History preservation paths where affected.

Recommended next step: try importing and removing a second test week on the installed iPhone app before community distribution.

## BuiltSimple and My workouts separation (1.0.65)

BuiltSimple remains the primary workflow. Day edits save automatically to their original track/week. Edit workout exposes a confirmed Restore original action that replaces only that day’s edited copy. Starter days use the same behavior with a retained local original after first load. Opening and dismissing management alone does not clear the day. The workout preview identifies its track and pack.

My workouts is a quiet, separate disclosure containing the existing basic/structured creation and individual-file controls, plus Resume my workout for the last personal draft. Do not build a personal library or duplicate pack days into it. Existing unassociated saved workouts remain accessible as personal drafts. Colours and start delay remain under Workout options; History is independently accessible.
