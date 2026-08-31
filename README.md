# Workout Timer

A focused, local-first workout timer designed for an iPhone or iPad at the gym.

**[Open Workout Timer](https://builtwithcoffee.github.io/workout-timer/)**

Workout Timer runs as an installable web app. After the first online launch, it works offline with no account, subscription, analytics, or server. Your workouts and history remain on your device.

## Install on iPhone or iPad

1. Open [Workout Timer](https://builtwithcoffee.github.io/workout-timer/) in **Safari**.
2. Tap the **Share** button.
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

The running screen uses large type, strong phase colours, progress animation, countdown sounds, and screen wake lock where the browser supports it. Workouts can also record reps, weight, notes, elapsed blocks, and AMRAP results.

## Workouts and your data

Create straightforward workouts in the app or load a saved `.workout.json` or `.circuit.json` plan. Plans can be saved and shared through the device's normal file and share controls.

Workout history is stored locally in the browser on that device. It is never uploaded. Plan files and workout-history backups are deliberately separate: loading a plan does not bring its previous sessions with it.

Use **Export history** to make a backup or move history to another device. On the second device, use **Import history** to merge the backup without duplicating existing sessions. Export periodically if the history matters to you, especially before clearing Safari website data or changing devices.

## Example workouts

The repository includes a few plans that can be downloaded and loaded into the app:

- [Simple strength workout](strength-workout.workout.json)
- [Strength circuit](strength-circuit.workout.json)
- [Structured lower-body workout](lower-body-focus-day.workout.json)

## About the project

Workout Timer is intentionally small and local-first. It is meant to be useful on a phone or tablet without turning into a fitness platform, requiring an account, or depending on an ongoing hosted service.

The project was primarily vibe-coded with OpenAI Codex. Its initial interface and design direction were developed with Anthropic Claude, with product decisions and real-device testing guided by the maintainer.

## Technical notes

- Static, dependency-free HTML, CSS, and JavaScript; the main application is in `index.html`.
- Installable/offline PWA behavior is provided by `manifest.webmanifest` and `sw.js`.
- Plans and settings use local storage; workout history uses IndexedDB with a local-storage fallback.
- Current application release: **1.0.1**.
- Current workout-plan format: **version 7**, with compatibility for older supported plan files.
- App updates replace cached code and assets without clearing saved plans or workout history.
- `node scripts/verify-release.mjs` checks the synchronized app version, CSP script hash, and JSON assets before release.

For quick desktop iteration, open `index.html` directly. Installation and service-worker testing require the app to be served over HTTP or HTTPS.
