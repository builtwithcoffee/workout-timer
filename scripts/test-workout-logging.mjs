import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const helperSource = html.match(/  function isWarmupBlock\(block\) \{[\s\S]*?\n  \}/)?.[0];
if (!helperSource) throw new Error('Could not find the warm-up logging helper in index.html.');
const { isWarmupBlock } = Function(helperSource + '\nreturn { isWarmupBlock };')();

assert.equal(isWarmupBlock({ id: 'dip-warm-up', title: 'Dip Focus Day · Warm-Up' }), true);
assert.equal(isWarmupBlock({ id: 'main-lift-dips', title: 'Main Lift · Dips' }), false);
assert.match(html, /liveLog: block\.mode === 'sequence' && exercise\.completion === 'manual' && !isWarmupBlock\(block\)/);
assert.match(html, /const warmup = isWarmupBlock\(block\);/);
assert.match(html, /completed as prescribed/);

const catalog = JSON.parse(await readFile(new URL('workouts/catalog.json', root), 'utf8'));
const plans = catalog.tracks.flatMap(track => track.plans).concat(catalog.optional || []);
for (const plan of plans) {
  const workout = JSON.parse(await readFile(new URL(plan.file.slice(2), root), 'utf8'));
  assert.equal(isWarmupBlock(workout.blocks[0]), true, `${plan.id} should begin with a recognized warm-up block`);
}

console.log(`Warm-up logging tests passed for ${plans.length} supplied workouts.`);
