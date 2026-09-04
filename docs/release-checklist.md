# Release and device checks

This checklist applies to the current pack-based flow. Local commits do not deploy the app. Publishing requires explicit authorization.

## Local verification

Serve the repository over HTTP. From its root, a dependency-free option is:

```sh
python3 -m http.server 8875 --bind 127.0.0.1
```

Use [the localhost preview](http://localhost:8875/). Reuse an existing server if that port is occupied. Keep the same origin for normal testing: changing hostname or port uses separate browser storage. `file://` is insufficient for catalog and service-worker testing.

For a release, synchronize APP_VERSION in `index.html` and `sw.js`, update the README release, and update the guide's version label when its content changes. Changing the inline script also requires updating its SHA-256 CSP hash.

Run the relevant checks, including release verification:

```sh
node scripts/test-workout-packs.mjs
node scripts/test-workout-logging.mjs
node scripts/test-workout-transition.mjs
node scripts/test-workout-overview.mjs
node scripts/verify-release.mjs
git diff --check
```

Pack tests simulate DOM/storage and fetch boundaries. They do not establish that iOS file pickers, installation, backgrounding, or layout work on a physical device. For documentation-only updates, check links, source/UI consistency, guide rendering, and the release/CSP gate; do not claim timer regressions were rerun unless they were.

## App update checks

The service worker caches `guide.html` with the app. A guide change needs a new app/cache version to reach existing installations. The worker does not use skipWaiting or force-reload active workouts. The app registers the worker on page load and displays Update ready when a replacement is waiting/installed; there is no app-level hourly polling loop.

1. Open the old build online and let the new worker finish downloading.
2. Confirm Update ready appears without interrupting a workout.
3. Finish and log the workout. Close all app and Guide tabs/windows; for an installed app, close its app-switcher preview.
4. Reopen and check the footer version. Verify packs, edits, and History remain.
5. Reopen offline and load a starter and imported workout.

Do not enable DevTools Update on reload or use Skip waiting when validating the ordinary member update path: those controls alter normal behavior. Reinstalling or clearing site data is not the routine update path and can remove local data.

## Installed iPhone/iPad smoke test

Use disposable test editions for removal checks; retain the original files and back up History first.

- Fresh install: Momentum/Rise Starter Packs and optional cardio appear; Forge appears after importing its attachment from Files.
- Import a second edition, duplicate an identical import, and reject an invalid/conflicting file without losing data.
- Load a day, edit a target, choose Done editing, switch days, and reopen offline. Confirm edits stay with that edition. Restore original affects only the chosen day.
- Change immediately opens centered track selection. Dropdown edition changes update days in place and clear the old day. History is absent during selection and present with a loaded workout.
- Manage packs: check long names, narrow layout, touch targets, Done, removal confirmation/Cancel, selected/unselected removal, and starter protection.
- Custom workouts: three landing actions, no Resume, working file save/load, adjustable delay/colours, and landing choices after leaving an editor. Pack days remain separate.
- Start a BuiltSimple workout: five-second preparation, correct manual/timed controls, block-ready screen, Skip block, and early End AMRAP/EMOM behavior. Confirm session logging and History import/export/copy.
- Switch to another app during timed and manual phases. Check a brief return and a longer background period that might cause iOS to discard the page. Active-session recovery after page termination remains a real-device validation item; do not promise it based on offline plan storage.

Record the version, device/browser, scenarios exercised, and concrete failures. Desktop emulation supplements but does not replace this check.

## Publishing and weekly packs

Review the diff, commit the verified checkpoint, and push only when publishing is authorized. After deployment, check the version served at the shared URL and exercise the update path from an existing installation. Then tell members the new version and how to activate it.

A new compatible weekly pack does not require an app release. Follow [workout pack publishing](workout-packs.md), distribute the immutable JSON file, and tell members to use Manage packs → Import workout pack. Review the actual attachment on an installed device before distributing broadly.
