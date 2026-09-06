'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BASE } from '@/lib/atlas';
import Atlas from './atlas';

export default function Experience() {
 const [intro,setIntro]=useState(true);
 const [leaving,setLeaving]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout> | null>(null);
 const atlasSurface=useRef<HTMLDivElement>(null);

 useEffect(()=>{
  const syncLocation=()=>{
   if(timer.current)clearTimeout(timer.current);
   setIntro(!window.location.hash.startsWith('#site-')&&window.location.hash!=='#atlas');
   setLeaving(false);
  };
  syncLocation();
  window.addEventListener('popstate',syncLocation);
  window.addEventListener('hashchange',syncLocation);
  return()=>{
   if(timer.current)clearTimeout(timer.current);
   window.removeEventListener('popstate',syncLocation);
   window.removeEventListener('hashchange',syncLocation);
  };
 },[]);

 function enterAtlas(){
  if(leaving)return;
  history.pushState(null,'','#atlas');
  setLeaving(true);
  timer.current=setTimeout(()=>{
   setIntro(false);setLeaving(false);
   atlasSurface.current?.focus({preventScroll:true});
  },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:700);
 }

 return <div className={`atlas-experience ${intro&&!leaving?'is-covered':'is-revealed'}`}>
  <div ref={atlasSurface} className="atlas-stage" tabIndex={-1} inert={intro&&!leaving} aria-hidden={intro&&!leaving}>
   <Atlas covered={intro&&!leaving}/>
  </div>
  {intro&&<main className={`splash ${leaving?'splash-leaving':''}`} aria-labelledby="splash-title" inert={leaving}>
   <header className="splash-header">
    <a className="splash-brand" href={`${BASE}/`} aria-label="Maya atlas home"><Compass size={33} strokeWidth={1.15}/><span>MAYA<span className="splash-dot">.</span></span></a>
    <span className="splash-edition">AN ILLUSTRATED ATLAS</span>
    <a className="splash-skip" href="#atlas" onClick={event=>{event.preventDefault();enterAtlas();}}>Explore the map <ArrowUpRight size={18}/></a>
   </header>

   <div className="splash-scene">
    <figure className="splash-art">
     <Image src={`${BASE}/art/tikal.webp`} alt="Interpretive ink and watercolor drawing of Tikal’s Temple I rising above the forest" width={1536} height={1024} unoptimized priority/>
     <figcaption><span className="splash-caption-line"/><span>Tikal, Guatemala<small>INTERPRETIVE SITE DRAWING</small></span></figcaption>
    </figure>
    <div className="splash-copy">
     <p className="splash-kicker"><span/>THE MAYA WORLD, MAPPED</p>
     <h1 id="splash-title">A world<br/>written in <em>stone.</em></h1>
     <p className="splash-intro">Explore ancient cities and forest temples across the Maya world, one place at a time.</p>
     <Button className="splash-enter" onClick={enterAtlas}>Enter the atlas <span><ArrowRight className="size-5"/></span></Button>
     <p className="splash-invitation">Choose a place. Follow its story.</p>
    </div>
   </div>

   <footer className="splash-footer">
    <div className="splash-stat"><strong>5,223</strong><span>recorded places</span></div>
    <div className="splash-stat"><strong>50</strong><span>illustrated highlights</span></div>
    <p className="splash-footer-note">Ancient places. Living cultures.<span>Across Mexico & Central America</span></p>
   </footer>
  </main>}
 </div>;
}
