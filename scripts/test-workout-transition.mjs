import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const source = html.match(/\/\* ---------- timed setup transition ---------- \*\/([\s\S]*?)\/\* ---------- end timed setup transition ---------- \*\//)?.[1];
if (!source) throw new Error('Could not find the timed setup transition helper in index.html.');
const { TIMED_SETUP_SECONDS, needsTimedSetup } = Function(source + '\nreturn { TIMED_SETUP_SECONDS, needsTimedSetup };')();

const manual = { phase: 'work', completion: 'manual', blockId: 'warm-up' };
const timed = { phase: 'work', completion: 'timed', blockId: 'warm-up' };
const rest = { phase: 'rest', seconds: 30, blockId: 'warm-up' };
const sequence = { id: 'warm-up', mode: 'sequence' };
const amrap = { id: 'warm-up', mode: 'amrap' };
const forTime = { id: 'warm-up', mode: 'for-time' };
const timedExercise = { completion: 'timed' };
const manualExercise = { completion: 'manual' };

assert.equal(TIMED_SETUP_SECONDS, 3);
assert.equal(needsTimedSetup(manual, sequence, timedExercise), true, 'manual to timed sequence step needs setup');
assert.equal(needsTimedSetup(rest, sequence, timedExercise), false, 'an explicit rest already provides setup time');
assert.equal(needsTimedSetup(timed, sequence, timedExercise), false, 'timed to timed does not add setup');
assert.equal(needsTimedSetup(manual, sequence, manualExercise), false, 'manual to manual does not add setup');
assert.equal(needsTimedSetup(manual, amrap, timedExercise), false, 'AMRAP transitions remain immediate');
assert.equal(needsTimedSetup(manual, forTime, timedExercise), false, 'for-time transitions remain immediate');
assert.equal(needsTimedSetup({ ...manual, blockId: 'previous' }, sequence, timedExercise), false, 'block transitions use the existing block gate');
assert.equal(needsTimedSetup(null, sequence, timedExercise), false, 'the first exercise does not add redundant setup');

console.log('Manual-to-timed setup transition tests passed.');
