# Third-party geography data

My Geo generates and ships local, offline-ready geography assets from fixed package versions. These sources are used during `bun run data:generate`; the application does not query them or any external API at runtime.

## Country catalogue

- Source: `world-countries@5.1.0`
- Project: <https://github.com/mledoze/countries>
- License: Open Database License (ODbL) 1.0
- Use: ISO codes, Chinese/English common and official names, continents, subregions, country centers, area, landlocked status, borders, capital names, language and currency source data.

The generated catalogue is a derivative database. It remains attributable to the source and is redistributed under the ODbL terms applicable to that database.

My Geo adds repository-owned Chinese labels for capitals, subregions and the small number of language or currency codes that are not localized by the pinned JavaScript runtime. The pinned source omits a currency entry for the Federated States of Micronesia, so the generator applies an explicit local USD correction and validates it with the rest of the catalogue.

## Knowledge-card highlights

- Structured highlights for 183 countries are generated from stable `world-countries@5.1.0` fields such as area, landlocked status and sovereign-border count.
- Three highlights for each of the 12 featured countries are repository-owned summaries reviewed against linked references from Encyclopaedia Britannica, UNESCO, the World Wildlife Fund and the U.S. National Park Service.
- The generated `country-sources.json` registry records publisher, URL, version or access date, and license notes. Links are optional references only; all displayed content remains available offline.

Reference sites retain their own copyright. My Geo stores short original Chinese summaries rather than copying source prose.

## Adjacent regions

Border codes outside the 195-country catalogue are not treated as sovereign countries. The local data contract classifies Hong Kong, Macao, Gibraltar, French Guiana, Western Sahara and Kosovo as non-interactive adjacent-region labels. This classification is a product presentation rule and does not replace a public-release map-compliance review.

## Country boundaries

- Source: `world-atlas@2.0.2`, derived from Natural Earth 4.1.0 Admin 0 data
- Projects: <https://github.com/topojson/world-atlas> and <https://www.naturalearthdata.com/>
- License: ISC for the World Atlas package; Natural Earth vector data is public domain
- Use: 1:110m prototype country polygons converted from TopoJSON to local GeoJSON.

These boundaries are for internal product prototyping. Public release, especially in regulated jurisdictions, requires a separate map-compliance review.

## Capital coordinates

- Source: `world-cities-json@1.0.1`, based on the SimpleMaps World Cities Database
- Project: <https://github.com/JetSetExpert/cities-json>
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Use: latitude and longitude for capital markers. Palestine uses an explicit local Ramallah coordinate override because the source does not include a matching capital record.

## Oceans and named waterbodies

- References: NOAA Ocean Service education materials, the GEBCO Gazetteer of Undersea Feature Names, International Hydrographic Organization standards, and Marine Regions geographic names.
- Accessed: 2026-08-13.
- Use: reviewed Chinese and English names, broad locations, classifications, adjacent land descriptions, and educational summaries for 50 oceans, seas, bays, gulfs, straits, and trenches.

My Geo stores repository-owned summaries and deliberately simplified teaching geometries. Surface polygons and trench lines show an approximate location only. They are not hydrographic limits and do not represent territorial seas, exclusive economic zones, jurisdiction, sovereignty, or any legal boundary. Public release still requires a separate map-compliance and content review.

## Major rivers and artificial canals

- Primary river geometry: Natural Earth 5.0.0 1:10m river and lake centerlines, public domain. The pinned archive SHA-256 is `ded71b01870855ccfe19b51f2ec14c9bb48fae23c0e9f3c11974d426433b5c38`.
- Build process: `data:generate` downloads or accepts a local copy of the pinned archive, verifies the SHA-256, reads SHP/DBF records by repository-reviewed `ne_id` and part indexes, then commits deterministic high, medium and low-detail main-stem JSON. `data:validate` never accesses the network.
- Supplement references: public Ministry of Water Resources material for the upper Yangtze review; Mekong River Commission material for the upper Mekong review; Natural Resources Canada's National Hydro Network for the Great Lakes–Saint Lawrence connection; Peru's ANA for the Amazon source reach; and Brazil's ANA/SNIRH for the Paraguay main stem. These references guide short repository-authored connectors; their original vector records are not copied into the committed JSON.
- Content references: Encyclopaedia Britannica river and canal overviews, UNESCO's Grand Canal record, and official Suez and Panama canal authority pages.
- Accessed: 2026-08-13.
- Use: reviewed Chinese and English names, approximate lengths, sources and mouths or endpoints, connected waters, and simplified main-stem paths for 30 major river systems and 10 artificial canals.

Five catalog objects include explicitly recorded educational supplements because Natural Earth does not contain a complete source-to-mouth main stem: the Yangtze, Mekong, Amazon, Paraná–Paraguay and Saint Lawrence–Great Lakes systems. Generated provenance records every Natural Earth feature/part and every inserted gap. The shipped lines remain teaching centerlines and intentionally omit ordinary tributaries, changing channels, floodplains, legal water boundaries, guaranteed depths, shipping conditions and real-time flow. HydroRIVERS and Hydrography90m are not used because their redistribution terms do not fit this offline PWA release.

## Famous mountain ranges

- Primary range envelopes: Natural Earth 5.0.0 1:10m geography region polygons, public domain. The pinned archive SHA-256 is `cb7b9db200284ed1551f20eacc7f3333e9b5f311c19f7cb2670694529f688682`.
- Build process: `data:generate` verifies the pinned archive, resolves 30 repository-reviewed `ne_id` records, validates ordered ridge controls against their range envelopes, and writes deterministic high, medium and low-detail ridge lines. `data:validate` does not access the network.
- Content references: Encyclopaedia Britannica mountain references, the U.S. Geological Survey, China's Ministry of Natural Resources, Geoscience Australia and Land Information New Zealand. Accessed 2026-08-14.
- Use: Chinese and English names, broad locations, approximate lengths, highest-peak names, elevations, coordinates and original educational summaries.

Natural Earth provides broad range polygons rather than crest lines. My Geo therefore treats those polygons as validation envelopes and derives repository-reviewed teaching ridges from ordered control points. The displayed line and peak marker are not a digital elevation model, complete mountain boundary, climbing route, hazard assessment, administrative border or sovereignty statement. Mountain and summit measurements can vary between surveys, so values marked as approximate should not be read as live surveying results.

## Flags

- Source: `flag-icons@7.5.0`
- Project: <https://github.com/lipis/flag-icons>
- License: MIT
- Use: copied 4:3 SVG flags for the 195-country catalogue.

Flag designs may also be subject to jurisdiction-specific laws and usage rules beyond the source-code license.
