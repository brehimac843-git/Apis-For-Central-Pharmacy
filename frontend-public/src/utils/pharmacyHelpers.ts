export function getAmoPricing(
  price: number,
  amoSupported: boolean,
  amoRate: number | null
) {
  if (!amoSupported || amoRate == null) {
    return { fullPrice: price, amoPrice: null as number | null, savings: null as number | null }
  }

  const amoPrice = Math.max(0, Math.round(price * (1 - amoRate / 100)))
  const savings = Math.round(price * (amoRate / 100))
  return { fullPrice: price, amoPrice, savings }
}

export function openPharmacyDirections(
  pharmacy: { latitude: number; longitude: number },
  userLocation?: { latitude: number; longitude: number } | null
) {
  const destination = `${pharmacy.latitude},${pharmacy.longitude}`
  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`

  if (userLocation) {
    url += `&origin=${encodeURIComponent(`${userLocation.latitude},${userLocation.longitude}`)}`
  }

  window.open(url, "_blank")
}

export function requestPharmacyDirections(
  pharmacy: { latitude: number; longitude: number },
  userLocation?: { latitude: number; longitude: number } | null,
  onStatus?: (message: string) => void
) {
  if (userLocation) {
    onStatus?.("Opening navigation from your current location...")
    openPharmacyDirections(pharmacy, userLocation)
    return
  }

  if (!navigator.geolocation) {
    onStatus?.("Opening directions to the pharmacy.")
    openPharmacyDirections(pharmacy)
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      onStatus?.("Opening navigation from your current location...")
      openPharmacyDirections(pharmacy, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
    },
    () => {
      onStatus?.("Location unavailable. Opening directions to the pharmacy.")
      openPharmacyDirections(pharmacy)
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}
