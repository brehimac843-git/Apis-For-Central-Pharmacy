import axios from "axios"
import { API_BASE } from "../config"

export type StockMatch = {
  pharmacy: string
  city: string
  latitude: number
  longitude: number
  price: number
  stock: number
  amo_supported: boolean
  amo_rate: number | null
  distanceKm?: number
}

export type BulkSearchDrugResult =
  | {
      drug: string
      status: "found"
      matches: StockMatch[]
    }
  | {
      drug: string
      status: "not_found"
    }

export type BulkSearchResults = {
  drugResults: BulkSearchDrugResult[]
  prioritizeAmo: boolean
}

/** @deprecated Per-drug result shape — use BulkSearchResults instead */
export type BulkSearchItemResult =
  | {
      drug: string
      status: "found"
      match: StockMatch
      availableAt: number
    }
  | {
      drug: string
      status: "not_found"
    }

export type PharmacyDrugEntry = {
  drug: string
  match: StockMatch
}

export type BulkPharmacyRanking = {
  pharmacy: string
  city: string
  latitude: number
  longitude: number
  distanceKm?: number
  drugCount: number
  totalDrugs: number
  amoDrugCount: number
  drugs: PharmacyDrugEntry[]
  totalFull: number
  totalWithAmo: number
}

export type PharmacyOption = {
  id: number
  name: string
  city: string
  latitude: number
  longitude: number
  amo_supported: boolean
  distanceKm?: number
}

export function sortPharmaciesByDistance(pharmacies: PharmacyOption[]): PharmacyOption[] {
  return [...pharmacies].sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
    if (a.distanceKm != null) return -1
    if (b.distanceKm != null) return 1
    return a.name.localeCompare(b.name)
  })
}

export function enrichPharmacyOptions(
  pharmacies: PharmacyOption[],
  userLocation: { latitude: number; longitude: number } | null,
  calculateDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number) => number
): PharmacyOption[] {
  if (!userLocation) return pharmacies

  return pharmacies.map((pharmacy) => ({
    ...pharmacy,
    distanceKm: calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      pharmacy.latitude,
      pharmacy.longitude
    ),
  }))
}

export async function resolveDrugName(input: string): Promise<string> {
  const trimmed = input.trim()
  if (!trimmed) return trimmed

  try {
    const res = await axios.get(`${API_BASE}/api/suggestions?q=${encodeURIComponent(trimmed)}`)
    const suggestions: string[] = res.data ?? []
    const exact = suggestions.find((s) => s.toLowerCase() === trimmed.toLowerCase())
    if (exact) return exact
    if (suggestions.length > 0) return suggestions[0]
  } catch {
    // fall through to raw input
  }

  return trimmed
}

export async function resolveDrugNames(inputs: string[]): Promise<string[]> {
  const resolved: string[] = []
  const seen = new Set<string>()

  for (const input of inputs) {
    const name = await resolveDrugName(input)
    const key = name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    resolved.push(name)
  }

  return resolved
}

export async function fetchDrugSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim()
  if (trimmed.length < 1) return []

  try {
    const res = await axios.get(`${API_BASE}/api/suggestions?q=${encodeURIComponent(trimmed)}`)
    return res.data ?? []
  } catch {
    return []
  }
}

export function parseDrugNames(raw: string): string[] {
  const seen = new Set<string>()
  const drugs: string[] = []

  for (const part of raw.split(/[\n,;]+/)) {
    const name = part.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    drugs.push(name)
  }

  return drugs
}

export function enrichWithDistance(
  matches: StockMatch[],
  userLocation: { latitude: number; longitude: number } | null,
  calculateDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number) => number
): StockMatch[] {
  if (!userLocation) return matches

  return matches.map((item) => ({
    ...item,
    distanceKm: calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      item.latitude,
      item.longitude
    ),
  }))
}

export function pickBestPharmacy(
  matches: StockMatch[],
  prioritizeAmo: boolean
): StockMatch {
  const pool =
    prioritizeAmo
      ? matches.filter((p) => p.amo_supported && p.amo_rate != null)
      : matches

  const candidates = pool.length > 0 ? pool : matches

  const hasDistance = candidates.some((p) => p.distanceKm != null)
  if (hasDistance) {
    return [...candidates].sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    )[0]
  }

  return [...candidates].sort((a, b) => a.price - b.price)[0]
}

