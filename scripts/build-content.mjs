// Deterministic content compilation. Never changes the original MayaMap records.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const read = async p => JSON.parse(await readFile(p,'utf8'));
const write = async (p,v) => writeFile(p,JSON.stringify(v,null,2)+'\n');
const rows = async p => (await readFile(p,'utf8')).trim().split('\n').map(l=>l.split('|'));
const sites = await read('public/data/sites.json');
const byId = new Map(sites.map(s=>[s.id,s]));
const sources = await read('content/research-sources.json');
const index = await read('content/review-index.json');
const inah = await read('content/inah-profiles.json');
const inahArt = await read('content/inah-art.json');
const translations = await read('content/survey-translations.json');
const highlights = {};
const labelFor = url => url.includes('unesco.org')?'UNESCO World Heritage Centre':url.includes('inah.gob.mx')?'INAH · National Institute of Anthropology and History':'Wikipedia · archaeological overview';
for(const row of await rows('content/highlights.tsv')) {
 assert.equal(row.length,9);
 const [id,title,art,period,dates,heading,highlight,source,description]=row;
 assert.ok(byId.has(id));assert.ok(!highlights[id]);
 highlights[id]={title,art,period,dates,heading,highlight,source,sourceLabel:labelFor(source),description};
}
assert.equal(Object.keys(highlights).length,50);
assert.equal(new Set(Object.values(highlights).map(h=>h.art)).size,50);
const profiles={};
for(const [id,description] of await rows('content/research.tsv')) {
 assert.ok(byId.has(id));assert.ok(!profiles[id]&&!highlights[id]);assert.ok(sources[id]);
 profiles[id]={description,sources:[sources[id]]};
}
const ranks={1:'major centre',2:'important site',3:'medium site',4:'minor site',5:'site with minimal remains'};
function distance(a,b){const rad=Math.PI/180;const x=(b[1]-a[1])*rad,y=(b[0]-a[0])*rad;return 6371*2*Math.asin(Math.sqrt(Math.sin(x/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(y/2)**2));}
function surveyNote(s){
 const n=s.notes||'';
 if(/EXCAVACION/.test(n)&&/DESTRUCCION/.test(n))return 'The original atlas flags both excavation and destruction; these are historical survey annotations, not an assessment of present conditions.';
 if(/EXCAVACION/.test(n))return 'The original atlas flags excavation, but does not describe its date, extent or findings in this record.';
 if(/DESTRUCCION|Ya no existe/.test(n))return 'The source flags destruction or loss of remains. This historical annotation does not establish the condition of every part of the site today.';
 if(/No se encontró/.test(n))return 'The source annotation says the site was not found during that verification; the historical position is retained with this uncertainty.';
 if(/Pendiente/.test(n))return 'The source marks verification as pending, so the recorded position remains provisional.';
 if(/Google Earth/.test(n))return 'The coordinate note records identification using Google Earth; it should not be treated as a precise archaeological boundary or entrance.';
 if(n==='GPS')return 'The source identifies GPS recording, without publishing positional accuracy in this entry.';
 if(/\bmounds?\b|\bplatform\b|\bmonument|\bvault|\bstructure\b|\bpalace\b|\btemple\b|\bsized?\b|\b\d+\s*[xX]\s*\d+\s*m\b/i.test(n)&&!n.startsWith('rank'))return `The survey records: “${translations[n]||n}”. This brief field annotation is not a complete account of the settlement.`;
 return s.notes?'The original notes contain survey codes or abbreviated references, retained below without assigning unsupported historical meanings.':'The source supplies no descriptive field notes for this record.';
}
const details={};const audit=[];
const identityCounts=new Map();for(const s of sites){const k=JSON.stringify([s.name,s.coordinates]);identityCounts.set(k,(identityCounts.get(k)||0)+1);}
for(const s of sites){
 const h=highlights[s.id],p=profiles[s.id],repository=inah[s.id];
 const candidates=index.filter(a=>a.candidates?.includes(s.id));
 const state=h?'illustrated-profile':p||repository?'sourced-profile':candidates.length?'unresolved-reference-match':'survey-record';
 let description=h?.description||p?.description;
 if(repository)description=description?`${description}\n\n${repository.description}`:repository.description;
 let nearest;
 if(!description){
  nearest=Object.keys(highlights).map(id=>({id,km:distance(s.coordinates,byId.get(id).coordinates)})).sort((a,b)=>a.km-b.km)[0];
  const location=[s.region,s.country].filter(x=>x!=='Unspecified').join(', ')||'an unspecified administrative area';
  const context=nearest.km<180?` Its recorded point lies about ${nearest.km<1?nearest.km.toFixed(1):Math.round(nearest.km)} km in a straight line from ${highlights[nearest.id].title}; proximity alone does not establish a historical relationship.`:'';
  description=`${s.name} is listed in ${location} by the Electronic Atlas of Ancient Maya Sites. The inventory classifies it as ${ranks[s.rank]||'unclassified'} and locates it at ${s.coordinates[1].toFixed(5)}° N, ${Math.abs(s.coordinates[0]).toFixed(5)}° W.${context}\n\n${surveyNote(s)} No independently verified site history is attached to this entry; occupation dates, rulers and building functions remain unspecified here.`;
 }
 if(identityCounts.get(JSON.stringify([s.name,s.coordinates]))>1&&!h&&!p&&!repository)description+=` This is inventory record ${s.id}; another source entry has the same name and coordinate, and both are preserved separately.`;
 const detailSources=[...(h?[{url:h.source,label:h.sourceLabel}]:p?.sources||[]),...(repository?.sources||[])];
 details[s.id]={description,sources:detailSources,reviewStatus:state,...(repository?{inahReviewed:true}:{}),...(nearest?{nearbyHighlight:nearest.id,straightLineKm:Math.round(nearest.km*10)/10}:{})};
 audit.push({id:s.id,status:state,notesReviewed:!!s.notes,referencePresent:!!s.reference,candidateUrls:candidates.map(a=>a.url),inahSources:repository?.sources.map(source=>source.url)||[]});
}
assert.equal(Object.keys(details).length,5223);
for(const [id,profile] of Object.entries(inah)){assert.ok(byId.has(id));assert.ok(profile.description&&profile.sources.length);}
for(const id of Object.keys(inahArt))assert.ok(byId.has(id));
const sourcedCount=Object.values(details).filter(detail=>detail.sources.length).length;
const summary={reviewedAt:'2026-09-06',records:sites.length,highlights:50,sourcedProfiles:sourcedCount,surveyProfiles:sites.length-sourcedCount,inahRepositoryProfiles:Object.keys(inah).length,inahReferencedDrawings:Object.keys(inahArt).length,sourceIndexUrl:'https://en.wikipedia.org/wiki/List_of_Maya_sites',sourceIndexEntries:index.length,retrievedIndexEntries:index.filter(a=>a.retrieved).length,recordsWithOriginalNotes:sites.filter(s=>s.notes).length,method:'All original names, locations, ranks, notes and bibliographic fields were reviewed through a catalogue-wide source-index comparison. Name matches were checked against coordinates and regional context before attaching an original summary. Additional official UNESCO and INAH references and explicit aliases were reviewed for selected entries. Unresolved names, modern-town articles and conflicting locations were not automatically assigned histories. The INAH repository guide catalogue was additionally compared with the inventory; completed, location-matched guide summaries and photographic references are attached individually. This is a bounded catalogue review, not an exhaustive search of all archaeological publications. Survey-only descriptions use source fields and calculated straight-line proximity, never inferred chronology or political affiliation.',coordinatePolicy:'All 5,223 original records and their full-precision coordinates are unchanged. Historical ranks are inventory categories, not ratings of cultural importance or present condition.',originalSitesSha256:createHash('sha256').update(await readFile('public/data/sites.json')).digest('hex')};
await write('content/highlights.json',highlights);
await write('content/inah-titles.json',Object.fromEntries(Object.entries(inah).map(([id,p])=>[id,p.title])));
await write('content/review-summary.json',summary);
await write('public/data/site-details.json',details);
await write('public/data/review.json',{...summary,entries:audit});
console.log(`Reviewed ${sites.length} records; ${summary.sourcedProfiles} sourced profiles; 50 individual illustrations required.`);
