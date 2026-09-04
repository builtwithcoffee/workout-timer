import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const extract = name => {
  const match = html.match(new RegExp(`  (?:async )?function ${name}\\([^]*?\\n  \\}`));
  if (!match) throw new Error(`Missing production function: ${name}`);
  return match[0];
};
const constants = ['WORK_SWATCHES', 'REST_SWATCHES', 'FORMAT', 'PLAN_VERSION', 'MAX_WORKOUT_QUEUE_ITEMS', 'AMRAP_QUEUE_ROUNDS', 'HEX', 'sessionId', 'exerciseId', 'setResultKey']
  .map(name => html.match(new RegExp(`  const ${name} = [^\\n]+`))[0]).join('\n');
const helpers = html.slice(html.indexOf('  const defaultTheme ='), html.indexOf('  function textOn('));
const queueHelpers = html.slice(html.indexOf('  const isManualItem ='), html.indexOf('  function blockTransitionDetails('));
const overview = html.split('  /* ---------- workout overview ---------- */')[1].split('  /* ---------- end workout overview ---------- */')[0];
const state = html.match(/  const S = \{[^]*?\};/)[0];
const storage = html.match(/  const store = \{[^]*?\n  \};/)[0];
const names = [
  'defaultWorkout', 'defaultCircuit', 'validateBasics', 'estimateWorkoutQueue', 'assertWorkoutQueueBudget', 'normalizeWorkout', 'setWorkoutPlan', 'workoutFile',
  'fmt', 'fmtPad', 'fmtElapsed', 'setTargetDetail', 'structuredBlockModeLabel', 'blockTransitionDetails', 'withMeta', 'workoutStartDelay', 'buildWorkout', 'buildCircuit', 'buildIntervals', 'buildRest', 'buildStopwatch',
  'targetRepRange', 'targetReps', 'planExercises', 'previousExerciseMap', 'isWarmupBlock', 'previousSetForItem', 'convertedAddedWeight', 'ensureManualSetResult', 'recordManualSet',
  'ensureAmrapResult', 'captureActiveBlock', 'logSets', 'buildPendingSession', 'saveSessionLog',
  'elapsed', 'blockElapsed', 'paintBlockClock', 'remainingAfter', 'tick', 'moveToQueueIndex', 'completeActiveBlock',
  'activeStructuredBlockId', 'nextBlockTransitionIndex', 'blockActionMode', 'resetBlockAction', 'runBlockAction',
  'advance', 'nextExerciseQueueIndex', 'skipCurrent', 'launch', 'startWorkout', 'togglePause', 'finish',
  'fallbackHistory', 'cleanHistoryRows', 'historyAll', 'historyPut', 'historyMerge',
  'historyText', 'historyInteger', 'historyNumber', 'canonicalHistoryPlanSnapshot', 'normalizeHistorySession'
];

