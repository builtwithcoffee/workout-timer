import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const extract = name => {
  const match = html.match(new RegExp(`  (?:async )?function ${name}\\([^]*?\\n  \\}`));
  if (!match) throw new Error(`Missing ${name}`);
  return match[0];
};
const constants = ['FORMAT', 'PLAN_VERSION', 'TRACK_KEY', 'PACK_FORMAT', 'PACKS_KEY', 'PACK_EDITIONS_KEY', 'MAX_PACK_BYTES', 'MAX_WORKOUT_QUEUE_ITEMS', 'AMRAP_QUEUE_ROUNDS', 'HEX']
  .map(name => html.match(new RegExp(`  const ${name} = [^\\n]+`))[0]).join('\n');
const helpers = html.slice(html.indexOf('  const defaultTheme ='), html.indexOf('  function textOn('));
const packSource = html.split('  /* ---------- imported workout packs ---------- */')[1].split('  /* ---------- end imported workout packs ---------- */')[0];
const functions = ['validateBasics', 'estimateWorkoutQueue', 'assertWorkoutQueueBudget', 'normalizeWorkout', 'normalizeCircuit', 'splitLegacy', 'setWorkoutPlan', 'workoutFile', 'circuitFile', 'persistPlans', 'prepareStructuredForEditing', 'loadPlanFile', 'applyBuiltInWorkout', 'normalizeWorkoutCatalog', 'loadCatalogWorkout', 'addCatalogText', 'makeDayRow', 'renderTrackChooser', 'renderTrackDays', 'renderWorkoutCatalogView', 'renderWorkoutCatalog'].map(extract).join('\n');

