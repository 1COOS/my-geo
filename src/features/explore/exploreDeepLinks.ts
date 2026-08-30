export function parseExploreDeepLinkPosition(searchParams: URLSearchParams) {
  const latitudeValue = searchParams.get('latitude')
  const longitudeValue = searchParams.get('longitude')
  if (!latitudeValue?.trim() || !longitudeValue?.trim()) return undefined
  const latitude = Number(latitudeValue)
  const longitude = Number(longitudeValue)
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined
  }
  return { latitude, longitude }
}
