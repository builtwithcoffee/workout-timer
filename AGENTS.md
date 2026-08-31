# Workout Timer Codex Instructions

When the local context notes are present, use `docs/context/README.md` as the project context entry point before making changes. These notes are intentionally local-only and ignored by Git.

## Default read order

1. `docs/context/project-status.md`
2. `docs/context/working-notes.md`
3. `docs/context/next-task.md`

Read `README.md` for the public product and installation overview. Inspect the current source and example workout files when implementation details, supported formats, deployment, or update behavior matter.

## Repository expectations

- Treat this repository as the canonical Workout Timer codebase.
- Keep the app local-first: no account, server, analytics, or subscription is required.
- Preserve offline PWA behavior and iPhone/iPad usability.
- Keep ordinary workouts easy to create while continuing to support structured imported workouts.
- Preserve compatibility with existing saved workout, circuit, and history data unless a deliberate migration is documented.
- Prefer focused improvements over expanding the app into a broad fitness platform.

## Implementation rules

- The app is intentionally dependency-free and primarily contained in `index.html`.
- Do not introduce frameworks, package managers, CDNs, or hosted runtime dependencies without explicit approval.
- Keep `APP_VERSION` synchronized in `index.html` and `sw.js` for every release.
- Keep application versioning separate from the workout-plan format version.
- Avoid service-worker changes that reload an active workout or clear locally stored plans/history.
- Verify meaningful changes locally and consider iOS/PWA behavior where relevant.

## Git and deployment

- Primary branch: `main`.
- Remote repository: `builtwithcoffee/workout-timer`.
- GitHub Pages: `https://builtwithcoffee.github.io/workout-timer/`.
- Prefer small, intentional commits at verified checkpoints.
- Do not push unless the user asks for it or clearly authorizes publishing the completed change.

## Context maintenance

Update the local `docs/context` notes selectively when project status, lasting product direction, workflow, or the recommended next task meaningfully changes. Do not update them for tiny one-off edits.
