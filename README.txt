WORKOUT TIMER — iPhone/iPad PWA

This folder is a static installable web app. No server-side code or package install is required.
The application lives in index.html; the manifest, service worker and icons beside it make it installable and available offline.

LOCAL DESKTOP ITERATION
- Open index.html directly in Safari, Chrome or Edge for quick local iteration.
- The manifest and service worker activate only when the folder is served over HTTP or HTTPS.
- For iPhone/iPad testing, serve or host the folder and open it in Safari. Opening a local HTML file from the iOS Files app is not a reliable way to run its JavaScript.

MODES
- Workout — rep-based exercises. Every exercise has a target, a set count and a linked rest duration.
- Circuit — named timed stations and rest steps repeated for a number of circuit rounds.
- Rest — a single countdown with five editable one-tap presets.
- Stopwatch — counts up, with an optional limit.
- Intervals — anonymous work/rest alternation with five editable one-tap presets.

WORKOUTS
- Add exercise creates an exercise card with its linked rest-after-each-set control.
- Add rest creates an independent timed rest card that can be reordered anywhere in the workout.
- Each exercise has a name, a short target such as "10 reps", sets and Rest after each set.
- Targets may also be rep ranges such as "10–12 reps".
- Each rep-based exercise can log Reps only or Weight + reps. The setting belongs to the exercise, so a single workout can mix bodyweight and weighted movements.
- Set done advances the current set or movement in a rep-based exercise.
- Linked rest follows each set and separates consecutive exercises. A standalone rest immediately after an exercise replaces its final linked rest, avoiding two rest screens in a row.
- Workouts have variable duration because the user decides when each set is complete.
- Workouts do not have workout rounds. Repetition belongs to the exercise's Sets control.
- Version 7 also supports structured imported workouts made of named blocks. A block may be a normal sequence, a rep-based "for time" block with an overall stopwatch, or an AMRAP with an overall time cap.
- Structured imports can mix timed and manually completed exercises, preserve coaching notes, and specify a different rest after each set.
- The simple on-screen editor remains available for ordinary rep-based workouts. Structured block plans are currently authored or generated as Workout files, then loaded, run, saved and shared by the app.

CIRCUITS
- Add station + rest appends a 45-second station and a 15-second rest.
- Circuit steps are always timed; there is no REPS/timed switch.
- Circuit rounds repeat the full timed station/rest sequence.
- The total is exact because every circuit step has a duration.

FILES AND LOCAL STORAGE
- Workout and Circuit are stored independently in the browser.
- Save creates a portable .workout.json or .circuit.json file. Load reads only the file selected in the system picker.
- Share uses the native share sheet when file sharing is supported and otherwise downloads the file.
- Version 5, 6 and 7 files identify their kind explicitly, preventing a Workout from being mistaken for a Circuit.
- Older version 1–4 mixed files still load. Manual/REPS stations and their following rest become Workout exercises; timed stations and their rests become a Circuit.
- The older local-storage entry is left intact during migration as a recoverable fallback.

WORKOUT HISTORY
- After completing a Workout, Log workout opens a short review form. Planned reps are prefilled; actual reps, weight, weight unit and session notes can be adjusted before saving.
- When a manual set has a following rest, its compact logger appears while the countdown continues. It uses the matching exercise and set from the most recent applicable history entry as a reference, defaults weighted exercises to the previous weight, and carries today's weight into the next set.
- The active exercise screen shows the matching previous set when history is available. Previous values are guidance only; the current session remains independently editable.
- Exercise IDs stored in Workout files keep this history association stable when an exercise's displayed name changes.
- Structured workouts also record elapsed for-time blocks and rounds plus extra reps for AMRAP blocks. Timed exercises keep their prescribed duration.
- History is stored locally on that browser/device in IndexedDB, with a local-storage fallback when IndexedDB is unavailable. No session data is sent to a server.
- Export history creates one .json backup containing all saved sessions. Import history merges that backup into the current device by session ID: new sessions are added and matching sessions are updated rather than duplicated.
- To move between an iPad and iPhone without a server, export on one device, transfer the history file with Files, AirDrop or another user-chosen method, then import it on the other device. Export from the newly merged device before switching back so both histories can be reconciled.
- Workout plan files and history backup files are intentionally separate. Loading a workout does not import its past sessions.

VERSION 7 SIMPLE WORKOUT FORMAT
{
  "format": "workout-timer-plan",
  "version": 7,
  "kind": "workout",
  "layout": "simple",
  "name": "Strength Workout",
  "prepSeconds": 5,
  "items": [
    { "type": "exercise", "id": "push-ups", "label": "Push-ups", "target": "10 reps", "sets": 3, "restSeconds": 30, "tracking": "reps" },
    { "type": "exercise", "id": "curls", "label": "Curls", "target": "10–12 reps", "sets": 3, "restSeconds": 30, "tracking": "weight-reps" },
    { "type": "rest", "label": "Water break", "seconds": 60 }
  ],
  "theme": { "work": "#f04e23", "rest": "#1668c4" }
}

