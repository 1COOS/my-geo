import type { CountrySource } from '../src/data/countrySchema'

const accessedAt = '2026-08-12'
const referenceLicense = 'Copyrighted reference material; linked, not copied'

export const countrySources: CountrySource[] = [
  {
    id: 'world-countries',
    name: 'World Countries dataset',
    publisher: 'mledoze/countries contributors',
    version: '5.1.0',
    url: 'https://github.com/mledoze/countries',
    license: 'Open Database License (ODbL) 1.0',
  },
  ...[
    [
      'britannica-australia',
      'Australia',
      'https://www.britannica.com/place/Australia',
    ],
    ['britannica-brazil', 'Brazil', 'https://www.britannica.com/place/Brazil'],
    ['britannica-china', 'China', 'https://www.britannica.com/place/China'],
    ['britannica-egypt', 'Egypt', 'https://www.britannica.com/place/Egypt'],
    ['britannica-france', 'France', 'https://www.britannica.com/place/France'],
    ['britannica-india', 'India', 'https://www.britannica.com/place/India'],
    [
      'britannica-indonesia',
      'Indonesia',
      'https://www.britannica.com/place/Indonesia',
    ],
    ['britannica-japan', 'Japan', 'https://www.britannica.com/place/Japan'],
    ['britannica-mexico', 'Mexico', 'https://www.britannica.com/place/Mexico'],
    ['britannica-russia', 'Russia', 'https://www.britannica.com/place/Russia'],
    [
      'britannica-south-africa',
      'South Africa',
      'https://www.britannica.com/place/South-Africa',
    ],
    [
      'britannica-united-states',
      'United States',
      'https://www.britannica.com/place/United-States',
    ],
  ].map(([id, countryName, url]) => ({
    id,
    name: `${countryName} overview`,
    publisher: 'Encyclopaedia Britannica',
    accessedAt,
    url,
    license: referenceLicense,
  })),
  {
    id: 'wwf-giant-panda',
    name: 'Giant Panda',
    publisher: 'World Wildlife Fund',
    accessedAt,
    url: 'https://www.worldwildlife.org/species/giant-panda',
    license: referenceLicense,
  },
  {
    id: 'nps-yellowstone',
    name: 'History of Yellowstone National Park',
    publisher: 'U.S. National Park Service',
    accessedAt,
    url: 'https://www.nps.gov/yell/learn/historyculture/index.htm',
    license: 'U.S. federal government reference material; linked, not copied',
  },
  {
    id: 'unesco-giza',
    name: 'Memphis and its Necropolis – the Pyramid Fields from Giza to Dahshur',
    publisher: 'UNESCO World Heritage Centre',
    accessedAt,
    url: 'https://whc.unesco.org/en/list/86/',
    license: referenceLicense,
  },
  {
    id: 'unesco-great-barrier-reef',
    name: 'Great Barrier Reef',
    publisher: 'UNESCO World Heritage Centre',
    accessedAt,
    url: 'https://whc.unesco.org/en/list/154/',
    license: referenceLicense,
  },
]
