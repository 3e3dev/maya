# MAYA — An illustrated atlas

Public site: https://3e3dev.github.io/maya/

A light OpenStreetMap atlas of all 5,223 coordinate records in the MayaMap EAAMS dataset. MapLibre groups nearby records into numbered clusters when zoomed out. Clicking a cluster smoothly expands it into smaller groups and individual site markers; selecting a site opens its illustrated notes and fly-to transition. The complete catalogue remains searchable. Phone layouts use a bottom detail sheet. Reduced-motion preferences are respected.

## Data and artwork

Coordinates, rank, notes and bibliographic references are preserved from https://mayamap.org/data/maya_sites.geojson. See `public/data/provenance.json` for retrieval details and source checksum. EAAMS was compiled by Walter Witschey and Clifford Brown. This is a source inventory, not a claim to contain every Maya archaeological site. All records are retained, including unclassified ranks and peripheral/unspecified locations.

Fifty highlighted entries have expanded histories and individual drawings. A catalogue-wide review provides 134 source-linked profiles, using UNESCO, INAH and archaeological reference articles. All 5,223 records have descriptions: records without verified histories use their survey fields, interpreted field annotations and explicitly calculated straight-line geographic context. No chronology or political affiliation is inferred from proximity. Other entries use one of two shared, explicitly conceptual regional illustrations. The illustrations are interpretive, not evidence of specific architectural details. Exact prompts and generation provenance are in `public/art/PROVENANCE.md`. Images were created with the built-in image_gen tool and encoded as WebP.

Basemap: OpenFreeMap / OpenMapTiles, using OpenStreetMap data. Basemap and coordinate attribution remain visible on the map and in the About panel.

## Content review

The home page opens with an illustrated Tikal cover and a motion-aware transition into the live atlas. The map initializes beneath the cover so it is ready to explore. `#atlas` and existing `#site-…` links bypass the cover; browser Back returns to it after entering the map.

`content/highlights.tsv` and `content/research.tsv` contain original, source-linked editorial summaries keyed to stable record IDs. `scripts/build-content.mjs` produces the public detail catalogue and review report without modifying the source coordinates. `content/review-index.json` records the bounded external reference-index comparison; ambiguous names, modern-town redirects and conflicting coordinates are not automatically enriched. The review is not an exhaustive search of all archaeological literature. See `public/data/review.json` for per-record coverage and methods. Rebuild content with `node scripts/build-content.mjs` after editing the source text. The normal production build runs this automatically.

## Development

Node 22.13 or later.

```sh
npm ci
npm run dev
npm run build
```

Application type checking: `npx tsc --noEmit`.
Application lint: `npx oxlint app lib vite.config.ts next.config.ts`.

The bundled starter component catalogue contains pre-existing lint findings; it is unchanged. The application and type checks pass.

## GitHub Pages export

The pinned vinext beta exporter omits the base path when prerendering. `scripts/export-pages.mjs` renders the production `/maya/` route through the framework’s server API and writes its HTML, RSC payload and normalized static assets to `out/`. It verifies the homepage, referenced bundles, data inventory and artwork before deployment. GitHub Actions builds and publishes that directory on pushes to `main`.

### INAH repository update

Added 24 original English summaries from location-matched INAH guides and 18 new interpretive drawings using archival photographs as architectural references. The atlas now contains 141 source-linked profiles. This update publishes the completed research; it does not claim that every inventory entry has an INAH record. Source links and English credits appear in each site panel. Prompts and photographic references are recorded in `public/art/INAH-PROVENANCE.md`. All 5,223 original coordinates are preserved.

### Conceptual landscapes

Sites without individual artwork use one of 20 distinct AI-generated ink and watercolor landscapes. A seeded hash of each inventory ID distributes images consistently across visits. Unique highlighted and INAH-reference drawings take precedence. Captions identify shared art as conceptual. Prompts are in `public/art/LANDSCAPE-PROMPTS.md`; validate assets and distribution with `node scripts/check-landscapes.mjs`.
