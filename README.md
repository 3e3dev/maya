# MAYA — An illustrated atlas

Public site: https://3e3dev.github.io/maya/

A light OpenStreetMap atlas of all 5,223 coordinate records in the MayaMap EAAMS dataset. MapLibre groups nearby records into numbered clusters when zoomed out. Clicking a cluster smoothly expands it into smaller groups and individual site markers; selecting a site opens its illustrated notes and fly-to transition. The complete catalogue remains searchable. Phone layouts use a bottom detail sheet. Reduced-motion preferences are respected.

## Data and artwork

Coordinates, rank, notes and bibliographic references are preserved from https://mayamap.org/data/maya_sites.geojson. See `public/data/provenance.json` for retrieval details and source checksum. EAAMS was compiled by Walter Witschey and Clifford Brown. This is a source inventory, not a claim to contain every Maya archaeological site. All records are retained, including unclassified ranks and peripheral/unspecified locations.

Six landmark entries have historical summaries linked to UNESCO or INAH and individually generated drawings. Other entries use the original survey information and one of two shared, explicitly conceptual regional illustrations. The illustrations are interpretive, not evidence of specific architectural details. Exact prompts and generation provenance are in `public/art/PROVENANCE.md`. Images were created with the built-in image_gen tool and encoded as WebP.

Basemap: OpenFreeMap / OpenMapTiles, using OpenStreetMap data. Basemap and coordinate attribution remain visible on the map and in the About panel.

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