function pricingTotals(drugs: PharmacyDrugEntry[]) {
  let totalFull = 0
  let totalWithAmo = 0

  for (const { match } of drugs) {
    const price = match.price
    totalFull += price
    if (match.amo_supported && match.amo_rate != null) {
      totalWithAmo += Math.max(0, Math.round(price * (1 - match.amo_rate / 100)))
    } else {
      totalWithAmo += price
    }
  }

  return { totalFull, totalWithAmo, savings: totalFull - totalWithAmo }
}

export function rankPharmaciesFromResults(results: BulkSearchResults): BulkPharmacyRanking[] {
  const found = results.drugResults.filter(
    (r): r is Extract<BulkSearchDrugResult, { status: "found" }> => r.status === "found"
  )
  const totalDrugs = results.drugResults.length
  const byPharmacy = new Map<string, BulkPharmacyRanking>()

  for (const drugResult of found) {
    for (const match of drugResult.matches) {
      let entry = byPharmacy.get(match.pharmacy)
      if (!entry) {
        entry = {
          pharmacy: match.pharmacy,
          city: match.city,
          latitude: match.latitude,
          longitude: match.longitude,
          distanceKm: match.distanceKm,
          drugCount: 0,
          totalDrugs,
          amoDrugCount: 0,
          drugs: [],
          totalFull: 0,
          totalWithAmo: 0,
        }
        byPharmacy.set(match.pharmacy, entry)
      }

      if (entry.drugs.some((d) => d.drug === drugResult.drug)) continue

      entry.drugs.push({ drug: drugResult.drug, match })
      entry.drugCount += 1
      if (match.amo_supported && match.amo_rate != null) {
        entry.amoDrugCount += 1
      }
    }
  }

  const ranked = [...byPharmacy.values()].map((entry) => {
    const totals = pricingTotals(entry.drugs)
    return { ...entry, ...totals }
  })

  ranked.sort((a, b) => {
    if (b.drugCount !== a.drugCount) return b.drugCount - a.drugCount

    if (results.prioritizeAmo && b.amoDrugCount !== a.amoDrugCount) {
      return b.amoDrugCount - a.amoDrugCount
    }

    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm - b.distanceKm
    }
    if (a.distanceKm != null) return -1
    if (b.distanceKm != null) return 1

    return a.totalFull - b.totalFull
  })

  return ranked
}

export function topPharmacyFromResults(results: BulkSearchResults): StockMatch | null {
  const ranked = rankPharmaciesFromResults(results)
  if (ranked.length === 0) return null
  const top = ranked[0]
  return {
    pharmacy: top.pharmacy,
    city: top.city,
    latitude: top.latitude,
    longitude: top.longitude,
    price: top.totalFull,
    stock: 0,
    amo_supported: top.amoDrugCount > 0,
    amo_rate: top.amoDrugCount > 0 ? top.drugs.find((d) => d.match.amo_rate != null)?.match.amo_rate ?? null : null,
    distanceKm: top.distanceKm,
  }
}

export async function runBulkSearch(
  drugs: string[],
  selectedPharmacyNames: Set<string>,
  prioritizeAmo: boolean,
  userLocation: { latitude: number; longitude: number } | null,
  calculateDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number) => number,
  onProgress?: (completed: number, total: number) => void
): Promise<BulkSearchResults> {
  const resolvedDrugs = await resolveDrugNames(drugs)
  const drugResults: BulkSearchDrugResult[] = []

  for (let i = 0; i < resolvedDrugs.length; i++) {
    const drug = resolvedDrugs[i]
    onProgress?.(i, resolvedDrugs.length)

    try {
      const res = await axios.get(
        `${API_BASE}/api/aggregate-stock/${encodeURIComponent(drug)}`
      )
      const allMatches: StockMatch[] = res.data ?? []
      const filtered = allMatches.filter((p) => selectedPharmacyNames.has(p.pharmacy))

      if (filtered.length === 0) {
        drugResults.push({ drug, status: "not_found" })
        continue
      }

      const enriched = enrichWithDistance(filtered, userLocation, calculateDistanceKm)
      drugResults.push({
        drug,
        status: "found",
        matches: enriched,
      })
    } catch {
      drugResults.push({ drug, status: "not_found" })
    }
  }

  onProgress?.(resolvedDrugs.length, resolvedDrugs.length)
  return { drugResults, prioritizeAmo }
}

export async function fetchPharmacyOptions(): Promise<PharmacyOption[]> {
  const res = await axios.get(`${API_BASE}/api/pharmacies`)
  return res.data ?? []
}
