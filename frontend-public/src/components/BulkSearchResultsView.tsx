import { MapPin, Navigation, Shield, XCircle } from "lucide-react"
import type { BulkSearchResults } from "../utils/bulkSearch"
import { rankPharmaciesFromResults } from "../utils/bulkSearch"
import { getAmoPricing, requestPharmacyDirections } from "../utils/pharmacyHelpers"

type Props = {
  results: BulkSearchResults
  userLocation?: { latitude: number; longitude: number } | null
}

function rankLabel(index: number, pharmacy: ReturnType<typeof rankPharmaciesFromResults>[number], ranked: ReturnType<typeof rankPharmaciesFromResults>): string {
  if (index === 0) return "Meilleure correspondance"

  const prev = ranked[index - 1]
  if (pharmacy.drugCount === prev.drugCount) {
    if (pharmacy.drugCount === pharmacy.totalDrugs) {
      return `#${index + 1} · même couverture complète`
    }
    return `#${index + 1} · même couverture`
  }

  return `#${index + 1}`
}

function rankHint(
  index: number,
  pharmacy: ReturnType<typeof rankPharmaciesFromResults>[number],
  ranked: ReturnType<typeof rankPharmaciesFromResults>,
  prioritizeAmo: boolean
): string | null {
  if (index === 0) return null

  const prev = ranked[index - 1]
  if (pharmacy.drugCount !== prev.drugCount) return null

  if (prioritizeAmo && pharmacy.amoDrugCount !== prev.amoDrugCount) {
    return "Classement inférieur — moins de médicaments couverts par l'AMO"
  }

  if (
    pharmacy.distanceKm != null &&
    prev.distanceKm != null &&
    pharmacy.distanceKm > prev.distanceKm
  ) {
    return "Classement inférieur — plus éloignée"
  }

  return "Classement inférieur — prix total plus élevé"
}

export default function BulkSearchResultsView({ results, userLocation = null }: Props) {
  const ranked = rankPharmaciesFromResults(results)
  const notFound = results.drugResults.filter((r) => r.status === "not_found")
  const foundDrugCount = results.drugResults.length - notFound.length
  const totalDrugs = results.drugResults.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
          <p className="text-2xl font-bold text-green-700">{foundDrugCount}</p>
          <p className="text-sm text-green-800">Médicaments trouvés</p>
        </div>
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
          <p className="text-2xl font-bold text-red-700">{notFound.length}</p>
          <p className="text-sm text-red-800">Non trouvés</p>
        </div>
      </div>

      {results.prioritizeAmo && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          Ranked by coverage first, then AMO support, then distance.
        </div>
      )}

      {ranked.length > 0 && (
        <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Pharmacies classées par couverture
            </h3>
          <div className="space-y-3">
            {ranked.map((pharmacy, index) => {
              const hint = rankHint(index, pharmacy, ranked, results.prioritizeAmo)
              const savings = pharmacy.totalFull - pharmacy.totalWithAmo

              return (
                <div
                  key={pharmacy.pharmacy}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${
                    index === 0 ? "border-primary-300 ring-1 ring-primary-100" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2 ${
                          index === 0
                            ? "bg-primary-100 text-primary-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {rankLabel(index, pharmacy, ranked)}
                      </span>
                      <p className="font-bold text-slate-900 text-lg">{pharmacy.pharmacy}</p>
                      <p className="text-sm text-slate-500">{pharmacy.city}</p>
                      <p className="text-sm font-semibold text-primary-700 mt-1">
                        {pharmacy.drugCount} sur {totalDrugs} médicaments disponibles
                      </p>
                      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    {pharmacy.distanceKm != null && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {pharmacy.distanceKm} km
                      </span>
                    )}
                    {pharmacy.amoDrugCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <Shield className="w-3.5 h-3.5" />
                        AMO on {pharmacy.amoDrugCount} of {pharmacy.drugCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {pharmacy.drugs.map(({ drug, match }) => {
                      const pricing = getAmoPricing(
                        match.price,
                        match.amo_supported,
                        match.amo_rate
                      )

                      return (
                        <div
                          key={drug}
                          className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-900">{drug}</span>
                          <div className="text-right shrink-0">
                                <p className="font-semibold text-slate-900">
                                  {pricing.fullPrice.toLocaleString()} FCFA
                                </p>
                                {pricing.amoPrice != null && (
                                  <p className="text-xs text-emerald-700">
                                    {pricing.amoPrice.toLocaleString()} avec AMO
                                  </p>
                                )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Total du panier</p>
                      <p className="font-bold text-slate-900">
                        {pharmacy.totalFull.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Avec AMO</p>
                      <p className="font-bold text-emerald-800">
                        {pharmacy.totalWithAmo.toLocaleString()} FCFA
                      </p>
                      {savings > 0 && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Économisez jusqu'à {savings.toLocaleString()} FCFA
                        </p>
                      )}
                    </div>
                  </div>

                    <button
                      type="button"
                      onClick={() =>
                        requestPharmacyDirections(
                          { latitude: pharmacy.latitude, longitude: pharmacy.longitude },
                          userLocation
                        )
                      }
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-white font-semibold hover:bg-primary-700 transition"
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {notFound.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Not found at any selected pharmacy
          </h3>
          <div className="space-y-2">
            {notFound.map((item) => (
              <div
                key={item.drug}
                className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3"
              >
                <span className="font-medium text-slate-900">{item.drug}</span>
                <span className="inline-flex items-center gap-1 text-sm text-red-700">
                  <XCircle className="w-4 h-4" />
                  Unavailable
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