function fixture(saved = new Map()) {
  // Use the production handlers and renderer with a minimal DOM/storage boundary.
  return Function('saved', constants + '\n' + helpers + '\n' + packSource + '\n' + functions + `
    const WORK_SWATCHES=['#f04e23'], REST_SWATCHES=['#1668c4'];
    const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
    class Element {
      constructor(tag='div') { this.tag=tag; this.children=[]; this.handlers={}; this.classList={add(){},remove(){},toggle(){}}; }
      appendChild(child) { this.children.push(child); return child; }
      setAttribute(name,value) { this[name]=value; }
      removeAttribute(name) { delete this[name]; }
      addEventListener(name,fn) { this.handlers[name]=fn; }
      add(option) { this.children.push(option); }
      set innerHTML(value) { this.children=[]; this.html=value; }
      get innerHTML() { return this.html||''; }
    }
    const elements=new Map(), $=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
    const document={createElement:tag=>new Element(tag)};
    const Option=function(text,value){this.textContent=text;this.value=value;};
    let quotaFailure=false, fetchFailure=false, confirms=true, fetches=0;
    const localStorage={setItem(k,v){if(quotaFailure)throw new Error('QuotaExceeded');saved.set(k,v);}};
    const store={get(k,f){try{return saved.has(k)?JSON.parse(saved.get(k)):f;}catch{return f;}},set(k,v){localStorage.setItem(k,JSON.stringify(v));},remove(k){saved.delete(k);}};
    const window={matchMedia:()=>({matches:false}),scrollTo(){},confirm:()=>confirms};
    const cfg={workout:{prep:5},circuit:{prep:5,rounds:1}};
    let importedPacks=readImportedPacks(), activePackWorkout=null, selectedPackEditions=store.get(PACK_EDITIONS_KEY,{});
    let workoutCatalog=null,selectedTrackId='',workoutSelectionPending=true,editingStructuredWorkout=false,pendingLoadKind='workout';
    let workoutPlan,workoutTheme={work:'#f04e23',rest:'#1668c4'},circuitPlan={name:'Circuit',segments:[{label:'Station',phase:'work',seconds:30}]},circuitTheme={...workoutTheme};
    const renderSwatches=()=>{},renderWorkoutExercises=()=>{},renderCircuitTiles=()=>{},renderFields=()=>{},renderSummaries=()=>{},selectMode=()=>{},focusCatalogTarget=()=>{};
    const messages=[];
    const setPlanMsg=(kind,text,error)=>messages.push({text,error});
    const setCatalogMsg=(text,error)=>messages.push({text,error});
    const fetchSmallJson=async()=>{fetches++;if(fetchFailure)throw new Error('offline');throw new Error('Unexpected network request');};
    return {normalizeWorkoutPack,importWorkoutPack,readImportedPacks,availableWorkoutCatalog,trackWorkoutPlans,selectedTrackPack,removeImportedPack,loadPlanFile,loadCatalogWorkout,renderWorkoutCatalog,renderWorkoutCatalogView,applyBuiltInWorkout,prepareStructuredForEditing,persistPlans,workoutFile,saved,elements,messages,
      get packs(){return importedPacks;},get plan(){return workoutPlan;},get active(){return activePackWorkout;},get track(){return selectedTrackId;},get fetches(){return fetches;},
      setCatalog(raw){workoutCatalog=normalizeWorkoutCatalog(raw);},setQuota(value){quotaFailure=value;},setOffline(){fetchFailure=true;},setConfirm(value){confirms=value;},
      selectEdition(track,id){selectedTrackId=track;selectedPackEditions[track]=id;},
      restoreCurrent(){const raw=store.get('workoutTimerWorkoutPlanV7',null);if(raw){setWorkoutPlan(normalizeWorkout(raw));workoutSelectionPending=false;if(importedWorkoutSource(raw.packSource))activePackWorkout=raw.packSource;}},
      walk(node){return [node,...(node.children||[]).flatMap(child=>this.walk(child))];}
    };
  `)(saved);
}
const raw = JSON.parse(await readFile(new URL('workouts/packs/forge-2026-09-03.workout-pack.json', root), 'utf8'));
const catalog = JSON.parse(await readFile(new URL('workouts/catalog.json', root), 'utf8'));
const f = fixture();
f.setCatalog(catalog);
const initial = JSON.parse(await readFile(new URL('workouts/momentum/push-focus.workout.json', root), 'utf8'));
const upload = async (target, value, name='pack.json') => {
  const body=JSON.stringify(value);
  await target.loadPlanFile({target:{files:[{name,size:Buffer.byteLength(body),text:async()=>body}]}});
};
await upload(f, initial);
const workingBefore=f.workoutFile();
const history='[{"id":"existing-session"}]';f.saved.set('workoutTimerHistoryFallbackV1',history);
await upload(f,raw);
assert.equal(f.packs.length,1);
assert.equal(f.track,'forge');
assert.deepEqual(f.workoutFile(),workingBefore,'Import must not replace current workout');
assert.equal(f.saved.get('workoutTimerHistoryFallbackV1'),history);
assert.deepEqual(f.availableWorkoutCatalog().tracks.map(t=>t.id),['momentum','rise','forge']);
const forge=()=>f.availableWorkoutCatalog().tracks.find(t=>t.id==='forge');
assert.deepEqual(f.trackWorkoutPlans(forge()).map(p=>p.name),['Lower Body Focus Day','Dip Focus Day','Pull Focus Day','Push Focus Day']);
let rendered=f.walk(f.elements.get('#wPlanLibrary'));
assert.equal(rendered.filter(el=>el.className==='day-row').length,5,'Four days plus existing optional cardio');
assert.ok(rendered.some(el=>el.id==='wPackEdition'));
const push=f.trackWorkoutPlans(forge())[3];
await f.loadCatalogWorkout(push,{innerHTML:'Push',setAttribute(){},removeAttribute(){}});
assert.equal(f.fetches,0,'Imported day must not fetch a file');
f.prepareStructuredForEditing();
f.plan.blocks[1].items[0].setPlan[0].target='25 reps';f.persistPlans();
await f.loadCatalogWorkout(f.trackWorkoutPlans(forge())[1],{innerHTML:'Dip',setAttribute(){},removeAttribute(){}});
await f.loadCatalogWorkout(f.trackWorkoutPlans(forge())[3],{innerHTML:'Push',setAttribute(){},removeAttribute(){}});
assert.equal(f.plan.blocks[1].items[0].setPlan[0].target,'25 reps');
await upload(f,raw);
assert.equal(f.packs.length,1);
assert.equal(f.packs[0].edits['push-focus'].blocks[1].items[0].setPlan[0].target,'25 reps');
const next=structuredClone(raw);next.id='forge-next-week';next.edition='Next week';next.workouts[3].workout.blocks[2].rounds=9;
await upload(f,next);
assert.equal(f.packs.length,2);
assert.equal(f.trackWorkoutPlans(forge())[3].workout.blocks[2].rounds,9);
assert.equal(f.plan.blocks[1].items[0].setPlan[0].target,'25 reps','Weekly import preserves the open workout');
f.selectEdition('forge',raw.id);
assert.equal(f.trackWorkoutPlans(forge())[3].workout.blocks[1].items[0].setPlan[0].target,'25 reps');
const beforeFailure=JSON.stringify(f.packs);
const conflicting=structuredClone(raw);conflicting.edition='Changed';
assert.throws(()=>f.importWorkoutPack(conflicting),/new ID/);
const invalid=structuredClone(next);invalid.id='forge-invalid';invalid.workouts[3].workout.blocks[1].items[0].setPlan[0].restSeconds=-1;
assert.throws(()=>f.importWorkoutPack(invalid),/rest/);
assert.equal(JSON.stringify(f.packs),beforeFailure,'Validation is all-or-nothing');
await f.loadPlanFile({target:{files:[{name:'oversized.json',size:512*1024+1,text:async()=>{throw new Error('Must not read oversized file');}}]}});
assert.match(f.messages.at(-1).text,/512 KB/);
await f.loadPlanFile({target:{files:[{name:'broken.json',size:3,text:async()=>'{no'}]}});
assert.equal(f.messages.at(-1).error,true);
assert.equal(JSON.stringify(f.packs),beforeFailure);
const oversizedWorkout=structuredClone(raw);oversizedWorkout.workouts[0].workout.name='a'.repeat(102401);
assert.throws(()=>f.normalizeWorkoutPack(oversizedWorkout),/100 KB/);

