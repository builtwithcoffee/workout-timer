# Manage packs

Status: implemented in local app release 1.0.78; actual installed-iPhone smoke test remains before community rollout.

## Outcome

Give members one place to import, see, and remove workout packs, while keeping everyday workout selection quick. Reuse the existing pack format, device storage, starter workouts, and visual style.

## Entry and presentation

- Replace the chooser's **Import workout pack** button with **Manage packs**. Show it on both the track picker and the selected track's day list, including first use.
- Remove **Remove pack** from the everyday day list.
- Keep the track chip and Workout pack dropdown above the days. Training still starts with track → pack → day. Change saves edits and immediately clears the displayed workout, showing the centered track picker. Track and day selection share that centered layout; History is hidden until a workout is loaded. Changing editions in the pack dropdown preserves its existing layout and updates the days beneath it. When switching from a loaded workout, an empty Choose a workout prompt replaces that workout while the sidebar stays in place. This pending layout survives reload.
- Open one labelled management dialog, using the app's existing dialog pattern. Make it a full-height sheet on phones and a bounded, scrollable panel on larger screens.
- Header: **Manage packs**, with a visible **Done** button. Keep the header available while scrolling. Escape/platform Back should dismiss where supported, without exiting the app or discarding a workout; restore focus to the entry button.
- Opening or closing the manager does not load, reset, or start a workout. It is available from setup, not during an active timer or unfinished result entry.

## Screen contents

1. A primary **Import workout pack** button.
2. One short instruction: “Imported packs stay on this device and work offline.”
3. Packs grouped under track names, in the same order as the existing track picker.
4. Each compact row shows the edition and a small workout-day count beneath it, with Remove aligned on the right for imported packs. Use the app's current type, colours, dividers, and comfortable touch targets.

Example content:

| Track | Edition | Details | Actions |
| --- | --- | --- | --- |
| Momentum | Starter Pack | 4 workout days · Included with app | — |
| Momentum | Cycle 4 · Week 3 | 4 workout days | Remove |
| Forge | Cycle 4 · Week 3 | 4 workout days | Remove |
| Rise | Starter Pack | 4 workout days · Included with app | — |

Render these as compact rows separated by dividers within each track group. Keep Remove alongside the pack details even on phones; long edition names wrap within the details column. Preserve 44-pixel touch targets. No Use pack action or Selected badge: selection belongs in the workout chooser. Removal confirmation expands below its row across both columns.

Starter Pack comes first within its track; imported packs follow most-recently-imported first, matching the current selector. Do not infer chronology from free-text edition names. Show no dates or counts of completed workouts.

Optional Cardio remains shared and selectable in the normal workout chooser. It is not an imported pack and does not need a management row.

## Actions

### Import

- Open the existing file picker and accept the existing workout-pack format. Cancellation leaves the manager unchanged. Keep individual workout imports in Custom workouts and circuit imports in Circuit.
- Validate and save using the existing importer. Keep duplicate/conflict, size, queue, and storage protections.
- On success, select the imported track and edition, close the manager, reveal its days, and show “Forge · Cycle 4 · Week 3 imported. Choose a workout day.” Focus the first day.
- A different track or edition clears the displayed workout until a day is chosen. This empty selection survives reload; the same edition keeps the current day. Save any pending imported-workout edit before switching context; if it cannot be saved, stay put and show the error.
- Re-importing an identical pack uses the same flow with “Already imported. Your edits are unchanged.” It never creates another copy.
- Show malformed-file, conflicting-edition, and storage errors inside the still-open manager, next to the import action. Do not hide them behind the dialog.
- Disable repeated import actions while reading/saving a file. Do not close the manager while a write is underway.

### Done

- Close the manager and return focus to Manage packs without changing the current selection.
- Select tracks, editions, and workout days in the normal workout chooser.

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

Exclude search, filters, folders, drag ordering, bulk deletion, automatic downloads, a hosted pack marketplace, pack editing/export, and management of unrelated standalone workout files. This screen manages the packs that supply the track library.

## Acceptance checks

- Fresh install: Momentum and Rise starter rows appear; no Use actions or starter Remove actions are shown. Done preserves the current selection.
- Import Forge: track and edition appear, the manager closes to its day list, the previous day is hidden, and edits/History are preserved.
- Import another week: both editions remain available in the manager and top dropdown; edits stay with their original edition.
- Existing imported libraries and the earlier dated Forge pack require no migration.
- Duplicate, invalid, conflicting, cancelled, and storage-failed imports behave clearly without losing data.
- Removing selected, unselected, last-in-track, and currently loaded source packs follows the rules above; cancellation is harmless.
- Switching through the top dropdown selects the correct edition, including after reload.
- After the app has cached successfully, reopening offline still allows management and loading of stored packs.
- Check a narrow iPhone viewport, long edition names, scrolling, keyboard/screen-reader labels, focus restoration, and actual installed-iPhone file-picker return behavior.
- Run the pack regression suite and release/CSP verification. Test the existing workout and History preservation paths where affected.

Recommended next step: try importing and removing a second test week on the installed iPhone app before community distribution.

## BuiltSimple and Custom workouts separation (1.0.65)

BuiltSimple remains the primary workflow. Day edits save automatically to their original track/week. The editing panel groups a primary Done editing button with the secondary Restore original action beneath the autosave note. Done editing persists once more before returning to the preview; a failed save leaves editing open. Restore original requires confirmation and replaces only that day’s edited copy. Starter days use the same behavior with a retained local original after first load. Opening and dismissing management alone does not clear the day. The workout preview identifies its track and pack.

Custom workouts is a separate screen reached through More → Custom workouts, offering only New basic workout, New structured workout, and Load workout file. It has no Resume or Back to BuiltSimple button. Leaving a custom editor clears its displayed selection; opening Custom workouts or reloading an active custom editor shows the landing page. Save workout file creates the reusable copy for later loading. Personal editing hides the BuiltSimple track/day chooser and exposes Save workout file and Back to Custom workouts. The Workout tab returns to the primary flow. No personal creation/loading controls appear beside Manage packs. Do not build a personal library or duplicate pack days into it. Existing stored workout data is preserved for compatibility but is not offered as a resumable draft. Workout options retains colour controls for BuiltSimple and custom workouts. BuiltSimple workouts use a fixed five-second countdown; only custom workouts show the start-delay control. History remains available with a loaded workout.