function fixture() {
  // Production queues, timer, session construction, storage and validation run
  // together. Only clocks, browser rendering and storage APIs are replaced.
  return Function(constants + '\n' + helpers + '\n' + queueHelpers + '\n' + overview + '\n' + state + '\n' + storage + '\n' + names.map(extract).join('\n') + `
    const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
    const shortSec=s=>s>=60?fmt(s):s+'s';
    let now=0, serial=0, blockActionArmed=0, dbAvailable=false, dbWriteFailure=false, quotaFailure=false;
    const epoch=1799150400000;
    const NativeDate=globalThis.Date;
    const Date=class extends NativeDate {constructor(...args){super(...(args.length?args:[epoch+now]));}static now(){return epoch+now;}};
    const performance={now:()=>now};
    const crypto={randomUUID:()=> 'session-'+(++serial)},window={crypto};
    const local=new Map(), database=new Map(), frames=new Map(), elements=new Map(), inputGroups=new Map();
    const localStorage={getItem:key=>local.get(key)||null,setItem(key,value){if(quotaFailure)throw new Error('QuotaExceededError');local.set(key,value);},removeItem:key=>local.delete(key)};
    const openHistoryDb=async()=>{
      if(!dbAvailable)throw new Error('IndexedDB unavailable');
      return {transaction(){const transaction={objectStore:()=>({
        getAll(){const request={};queueMicrotask(()=>{request.result=[...database.values()];request.onsuccess();});return request;},
        put(session){queueMicrotask(()=>{if(dbWriteFailure){transaction.error=new Error('IndexedDB write failed');transaction.onabort();}else{database.set(session.id,structuredClone(session));transaction.oncomplete();}});}
      })};return transaction;}};
    };
    const $=key=>{if(!elements.has(key)){const classes=new Set();elements.set(key,{value:'',textContent:'',innerHTML:'',disabled:false,style:{setProperty(){}},classList:{add(...values){values.forEach(v=>classes.add(v));},remove(...values){values.forEach(v=>classes.delete(v));},toggle(v,on){if(on)classes.add(v);else classes.delete(v);},contains:v=>classes.has(v)}});}return elements.get(key);};
    const $$=key=>inputGroups.get(key)||[];
    const requestAnimationFrame=callback=>{const id=++serial;frames.set(id,callback);return id;},cancelAnimationFrame=id=>frames.delete(id);
    const setTimeout=()=>++serial,clearTimeout=()=>{};
    const beep=()=>{},primeAudio=()=>{},lockScreen=()=>{},unlockScreen=()=>{},hideRunTapHint=()=>{},resetEnd=()=>{},renderRunRestPresets=()=>{};
    const paintTime=(el,value)=>{el.textContent=value;};
    const paintPhase=()=>{const item=S.queue[S.qi];if(item.inlineLog)ensureManualSetResult(item);if(isAmrapResult(item))ensureAmrapResult(item);};
    const messages=[];const setPlanMsg=(kind,message)=>messages.push(message);
    const cfg={workout:{prep:0},circuit:{prep:0,rounds:1},intervals:{prep:0,rounds:2,work:20,rest:10},rest:{minutes:0,seconds:30},stopwatch:{prep:0,limit:0}};
    let workoutPlan=defaultWorkout(),workoutTheme=defaultTheme(),circuitPlan=defaultCircuit(),circuitTheme=defaultTheme();
    let activePackWorkout=null,myWorkoutsOpen=false,workoutSelectionPending=false;
    const workoutSource=source=>source;
    return {S,cfg,local,database,frames,elements,messages,$,inputGroups,
      tick,advance,skipCurrent,runBlockAction,completeActiveBlock,togglePause,buildPendingSession,normalizeHistorySession,formatWorkoutOverview,ensureManualSetResult,saveSessionLog,historyPut,historyAll,historyMerge,
      setClock(value){now=value;},elapse(ms){now+=ms;tick();},get now(){return now;},get epoch(){return epoch;},get item(){return S.queue[S.qi];},
      setQuota(value){quotaFailure=value;},setDb(available,fail=false){dbAvailable=available;dbWriteFailure=fail;},
      async workout(raw,pack=false){setWorkoutPlan(normalizeWorkout(raw));activePackWorkout=pack?{packId:'fixture-pack'}:null;S.mode='workout';await startWorkout();if(messages.length)throw new Error(messages.join('; '));},
      timer(mode){S.mode=mode;launch(mode==='intervals'?buildIntervals():mode==='circuit'?buildCircuit():mode==='rest'?buildRest():buildStopwatch());}
    };
  `)();
}

const exercise = (id, completion='manual', extra={}) => ({type:'exercise',id,label:id,completion,sets:3,target:'10 reps',seconds:20,restSeconds:10,tracking:'weight-reps',...extra});
const block = (id, items, extra={}) => ({id,title:id,mode:'sequence',items,...extra});
const structured = blocks => ({format:'workout-timer-plan',version:7,kind:'workout',name:'Runtime regression',layout:'blocks',prepSeconds:0,blocks});
const basic = {format:'workout-timer-plan',version:7,kind:'workout',name:'Basic regression',prepSeconds:0,items:[exercise('push'),exercise('curl')]};

