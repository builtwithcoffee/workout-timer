# Workout Timer

A focused, local-first workout timer designed for an iPhone or iPad at the gym.

**[Open Workout Timer](https://builtwithcoffee.github.io/workout-timer/)**

Workout Timer runs as an installable web app. After the first online launch, it works offline with no account, subscription, analytics, or server. Your workouts and history remain on your device.

## Install on iPhone or iPad

1. Open [Workout Timer](https://builtwithcoffee.github.io/workout-timer/) in Chrome, Safari, or your preferred browser.
2. Tap the browser’s **Share** button.
3. Scroll down and tap **Add to Home Screen**.
4. Leave **Open as Web App** turned on, then tap **Add**.
5. Launch Workout Timer from the new Home Screen icon once while online. Its files will be cached for offline use.

You can then use it at the gym without a network connection. When a new version is available, fully close and reopen the app to allow the update to finish.

## What it does

- **Workout** — Run rep- and set-based workouts, including mixed bodyweight and weighted movements.
- **Circuit** — Repeat timed stations and rests for a chosen number of rounds.
- **Rest** — Start a countdown from editable one-tap presets.
- **Stopwatch** — Count up freely or toward an optional limit.
- **Intervals** — Alternate work and rest using editable presets.

The running screen uses large type, strong phase colours, progress animation, countdown sounds, and screen wake lock where the browser supports it. Workouts can also record reps, weight, notes, elapsed blocks, and AMRAP results, and can run fixed-minute EMOM blocks.

## Workouts and your data

Create basic or structured workouts in the app, or load a saved `.workout.json` or `.circuit.json` plan. Plans can be saved as portable files using the device's normal file controls.

Workout history is stored locally in the browser on that device. It is never uploaded. Plan files and workout-history backups are deliberately separate: loading a plan does not bring its previous sessions with it.

Use **Export history** to make a backup or move history to another device. On the second device, use **Import history** to merge the backup without duplicating existing sessions. Export periodically if the history matters to you, especially before clearing browser website data or changing devices.

## Included workout plans

On first use, the workout picker asks you to select Momentum or Rise and then shows the workout days for that track. It remembers your track on the device, while shared optional workouts are listed once. Each supplied workout is stored as an individual JSON file, so it can be selected in the app, edited, and saved as a personal copy.

- [Momentum workout files](workouts/momentum/)
- [Rise workout files](workouts/rise/)

## Import a workout pack

A `.workout-pack.json` file contains a complete set of workout days. Download it to your device, open the workout chooser, and tap **Import workout pack**. The imported track appears alongside Momentum and Rise. Choose its **Workout pack** edition, then select a day.

Imported workouts and their edits stay on your device, including when switching days or reopening offline. Importing the same pack again keeps your edits. Each new weekly edition has its own entry, so earlier weeks remain available. Importing or browsing a pack leaves the current workout and History unchanged.

The first [Forge pack](workouts/packs/forge-2026-09-03.workout-pack.json) contains Lower Body, Dip, Pull, and Push. PR-based targets are instructions to enter the reps from your current assignment; the app does not calculate them. Use **Workout files → Save** to back up a personalized workout before removing a pack or clearing browser data.

For preparing weekly distributions, see [Workout pack publishing](docs/workout-packs.md).

## About the project

Workout Timer is intentionally small and local-first. It is meant to be useful on a phone or tablet without turning into a fitness platform, requiring an account, or depending on an ongoing hosted service.

The project was primarily vibe-coded with OpenAI Codex. Its initial interface and design direction were developed with Anthropic Claude, with product decisions and real-device testing guided by the maintainer.

## Technical notes

- Static, dependency-free HTML, CSS, and JavaScript; the main application is in `index.html`.
- Installable/offline PWA behavior is provided by `manifest.webmanifest` and `sw.js`.
- Plans and settings use local storage; workout history uses IndexedDB with a local-storage fallback.
- Current application release: **1.0.60**.
- Current workout-plan format: **version 7**, with compatibility for older supported plan files.
- App updates replace cached code and assets without clearing saved plans or workout history.
- `node scripts/verify-release.mjs` checks the synchronized app version, CSP script hash, and JSON assets before release.

For full local testing, including the supplied workout library, serve the repository over HTTP. Installation and service-worker testing require HTTP or HTTPS as well.
