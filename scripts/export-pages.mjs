// vinext beta.5 prerender requests omit basePath. Render the actual public route,
// then normalize its asset tree for a GitHub Pages project mounted at /maya/.
import { startProdServer } from 'vinext/server/prod-server';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const server = await startProdServer({host:'127.0.0.1',port:0,outDir:resolve('dist'),noCompression:true});
try {
 const origin=`http://127.0.0.1:${server.port}`;
 const response=await fetch(`${origin}/maya/`);
 assert.equal(response.status,200,'Production homepage must return 200');
 const html=await response.text();
 assert.ok(html.includes('A world to uncover.'),'Atlas homepage must be rendered');
 assert.ok(html.includes('AN ILLUSTRATED ATLAS'),'Atlas branding must be rendered');
 assert.ok(!html.includes('Your site is taking shape'),'Starter must not be exported');
 await rm('out',{recursive:true,force:true});
 await mkdir('out',{recursive:true});
 for(const item of await readdir('dist/client',{withFileTypes:true})) {
  if(item.name==='maya'||item.name==='vinext-client-entry-manifest.json') continue;
  await cp(`dist/client/${item.name}`,`out/${item.name}`,{recursive:true});
 }
 await cp('dist/client/maya/_next','out/_next',{recursive:true});
 await writeFile('out/index.html',html);
 await writeFile('out/.nojekyll','');
 const rsc=await fetch(`${origin}/maya/`,{headers:{RSC:'1',Accept:'text/x-component'}});
 assert.equal(rsc.status,200,'RSC export must return 200');
 await writeFile('out/index.rsc',await rsc.text());
 for(const match of html.matchAll(/(?:src|href)="(\/maya\/[^"?#]+)"/g)) {
  const url=match[1];
  if(url.endsWith('/'))continue;
  await readFile(`out/${url.slice('/maya/'.length)}`);
 }
 const sites=JSON.parse(await readFile('out/data/sites.json','utf8'));
 assert.equal(sites.length,5223);assert.equal(new Set(sites.map(s=>s.id)).size,5223);
 for(const site of sites)assert.ok(site.coordinates.length===2&&site.coordinates.every(Number.isFinite));
 const highlights=JSON.parse(await readFile('content/highlights.json','utf8'));
 const details=JSON.parse(await readFile('out/data/site-details.json','utf8'));
 assert.equal(Object.keys(highlights).length,50);
 assert.equal(new Set(Object.values(highlights).map(h=>h.art)).size,50);
 assert.equal(Object.keys(details).length,5223);
 for(const site of sites){assert.ok(details[site.id]?.description.length>100);assert.ok(Array.isArray(details[site.id].sources));}
 for(const id of Object.keys(highlights))assert.ok(sites.some(s=>s.id===id));
 for(const art of [...Object.values(highlights).map(h=>h.art),'lowlands','highlands']) assert.ok((await readFile(`out/art/${art}.webp`)).byteLength>1000);
 assert.ok(html.includes('50 ILLUSTRATED HIGHLIGHTS'));
 console.log('GitHub Pages export verified: homepage, linked bundles, 5,223 detailed records, 50 highlighted drawings and 2 regional studies.');
}finally{await new Promise(resolve=>server.server.close(resolve));}