// Completed, pending and skipped manual/timed sets must remain distinct.
for (const plan of [basic,structured([block('main',[exercise('push'),exercise('curl')])])]) {
  const f=fixture();await f.workout(plan);
  assert.equal(f.S.sessionSetResults['push::1'].actualReps,10,'The shown set has a draft result');
  f.advance(); // complete first set
  f.skipCurrent(); // skip its rest
  f.skipCurrent(); // skip remaining push sets
  f.skipCurrent(); // skip all curls and finish
  const session=f.normalizeHistorySession(f.buildPendingSession());
  assert.equal(session.blocks.length,1);
  assert.deepEqual(session.blocks[0].exercises.map(e=>[e.label,e.sets.map(s=>s.set)]),[['push',[1]]]);
  assert.doesNotMatch(f.formatWorkoutOverview(session),/curl|3 ×/);
  const finished=session.completedAt,duration=session.durationSeconds;
  f.elapse(600000);
  assert.equal(f.buildPendingSession().completedAt,finished);
  assert.equal(f.buildPendingSession().durationSeconds,duration,'Completion-screen delay must not lengthen a session');
}
{
  const f=fixture();await f.workout(basic);f.skipCurrent();f.skipCurrent();
  assert.deepEqual(f.buildPendingSession().blocks,[]);
  assert.equal(f.$('#doneLog').classList.contains('hidden'),true,'Nothing performed must not offer a fabricated log');
}
{
  const f=fixture();await f.workout(structured([block('warm-up',[exercise('hold','timed'),exercise('squats')])]));
  f.elapse(20000);f.skipCurrent();f.skipCurrent();f.skipCurrent();
  const session=f.normalizeHistorySession(f.buildPendingSession());
  assert.deepEqual(session.blocks[0].exercises.map(e=>[e.label,e.sets.map(s=>s.actualSeconds)]),[['hold',[20]]]);
}

// Mixed for-time blocks preserve actual repetitions when one exercise is skipped.
{
  const f=fixture();await f.workout(structured([block('density',[exercise('hold','timed',{sets:1,restSeconds:0}),exercise('row','manual',{sets:1,restSeconds:0})],{mode:'for-time',rounds:2,unitLabel:'round'})]));
  f.skipCurrent();f.advance();f.elapse(20000);f.advance();
  const session=f.normalizeHistorySession(f.buildPendingSession());
  assert.equal(session.blocks[0].rounds,1);
  assert.deepEqual(session.blocks[0].exercises.map(e=>[e.label,e.sets[0].completedCount]),[['hold',1],['row',2]]);
  assert.match(f.formatWorkoutOverview(session),/hold — 1 × 20s/);
  assert.match(f.formatWorkoutOverview(session),/row — 2 × 10 reps/);
}

// Historical weights are converted once; today's values and prescriptions take precedence.
for (const [oldUnit,newUnit,oldWeight,expected] of [['lb','kg',100,45.5],['kg','lb',50,110],['kg','kg',50,50]]) {
  const f=fixture();f.S.sessionUnit=newUnit;
  f.S.previousExercises.curl={unit:oldUnit,sets:[{completion:'manual',actualReps:8,weight:oldWeight}]};
  const item={liveLog:true,exerciseId:'curl',label:'Curl',set:1,target:'10 reps',tracking:'weight-reps'};
  assert.equal(f.ensureManualSetResult(item).weight,expected);
  assert.equal(f.ensureManualSetResult({...item,set:2}).weight,expected,'Do not convert the current-session value twice');
  assert.equal(f.ensureManualSetResult({...item,set:3,addedWeight:20,weightUnit:newUnit}).weight,20);
}

