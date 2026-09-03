import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const guide = await readFile(new URL('guide.html', root), 'utf8');
const helperSource = html.match(/  function isWarmupBlock\(block\) \{[\s\S]*?\n  \}/)?.[0];
if (!helperSource) throw new Error('Could not find the warm-up logging helper in index.html.');
const { isWarmupBlock } = Function(helperSource + '\nreturn { isWarmupBlock };')();
const groupedSource = html.match(/\/\* ---------- grouped density rounds ---------- \*\/([\s\S]*?)\/\* ---------- end grouped density rounds ---------- \*\//)?.[1];
if (!groupedSource) throw new Error('Could not find the grouped round helpers in index.html.');
const { isGroupedForTimeBlock, isGroupedManualAmrapBlock, isEmomBlock } = Function(groupedSource + '\nreturn { isGroupedForTimeBlock, isGroupedManualAmrapBlock, isEmomBlock };')();

assert.equal(isWarmupBlock({ id: 'dip-warm-up', title: 'Dip Focus Day · Warm-Up' }), true);
assert.equal(isWarmupBlock({ id: 'main-lift-dips', title: 'Main Lift · Dips' }), false);
assert.match(html, /liveLog: block\.mode === 'sequence' && exercise\.completion === 'manual' && !isWarmupBlock\(block\)/);
assert.match(html, /const warmup = isWarmupBlock\(block\);/);
assert.match(html, /completed as prescribed/);

const catalog = JSON.parse(await readFile(new URL('workouts/catalog.json', root), 'utf8'));
const plans = catalog.tracks.flatMap(track => track.plans).concat(catalog.optional || []);
let groupedBlocks = 0;
let groupedAmrapBlocks = 0;
let emomBlocks = 0;
for (const plan of plans) {
  const workout = JSON.parse(await readFile(new URL(plan.file.slice(2), root), 'utf8'));
  assert.doesNotMatch(JSON.stringify(workout), /set done[^.]*then[^.]*during (?:the )?(?:rest|recovery)|enter[^.]*during (?:the )?(?:rest|recovery)/i,
    `${plan.id} should not instruct users to enter results after advancing to rest`);
  assert.equal(isWarmupBlock(workout.blocks[0]), true, `${plan.id} should begin with a recognized warm-up block`);
  for (const block of workout.blocks) {
    if (isGroupedForTimeBlock(block)) {
      groupedBlocks++;
      assert.equal(block.unitLabel, 'round', `${plan.id} grouped work should use rounds`);
    }
    if (isGroupedManualAmrapBlock(block)) groupedAmrapBlocks++;
    if (isEmomBlock(block)) {
      emomBlocks++;
      assert.equal(block.mode, 'emom', `${plan.id} should use the first-class EMOM block mode`);
      assert.equal(block.unitLabel, 'minute', `${plan.id} EMOM progress should use minutes`);
      assert.equal(block.durationSeconds % 60, 0, `${plan.id} EMOM duration should use whole minutes`);
      assert.ok(block.items.every(item => item.type === 'exercise' && item.completion === 'timed' &&
        (item.setPlan || [{ seconds: item.seconds, restSeconds: item.restSeconds }]).every(set => set.seconds === 60 && set.restSeconds === 0)),
      `${plan.id} EMOM steps should be fixed 60-second intervals`);
    }
  }
}
assert.equal(groupedBlocks, 8, 'Every supplied strength workout should have one grouped density block');
assert.equal(groupedAmrapBlocks, 4, 'The four all-manual Dip and Pull finishers should use grouped AMRAP rounds');
assert.equal(emomBlocks, 1, 'The optional cardio workout should contain one first-class EMOM block');
assert.match(html, /roundGroup: true/);
assert.match(html, /isGroupedForTimeBlock\(block\) \|\| isGroupedManualAmrapBlock\(block\)/);
assert.match(html, /groupedAmrap \? 'Complete round' : roundGroup \? 'Round done'/);
assert.match(html, /class="round-exercise"/);
assert.match(html, /class="round-exercise-name"/);
assert.match(html, /class="round-exercise-detail"/);
assert.match(html, /const roundExercises = block\.items\.map\(item => \(\{[\s\S]*?label: item\.label,[\s\S]*?detail:/);
assert.match(html, /run\.classList\.toggle\('round-group', roundGroup\)/);
assert.match(html, /\$\('#runLabel'\)\.classList\.toggle\('hidden', roundGroup\)/);
assert.match(html, /it\.roundGroup && next\.roundGroup \? 'Round ' \+ next\.round/);
assert.match(html, /if \(!it\.roundGroup\) \$\('#runTime'\)\.textContent = setTargetDetail\(it\)/);
assert.doesNotMatch(html, /roundSummary:/);
assert.match(html, /roundGroup && it\.blockMode === 'amrap'/);
assert.match(html, /id="runAmrapCompletedValue"/);
assert.match(html, /\$\('#runAmrapCompletedValue'\)\.textContent = Math\.max\(0, \(Number\(it\.round\) \|\| 1\) - 1\)/);
assert.match(html, /!\(it\.roundGroup && it\.blockMode === 'amrap'\)/);
assert.match(html, /id="runBlockClock"/);
assert.match(html, /id="runBlockClockValue"/);
assert.match(html, /showBlockClock = it\.blockMode === 'amrap'/);
assert.match(html, /run\.classList\.toggle\('emom', it\.blockMode === 'emom' && !blockTransition\)/);
assert.match(html, /\.run\.emom \.run-context-top\{padding-bottom:/);
assert.match(html, /\$\('#runBlockClockValue'\)\.textContent = fmtPad\(left\)/);
assert.match(html, /phase: 'amrap-result'/);
assert.match(html, /data-amrap-field="rounds"/);
assert.doesNotMatch(html, /data-amrap-field="extraReps"/);
assert.match(html, /Record your AMRAP result/);
assert.match(html, /Count only full rounds/);
assert.match(html, /requestedMode === 'amrap' && legacyScore === 'emom' \? 'emom' : requestedMode/);
assert.match(html, /if \(block\.mode === 'emom'\) \{ total \+= block\.durationSeconds \/ 60; return; \}/);
assert.match(html, /if \(block\.mode === 'emom'\) \{[\s\S]*?const minuteCount = block\.durationSeconds \/ 60;/);
assert.match(html, /Minute ' \+ it\.minute \+ ' of ' \+ it\.minutes/);
assert.match(html, /manual \|\| it\.blockMode === 'emom' \|\| S\.mode === 'rest'/);
assert.match(html, /current\.blockMode === 'emom'[\s\S]*?return 'end-emom'/);
assert.match(html, /mode === 'end-emom' \? 'End EMOM'/);
assert.match(html, /block\.mode === 'amrap' && !emom/);
assert.match(html, /\['sequence', 'for-time', 'amrap', 'emom'\]\.includes\(mode\)/);
assert.match(html, /nextItem\.phase === 'rest' \|\| isBlockTransition\(nextItem\)/);
assert.match(html, /item\.phase === 'rest' \|\| isBlockTransition\(item\)/);
assert.match(html, /amrapResult\.rounds == null/);
assert.match(html, /it\.inlineLog = !!\(isManualItem\(it\) && it\.liveLog\)/);
assert.match(html, /item && item\.inlineLog && isManualItem\(item\)[\s\S]*?ensureManualSetResult\(item\)/);
assert.match(html, /!item\.inlineLog && nextItem && \(nextItem\.phase === 'rest' \|\| isBlockTransition\(nextItem\)\)/);
assert.match(html, /it\.next === 'Finish' \|\| it\.inlineLog \|\|/);
assert.match(html, /current && current\.inlineLog && isManualItem\(current\) \? setResultKey\(current\.exerciseId, current\.set\) : S\.restLogKey/);
assert.match(html, /id="doneLog" type="button">Log result</);
assert.match(html, /\$\('#doneAgain'\)\.classList\.toggle\('hidden', canLogWorkout\)/);
assert.match(html, /canLogWorkout \? 'Back to workouts' : 'Done'/);
assert.match(html, /\$\('#doneSub'\)\.textContent = canLogWorkout \? name/);
assert.doesNotMatch(html, /class="home-motto"/);
assert.match(html, /class="done-motto hidden" id="doneMotto"><span class="done-motto-accent">1%<\/span> better every day<\/div>/);
assert.match(html, /\.done-motto\{[^}]*border-top:1px solid var\(--line\)/);
assert.match(html, /\$\('#doneMotto'\)\.classList\.toggle\('hidden', !canLogWorkout\)/);
assert.match(guide, /Enter the completed reps and weight, then tap <strong>Set done<\/strong>/);
assert.doesNotMatch(guide, /adjust the completed reps and weight[^.]*rest/i);

console.log(`Workout logging tests passed for ${plans.length} supplied workouts, ${groupedBlocks} grouped density blocks, ${groupedAmrapBlocks} grouped AMRAP blocks, and ${emomBlocks} EMOM block.`);
