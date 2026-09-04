# Workout Timer

A local-first workout timer for an iPhone or iPad at the gym. No account, subscription, or analytics is required. Workouts and History stay on your device.

**[Open Workout Timer](https://builtwithcoffee.github.io/workout-timer/)** · **[Read the guide](https://builtwithcoffee.github.io/workout-timer/guide.html)**

This repository describes app release **1.0.81**. A local commit does not update the shared site; check the version in the app footer against the release announced to the community.

## Start with a workout pack

Momentum and Rise each include a **Starter Pack** with four training days and shared optional Cardio · Burpees. You can try a starter immediately or import a weekly pack supplied to the community. Forge appears after importing its pack.

1. Open the supplied `.workout-pack.json` attachment. If FITR displays it as JSON text, tap the arrow beside the filename and choose **Save to Files**.
2. In **Workout**, open **Manage packs → Import workout pack** and select the file.
3. The imported track and edition open to their workout days. Choose a day.
4. Check the track and edition above the workout title, review its targets, and choose **Start workout**. BuiltSimple workouts use a five-second countdown.
5. Follow the on-screen completion controls. After training, choose **Log result** and save the session to History.

Workout Timer does not connect to BuiltSimple or fetch new programming automatically. Your current assignment is authoritative. Where a template says **PR-based reps**, enter the assigned target using **Edit workout**; the app does not calculate it from a benchmark.

Current prepared editions:

- [Momentum · Cycle 4 · Week 3](workouts/packs/momentum-cycle-4-week-3.workout-pack.json)
- [Forge · Cycle 4 · Week 3](workouts/packs/forge-cycle-4-week-3.workout-pack.json)
- [Rise · Cycle 4 · Week 3](workouts/packs/rise-cycle-4-week-3.workout-pack.json)

Cycle/week labels identify the programming, not a scheduled date range. These files are separate imports; they do not automatically replace the Starter Packs.

## Choose, edit, and manage packs

- **Change** saves edits and opens the centered track picker immediately. Choose a track, edition, and day.
- The **Workout pack** dropdown switches editions within the current track and refreshes the days beneath it. It keeps the current chooser layout. The previous workout clears until you choose a day from the new pack.
- **Manage packs** lists compact rows by track. Import adds a pack; **Remove** confirms the deletion of an imported pack and its edits. Starter Packs cannot be removed. **Done** returns to the chooser without changing the current selection.
- **Edit workout** saves changes automatically to that day and edition on this device. **Done editing** and **Restore original** are grouped in the editing panel. Restore requires confirmation and affects only that day's edits, not other days or History.
- **Workout options → Workout colours** remains available. The BuiltSimple start delay is fixed at five seconds.

Importing a new week keeps earlier weeks available. Re-importing the identical file keeps existing edits; different content under the same pack ID is rejected. New editions start with their own targets and do not inherit edits from earlier weeks. Optional Cardio stays shared across editions within a track.

Pack workouts cannot be saved as new custom workouts, and edited-pack export is not available. Keep original pack files for re-import, and record any changes you need before removing a pack. History remains available when a workout is loaded and is hidden during track/day selection.

## Custom workouts and timer tools

**Workout**, **Circuit**, and **Intervals** are the main navigation choices. **More** contains **Rest**, **Stopwatch**, and **Custom workouts**.

**More → Custom workouts** offers exactly three choices: **New basic workout**, **New structured workout**, and **Load workout file**. Custom workouts support adjustable start delay and colours. Use **Save workout file** in the editor before leaving to keep a reusable JSON copy. Returning to Custom workouts shows the three choices; it does not resume the old editor. Use **Load workout file** to reopen a saved file, or the **Workout** tab to return to BuiltSimple.

Circuit has its own file controls. Rest is a quick countdown, Stopwatch counts up, and Intervals alternates work and recovery periods.

## Install and use offline

1. Open the app in your iPhone or iPad browser.
2. Open the browser's **Share** menu and choose **Add to Home Screen**.
3. If shown, leave **Open as Web App** enabled, then tap **Add**.
4. Launch it from the Home Screen while online so the app and starter files can finish caching. Test reopening offline before relying on it at the gym.

Imported packs are copied into the app's browser storage on that device. They are not linked to the downloaded file, and edits do not modify that file. After import and app caching, you can load and train with them offline. Internet access is needed for the initial app load, app updates, and downloading new packs.

Normal updates preserve packs, edits, and History. Clearing website data or removing the installed app can remove local data. There is no automatic synchronization between browsers or devices.

## Update the app

Open the app online and wait for **Update ready**. Finish and log any active workout first.

- **Installed iPhone/iPad app:** swipe Workout Timer away in the app switcher, then reopen it from its Home Screen icon. Returning to the Home Screen alone may leave it running.
- **Browser:** close every Workout Timer tab/window, including Guide pages, then open the site again. Refresh alone may leave the new version waiting.

Check the version in the footer. If it is still older, close other app pages and repeat once the update is ready. Closing before the download finishes is not a reliable update method. Reinstalling is not the normal update procedure. See the [update guide](guide.html#update-app).

## History and backups

After logging a workout, you can copy a concise overview for sharing. **History → Export history** creates a fuller backup of completed sessions. **Import history** merges a backup without duplicating existing session IDs.

History backups do not contain the installed pack library or its current edits. Custom workout files contain plans, not completed sessions. Keep original pack files, save custom workout files, and export History before changing devices or clearing storage. There is currently no complete backup/export of edited packs.

## Development and distribution

The app is dependency-free HTML, CSS, and JavaScript, primarily in `index.html`. `sw.js`, `manifest.webmanifest`, and local icons provide the PWA shell. There is no application server or package-install/build step. Use a localhost HTTP server for development; opening `index.html` as a file does not reliably load the JSON catalog.

Application release **1.0.81**, workout-plan format **7**, and pack format **1** are separate version numbers. Plans/settings use local storage; History uses IndexedDB with a local-storage fallback. Keep `APP_VERSION` synchronized in `index.html` and `sw.js`, and keep the CSP script hash current.

- [Weekly pack publishing and format](docs/workout-packs.md)
- [Pack management behavior](docs/manage-workouts-spec.md)
- [Release and device checks](docs/release-checklist.md)

Workout Timer was primarily vibe-coded with OpenAI Codex, with the initial interface and design direction developed with Anthropic Claude and product decisions and real-device testing guided by the maintainer.
