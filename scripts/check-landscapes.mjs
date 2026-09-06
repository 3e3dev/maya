import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const code = ts.transpileModule(await readFile('lib/landscapes.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { landscapeFor, landscapeTitles } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const sites = JSON.parse(await readFile('public/data/sites.json', 'utf8'));
const highlights = JSON.parse(await readFile('content/highlights.json', 'utf8'));
const references = JSON.parse(await readFile('content/inah-art.json', 'utf8'));
const fallbackSites = sites.filter(site => !highlights[site.id] && !references[site.id]);
const counts = new Map();
assert.equal(landscapeTitles.length, 20);
for (const site of fallbackSites) {
 const result = landscapeFor(site.id);
 assert.deepEqual(result, landscapeFor(site.id));
 assert.match(result.art, /^landscape-(0[1-9]|1[0-9]|20)$/);
 counts.set(result.art, (counts.get(result.art) || 0) + 1);
}
assert.equal(counts.size, 20, 'Every landscape must be used');
const hashes = new Set();
for (const [art, count] of counts) {
 assert.ok(count > 100 && count < 400, `${art} distribution is unexpectedly uneven`);
 const bytes = await readFile(`public/art/${art}.webp`);
 assert.ok(bytes.length > 1000);
 hashes.add(createHash('sha256').update(bytes).digest('hex'));
}
assert.equal(hashes.size, 20, 'All 20 images must be distinct');
console.log(`Verified 20 unique landscape assets assigned across ${fallbackSites.length} sites; ${sites.length - fallbackSites.length} sites retain unique artwork. Distribution: ${Math.min(...counts.values())}–${Math.max(...counts.values())} sites per landscape.`);
