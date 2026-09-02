import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const source = html.match(/\/\* ---------- workout overview ---------- \*\/([\s\S]*?)\/\* ---------- end workout overview ---------- \*\//)?.[1];
if (!source) throw new Error('Could not find the workout overview formatter in index.html.');
const { formatWorkoutOverview } = Function(source + '\nreturn { formatWorkoutOverview };')();

const manual = (label, values, targets = [], weights = []) => ({
  label,
  completion: 'manual',
  tracking: weights.some(value => value != null) ? 'weight-reps' : 'reps',
  sets: values.map((actualReps, index) => ({
    set: index + 1,
    completion: 'manual',
    target: targets[index] || targets[0] || 'Complete set',
    plannedReps: actualReps,
    actualReps,
    weight: weights[index] == null ? null : weights[index]
  }))
});
const timed = (label, values) => ({
  label,
  completion: 'timed',
  tracking: 'reps',
  sets: values.map((actualSeconds, index) => ({ set: index + 1, completion: 'timed', plannedSeconds: actualSeconds, actualSeconds }))
});

const structured = {
  id: 'structured-session',
  formatVersion: 1,
  workoutName: 'Lower Body Focus Day',
  workoutKind: 'structured',
  startedAt: '2026-09-01T13:00:00.000Z',
  completedAt: '2026-09-01T14:02:03.000Z',
  durationSeconds: 3723,
  unit: 'lb',
  notes: 'PRIVATE SESSION NOTE',
  blocks: [
    {
      id: 'warm-up', title: 'Lower Body Focus Day · Warm-Up', mode: 'sequence', elapsedSeconds: 180, stoppedEarly: false, rounds: null, extraReps: null,
      exercises: [timed('Wall Sit', [30, 30]), manual('Bodyweight Squats', [5, 5, 5], ['5 reps']), manual('Reverse Lunges', [10, 10], ['10 per side'])]
    },
    {
      id: 'main-lift', title: 'Main Lift / Squats', mode: 'sequence', elapsedSeconds: 500, stoppedEarly: false, rounds: null, extraReps: null,
      exercises: [manual('Squats', [8, 7, 6], ['PR reps'], [95, 95, 95])]
    },
    {
      id: 'density', title: 'Density / Quality Work', mode: 'for-time', elapsedSeconds: 754, stoppedEarly: false, rounds: null, extraReps: null,
      exercises: [manual('Neutral-Grip Rows', [10], ['10 reps']), manual('Reverse Lunges', [20], ['20 overall reps'])]
    },
    {
      id: 'finisher', title: 'Core / Finisher', mode: 'amrap', elapsedSeconds: 720, stoppedEarly: false, rounds: 8, extraReps: 6,
      exercises: [manual('Toes to Bar', [7], ['7 reps']), timed('Side Plank', [30])]
    }
  ],
  planSnapshot: {
    layout: 'blocks',
    blocks: [
      { id: 'warm-up', title: 'Lower Body Focus Day · Warm-Up', mode: 'sequence', rounds: 1, unitLabel: 'round' },
      { id: 'main-lift', title: 'Main Lift / Squats', mode: 'sequence', rounds: 1, unitLabel: 'round' },
      { id: 'density', title: 'Density / Quality Work', mode: 'for-time', rounds: 5, unitLabel: 'cycle' },
      { id: 'finisher', title: 'Core / Finisher', mode: 'amrap', rounds: 1, unitLabel: 'round' },
      { id: 'skipped', title: 'Skipped Block', mode: 'sequence', rounds: 1, unitLabel: 'round' }
    ]
  }
};

const structuredOverview = formatWorkoutOverview(structured);
assert.equal(structuredOverview, `WARM-UP
• Wall Sit — 2 × 30s
• Bodyweight Squats — 3 × 5
• Reverse Lunges — 2 × 10/side

MAIN LIFT / SQUATS
• Squats — 8, 7, 6 reps @ 95 lb

DENSITY / QUALITY WORK
• 5 cycles in 12:34
• Neutral-Grip Rows — 5 × 10 reps
• Reverse Lunges — 5 × 20 overall reps

CORE / FINISHER
• 8 rounds + 6 reps
• Toes to Bar — 8 × 7
• Side Plank — 8 × 30s`);
for (const excluded of [structured.workoutName, structured.completedAt, String(structured.durationSeconds), structured.notes, 'SKIPPED BLOCK']) {
  assert.equal(structuredOverview.includes(excluded), false, `Overview must exclude ${excluded}.`);
}

const prDensity = {
  workoutName: 'Dip Focus Day', workoutKind: 'structured', unit: 'lb',
  blocks: [{ id: 'dip-density', title: 'Density · Quality Work', mode: 'for-time', elapsedSeconds: 600,
    exercises: [manual('Push-Ups', [null], ['PR-based reps']), manual('Inverted Rows', [9], ['9 reps'])] }],
  planSnapshot: { layout: 'blocks', blocks: [{ id: 'dip-density', title: 'Density · Quality Work', mode: 'for-time', rounds: 8, unitLabel: 'cycle' }] }
};
assert.equal(formatWorkoutOverview(prDensity), `DENSITY · QUALITY WORK
• 8 cycles in 10:00
• Push-Ups — 8 × PR-based reps
• Inverted Rows — 8 × 9 reps`);

const basic = {
  workoutName: 'Basic Strength', workoutKind: 'simple', unit: 'kg', completedAt: '2026-09-01T12:00:00.000Z', durationSeconds: 999, notes: 'Do not copy',
  blocks: [{ id: 'workout', title: 'Basic Strength', mode: 'sequence', exercises: [
    manual('Push-Ups', [12, 10, 0], ['12 reps']),
    manual('Deadlift', [5, 5, 4], ['5 reps'], [100, 110, 110]),
    timed('Hollow Hold', [30, 25, 60])
  ] }]
};
assert.equal(formatWorkoutOverview(basic), `WORKOUT
• Push-Ups — 12, 10, 0 reps
• Deadlift — set 1: 5 reps @ 100 kg; set 2: 5 reps @ 110 kg; set 3: 4 reps @ 110 kg
• Hollow Hold — 30s, 25s, 1:00`);

const early = {
  workoutKind: 'structured', unit: 'lb',
  blocks: [{ id: 'amrap', title: 'Fast Finisher', mode: 'amrap', elapsedSeconds: 252, stoppedEarly: true, rounds: 3, extraReps: 2,
    exercises: [manual('Burpees', [7], ['7 reps'])] }],
  planSnapshot: { layout: 'blocks', blocks: [{ id: 'amrap', title: 'Fast Finisher', mode: 'amrap', unitLabel: 'round' }] }
};
assert.equal(formatWorkoutOverview(early), `FAST FINISHER
• 3 rounds + 2 reps (ended early after 4:12)
• Burpees — 3 × 7`);

const noRounds = structuredClone(early);
noRounds.blocks[0].rounds = 0;
noRounds.blocks[0].extraReps = 6;
assert.equal(formatWorkoutOverview(noRounds), `FAST FINISHER
• 0 rounds + 6 reps (ended early after 4:12)`);

const weightConversionSource = html.match(/\/\* ---------- workout weight unit conversion ---------- \*\/([\s\S]*?)\/\* ---------- end workout weight unit conversion ---------- \*\//)?.[1];
if (!weightConversionSource) throw new Error('Could not find the workout weight unit conversion helpers in index.html.');
const { convertedAddedWeight, convertedWeightInputValues } = Function(weightConversionSource + '\nreturn { convertedAddedWeight, convertedWeightInputValues };')();
assert.deepEqual(convertedWeightInputValues(['', '22', '100'], 'lb', 'kg'), ['', '10', '45.5']);
assert.deepEqual(convertedWeightInputValues(['', '10', '45.5'], 'kg', 'lb'), ['', '22', '100.5']);
assert.equal(convertedAddedWeight(10, 'kg', 'kg'), 10);

const clipboardSource = html.match(/  function fallbackCopyPlainText[\s\S]*?(?=\n  let renderedHistorySessions)/)?.[0];
if (!clipboardSource) throw new Error('Could not find the clipboard helpers in index.html.');
function clipboardHarness(navigatorValue, copyResult = true) {
  let field = null, command = '', restoredFocus = false;
  const activeElement = { focus() { restoredFocus = true; } };
  const documentValue = {
    activeElement,
    body: { appendChild(value) { field = value; } },
    createElement() {
      return {
        value: '', style: {}, attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        focus() {}, select() { this.selected = true; },
        setSelectionRange(start, end) { this.selection = [start, end]; },
        remove() { this.removed = true; }
      };
    },
    execCommand(value) { command = value; return copyResult; }
  };
  const helpers = Function('navigator', 'document', clipboardSource + '\nreturn { fallbackCopyPlainText, copyPlainText };')(navigatorValue, documentValue);
  return { helpers, result: () => ({ field, command, restoredFocus }) };
}

const fallback = clipboardHarness({});
await fallback.helpers.copyPlainText('WORKOUT\n• Push-Ups — 3 × 10');
assert.equal(fallback.result().command, 'copy');
assert.equal(fallback.result().field.value, 'WORKOUT\n• Push-Ups — 3 × 10');
assert.deepEqual(fallback.result().field.selection, [0, fallback.result().field.value.length]);
assert.equal(fallback.result().field.removed, true);
assert.equal(fallback.result().restoredFocus, true);

const rejectedModern = clipboardHarness({ clipboard: { async writeText() { throw new Error('denied'); } } });
await rejectedModern.helpers.copyPlainText('fallback after rejection');
assert.equal(rejectedModern.result().command, 'copy');

const unavailable = clipboardHarness({}, false);
await assert.rejects(() => unavailable.helpers.copyPlainText('cannot copy'), /Clipboard access is unavailable/);

console.log('Workout overview formatter and clipboard fallback tests passed.');
