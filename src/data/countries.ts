import { countryCatalogSchema } from './countrySchema'

// The first country content slice will be added after the 3D baseline.
// Keeping parsing at module load makes invalid educational content fail fast.
export const countries = countryCatalogSchema.parse([])