VERSION 7 STRUCTURED WORKOUT FORMAT
{
  "format": "workout-timer-plan",
  "version": 7,
  "kind": "workout",
  "layout": "blocks",
  "name": "Lower Body Focus Day",
  "workoutType": "strength",
  "prepSeconds": 5,
  "blocks": [
    {
      "id": "main-lift",
      "title": "Main Lift / Squats",
      "mode": "sequence",
      "notes": ["Quality comes first; this block has no clock."],
      "items": [
        {
          "type": "exercise",
          "id": "main-lift-squats",
          "label": "Squats",
          "completion": "manual",
          "tracking": "weight-reps",
          "setPlan": [
            { "target": "PR reps", "restSeconds": 180 },
            { "target": "PR reps", "restSeconds": 150 },
            { "target": "PR reps", "restSeconds": 0 }
          ],
          "notes": ["Use air or weighted squats as prescribed."]
        }
      ]
    },
    {
      "id": "density",
      "title": "Density / Quality Work",
      "mode": "for-time",
      "rounds": 5,
      "unitLabel": "cycle",
      "restBetweenRoundsSeconds": 30,
      "score": "elapsed-time",
      "items": [
        { "type": "exercise", "label": "Neutral Grip Rows", "completion": "manual", "target": "10 reps", "sets": 1, "restSeconds": 0 },
        { "type": "exercise", "label": "Reverse Lunges", "completion": "manual", "target": "20 overall reps", "sets": 1, "restSeconds": 0 }
      ]
    },
    {
      "id": "finisher",
      "title": "Core / Finisher",
      "mode": "amrap",
      "durationSeconds": 720,
      "score": "rounds-and-reps",
      "items": [
        { "type": "exercise", "label": "Side Plank — Left", "completion": "timed", "seconds": 35, "sets": 1, "restSeconds": 0 },
        { "type": "exercise", "label": "Hamstring Curls", "completion": "manual", "target": "15 reps", "sets": 1, "restSeconds": 0 }
      ]
    }
  ],
  "theme": { "work": "#f04e23", "rest": "#1668c4" }
}

The included lower-body-focus-day.workout.json is a complete four-block example made from the supplied program screenshots.

VERSION 7 CIRCUIT FORMAT
{
  "format": "workout-timer-plan",
  "version": 7,
  "kind": "circuit",
  "name": "Timed Circuit",
  "prepSeconds": 5,
  "rounds": 3,
  "segments": [
    { "label": "Push-ups", "phase": "work", "seconds": 45 },
    { "label": "Rest", "phase": "rest", "seconds": 15 }
  ],
  "theme": { "work": "#f04e23", "rest": "#1668c4" }
}

COLOURS
- Workout and Circuit each have independent work/rest colours.
- Colours affect only that saved plan's cards and running phases, not navigation, Rest mode or Intervals.
- Generic Intervals remain red for work and blue for rest; Rest remains blue.
- Text contrast is calculated automatically.

RUNNING EXPERIENCE
- Setup and running are separate full-screen states.
- The phase colour fills the running screen, and timed steps use a left-to-right progress wipe.
- Three short beeps count the final seconds; phase changes use a distinct tone.
- Tapping a timed running screen pauses or resumes. Manual Workout steps show the current set or round prominently and use Set done.
- The app requests a Screen Wake Lock while a timer is running where supported.

FASTEST DEPLOYMENT (GITHUB PAGES)
1. Create a GitHub repository, for example workout-timer.
2. Upload all files from this folder to the repository root.
3. In GitHub, open Settings > Pages.
4. Under Build and deployment, select Deploy from a branch.
5. Select the main branch and / (root), then Save.
6. Open the resulting HTTPS URL in Safari on iPhone/iPad.
7. Safari > Share > Add to Home Screen > turn on Open as Web App > Add.
8. Launch Workout Timer once while online so its static files can be cached.
9. For each release, update APP_VERSION in both index.html and sw.js. The current release is 1.0.0.

APP UPDATES
- The application release and service-worker cache use the same version number, for example 1.0.0 or 1.0.1.
- The workout and circuit file format has its own PLAN_VERSION (currently 7) and is intentionally independent from the application release.
- A newly downloaded service worker waits while the current app remains open. It activates after every page using the previous version has been fully closed.
- When an update is ready, the setup screen explains that it will be used after the app is fully closed and reopened. Active workouts are never reloaded by the update code.
- On iPhone and iPad, fully closing may require removing the app from the App Switcher rather than only returning to the Home Screen.
- Cache cleanup is limited to names beginning with workout-timer-v so it cannot remove caches belonging to other projects on the same GitHub Pages domain.
- Application updates replace cached code and assets only. They do not clear workout plans in localStorage or workout history in IndexedDB.

NOTES
- No fonts, audio files, analytics or other runtime assets are fetched from a network.
- Keyboard: Space starts, pauses or advances a manual step; S skips a timed step; R returns to setup; F toggles fullscreen.
- Version 5 introduced the Workout/Circuit split. Version 6 added standalone Workout rest items. Version 7 adds structured block workouts while continuing to load version 5 and 6 files.