// Timer catch-up crosses timed phases, not user-controlled gates.
{
  const f=fixture();f.timer('intervals');f.elapse(35000);
  assert.equal(f.item.phase,'work');assert.equal(f.item.seconds-f.S.accum/1000,15);
  assert.equal(f.frames.size,1,'Catch-up must leave one animation loop');
  f.togglePause();f.elapse(90000);assert.equal(f.S.accum,5000);
  f.togglePause();f.elapse(15000);assert.equal(f.item.phase,'rest');
  f.elapse(10000);assert.equal(f.S.running,false);
}
{
  const f=fixture();await f.workout(structured([block('first',[exercise('hold','timed',{sets:1,restSeconds:0})]),block('next',[exercise('row')])]),true);
  f.elapse(90000);
  assert.equal(f.item.phase,'transition');assert.equal(f.S.blockId,null);
  assert.equal(f.S.sessionBlockTimes.first,20);
  f.elapse(90000);assert.equal(f.item.phase,'transition');
  f.advance();assert.equal(f.item.label,'row');assert.equal(f.S.blockAccum,0);
  f.elapse(90000);assert.equal(f.item.label,'row');assert.equal(f.item.completed,undefined);
}
{
  const f=fixture();await f.workout(structured([block('manual',[exercise('row')])]),true);
  f.elapse(90000);assert.equal(f.item.label,'row');assert.equal(f.item.set,1);assert.equal(f.item.completed,undefined);
}
{
  const f=fixture();await f.workout(structured([block('emom',[exercise('burpee','timed',{sets:1,seconds:60,restSeconds:0})],{mode:'emom',durationSeconds:180})]));
  f.elapse(125000);assert.equal(f.item.minute,3);assert.equal(f.S.accum,5000);assert.equal(f.S.blockAccum,0);
  assert.equal(f.S.queue.filter(q=>q.completed).length,2);
  f.elapse(90000);assert.equal(f.S.running,false);
  assert.equal(f.S.queue.filter(q=>q.completed).length,3);
  assert.equal(f.buildPendingSession().durationSeconds,180);
  assert.equal(f.buildPendingSession().blocks[0].elapsedSeconds,180);
}
{
  const f=fixture();await f.workout(structured([block('amrap',[exercise('hold','timed',{sets:1,seconds:20,restSeconds:0})],{mode:'amrap',durationSeconds:60})]));
  f.elapse(90000);assert.equal(f.item.phase,'amrap-result');
  assert.equal(f.S.sessionAmrapResults.amrap.rounds,3);
  f.elapse(600000);f.advance();
  assert.equal(f.buildPendingSession().durationSeconds,60,'Final AMRAP scoring time must not extend the workout');
  assert.equal(f.buildPendingSession().blocks[0].elapsedSeconds,60);
}
{
  const f=fixture();await f.workout(structured([block('amrap',[exercise('a','manual',{sets:1,restSeconds:0}),exercise('b','manual',{sets:1,restSeconds:0})],{mode:'amrap',durationSeconds:60})]));
  f.elapse(10000);f.advance();f.elapse(5000);f.runBlockAction();f.runBlockAction();
  assert.equal(f.item.phase,'amrap-result');assert.equal(f.S.sessionAmrapResults.amrap.rounds,1);
  f.elapse(100000);f.advance();
  const session=f.normalizeHistorySession(f.buildPendingSession());
  assert.equal(session.durationSeconds,15);assert.equal(session.blocks[0].stoppedEarly,true);
  assert.equal(session.blocks[0].rounds,1);
}

// Finish at the actual deadline, even after a very long callback gap.
{
  const f=fixture();await f.workout(structured([block('timed',[exercise('hold','timed',{sets:3,restSeconds:10})])]));
  f.elapse(600000);assert.equal(f.S.running,false);
  assert.equal(f.buildPendingSession().durationSeconds,90);
  assert.equal(f.S.queue.filter(q=>q.completed).length,3);
}

