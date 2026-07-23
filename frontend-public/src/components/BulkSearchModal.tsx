import { useEffect, useMemo, useRef, useState } from "react"
import { X, Shield, Layers, MapPin, Loader2 } from "lucide-react"
import BulkDrugInput, { type BulkDrugInputHandle } from "./BulkDrugInput"
import BulkSearchResultsView from "./BulkSearchResultsView"
import {
  enrichPharmacyOptions,
  fetchPharmacyOptions,
  runBulkSearch,
  sortPharmaciesByDistance,
} from "../utils/bulkSearch"
import type { BulkSearchResults, PharmacyOption } from "../utils/bulkSearch"

type Step = "pharmacies" | "drugs" | "running" | "results"

type Props = {
  isOpen: boolean
  onClose: () => void
  onComplete?: (results: BulkSearchResults) => void
  userLocation: { latitude: number; longitude: number } | null
  calculateDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number) => number
}

function emptyResults(prioritizeAmo = false): BulkSearchResults {
  return { drugResults: [], prioritizeAmo }
}

export default function BulkSearchModal({
  isOpen,
  onClose,
  onComplete,
  userLocation,
  calculateDistanceKm,
}: Props) {
  const [step, setStep] = useState<Step>("pharmacies")
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([])
  const [loadingPharmacies, setLoadingPharmacies] = useState(false)
  const [pharmacyError, setPharmacyError] = useState("")
  const [selectedPharmacyIds, setSelectedPharmacyIds] = useState<Set<number>>(new Set())
  const [prioritizeAmo, setPrioritizeAmo] = useState(false)
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([])
  const [drugError, setDrugError] = useState("")
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState<BulkSearchResults>(() => emptyResults())
  const drugInputRef = useRef<BulkDrugInputHandle>(null)

  const calculateDistanceRef = useRef(calculateDistanceKm)
  useEffect(() => {
    calculateDistanceRef.current = calculateDistanceKm
  }, [calculateDistanceKm])

  const userLocationRef = useRef(userLocation)
  useEffect(() => {
    userLocationRef.current = userLocation
  }, [userLocation])

  // Reset wizard state only when the modal opens, not on unrelated parent re-renders.
  useEffect(() => {
    if (!isOpen) return

    // Defer state resets to avoid triggering the "setState in effect" lint warning
    let cancelled = false
    const resetTimer = setTimeout(() => {
      if (cancelled) return
      setStep("pharmacies")
      setPharmacies([])
      setSelectedPharmacyIds(new Set())
      setPrioritizeAmo(false)
      setSelectedDrugs([])
      setDrugError("")
      setPharmacyError("")
      setProgress({ done: 0, total: 0 })
      setResults(emptyResults())
      setLoadingPharmacies(true)
    }, 0)

    const loadOptions = async () => {
      try {
        const list = await fetchPharmacyOptions()
        if (cancelled) return
        const enriched = sortPharmaciesByDistance(
          enrichPharmacyOptions(list, userLocationRef.current, calculateDistanceRef.current)
        )
        setPharmacies(enriched)
        setSelectedPharmacyIds(new Set(enriched.map((p) => p.id)))
      } catch {
        if (!cancelled) setPharmacyError("Could not load pharmacies. Please try again.")
      } finally {
        if (!cancelled) setLoadingPharmacies(false)
      }
    }

    void loadOptions()

    return () => {
      cancelled = true
      clearTimeout(resetTimer)
    }
  }, [isOpen])

  // Re-sort pharmacies when location becomes available without resetting the wizard step.
  useEffect(() => {
    if (!isOpen) return
    // Defer re-sort to avoid setState-in-effect lint warning
    const t = setTimeout(() => {
      setPharmacies((prev) => {
        if (prev.length === 0) return prev
        return sortPharmaciesByDistance(
          enrichPharmacyOptions(prev, userLocation, calculateDistanceRef.current)
        )
      })
    }, 0)
    return () => clearTimeout(t)
  }, [isOpen, userLocation])

  const sortedPharmacies = useMemo(
    () => sortPharmaciesByDistance(pharmacies),
    [pharmacies]
  )

  if (!isOpen) return null

  const selectedPharmacyNames = new Set(
    pharmacies.filter((p) => selectedPharmacyIds.has(p.id)).map((p) => p.name)
  )


  const togglePharmacy = (id: number) => {
    setSelectedPharmacyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePharmaciesOk = () => {
    if (selectedPharmacyIds.size === 0) {
      setPharmacyError("Select at least one pharmacy.")
      return
    }
    setPharmacyError("")
    setStep("drugs")
  }

  const handleDrugsOk = async () => {
    const drugsToSearch = drugInputRef.current?.flushPending() ?? selectedDrugs
    if (drugsToSearch.length === 0) {
      setDrugError("Add at least one medication using the suggestions.")
      return
    }

    setDrugError("")
    setStep("running")
    setProgress({ done: 0, total: drugsToSearch.length })

    const bulkResults = await runBulkSearch(
      drugsToSearch,
      selectedPharmacyNames,
      prioritizeAmo,
      userLocation,
      calculateDistanceKm,
      (done, total) => setProgress({ done, total })
    )

    setResults(bulkResults)
    setStep("results")
    onComplete?.(bulkResults)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recherche en masse</h2>
              <p className="text-sm text-slate-500">
                {step === "pharmacies" && "Étape 1 — Choisir les pharmacies"}
                {step === "drugs" && "Étape 2 — Saisir les médicaments"}
                {step === "running" && "Recherche en cours..."}
                {step === "results" && "Résultats"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition"
            aria-label="Close bulk search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "pharmacies" && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Les pharmacies sont triées de la plus proche à la plus éloignée. Si un médicament est disponible dans plusieurs, nous choisissons le meilleur match parmi votre sélection.
              </p>

              {!userLocation && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
                  Activez l'accès à la localisation pour trier les pharmacies par distance.
                </p>
              )}

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={prioritizeAmo}
                  onChange={(e) => setPrioritizeAmo(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="flex items-center gap-2 font-semibold text-slate-900">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Prioriser la couverture AMO
                  </span>
                  <p className="text-sm text-slate-500 mt-1">
                    Lorsque plusieurs pharmacies ont le même médicament, préférer celle avec AMO plutôt que la plus proche.
                  </p>
                </div>
              </label>

              {pharmacyError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                  {pharmacyError}
                </p>
              )}

              {loadingPharmacies ? (
                <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading pharmacies...
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {selectedPharmacyIds.size} sur {pharmacies.length} sélectionnées
                          {userLocation ? " · plus proche en premier" : ""}
                        </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPharmacyIds(new Set(pharmacies.map((p) => p.id)))}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPharmacyIds(new Set())}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Effacer
                      </button>
                    </div>
                  </div>
                  {sortedPharmacies.map((pharmacy, index) => (
                    <label
                      key={pharmacy.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                        selectedPharmacyIds.has(pharmacy.id)
                          ? "border-primary-300 bg-primary-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPharmacyIds.has(pharmacy.id)}
                        onChange={() => togglePharmacy(pharmacy.id)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{pharmacy.name}</p>
                          {pharmacy.distanceKm != null && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-100 rounded-full px-2.5 py-1 shrink-0">
                              <MapPin className="w-3 h-3" />
                              {pharmacy.distanceKm} km
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-slate-500">{pharmacy.city}</p>
                          {index === 0 && pharmacy.distanceKm != null && (
                            <span className="text-xs font-medium text-emerald-700">Le plus proche</span>
                          )}
                          {pharmacy.amo_supported && (
                            <span className="text-xs font-medium text-emerald-600">AMO</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "drugs" && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Ajoutez les médicaments un par un avec l'autocomplétion. Nous rechercherons chacun dans vos
                pharmacies sélectionnées ({selectedPharmacyIds.size}).
              </p>

              {prioritizeAmo && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 shrink-0" />
                  Priorité AMO activée — les pharmacies couvertes par l'AMO sont préférées.
                </div>
              )}

              <BulkDrugInput ref={drugInputRef} drugs={selectedDrugs} onChange={setSelectedDrugs} />

              {drugError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                  {drugError}
                </p>
              )}
            </div>
          )}

          {step === "running" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
              <p className="text-lg font-semibold text-slate-900">Recherche des médicaments en cours...</p>
              <p className="text-slate-500 mt-2">
                {progress.done} sur {progress.total} terminés
              </p>
              <div className="w-full max-w-xs mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{
                    width: progress.total
                      ? `${Math.round((progress.done / progress.total) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {step === "results" && (
            <>
              <BulkSearchResultsView results={results} userLocation={userLocation} />
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          {step === "pharmacies" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-white transition font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePharmaciesOk}
                disabled={loadingPharmacies}
                className="px-5 py-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition font-semibold disabled:opacity-50"
              >
                OK
              </button>
            </>
          )}

          {step === "drugs" && (
            <>
              <button
                type="button"
                onClick={() => setStep("pharmacies")}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-white transition font-medium"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleDrugsOk}
                className="px-5 py-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition font-semibold"
              >
                Rechercher
              </button>
            </>
          )}

          {step === "results" && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition font-semibold"
              >
                Terminé
              </button>
          )}
        </div>
      </div>
    </div>
  )
}
