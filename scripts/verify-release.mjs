import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const indexPath = new URL('index.html', root);
const workerPath = new URL('sw.js', root);
const [html, worker] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(workerPath, 'utf8')
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

const names = await readdir(root);
const jsonNames = ['manifest.webmanifest', ...names.filter(name => name.endsWith('.workout.json'))];
await Promise.all(jsonNames.map(async name => JSON.parse(await readFile(new URL(name, root), 'utf8'))));

console.log(`Verified release ${indexVersion}: CSP hash, service-worker version, and ${jsonNames.length} JSON assets are valid.`);
