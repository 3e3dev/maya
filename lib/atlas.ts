import highlightData from '@/content/highlights.json';
export type Source = { url: string; label: string };
export type SiteDetail = { description: string; sources: Source[]; reviewStatus: string; nearbyHighlight?: string; straightLineKm?: number };
export type Site = { id: string; name: string; country: string; region: string; rank: number; notes: string | null; reference: string | null; coordinates: [number, number] };
export type Story = { title: string; art: string; period: string; dates: string; heading: string; description: string; highlight: string; source: string; sourceLabel: string };
export const BASE = '/maya';
export const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const rankName = (rank: number) => ({1:'Major centre',2:'Important site',3:'Medium site',4:'Minor site',5:'Minimal remains'}[rank] || 'Unclassified');
export const stories: Record<string, Story> = highlightData;
export const featuredIds = Object.keys(stories);
export const titleFor = (site: Site) => stories[site.id]?.title || (site.id==='site-5000'?'Joya de Cerén':site.name);
export function artFor(site: Site) { return stories[site.id]?.art || (site.coordinates[1] < 16 ? 'highlands' : 'lowlands'); }
export function geojson(sites: Site[]) { return { type: 'FeatureCollection' as const, features: sites.map(site => ({type:'Feature' as const, id:site.id, geometry:{ type:'Point' as const,coordinates:site.coordinates }, properties:{ id:site.id,name:titleFor(site),rank:site.rank } })) }; }
export function findSites(sites: Site[], query: string) { const term=normalize(query.trim()); return sites.filter(s => normalize(`${s.name} ${titleFor(s)} ${s.region} ${s.country}`).includes(term)); }
