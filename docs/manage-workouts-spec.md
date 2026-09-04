# Manage packs and workout selection

Current behavior for app **1.0.79**. This document replaces the earlier implementation proposal. See [the release checklist](release-checklist.md) for verification still required before community rollout.

## Navigation

Workout is the primary BuiltSimple flow. Momentum and Rise have Starter Packs; imported tracks and editions join the same chooser. Every track has a Workout pack dropdown above its days. The selected track and edition appear above the loaded workout title.

| Action | Result |
| --- | --- |
| Change | Save edits, clear the displayed workout, and show the centered track picker immediately. |
| Select a track | Show its remembered edition and days; wait for a day selection. |
| Change the pack dropdown | Update days beneath the dropdown while preserving the existing centered/sidebar layout. Clear the previous workout and wait for a day. A sidebar selection shows a Choose a workout prompt beside it. |
| Select a day | Load that edition's edited copy, or its original if unedited. |
| Open/dismiss Manage packs | Preserve the current workout and chooser selection. |
| Choose the same edition | Preserve the current day. |

Pending selection and its layout survive reload. Start and editing controls are unavailable until a day is selected. History is hidden during selection and available with a loaded workout. Changing context saves edits first; a failed save must not silently discard them.

## Management screen

Manage packs appears in the track/day chooser and opens a labelled dialog. Its header contains Done; below are Import workout pack, a brief offline-storage note, and compact rows grouped by track. Track headings have shaded backgrounds and an accent edge. Imported rows have an outlined Remove button on the right with hover/focus feedback; starter rows have no removal action. There is no Use pack action or Selected badge.

The dialog is full-height on phones and bounded/scrollable on desktop. Done remains available in its sticky header. Maintain 44-pixel minimum button targets; long edition names wrap within the details column. Confirmation expands below its row. Escape/platform dismissal is supported where available, with focus restored to the entry button.

Starter Pack appears first within a track. Imports follow in reverse import order, not order inferred from edition names. Optional Cardio remains in the normal day chooser, shared across editions within a track; it is not a management row.

## Import

- Use the existing file picker and pack validator. Individual workout files belong in Custom workouts; circuit files belong in Circuit.
- A successful import selects its track/edition, closes management, and reveals the days. A different edition clears the old day. Re-importing the identical edition preserves edits and the current day.
- Conflicting content under an existing ID is rejected. New editions and corrections need distinct IDs.
- Cancellation changes nothing. Invalid files and failed writes show an error inside the open manager. Repeated imports and dismissal are blocked during the import operation.

## Removal

- Only imported packs can be removed. Confirm the exact track and edition, explaining that saved edits will be deleted and History retained. Offer Cancel and Remove pack.
- Save any current edits before removal. Success updates the manager and chooser, announces the removal, and remains in management.
- Removing an unselected edition preserves the current selection. Removing the selected edition falls back to Starter Pack, otherwise the most recently imported remaining edition. If no packs remain in that track, return to track selection.
- Clear a displayed day whose source or selected pack was removed. Preserve unrelated edits and History. Failed storage writes retain the pack and selection.
- There is no edited-pack export or Save as custom workout path. Do not describe History export as a backup of these edits.

## Editing and ownership

Starter and imported days retain originals separately from full edited copies. Editing saves automatically to the current track/edition/day on this device. Done editing and Restore original are grouped beneath the autosave note. Done editing persists again before closing; failure keeps the editor open. Restore original requires confirmation and removes only the current day's edited copy. There is no change log or diff history.

The BuiltSimple start delay is fixed at five seconds, including previously imported plans with a different delay. Workout options retains colours. The original distributed JSON file remains unchanged; local edits are not written back to the download.

## Custom workouts

More → Custom workouts is a separate screen with exactly three actions: New basic workout, New structured workout, and Load workout file. No Resume or Back to BuiltSimple button appears there. Personal editing hides the pack chooser and provides Save workout file and Back to Custom workouts. The Workout tab returns to BuiltSimple.

Leaving the custom editor clears its displayed selection. Returning to Custom workouts, or reloading an active custom editor, opens the landing choices. Save workout file is the reusable-copy path. Existing local data is retained for compatibility but is not offered as a resumable draft. Custom workouts retain configurable delay and colours. Opening custom management alone does not discard a loaded BuiltSimple day.

## Scope

No accounts, hosted library, automatic weekly downloads, scheduling, PR calculation, custom-workout library, or edited-pack export is implemented. Keep future work separate from the current import → select → edit if needed → train flow.

Automated coverage lives in `scripts/test-workout-packs.mjs`. It exercises production handlers with simulated DOM/storage, including import errors, removal, failed writes, saved edits, restore, selection, reload, custom flow, and optional cardio. Browser and installed-device checks complement those tests; they are not implied by an automated pass.