// Catch-up stays iterative for large imported plans and works for standalone timers.
{
  const f=fixture();
  await f.workout(structured([block('many-timed-sets',Array.from({length:100},(_,i)=>exercise('hold-'+i,'timed',{sets:100,seconds:1,restSeconds:0})))]));
  f.elapse(10000000);
  assert.equal(f.S.running,false,'Large timed imports must catch up without recursive stack growth');
  assert.equal(f.normalizeHistorySession(f.buildPendingSession()).blocks[0].exercises.length,100);
}
for (const mode of ['circuit','rest','stopwatch']) {
  const f=fixture();
  if(mode==='stopwatch')f.cfg.stopwatch.limit=1;
  f.timer(mode);f.elapse(600000);
  assert.equal(f.S.running,false,mode+' should finish after its deadline');
}

// Full workouts from all three distributed tracks traverse real imported structures.
let packDays=0;
for (const track of ['momentum','rise','forge']) {
  const pack=JSON.parse(await readFile(new URL('workouts/packs/'+track+'-cycle-4-week-3.workout-pack.json',root),'utf8'));
  for (const day of pack.workouts) {
    const f=fixture();await f.workout(day.workout,true);
    assert.equal(f.item.phase,'prep');assert.equal(f.item.seconds,5);
    let steps=0;
    while(f.S.running && steps++<20000){
      const item=f.item;
      if(item.phase==='amrap-result'){f.advance();}
      else if(item.phase==='transition'){f.elapse(123000);assert.equal(f.item,item);f.advance();}
      else if(item.completion==='manual'){f.elapse(5000);if(f.item===item)f.advance();}
      else f.elapse(item.seconds*1000);
    }
    assert.ok(steps<20000,track+' / '+day.id+' must finish');
    const session=f.normalizeHistorySession(f.buildPendingSession());
    assert.equal(session.blocks.length,day.workout.blocks.length);
    assert.ok(session.blocks.every(b=>b.exercises.length));
    const end=session.completedAt;f.elapse(600000);assert.equal(f.buildPendingSession().completedAt,end);
    assert.ok(f.formatWorkoutOverview(session));
    packDays++;
  }
}

// Durable history writes: IndexedDB, fallback, total failure, retry and merge.
const savedFixture=fixture();await savedFixture.workout(basic);savedFixture.advance();savedFixture.skipCurrent();savedFixture.skipCurrent();savedFixture.skipCurrent();
const valid=savedFixture.normalizeHistorySession(savedFixture.buildPendingSession());
{
  const f=fixture();f.setDb(true);f.setQuota(true);await f.historyPut(valid);
  assert.deepEqual((await f.historyAll()).map(s=>s.id),[valid.id]);
}
{
  const f=fixture();f.setDb(true,true);await f.historyPut(valid);
  assert.deepEqual((await f.historyAll()).map(s=>s.id),[valid.id]);
}
{
  const f=fixture();f.setQuota(true);
  await assert.rejects(f.historyPut(valid),/Could not save workout history/);
  await assert.rejects(f.historyMerge([valid]),/Could not save workout history/);
  assert.deepEqual(await f.historyAll(),[]);
  f.S.pendingSession=structuredClone(valid);f.S.screen='log';f.$('#logUnit').value='lb';f.$('#logNotes').value='Keep my result';
  await f.saveSessionLog();
  assert.equal(f.S.screen,'log');assert.equal(f.S.pendingSession.notes,'Keep my result');
  assert.match(f.$('#logMsg').textContent,/Could not save/);assert.equal(f.$('#logSave').disabled,false);
  f.setQuota(false);await f.saveSessionLog();assert.equal(f.S.screen,'done');
  const rows=await f.historyAll();assert.equal(rows.length,1);assert.equal(rows[0].notes,'Keep my result');
  assert.deepEqual(await f.historyMerge([valid]),{added:0,skipped:1});
}

console.log('Runtime regressions passed: completed/skipped sets, weight units, storage failure/retry, timer catch-up, pause/gates, EMOM/AMRAP, fixed completion times, and '+packDays+' imported pack days.');
