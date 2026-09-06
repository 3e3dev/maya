// A stable pseudorandom choice keeps each inventory record's illustration consistent.
export const landscapeTitles = [
 'Rainforest river bend', 'Limestone cenote', 'Misty jungle canopy', 'Cloud forest ridge',
 'Tropical lagoon', 'Limestone scrubland', 'Mangrove creek', 'Ceiba clearing',
 'Volcanic lake', 'Fern ravine', 'Palm savanna', 'Karst hills',
 'Forest waterfall', 'Coastal dunes', 'Flooded forest', 'Rocky stream',
 'Forest cave entrance', 'Raincloud valley', 'Sunrise wetland', 'Mossy forest trail',
];
export function landscapeFor(id: string) {
 let hash = 2166136261;
 for (const character of `maya-landscapes-v1:${id}`) {
  hash ^= character.charCodeAt(0);
  hash = Math.imul(hash, 16777619);
 }
 const index = (hash >>> 0) % landscapeTitles.length;
 return { art: `landscape-${String(index + 1).padStart(2, '0')}`, title: landscapeTitles[index] };
}
