import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const extract = name => {
  const match = html.match(new RegExp(`  (?:async )?function ${name}\\([^]*?\\n  \\}`));
  if (!match) throw new Error(`Missing ${name}`);
  return match[0];
};
const constants = ['FORMAT', 'PLAN_VERSION', 'TRACK_KEY', 'PACK_FORMAT', 'PACKS_KEY', 'PACK_EDITIONS_KEY', 'STARTER_WORKOUTS_KEY', 'MY_WORKOUT_KEY', 'SELECTION_PENDING_KEY', 'MAX_PACK_BYTES', 'MAX_WORKOUT_QUEUE_ITEMS', 'AMRAP_QUEUE_ROUNDS', 'HEX']
  .map(name => html.match(new RegExp(`  const ${name} = [^\\n]+`))[0]).join('\n');
const helpers = html.slice(html.indexOf('  const defaultTheme ='), html.indexOf('  function textOn('));
const packSource = html.split('  /* ---------- imported workout packs ---------- */')[1].split('  /* ---------- end imported workout packs ---------- */')[0];
const functions = ['validateBasics', 'estimateWorkoutQueue', 'assertWorkoutQueueBudget', 'normalizeWorkout', 'normalizeCircuit', 'splitLegacy', 'setWorkoutPlan', 'workoutFile', 'circuitFile', 'persistPlans', 'restorePlans', 'createWorkout', 'disarmNewWorkout', 'defaultWorkout', 'defaultStructuredWorkout', 'prepareStructuredForEditing', 'loadPlanFile', 'applyBuiltInWorkout', 'normalizeWorkoutCatalog', 'loadCatalogWorkout', 'addCatalogText', 'makeDayRow', 'renderTrackChooser', 'renderTrackDays', 'renderWorkoutCatalogView', 'renderWorkoutCatalog'].map(extract).join('\n');

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
      showModal() { this.open=true; }
      close() { this.open=false; }
      focus() {}
      scrollIntoView() {}
      set innerHTML(value) { this.children=[]; this.html=value; }
      get innerHTML() { return this.html||''; }
    }
    const elements=new Map(), $=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
    const document={createElement:tag=>new Element(tag),body:new Element('body')};
    const S={screen:'home'};
    const Option=function(text,value){this.textContent=text;this.value=value;};
    let quotaFailure=false, fetchFailure=false, confirms=true, fetches=0, fetchHandler=null;
    const localStorage={setItem(k,v){if(quotaFailure)throw new Error('QuotaExceeded');saved.set(k,v);}};
    const store={get(k,f){try{return saved.has(k)?JSON.parse(saved.get(k)):f;}catch{return f;}},set(k,v){localStorage.setItem(k,JSON.stringify(v));},remove(k){saved.delete(k);}};
    const window={matchMedia:()=>({matches:false}),scrollTo(){},confirm:()=>confirms};
    const cfg={workout:{prep:5},circuit:{prep:5,rounds:1}};
    let newWorkoutArmed='',newWorkoutTimer=0;
    let starterWorkouts=readStarterWorkouts(),workoutLoadGeneration=0;
    let importedPacks=readImportedPacks(), activePackWorkout=null, selectedPackEditions=store.get(PACK_EDITIONS_KEY,{});
    let workoutCatalog=null,selectedTrackId=store.get(TRACK_KEY,''),workoutSelectionPending=true,editingStructuredWorkout=false,pendingLoadKind='workout';
    let workoutPlan,workoutTheme={work:'#f04e23',rest:'#1668c4'},circuitPlan={name:'Circuit',segments:[{label:'Station',phase:'work',seconds:30}]},circuitTheme={...workoutTheme};
    const renderSwatches=()=>{},renderWorkoutExercises=()=>{},renderCircuitTiles=()=>{},renderFields=()=>{},renderSummaries=()=>{},selectMode=()=>{},focusCatalogTarget=()=>{};
    const messages=[];
    const setPlanMsg=(kind,text,error)=>messages.push({text,error});
    const setCatalogMsg=(text,error)=>messages.push({text,error});
    const fetchSmallJson=async file=>{fetches++;if(fetchFailure)throw new Error('offline');if(fetchHandler)return fetchHandler(file);throw new Error('Unexpected network request');};
    return {createWorkout,restoreOriginalWorkout,resumeMyWorkout,renderWorkoutOwnership,clearWorkoutSelection,saveCurrentWorkout,openWorkoutManager,closeWorkoutManager,renderWorkoutManager,selectWorkoutPack,loadManagerPack,requestPackRemoval,cancelPackRemoval,setManagerBusy,normalizeWorkoutPack,importWorkoutPack,readImportedPacks,availableWorkoutCatalog,trackWorkoutPlans,selectedTrackPack,removeImportedPack,loadPlanFile,loadCatalogWorkout,renderWorkoutCatalog,renderWorkoutCatalogView,applyBuiltInWorkout,prepareStructuredForEditing,persistPlans,workoutFile,saved,elements,messages,
      get pending(){return workoutSelectionPending;},get starters(){return starterWorkouts;},get packs(){return importedPacks;},get plan(){return workoutPlan;},get active(){return activePackWorkout;},get track(){return selectedTrackId;},get fetches(){return fetches;},
      setFetch(fn){fetchHandler=fn;},setEditing(value){editingStructuredWorkout=value;},setCatalog(raw){workoutCatalog=normalizeWorkoutCatalog(raw);},setQuota(value){quotaFailure=value;},setOffline(){fetchFailure=true;},setConfirm(value){confirms=value;},
      selectEdition(track,id){selectedTrackId=track;selectedPackEditions[track]=id;},
      restoreCurrent:restorePlans,
      walk(node){return [node,...(node.children||[]).flatMap(child=>this.walk(child))];}
    };
  `)(saved);
}
const raw = JSON.parse(await readFile(new URL('workouts/packs/forge-2026-09-03.workout-pack.json', root), 'utf8'));
const catalog = JSON.parse(await readFile(new URL('workouts/catalog.json', root), 'utf8'));
const f = fixture();
f.setCatalog(catalog);
for (const track of ['momentum', 'rise']) {
  f.selectEdition(track, '');
  f.renderWorkoutCatalogView();
  const nodes = f.walk(f.elements.get('#wPlanLibrary'));
  const selector = nodes.find(el => el.id === 'wPackEdition');
  assert.deepEqual(selector.children.map(option => option.textContent), ['Starter Pack']);
  assert.ok(nodes.indexOf(selector) < nodes.findIndex(el => el.className === 'day-row'), 'Pack selection precedes workout days');
}
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
assert.deepEqual(f.trackWorkoutPlans(forge()).map(p=>p.summary),catalog.tracks[0].plans.map(p=>p.summary),'Imported day descriptions match the included tracks');
assert.deepEqual(f.availableWorkoutCatalog().optional,catalog.optional,'Forge uses the same shared Optional Cardio entry');

let rendered=f.walk(f.elements.get('#wPlanLibrary'));
assert.equal(rendered.filter(el=>el.className==='day-row').length,5,'Four days plus existing optional cardio');
assert.ok(rendered.some(el=>el.id==='wPackEdition'));
assert.ok(rendered.findIndex(el=>el.id==='wPackEdition') < rendered.findIndex(el=>el.className==='day-row'));
assert.deepEqual(rendered.filter(el=>el.className==='day-row-meta').map(el=>f.walk(el).filter(node=>node.textContent).map(node=>node.textContent).join(' · ')),[...catalog.tracks[0].plans.map(p=>p.summary),catalog.optional[0].summary]);
assert.equal(rendered.filter(el=>el.className==='day-optional').length,1,'Only one Optional section is displayed');

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
f.setQuota(false);
await f.loadCatalogWorkout(f.trackWorkoutPlans(forge())[3],{innerHTML:'Push',setAttribute(){},removeAttribute(){}});
f.setQuota(true);
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
restored.openWorkoutManager();restored.requestPackRemoval(raw.id);restored.cancelPackRemoval();assert.equal(restored.packs.length,2);
restored.removeImportedPack(raw.id);assert.equal(restored.packs.length,1);assert.equal(restored.active,null);assert.equal(restored.plan.name,'Push Focus Day');
assert.equal(restored.saved.get('workoutTimerHistoryFallbackV1'),history);
// Existing tracks can receive weekly packs without replacing their supplied catalog.
const momentum=structuredClone(raw);momentum.id='momentum-test';momentum.track={id:'momentum',name:'Momentum'};
f.importWorkoutPack(momentum);const mt=f.availableWorkoutCatalog().tracks.find(t=>t.id==='momentum');
assert.equal(mt.plans.length,4);assert.equal(mt.packs.length,1);f.selectEdition('momentum','');assert.deepEqual(f.trackWorkoutPlans(mt),mt.plans);
// Prototype-like IDs must never resolve to inherited object properties.
const special=structuredClone(raw);special.id='constructor';special.track.id='constructor';special.workouts[0].id='constructor';
f.importWorkoutPack(special);assert.equal(f.trackWorkoutPlans(f.availableWorkoutCatalog().tracks.find(t=>t.id==='constructor'))[0].name,'Lower Body Focus Day');

// Management uses the real dialog handlers and preserves the loaded workout.
const manager=fixture();manager.setCatalog(catalog);
await upload(manager,initial);
const beforeManager=manager.workoutFile();
manager.openWorkoutManager();
let managerNodes=manager.walk(manager.elements.get('#workoutManagerPacks'));
assert.equal(managerNodes.filter(el=>el.className==='manager-pack').length,2);
assert.equal(managerNodes.filter(el=>el.className==='manager-remove').length,0,'Starter packs cannot be removed');
assert.deepEqual(manager.workoutFile(),beforeManager);
const packUpload=async value=>manager.loadManagerPack({target:{files:[{size:JSON.stringify(value).length,text:async()=>JSON.stringify(value)}]}});
await packUpload(raw);
assert.equal(manager.elements.get('#workoutManager').open,false,'Success returns to day selection');
assert.equal(manager.track,'forge');assert.deepEqual(manager.workoutFile(),beforeManager);
manager.openWorkoutManager();
await packUpload(raw);assert.equal(manager.packs.length,1,'Duplicate manager imports are harmless');
manager.openWorkoutManager();
await packUpload(initial);assert.equal(manager.elements.get('#workoutManager').open,true);
assert.match(manager.elements.get('#workoutManagerMsg').textContent,/Choose a workout pack/);
assert.equal(manager.packs.length,1);
await manager.loadManagerPack({target:{files:[]}});assert.equal(manager.packs.length,1);
await manager.loadManagerPack({target:{files:[{size:5,text:async()=>'{nope'}]}});
assert.equal(manager.elements.get('#workoutManager').open,true);
assert.equal(manager.elements.get('#wImportPack').disabled,false);
let finishRead;
const pendingImport=manager.loadManagerPack({target:{files:[{size:100,text:()=>new Promise(resolve=>finishRead=resolve)}]}});
manager.closeWorkoutManager();assert.equal(manager.elements.get('#workoutManager').open,true,'Busy import blocks dismissal');
assert.equal(manager.selectWorkoutPack('momentum','',true),false,'Busy import blocks pack switches');
finishRead(JSON.stringify(next));await pendingImport;
assert.equal(manager.packs.length,2);
manager.openWorkoutManager();manager.setQuota(true);
const third=structuredClone(next);third.id='forge-third-week';
await packUpload(third);assert.equal(manager.packs.length,2);
assert.equal(manager.elements.get('#workoutManager').open,true);
assert.match(manager.elements.get('#workoutManagerMsg').textContent,/Could not save/);
manager.setQuota(false);
manager.selectWorkoutPack('forge',next.id,true);
manager.openWorkoutManager();manager.removeImportedPack(raw.id);
assert.equal(manager.selectedTrackPack(manager.availableWorkoutCatalog().tracks.find(t=>t.id==='forge')).pack.id,next.id,'Removing an older week preserves the selected week');
assert.equal(manager.elements.get('#workoutManager').open,true);
manager.importWorkoutPack(raw);manager.importWorkoutPack(next);
manager.openWorkoutManager();manager.removeImportedPack(next.id);
assert.equal(manager.selectedTrackPack(manager.availableWorkoutCatalog().tracks.find(t=>t.id==='forge')).pack.id,raw.id,'Selected removal falls back to remaining imported week');
manager.removeImportedPack(raw.id);assert.equal(manager.track,'','Last pack removal returns to track selection');
assert.deepEqual(manager.workoutFile(),beforeManager);
manager.importWorkoutPack(momentum);
manager.openWorkoutManager();manager.removeImportedPack(momentum.id);
assert.equal(manager.track,'momentum');
assert.equal(manager.selectedTrackPack(manager.availableWorkoutCatalog().tracks.find(t=>t.id==='momentum')),null,'Selected removal falls back to Starter Pack');
manager.closeWorkoutManager();assert.equal(manager.elements.get('#workoutManager').open,false);
// Save failures during Use pack and removal leave the current imported edit intact.
manager.importWorkoutPack(raw);
await manager.loadCatalogWorkout(manager.trackWorkoutPlans(manager.availableWorkoutCatalog().tracks.find(t=>t.id==='forge'))[3],{innerHTML:'Push',setAttribute(){},removeAttribute(){}});
manager.prepareStructuredForEditing();manager.plan.blocks[1].items[0].setPlan[0].target='29 reps';
manager.openWorkoutManager();manager.setQuota(true);
assert.equal(manager.selectWorkoutPack('momentum','',true),false);
assert.equal(manager.track,'forge');assert.equal(manager.elements.get('#workoutManager').open,true);
manager.removeImportedPack(raw.id);assert.equal(manager.packs.length,1);
manager.setQuota(false);manager.selectWorkoutPack('momentum','',true);
assert.equal(manager.packs[0].edits['push-focus'].blocks[1].items[0].setPlan[0].target,'29 reps');
manager.setOffline();await manager.renderWorkoutCatalog();manager.openWorkoutManager();
assert.equal(manager.walk(manager.elements.get('#workoutManagerPacks')).filter(el=>el.className==='manager-pack').length,1,'Stored packs remain manageable offline');

// BuiltSimple ownership: day/week selection, original restore and personal drafts.
const flow=fixture();flow.setCatalog(catalog);
const button=()=>({innerHTML:'Day',setAttribute(){},removeAttribute(){}});
await upload(flow,initial);
flow.plan.name='My own push workout';flow.persistPlans();
flow.importWorkoutPack(raw);
assert.equal(flow.pending,true,'Importing a new week requires day selection');
assert.equal(JSON.parse(flow.saved.get('workoutTimerMyWorkoutV1')).name,'My own push workout');
const flowTrack=()=>flow.availableWorkoutCatalog().tracks.find(t=>t.id==='forge');
await flow.loadCatalogWorkout(flow.trackWorkoutPlans(flowTrack())[3],button());
flow.plan.blocks[1].items[0].setPlan[0].target='24 reps';flow.persistPlans();
flow.renderWorkoutOwnership();
assert.equal(flow.elements.get('#wSave').disabled,true,'Pack days cannot be exported as new personal workouts');
assert.match(flow.elements.get('#wWorkoutContext').textContent,/Forge/);
flow.openWorkoutManager();flow.closeWorkoutManager();
assert.equal(flow.pending,false,'Opening and dismissing management keeps the day');
flow.selectWorkoutPack('forge',raw.id,true);
assert.equal(flow.pending,false,'Choosing the same pack retains its selected day');
flow.importWorkoutPack(raw);assert.equal(flow.pending,false,'Reimporting the same edition keeps the day and edits');
flow.importWorkoutPack(next);assert.equal(flow.pending,true);
const pendingReload=fixture(new Map(flow.saved));pendingReload.restoreCurrent();
assert.equal(pendingReload.pending,true,'Reload must not bring back a workout from the previous edition');
flow.selectWorkoutPack('forge',raw.id);
await flow.loadCatalogWorkout(flow.trackWorkoutPlans(flowTrack())[1],button());
flow.plan.name='Edited dip';flow.persistPlans();
await flow.loadCatalogWorkout(flow.trackWorkoutPlans(flowTrack())[3],button());
flow.saved.set('workoutTimerHistoryFallbackV1',history);
flow.setQuota(true);flow.restoreOriginalWorkout();
assert.equal(flow.plan.blocks[1].items[0].setPlan[0].target,'24 reps','Failed restore preserves the edit');
flow.setQuota(false);flow.restoreOriginalWorkout();
assert.equal(flow.packs.find(e=>e.pack.id===raw.id).edits['push-focus'],undefined);
assert.equal(flow.plan.blocks[1].items[0].setPlan[0].target,raw.workouts[3].workout.blocks[1].items[0].setPlan[0].target);
assert.equal(flow.packs.find(e=>e.pack.id===raw.id).edits['dip-focus'].name,'Edited dip','Restore affects only one day');
assert.equal(flow.packs.find(e=>e.pack.id===next.id).pack.edition,next.edition,'Restore does not affect another week');
assert.equal(flow.saved.get('workoutTimerHistoryFallbackV1'),history);
flow.resumeMyWorkout();
assert.equal(flow.plan.name,'My own push workout');assert.equal(flow.active,null);
flow.renderWorkoutOwnership();assert.equal(flow.elements.get('#wSave').disabled,false);
assert.equal(flow.elements.get('#wWorkoutContext').textContent,'My workouts');

// Starter originals are cached separately from edits, including offline restore.
const starter=fixture();starter.setCatalog(catalog);
const fileMap=new Map();
for(const plan of [...catalog.tracks.flatMap(t=>t.plans),...catalog.optional]) fileMap.set(plan.file,JSON.parse(await readFile(new URL(plan.file,root),'utf8')));
starter.setFetch(file=>fileMap.get(file));
starter.selectWorkoutPack('momentum','');
const starterTrack=()=>starter.availableWorkoutCatalog().tracks.find(t=>t.id==='momentum');
await starter.loadCatalogWorkout(starter.trackWorkoutPlans(starterTrack())[3],button());
assert.equal(starter.starters.length,1);assert.equal(starter.pending,false);
starter.plan.name='My starter push';starter.persistPlans();
const savedStarter=fixture(new Map(starter.saved));savedStarter.restoreCurrent();savedStarter.setCatalog(catalog);
assert.equal(savedStarter.plan.name,'My starter push');assert.ok(savedStarter.active.starterTrackId);
starter.selectWorkoutPack('rise','');assert.equal(starter.pending,true);
starter.selectWorkoutPack('momentum','');starter.setOffline();
const starterFetches=starter.fetches;
await starter.loadCatalogWorkout(starter.trackWorkoutPlans(starterTrack())[3],button());
assert.equal(starter.plan.name,'My starter push');assert.equal(starter.fetches,starterFetches,'Saved starter day works offline');
starter.setQuota(true);starter.restoreOriginalWorkout();assert.equal(starter.plan.name,'My starter push');
starter.setQuota(false);starter.restoreOriginalWorkout();assert.equal(starter.plan.name,initial.name);
assert.equal(starter.starters[0].edited,undefined);
assert.equal(starter.fetches,starterFetches,'Restoring a starter does not require a download');
savedStarter.plan.name='Still editing';savedStarter.setQuota(true);
assert.equal(savedStarter.selectWorkoutPack('rise',''),false);
assert.equal(savedStarter.pending,false,'Failed starter save prevents clearing the editor');
savedStarter.setQuota(false);savedStarter.persistPlans();
await savedStarter.loadCatalogWorkout(catalog.optional[0],button()); // no network handler: current day must survive
assert.equal(savedStarter.plan.name,'Still editing');

// Creation stays separate and never changes a pack's stored day.
flow.selectWorkoutPack('forge',raw.id);
await flow.loadCatalogWorkout(flow.trackWorkoutPlans(flowTrack())[1],button());
const retainedDip=JSON.stringify(flow.packs[0].edits['dip-focus']);
flow.createWorkout('basic');flow.createWorkout('basic');
assert.equal(flow.plan.layout,'simple');assert.equal(flow.active,null);assert.equal(flow.pending,false);
assert.equal(JSON.stringify(flow.packs[0].edits['dip-focus']),retainedDip);
flow.createWorkout('structured');flow.createWorkout('structured');
assert.equal(flow.plan.layout,'blocks');assert.equal(flow.active,null);
assert.equal(JSON.parse(flow.saved.get('workoutTimerMyWorkoutV1')).name,'Structured Workout');

// Shared optional cardio gets its own original/edit and clears on a track change.
const cardio=fixture();cardio.setCatalog(catalog);cardio.setFetch(file=>fileMap.get(file));
cardio.selectWorkoutPack('momentum','');await cardio.loadCatalogWorkout(catalog.optional[0],button());
cardio.plan.name='My optional cardio';cardio.persistPlans();
cardio.selectWorkoutPack('rise','');assert.equal(cardio.pending,true);
await cardio.loadCatalogWorkout(catalog.optional[0],button());assert.equal(cardio.plan.name,fileMap.get(catalog.optional[0].file).name);
cardio.selectWorkoutPack('momentum','');cardio.setOffline();
await cardio.loadCatalogWorkout(catalog.optional[0],button());assert.equal(cardio.plan.name,'My optional cardio');
cardio.restoreOriginalWorkout();assert.equal(cardio.plan.name,fileMap.get(catalog.optional[0].file).name);

// A slow starter download cannot load a day after a track switch.
const racing=fixture();racing.setCatalog(catalog);racing.selectWorkoutPack('momentum','');
let finishDownload;racing.setFetch(()=>new Promise(resolve=>finishDownload=resolve));
const download=racing.loadCatalogWorkout(catalog.tracks[0].plans[3],button());
racing.selectWorkoutPack('rise','');finishDownload(initial);await download;
assert.equal(racing.pending,true);assert.equal(racing.track,'rise');assert.equal(racing.active,null);

// Legacy standalone/current workouts are retained as the personal draft on first switch.
const legacy=fixture(new Map([['workoutTimerWorkoutPlanV7',JSON.stringify(initial)]]));
legacy.restoreCurrent();legacy.setCatalog(catalog);
legacy.selectWorkoutPack('rise','');legacy.resumeMyWorkout();
assert.equal(legacy.plan.name,initial.name);assert.equal(legacy.pending,false);
assert.equal(legacy.active,null);

for(const file of await readdir(new URL('workouts/packs/',root))) if(file.endsWith('.workout-pack.json')) f.normalizeWorkoutPack(JSON.parse(await readFile(new URL('workouts/packs/'+file,root),'utf8')));
console.log('Verified pack management, track/week selection clearing, starter/imported edit persistence and restore, personal drafts/creation, optional cardio, offline/reload behavior, loading races, validation and failed-write protection.');
