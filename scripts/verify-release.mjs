import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const indexPath = new URL('index.html', root);
const workerPath = new URL('sw.js', root);
const guidePath = new URL('guide.html', root);
const catalogPath = new URL('workouts/catalog.json', root);
const [html, worker, guide, manifest, catalogText] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(workerPath, 'utf8'),
  readFile(guidePath, 'utf8'),
  readFile(new URL('manifest.webmanifest', root), 'utf8'),
  readFile(catalogPath, 'utf8')
]);

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1) throw new Error(`Expected one inline script, found ${scripts.length}.`);

const scriptHash = 'sha256-' + createHash('sha256').update(scripts[0][1]).digest('base64');
const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
if (!csp) throw new Error('Content Security Policy meta tag is missing.');
const cspHashes = csp[1].match(/sha256-[A-Za-z0-9+/=]+/g) || [];
if (cspHashes.length !== 1 || cspHashes[0] !== scriptHash) {
  throw new Error(`CSP script hash is stale. Replace it with ${scriptHash}.`);
}

const indexVersion = html.match(/const APP_VERSION = '([^']+)'/)?.[1];
const workerVersion = worker.match(/const APP_VERSION = '([^']+)'/)?.[1];
if (!indexVersion || indexVersion !== workerVersion) {
  throw new Error(`APP_VERSION mismatch: index=${indexVersion || 'missing'}, worker=${workerVersion || 'missing'}.`);
}
if (!html.includes('href="./guide.html"')) throw new Error('The app footer does not link to guide.html.');
if (!worker.includes("'./guide.html'")) throw new Error('guide.html is missing from the service-worker asset list.');
if (!guide.includes('href="./"')) throw new Error('guide.html does not link back to Workout Timer.');
const guideImages = [...guide.matchAll(/<img[^>]+src="\.\/([^"]+)"/g)].map(match => match[1]);
for (const image of guideImages) {
  if (!/^assets\/guide\/[a-z0-9-]+\.png$/.test(image)) throw new Error(`Unsafe guide image path: ${image}`);
  await readFile(new URL(image, root));
  if (!worker.includes(`'./${image}'`)) throw new Error(`./${image} is missing from the service-worker asset list.`);
}
if (/function (?:lowerBodyFocusWorkout|optionalCardioBurpeeWorkout|pullFocusWorkout|dipFocusWorkout)\(/.test(html)) {
  throw new Error('Workout templates must live in JSON files, not in index.html.');
}

JSON.parse(manifest);
const catalog = JSON.parse(catalogText);
if (catalog.format !== 'workout-timer-catalog' || catalog.version !== 1 || !Array.isArray(catalog.tracks) || !catalog.tracks.length) {
  throw new Error('workouts/catalog.json is invalid.');
}
if (catalog.optional != null && !Array.isArray(catalog.optional)) throw new Error('The optional workout catalog is invalid.');
const trackIds = catalog.tracks.map(track => track.id);
if (trackIds.some(id => !id) || new Set(trackIds).size !== trackIds.length) throw new Error('The workout catalog has missing or duplicate track IDs.');
for (const track of catalog.tracks) {
  if (track.blurb != null && (typeof track.blurb !== 'string' || track.blurb.trim().length > 120)) {
    throw new Error(`Workout catalog track ${track.id || '(missing id)'} has an invalid blurb.`);
  }
}
const catalogPlans = catalog.tracks.flatMap(track => Array.isArray(track.plans) ? track.plans : []).concat(catalog.optional || []);
const catalogIds = catalogPlans.map(plan => plan.id);
const catalogFiles = catalogPlans.map(plan => plan.file);
if (!catalogFiles.length || catalogFiles.some(file => !file)) throw new Error('The workout catalog has missing files.');
if (catalogIds.some(id => !id) || new Set(catalogIds).size !== catalogIds.length) throw new Error('The workout catalog has missing or duplicate plan IDs.');
for (const plan of catalogPlans) {
  if (plan.summary != null && (typeof plan.summary !== 'string' || plan.summary.trim().length > 48)) {
    throw new Error(`Workout catalog plan ${plan.id || '(missing id)'} has an invalid summary.`);
  }
}
const uniqueCatalogFiles = [...new Set(catalogFiles)];
await Promise.all(catalogPlans.map(async plan => {
  const file = plan.file;
  if (!/^\.\/workouts\/[a-z0-9/_-]+\.workout\.json$/.test(file) || file.includes('..')) throw new Error(`Unsafe workout catalog path: ${file}`);
  const raw = JSON.parse(await readFile(new URL(file.slice(2), root), 'utf8'));
  if (raw.format !== 'workout-timer-plan' || raw.version !== 7 || raw.kind !== 'workout') throw new Error(`${file} is not a version 7 workout.`);
  if (!worker.includes(`'${file}'`)) throw new Error(`${file} is missing from the service-worker asset list.`);
  const summary = String(plan.summary || '');
  const blockCount = Array.isArray(raw.blocks) ? raw.blocks.length : 0;
  const exerciseCount = (raw.blocks || []).reduce((sum, block) => sum + (block.items || []).filter(item => item.type === 'exercise').length, 0);
  const blocks = summary.match(/(\d+) BLOCKS/);
  const phases = summary.match(/(\d+) PHASES/);
  const exercises = summary.match(/(\d+) EXERCISES/);
  if (blocks && Number(blocks[1]) !== blockCount) throw new Error(`${plan.id} summary has the wrong block count.`);
  if (phases && Number(phases[1]) !== blockCount) throw new Error(`${plan.id} summary has the wrong phase count.`);
  if (exercises && Number(exercises[1]) !== exerciseCount) throw new Error(`${plan.id} summary has the wrong exercise count.`);
}));
if (!worker.includes("'./workouts/catalog.json'")) throw new Error('The workout catalog is missing from the service-worker asset list.');

console.log(`Verified release ${indexVersion}: CSP hash, service-worker version, and ${catalogPlans.length} catalog entries across ${uniqueCatalogFiles.length} workout files are valid.`);
