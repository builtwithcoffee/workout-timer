import { readFile, mkdir, writeFile } from 'node:fs/promises';

const [track, id, edition] = process.argv.slice(2);
if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(track || '') || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(id || '') || !edition || edition.length > 60) {
  throw new Error('Usage: node scripts/build-workout-pack.mjs forge forge-2026-09-03 "Distributed 3 Sep 2026"');
}
const root = new URL('../', import.meta.url);
const workouts = [];
for (const day of ['lower-body', 'dip', 'pull', 'push']) {
  const workout = JSON.parse(await readFile(new URL(`workouts/${track}/${day}-focus.workout.json`, root), 'utf8'));
  if (workout.format !== 'workout-timer-plan' || workout.kind !== 'workout' || workout.version !== 7) throw new Error(`Invalid ${day} workout.`);
  workouts.push({ id: `${day}-focus`, workout });
}
const pack = { format: 'workout-timer-pack', version: 1, id,
  track: { id: track, name: track[0].toUpperCase() + track.slice(1) }, edition, workouts };
const directory = new URL('workouts/packs/', root);
await mkdir(directory, { recursive: true });
const path = new URL(`${id}.workout-pack.json`, directory);
// An edition is immutable: use a fresh ID for a new week or correction.
await writeFile(path, JSON.stringify(pack, null, 2) + '\n', { flag: 'wx' });
console.log(`Created ${path.pathname} (${workouts.length} workouts).`);
