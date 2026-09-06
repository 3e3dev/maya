'use client';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as GLMap, GeoJSONSource } from 'maplibre-gl';
import { ArrowUpRight, ArrowLeft, Compass, Globe2, Search, X, MapPin, Plus, Minus, LocateFixed, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { BASE, type Site, type SiteDetail, stories, featuredIds, titleFor, artFor, rankName, geojson, findSites } from '@/lib/atlas';
import reviewSummary from '@/content/review-summary.json';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function Atlas({covered=false}:{covered?:boolean}) {
 const filteredRef = useRef<Site[]>([]);
 const canvas = useRef<HTMLDivElement>(null); const map = useRef<GLMap | null>(null); const selectRef = useRef<(site:Site)=>void>(()=>{});
 const [sites,setSites]=useState<Site[]>([]); const [selected,setSelected]=useState<Site|null>(null); const [query,setQuery]=useState(''); const [all,setAll]=useState(false); const [limit,setLimit]=useState(60); const [ready,setReady]=useState(false); const [error,setError]=useState(''); const [mapError,setMapError]=useState(''); const [flying,setFlying]=useState(false); const [about,setAbout]=useState(false); const [mobileExplore,setMobileExplore]=useState(false); const [viewCount,setViewCount]=useState(0);
 const [siteDetails,setSiteDetails]=useState<Record<string,SiteDetail>>({}); const [detailsLoaded,setDetailsLoaded]=useState(false);
 const matches=useMemo(()=>findSites(sites,query),[sites,query]);
 const visible=useMemo(()=>query||all ? matches.slice(0,limit) : featuredIds.map(id=>sites.find(s=>s.id===id)).filter((s):s is Site=>!!s),[sites,matches,query,all,limit]);
 const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function select(site:Site) {
  setSelected(site);setAbout(false);setMobileExplore(false);
  history.replaceState(null,'',`#${site.id}`);
  if(map.current){
   const small=window.innerWidth<760;
   map.current.stop();setFlying(!reducedMotion());
   map.current.flyTo({center:site.coordinates,zoom:14,pitch:42,bearing:-12,duration:reducedMotion()?0:3200,curve:1.45,essential:false,padding:{top:0,bottom:0,left:0,right:0},offset:small?[0,-window.innerHeight*0.17]:[190,0]});
   if(map.current.getSource('selected'))(map.current.getSource('selected') as GeoJSONSource).setData(geojson([site]));
  }
 }
 useEffect(()=>{selectRef.current=select;});
 function closeSite(){setSelected(null);setFlying(false);history.replaceState(null,'',window.location.pathname);if(map.current?.getSource('selected'))(map.current.getSource('selected') as GeoJSONSource).setData(geojson([]));}
 function overview(){closeSite();setMobileExplore(false);const m=map.current;if(m)m.fitBounds([[-96.6,13.1],[-85.4,21.8]],{padding:window.innerWidth<760?{top:45,bottom:100,left:30,right:30}:{top:60,bottom:60,left:395,right:70},pitch:0,bearing:0,duration:reducedMotion()?0:2200});}
 useEffect(()=>{
  let disposed=false; let instance:GLMap|undefined;
  async function boot(){
   try {
    void fetch(`${BASE}/data/site-details.json`).then(response=>{if(!response.ok)throw new Error('Details unavailable');return response.json();}).then(details=>{if(!disposed)setSiteDetails(details as Record<string,SiteDetail>);}).catch(()=>{}).finally(()=>{if(!disposed)setDetailsLoaded(true);});
    const response=await fetch(`${BASE}/data/sites.json`);if(!response.ok)throw new Error('The site catalogue could not load. Please reload to try again.');
    const data:Site[]=await response.json();if(disposed)return;setSites(data);filteredRef.current=data;
    try {
     const maplibre=(await import('maplibre-gl')).default;if(disposed||!canvas.current)return;
     instance=new maplibre.Map({container:canvas.current,style:`${BASE}/data/map-style.json`,center:[-90,18],zoom:5.9,minZoom:3,maxZoom:18,attributionControl:false,canvasContextAttributes:{antialias:true}});map.current=instance;
     instance.addControl(new maplibre.AttributionControl({compact:true,customAttribution:'Site coordinates: <a href="https://mayamap.org" target="_blank" rel="noopener">EAAMS / MayaMap</a>'}),'bottom-right');
     instance.addControl(new maplibre.ScaleControl({maxWidth:110,unit:'metric'}),'bottom-left');
     instance.on('error',()=>{if(!disposed)setMapError('Some map detail could not load. Site search is still available.');});
     instance.on('idle',()=>{if(!disposed)setMapError('');});
     instance.on('moveend',()=>{if(disposed)return;setFlying(false);const b=instance!.getBounds();setViewCount(filteredRef.current.filter(s=>b.contains(s.coordinates)).length);});
     instance.on('load',()=>{
      if(disposed)return;const m=instance!;
      m.addSource('sites',{type:'geojson',data:geojson(data),cluster:true,clusterRadius:48,clusterMaxZoom:12});
      m.addSource('selected',{type:'geojson',data:geojson([])});
      m.addLayer({id:'site-halo',type:'circle',source:'sites',filter:['all',['!', ['has','point_count']],['<=',['get','rank'],2]],paint:{'circle-radius':['interpolate',['linear'],['zoom'],5,7,12,12],'circle-color':'#fdfdf7','circle-opacity':0.9}});
      m.addLayer({id:'site-dots',type:'circle',source:'sites',filter:['!', ['has','point_count']],paint:{'circle-radius':['interpolate',['linear'],['zoom'],5,['case',['==',['get','rank'],1],4,['==',['get','rank'],2],3,1.7],12,['case',['<=',['get','rank'],2],6,4]],'circle-color':['case',['<=',['get','rank'],2],'#183f46','#54756d'],'circle-opacity':['case',['<=',['get','rank'],2],1,0.62],'circle-stroke-color':'#fdfdf9','circle-stroke-width':['interpolate',['linear'],['zoom'],5,0.5,12,1.6]}});
      m.addLayer({id:'site-labels',type:'symbol',source:'sites',filter:['all',['!', ['has','point_count']],['<=',['get','rank'],2]],layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':['interpolate',['linear'],['zoom'],5,12,10,14],'text-anchor':'top','text-offset':[0,1],'text-optional':true},paint:{'text-color':'#173d43','text-halo-color':'#fbfcf7','text-halo-width':2}});
      m.addLayer({id:'site-clusters',type:'circle',source:'sites',filter:['has','point_count'],paint:{'circle-radius':['step',['get','point_count'],18,50,22,250,27],'circle-color':['step',['get','point_count'],'#487b77',50,'#356661',250,'#244e4c'],'circle-stroke-color':'#fcfdf9','circle-stroke-width':3,'circle-opacity':0.97}});
      m.addLayer({id:'cluster-counts',type:'symbol',source:'sites',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Bold'],'text-size':13,'text-allow-overlap':true,'text-ignore-placement':true},paint:{'text-color':'#ffffff'}});
      m.addLayer({id:'selected-halo',type:'circle',source:'selected',paint:{'circle-radius':19,'circle-color':'#b96843','circle-opacity':0.16,'circle-stroke-width':1,'circle-stroke-color':'#b96843'}});
      m.addLayer({id:'selected-point',type:'circle',source:'selected',paint:{'circle-radius':7,'circle-color':'#b96843','circle-stroke-width':3,'circle-stroke-color':'#fff'}});
      let expansionRequest=0;
      const clickableLayers=['selected-point','site-clusters','site-dots','site-labels'];
      m.on('click',e=>{
       const request=++expansionRequest;
       const features=m.queryRenderedFeatures([[e.point.x-9,e.point.y-9],[e.point.x+9,e.point.y+9]],{layers:clickableLayers});
       const feature=features[0];if(!feature)return;
       if(feature.properties.cluster){
        const source=m.getSource('sites') as GeoJSONSource;
        const filteredAtClick=filteredRef.current;
        const center=(feature.geometry as {type:'Point';coordinates:[number,number]}).coordinates;
        void source.getClusterExpansionZoom(Number(feature.properties.cluster_id)).then(zoom=>{
         if(disposed||request!==expansionRequest||filteredAtClick!==filteredRef.current)return;
         closeSite();setMobileExplore(false);m.stop();
         m.easeTo({center,zoom:Math.min(zoom+0.25,13),pitch:0,bearing:0,padding:{top:0,bottom:0,left:0,right:0},offset:window.innerWidth<760?[0,0]:[180,0],duration:reducedMotion()?0:1400});
        }).catch(()=>{if(!disposed&&request===expansionRequest)setMapError('This group changed as the map updated. Select it again to zoom in.');});
       }else{
        const chosen=data.find(site=>site.id===feature.properties.id);if(chosen)selectRef.current(chosen);
       }
      });
      m.on('mousemove',e=>{m.getCanvas().style.cursor=m.queryRenderedFeatures(e.point,{layers:clickableLayers}).length?'pointer':'';});
      setReady(true);const deep=data.find(s=>s.id===window.location.hash.slice(1));
      if(deep)selectRef.current(deep);else m.fitBounds([[-96.6,13.1],[-85.4,21.8]],{padding:window.innerWidth<760?{top:45,bottom:100,left:30,right:30}:{top:60,bottom:60,left:395,right:70},duration:0});
     });
    }catch{setMapError('The map is unavailable in this browser. You can still explore every site through the catalogue.');}
   }catch(e){setError(e instanceof Error?e.message:'The catalogue could not load.');}
  }
  void boot();return()=>{disposed=true;instance?.remove();map.current=null;};
 },[]);
 useEffect(()=>{filteredRef.current=matches;const m=map.current;if(ready&&m?.getSource('sites')){(m.getSource('sites') as GeoJSONSource).setData(geojson(matches));void m.once('sourcedata',()=>{const b=m.getBounds();setViewCount(filteredRef.current.filter(s=>b.contains(s.coordinates)).length);});}},[matches,ready]);
 const story=selected?stories[selected.id]:null;
 const selectedDetail=selected?siteDetails[selected.id]:null;
 const historySources=selectedDetail?.sources|| (story?[{url:story.source,label:story.sourceLabel}]:[]);
 const description=selectedDetail?.description||story?.description||(detailsLoaded?'The detailed profile could not load. The original survey coordinates, notes and bibliography remain available below.':'Loading the detailed site profile…');
 return <main className="atlas">
  <header className="masthead"><a className="brand" href={`${BASE}/`} aria-label="Maya atlas home"><Compass size={30} strokeWidth={1.2}/><span>MAYA<span className="brand-dot">.</span></span><span className="brand-caption">AN ILLUSTRATED ATLAS</span></a><div className="header-right"><span className="record-count"><i/>{sites.length?sites.length.toLocaleString():'5,223'} places to discover</span><Button variant="ghost" onClick={()=>setAbout(true)} className="about-button"><BookOpen/>About the atlas</Button></div></header>
  <div className="map-surface" ref={canvas} aria-label="Interactive map of Maya archaeological sites"/>
  {!ready&&!mapError&&<output className="map-loading"><Compass className="loading-compass"/>Opening the atlas…</output>}
  {(error||mapError)&&<output className="map-notice">{error||mapError}{error&&<Button onClick={()=>window.location.reload()}>Reload</Button>}</output>}
  <aside className={`explorer ${mobileExplore?'expanded':''} ${selected?'hidden-panel':''}`} aria-label="Explore archaeological sites">
   <div className="explorer-heading"><div><span className="eyebrow">THE MAYA WORLD</span><h1>A world to uncover.</h1></div><Button size="icon" variant="ghost" className="mobile-close" aria-label="Collapse site catalogue" onClick={()=>setMobileExplore(false)}><X/></Button></div>
   <p className="intro">Ancient cities, forest temples and the places in between.</p>
   <div className="search"><Search size={18}/><Input aria-label="Search all sites, regions or countries" placeholder="Find a site or region…" value={query} onFocus={()=>setMobileExplore(true)} onChange={e=>{setQuery(e.target.value);setLimit(60);}}/>{query&&<button aria-label="Clear search" onClick={()=>setQuery('')}><X size={16}/></button>}</div>
   <div className="catalogue-header"><span>{query?`${matches.length.toLocaleString()} RESULTS`:all?'ALL SITE RECORDS':'50 ILLUSTRATED HIGHLIGHTS'}</span><button onClick={()=>{setAll(!all);setQuery('');setLimit(60);setMobileExplore(true);}}>{all?'Highlights':'View all'} <ArrowUpRight size={14}/></button></div>
   <div className="site-list">
    {visible.map((site,i)=><button className="site-row" key={site.id} onClick={()=>select(site)}><span className="site-number">{String(i+1).padStart(2,'0')}</span><span className="site-row-text"><strong>{titleFor(site)}</strong><span>{site.region}, {site.country}</span></span><ArrowUpRight size={17}/></button>)}
    {sites.length>0&&!visible.length&&<p className="empty">No sites found. Try another name, country or region.</p>}
    {(query||all)&&matches.length>limit&&<Button className="more-button" variant="outline" onClick={()=>setLimit(limit+60)}>Show more sites ({matches.length-limit} remaining)</Button>}
   </div>
   <div className="explorer-foot"><span className="mini-dot"/>Select a group to zoom in, or a site for its story.</div>
  </aside>
  <div className="map-top-note"><span>MESOAMERICA</span><span>13°–22° N · 85°–97° W</span></div>
  <div className="map-controls"><Button size="icon" variant="outline" aria-label="Zoom in" onClick={()=>map.current?.zoomIn({duration:reducedMotion()?0:500})} disabled={!ready}><Plus/></Button><Button size="icon" variant="outline" aria-label="Zoom out" onClick={()=>map.current?.zoomOut({duration:reducedMotion()?0:500})} disabled={!ready}><Minus/></Button><Button size="icon" variant="outline" aria-label="Reset north" onClick={()=>map.current?.easeTo({bearing:0,pitch:0,duration:reducedMotion()?0:1000})} disabled={!ready}><Compass/></Button><Button size="icon" variant="outline" aria-label="Show entire atlas" onClick={overview} disabled={!ready}><LocateFixed/></Button></div>
  <div className="map-legend"><span><b className="cluster-key">12</b>Grouped sites</span><span><i className="major-dot"/>Major & important</span><span><i/>Other recorded sites</span></div>
  <div className="map-bottom"><span><Globe2 size={15}/>{viewCount.toLocaleString()} records in view</span><button onClick={overview}>Back to the whole world <ArrowUpRight size={14}/></button></div>
  <Button className="mobile-explore-button" onClick={()=>{closeSite();setMobileExplore(true);}}><Search/>Explore {sites.length.toLocaleString()} sites</Button>
  <Sheet modal={false} open={!!selected&&!covered} onOpenChange={(open,details)=>{if(!open&&details.reason!=='outside-press')closeSite();}}>
   <SheetContent side="left" className="site-sheet" showCloseButton={false}>
    {selected&&<div key={selected.id} className="detail-inner">
     <div className="detail-top"><Button variant="ghost" onClick={closeSite}><ArrowLeft/>All places</Button><span className={flying?'flight-status active':'flight-status'}>{flying?'IN FLIGHT':'FIELD NOTES'}</span><Button variant="ghost" size="icon" aria-label="Close site information" onClick={closeSite}><X/></Button></div>
     <figure className="site-art"><Image width={1536} height={1024} unoptimized src={`${BASE}/art/${artFor(selected)}.webp`} alt={story?`Interpretive ink and watercolor drawing of ${story.title}`:'Conceptual drawing of a regional archaeological landscape'}/><figcaption>{story?'INTERPRETIVE SITE DRAWING':'REGIONAL STUDY · CONCEPTUAL LANDSCAPE'}</figcaption></figure>
     <div className="detail-body"><span className="eyebrow">{selected.region} / {selected.country}</span><SheetTitle className="site-title">{titleFor(selected)}</SheetTitle><SheetDescription className="site-subtitle">{story?.heading||'A place in the archaeological record'}</SheetDescription><div className="detail-tags"><span>{rankName(selected.rank)}</span>{story&&<span>{story.period}</span>}</div>
     <div className="site-description">{description.split('\n\n').map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div>
     {!story&&historySources.length>0&&<p className="profile-source">History & context · <a href={historySources[0].url} target="_blank" rel="noreferrer">{historySources[0].label}<ArrowUpRight size={12}/></a></p>}
     {story&&<div className="field-detail"><span className="eyebrow">HISTORICAL HORIZON</span><p>{story.dates}</p><span className="eyebrow">LOOK CLOSER</span><p>{story.highlight}</p></div>}
     <div className="coordinate-card"><MapPin size={18}/><div><span>RECORDED LOCATION</span><strong>{selected.coordinates[1].toFixed(5)}° N &nbsp; {Math.abs(selected.coordinates[0]).toFixed(5)}° W</strong></div><a aria-label={`Open ${titleFor(selected)} on OpenStreetMap`} href={`https://www.openstreetmap.org/?mlat=${selected.coordinates[1]}&mlon=${selected.coordinates[0]}#map=16/${selected.coordinates[1]}/${selected.coordinates[0]}`} target="_blank" rel="noreferrer"><ArrowUpRight size={20}/></a></div>
     {selected.notes&&<details><summary>Original survey notes</summary><p>{selected.notes}</p></details>}
     <details className="source-details"><summary>Sources & illustration</summary><p>Coordinates: <a href="https://mayamap.org" target="_blank" rel="noreferrer">MayaMap / EAAMS</a>, compiled by Walter Witschey and Clifford Brown. WGS84; survey positions may be approximate.</p>{selected.reference&&<p>{selected.reference}</p>}{historySources.map(source=><p key={source.url}>History: <a href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowUpRight size={12}/></a></p>)}<p>Catalogue review: {reviewSummary.reviewedAt}. Survey ranks describe the original inventory, not present condition or cultural importance.</p><p>{story?'AI-generated interpretive artwork; architectural details are illustrative.':'AI-generated regional landscape shared across atlas entries; this is not a depiction or reconstruction of this specific site.'}</p></details>
     <a className="source-link" href={historySources[0]?.url||'https://mayamap.org'} target="_blank" rel="noreferrer">{historySources.length?'Read the site history':'Explore the source atlas'}<ArrowUpRight size={16}/></a>
     </div>
    </div>}
   </SheetContent>
  </Sheet>
  <Sheet open={about&&!covered} onOpenChange={setAbout}><SheetContent className="about-sheet"><SheetTitle className="about-title">An atlas of places.<br/>A living Maya world.</SheetTitle><SheetDescription>This map brings together all 5,223 records published by MayaMap, from monumental cities to modest archaeological remains.</SheetDescription><p>The coordinate source is the Electronic Atlas of Ancient Maya Sites (EAAMS), compiled by Walter Witschey and Clifford Brown. The source inventory spans several modern countries and includes peripheral and unclassified records. It is not an exhaustive list of every Maya site.</p><p>Maya communities and cultures continue across this region today. The archaeological record is one part of that continuing story.</p><p>Fifty highlighted sites have individual drawings and expanded histories. The catalogue review adds source-linked profiles for {reviewSummary.sourcedProfiles} records in total. Other entries include the available survey details and geographic context, with a shared regional illustration.</p><p>The review compared every record with a reference index, then checked names against locations before attaching histories. It does not exhaust all archaeological literature. Unresolved matches retain survey-only descriptions.</p><p>Drawings were created with AI as interpretive artwork. Locations come from historical surveys and are not guaranteed to mark an entrance or an accessible destination.</p><div className="about-links"><a href="https://mayamap.org" target="_blank" rel="noreferrer">Coordinate reference <ArrowUpRight size={16}/></a><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors <ArrowUpRight size={16}/></a><a href="https://openfreemap.org" target="_blank" rel="noreferrer">Basemap by OpenFreeMap <ArrowUpRight size={16}/></a><a href={`${BASE}/data/review.json`} target="_blank" rel="noreferrer">Catalogue review & coverage <ChevronRight size={16}/></a><a href={`${BASE}/data/provenance.json`} target="_blank" rel="noreferrer">Data provenance <ChevronRight size={16}/></a></div></SheetContent></Sheet>
 </main>;
}