const duplicate=structuredClone(raw);duplicate.workouts[1].id=duplicate.workouts[0].id;
assert.throws(()=>f.normalizeWorkoutPack(duplicate),/unique/);
const hostile=structuredClone(raw);hostile.id='../escape';assert.throws(()=>f.normalizeWorkoutPack(hostile),/Pack ID/);
const future=structuredClone(raw);future.version=2;assert.throws(()=>f.normalizeWorkoutPack(future),/supported/);
const huge=structuredClone(raw);huge.workouts=Array(21).fill(huge.workouts[0]);assert.throws(()=>f.normalizeWorkoutPack(huge),/1 to 20/);
const overQueue=structuredClone(raw);overQueue.workouts[0].workout.blocks[2].rounds=100;overQueue.workouts[0].workout.blocks[2].items[0].sets=100;overQueue.workouts[0].workout.blocks[2].items[0].restSeconds=30;
assert.throws(()=>f.normalizeWorkoutPack(overQueue),/timer steps/);
const quota=structuredClone(raw);quota.id='forge-quota';f.setQuota(true);
assert.throws(()=>f.importWorkoutPack(quota),/Could not save/);
assert.equal(JSON.stringify(f.packs),beforeFailure);
f.plan.blocks[1].items[0].setPlan[0].target='26 reps';
await f.loadCatalogWorkout(f.trackWorkoutPlans(forge())[1],{innerHTML:'Dip',setAttribute(){},removeAttribute(){}});
assert.equal(f.plan.name,'Push Focus Day','A failed draft write must prevent switching workouts');
f.setQuota(false);f.persistPlans();
const restored=fixture(new Map(f.saved));restored.restoreCurrent();restored.setOffline();await restored.renderWorkoutCatalog();
assert.equal(restored.packs.length,2);assert.equal(restored.plan.blocks[1].items[0].setPlan[0].target,'26 reps');
assert.deepEqual(restored.active,{packId:raw.id,workoutId:'push-focus'});
assert.equal(restored.availableWorkoutCatalog().tracks[0].id,'forge','Packs remain available without the built-in catalog');
restored.selectEdition('forge',raw.id);restored.renderWorkoutCatalogView();
assert.equal(restored.walk(restored.elements.get('#wPlanLibrary')).filter(el=>el.className==='day-row').length,4);
restored.setConfirm(false);restored.removeImportedPack(raw.id);assert.equal(restored.packs.length,2);
restored.setConfirm(true);restored.removeImportedPack(raw.id);assert.equal(restored.packs.length,1);assert.equal(restored.active,null);assert.equal(restored.plan.name,'Push Focus Day');
assert.equal(restored.saved.get('workoutTimerHistoryFallbackV1'),history);
// Existing tracks can receive weekly packs without replacing their supplied catalog.
const momentum=structuredClone(raw);momentum.id='momentum-test';momentum.track={id:'momentum',name:'Momentum'};
f.importWorkoutPack(momentum);const mt=f.availableWorkoutCatalog().tracks.find(t=>t.id==='momentum');
assert.equal(mt.plans.length,4);assert.equal(mt.packs.length,1);f.selectEdition('momentum','');assert.equal(f.trackWorkoutPlans(mt),mt.plans);
// Prototype-like IDs must never resolve to inherited object properties.
const special=structuredClone(raw);special.id='constructor';special.track.id='constructor';special.workouts[0].id='constructor';
f.importWorkoutPack(special);assert.equal(f.trackWorkoutPlans(f.availableWorkoutCatalog().tracks.find(t=>t.id==='constructor'))[0].name,'Lower Body Focus Day');
for(const file of await readdir(new URL('workouts/packs/',root))) if(file.endsWith('.workout-pack.json')) f.normalizeWorkoutPack(JSON.parse(await readFile(new URL('workouts/packs/'+file,root),'utf8')));
console.log('Verified pack import/navigation, weekly editions, edit persistence, reload/offline access, duplicate/conflict handling, validation, storage failure, removal, and legacy single-workout import.');
