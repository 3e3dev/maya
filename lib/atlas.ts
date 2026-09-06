import highlightData from '@/content/highlights.json';
import inahArtData from '@/content/inah-art.json';
import inahTitleData from '@/content/inah-titles.json';
import surveyTranslations from '@/content/survey-translations.json';
export type Source = { url: string; label: string; author?: string; credit?: string };
export type SiteDetail = { description: string; sources: Source[]; reviewStatus: string; nearbyHighlight?: string; straightLineKm?: number };
export type Site = { id: string; name: string; country: string; region: string; rank: number; notes: string | null; reference: string | null; coordinates: [number, number] };
export type Story = { title: string; art: string; period: string; dates: string; heading: string; description: string; highlight: string; source: string; sourceLabel: string };
export type ReferenceArt = { art: string; title: string; sourceUrl: string; credit: string; date: string; rights: string };
export const referenceArt: Record<string,ReferenceArt> = inahArtData;
const inahTitles: Record<string,string> = inahTitleData;
const translatedNotes: Record<string,string> = surveyTranslations;
export const surveyNotesFor = (site: Site) => site.notes ? translatedNotes[site.notes] || site.notes : null;
export const BASE = '/maya';
export const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const rankName = (rank: number) => ({1:'Major centre',2:'Important site',3:'Medium site',4:'Minor site',5:'Minimal remains'}[rank] || 'Unclassified');
export const stories: Record<string, Story> = highlightData;
export const featuredIds = Object.keys(stories);
export const titleFor = (site: Site) => stories[site.id]?.title || inahTitles[site.id] || (site.id==='site-5000'?'Joya de Cerén':site.name);
export function artFor(site: Site) { return referenceArt[site.id]?.art || stories[site.id]?.art || (site.coordinates[1] < 16 ? 'highlands' : 'lowlands'); }
export function geojson(sites: Site[]) { return { type: 'FeatureCollection' as const, features: sites.map(site => ({type:'Feature' as const, id:site.id, geometry:{ type:'Point' as const,coordinates:site.coordinates }, properties:{ id:site.id,name:titleFor(site),rank:site.rank } })) }; }
export function findSites(sites: Site[], query: string) { const term=normalize(query.trim()); return sites.filter(s => normalize(`${s.name} ${titleFor(s)} ${s.region} ${s.country}`).includes(term)); }
