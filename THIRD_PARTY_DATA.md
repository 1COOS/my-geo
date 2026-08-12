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

## Flags

- Source: `flag-icons@7.5.0`
- Project: <https://github.com/lipis/flag-icons>
- License: MIT
- Use: copied 4:3 SVG flags for the 195-country catalogue.

Flag designs may also be subject to jurisdiction-specific laws and usage rules beyond the source-code license.
