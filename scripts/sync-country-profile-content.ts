import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import prettier from 'prettier'

import {
  countryCatalogSchema,
  countryProfileSchema,
} from '../src/data/countrySchema'

const projectRoot = path.resolve(import.meta.dirname, '..')
const profilePath = path.join(
  projectRoot,
  'scripts/country-profile-content.json',
)
const countriesPath = path.join(
  projectRoot,
  'src/data/generated/countries.json',
)

const profiles = Object.fromEntries(
  Object.entries(
    JSON.parse(await readFile(profilePath, 'utf8')) as Record<string, unknown>,
  ).map(([countryCode, profile]) => [
    countryCode,
    countryProfileSchema.parse(profile),
  ]),
)
const countries = countryCatalogSchema.parse(
  JSON.parse(await readFile(countriesPath, 'utf8')),
)

const synchronizedCountries = countries.map((country) => {
  const profile = profiles[country.code]
  if (!profile) throw new Error(`Missing profile for ${country.code}`)
  return { ...country, profile }
})

await writeFile(
  countriesPath,
  await prettier.format(JSON.stringify(synchronizedCountries), {
    parser: 'json',
  }),
)

console.log(`Synchronized ${synchronizedCountries.length} country profiles.`)
