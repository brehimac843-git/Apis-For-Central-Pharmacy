import { useState, useRef, useEffect, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import Catalogue from "./Catalogue"
import PharmacyDetail from "./PharmacyDetail"
import DrugDetail from "./DrugDetail"
import { API_BASE } from "../config"
import { ROUTES, getViewFromPath, getDrugNameFromPath } from "../routes"
import { ArrowLeft, Search, Clock, Shield, Trash2, Filter, Layers, X } from "lucide-react"
import BulkSearchModal from "./BulkSearchModal"
import BulkSearchResultsView from "./BulkSearchResultsView"
import type { BulkSearchResults } from "../utils/bulkSearch"

type Pharmacy = {
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

type SearchHistoryItem = {
  id: string
  query: string
  type?: "single" | "bulk"
  payload?: BulkSearchResults | null
  createdAt: string
}

type CatalogueDrug = {
  name: string
  category: string
  minPrice: number
  availableAt: number
  description?: string
}

type Props = {
  token: string
  isGuest?: boolean
}

export default function Dashboard({ token, isGuest = false }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const view = getViewFromPath(location.pathname)
  const drugNameFromPath = getDrugNameFromPath(location.pathname)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [results, setResults] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterAmo, setFilterAmo] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'closest' | 'furthest' | null>('closest')
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [resultView, setResultView] = useState<'grid' | 'list'>('grid')
  const [confirmationAction, setConfirmationAction] = useState<"clear" | "delete" | null>(null)
  const [confirmationTargetId, setConfirmationTargetId] = useState<string | null>(null)
  const [historyNotice, setHistoryNotice] = useState<string | null>(null)
  const [bulkSearchOpen, setBulkSearchOpen] = useState(false)
  const [bulkHistoryDetail, setBulkHistoryDetail] = useState<BulkSearchResults | null>(null)

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load search history and user location on mount; clear history when guest
  useEffect(() => {
    if (isGuest) {
      setSearchHistory([])
    } else {
      loadSearchHistory()
    }
    requestUserLocation()
  }, [isGuest])

  useEffect(() => {
    if (isGuest && view === "history") {
      navigate(ROUTES.dashboard, { replace: true })
    }
  }, [isGuest, view, navigate])

  const loadSearchHistory = async () => {
    if (isGuest) return
    try {
      const res = await axios.get(`${API_BASE}/api/public/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSearchHistory(res.data || [])
    } catch (err) {
      console.error("Failed to load history", err)
    }
  }

  const deleteHistoryItem = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/api/public/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSearchHistory((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error("Failed to delete history item", err)
    }
  }

  const clearHistory = async () => {
    try {
      await axios.delete(`${API_BASE}/api/public/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSearchHistory([])
    } catch (err) {
      console.error("Failed to clear history", err)
    }
  }

  const confirmAction = async () => {
    if (confirmationAction === "clear") {
      await clearHistory()
      setHistoryNotice("Search history cleared.")
    }
    if (confirmationAction === "delete" && confirmationTargetId) {
      await deleteHistoryItem(confirmationTargetId)
      setHistoryNotice("Search entry deleted.")
    }
    setConfirmationAction(null)
    setConfirmationTargetId(null)
  }

  const openDeleteConfirmation = (id: string) => {
    setConfirmationAction("delete")
    setConfirmationTargetId(id)
  }

  const openClearConfirmation = () => {
    setConfirmationAction("clear")
    setConfirmationTargetId(null)
  }

  const cancelConfirmation = () => {
    setConfirmationAction(null)
    setConfirmationTargetId(null)
  }

  const calculateDistanceKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 6371 // Earth radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
  }, [])

  async function fetchSuggestions(q: string) {
    if (q.trim().length < 1) {
      setSuggestions([])
      return
    }
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      const res = await axios.get(`${API_BASE}/api/suggestions?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
      setSuggestions(res.data)
    } catch (err) {
      if (!axios.isCancel(err)) console.error(err)
    }
  }

  const saveBulkSearchHistory = async (results: BulkSearchResults) => {
    if (isGuest) return

    try {
      const historyRes = await axios.post(
        `${API_BASE}/api/public/history/bulk`,
        { results },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const historyItem = historyRes.data?.historyItem
      if (historyItem) {
        setSearchHistory((prev) => [historyItem, ...prev].slice(0, 10))
      }
    } catch (error) {
      console.error("Failed to save bulk search history", error)
    }
  }

  async function searchDrug(name: string) {
    if (!name.trim()) return
    if (view !== "search") {
      navigate(ROUTES.dashboard)
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (abortControllerRef.current) abortControllerRef.current.abort()

    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/aggregate-stock/${encodeURIComponent(name.trim())}`)
      let enrichedResults = res.data.map((item: Pharmacy) => {
        if (userLocation) {
          return {
            ...item,
            distanceKm: calculateDistanceKm(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude),
          }
        }
        return item
      })

      // If user requested a sort and we have location, apply it immediately
      if (sortBy && userLocation) {
        enrichedResults = enrichedResults.map((r: Pharmacy) => ({
          ...r,
          distanceKm:
            r.distanceKm != null
              ? r.distanceKm
              : calculateDistanceKm(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude),
        }))
        enrichedResults.sort((a: Pharmacy, b: Pharmacy) => {
          if (a.distanceKm == null) return 1
          if (b.distanceKm == null) return -1
          return sortBy === 'closest' ? (a.distanceKm as number) - (b.distanceKm as number) : (b.distanceKm as number) - (a.distanceKm as number)
        })
      }

      setResults(enrichedResults)
      setSuggestions([])
      setShowSuggestions(false)
      setFilterAmo(false)

      // Save to history (registered users only)
      if (isGuest) return
      try {
        const historyRes = await axios.post(
          `${API_BASE}/api/public/history`,
          { query: name.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const historyItem = historyRes.data?.historyItem
        if (historyItem) {
          setSearchHistory((prev) => {
            const filtered = prev.filter((item) => item.query.toLowerCase() !== name.trim().toLowerCase())
            return [historyItem, ...filtered].slice(0, 10)
          })
        }
      } catch (error) {
        console.error("Failed to save history", error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        // Keep using the default results when location is unavailable.
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const applySort = (order: 'closest' | 'furthest') => {
    if (!userLocation) {
      // Request location then apply sort when available
      requestUserLocation()
      setSortBy(order)
      return
    }

    const withDistances = results.map((r) => ({
      ...r,
      distanceKm:
        r.distanceKm != null
          ? r.distanceKm
          : calculateDistanceKm(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude),
    }))

    const sorted = withDistances.sort((a, b) => {
      if (a.distanceKm == null) return 1
      if (b.distanceKm == null) return -1
      return order === 'closest' ? a.distanceKm - b.distanceKm : b.distanceKm - a.distanceKm
    })
    setResults(sorted)
    setSortBy(order)
  }

  useEffect(() => {
    if (!userLocation) return
    if (!sortBy) return
    // when location becomes available, re-apply the chosen sort
    applySort(sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation])

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
    setActiveIndex(-1)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (view === "history") {
      navigate(ROUTES.dashboard)
    }
    setShowSuggestions(true)
    if (newQuery.trim().length < 1) {
      setSuggestions([])
      return
    }
    typingTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newQuery)
    }, 300)
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    searchDrug(suggestion)
  }

  const handleSelectHistory = (item: SearchHistoryItem) => {
    if (item.type === "bulk") return
    navigate(ROUTES.dashboard)
    setQuery(item.query)
    searchDrug(item.query)
  }

  const renderBulkHistoryDetailModal = () => {
    if (!bulkHistoryDetail) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bulk Search</h2>
              <p className="text-sm text-slate-500">Saved search details</p>
            </div>
            <button
              type="button"
              onClick={() => setBulkHistoryDetail(null)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition"
              aria-label="Close bulk search details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <BulkSearchResultsView results={bulkHistoryDetail} userLocation={userLocation} />
          </div>
          <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={() => setBulkHistoryDetail(null)}
              className="px-5 py-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSelectDrug = (drug: CatalogueDrug) => {
    navigate(ROUTES.drugDetail(drug.name), { state: { drug } })
  }

  const handleBackToCatalogue = () => {
    navigate(ROUTES.catalogue)
  }

  const handleSearchFromDetail = (drugName: string) => {
    navigate(ROUTES.dashboard)
    searchDrug(drugName)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        const selectedSuggestion = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0]
        setQuery(selectedSuggestion)
        searchDrug(selectedSuggestion)
      } else {
        searchDrug(query)
      }
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault()
      setActiveIndex(Math.min(activeIndex + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault()
      setActiveIndex(Math.max(activeIndex - 1, -1))
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      if (view === "history") {
        navigate(ROUTES.dashboard)
      }
    }
  }


  if (view === "drug" && drugNameFromPath) {
    const drug: CatalogueDrug =
      (location.state as { drug?: CatalogueDrug } | null)?.drug ?? {
        name: drugNameFromPath,
        category: "Medication",
        minPrice: 0,
        availableAt: 0,
      }

    return <DrugDetail drug={drug} onBack={handleBackToCatalogue} onSearch={handleSearchFromDetail} />
  }

  if (view === "catalogue") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(ROUTES.dashboard)}
            className="mb-8 inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 hover:text-primary-700 font-semibold transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Search
          </button>
          <Catalogue onSelectDrug={handleSelectDrug} />
        </div>
      </div>
    )
  }

  if (view === "history") {
    return (
      <>
        {historyNotice && (
          <div className="fixed left-1/2 top-6 z-50 w-[min(95%,36rem)] -translate-x-1/2 rounded-2xl bg-green-50 border border-green-200 text-green-900 px-5 py-3 shadow-lg flex items-center justify-between gap-4">
            <span>{historyNotice}</span>
            <button
              type="button"
              onClick={() => setHistoryNotice(null)}
              className="rounded-full px-2 py-1 text-green-900 hover:bg-green-100 transition"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        {confirmationAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                {confirmationAction === "clear" ? "Clear all history" : "Delete history item"}
              </h3>
              <p className="text-slate-600 mb-6">
                {confirmationAction === "clear"
                  ? "This will remove every saved search from your history."
                  : "This will delete the selected history item permanently."}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={cancelConfirmation}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAction}
                  className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(ROUTES.dashboard)}
            className="mb-8 inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 hover:text-primary-700 font-semibold transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Search
          </button>
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Search History</h2>
                <p className="text-sm text-slate-500">Manage your saved searches from one clean place.</p>
              </div>
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={openClearConfirmation}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear history
                </button>
              )}
            </div>
            {searchHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                No search history yet. Search for a medication or run a bulk search to build your history.
              </div>
            ) : (
              <div className="space-y-4">
                {searchHistory.map((item) => {
                  const isBulk = item.type === "bulk"

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {isBulk ? (
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-slate-900">
                                <Layers className="w-4 h-4" />
                                <span className="font-semibold">Bulk search</span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.payload) setBulkHistoryDetail(item.payload)
                              }}
                              disabled={!item.payload}
                              className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition disabled:opacity-50"
                            >
                              Show detail
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectHistory(item)}
                            className="text-left flex-1"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-slate-900">
                                <Clock className="w-4 h-4" />
                                <span className="font-semibold">{item.query}</span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">Tap to search again</p>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openDeleteConfirmation(item.id)}
                          className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 transition"
                          aria-label="Delete history item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {renderBulkHistoryDetailModal()}
    </>
    )
  }

  return (
    <>
      {historyNotice && (
        <div className="fixed left-1/2 top-6 z-50 w-[min(95%,36rem)] -translate-x-1/2 rounded-2xl bg-green-50 border border-green-200 px-5 py-3 text-green-900 shadow-lg flex items-center justify-between gap-4">
          <span>{historyNotice}</span>
          <button
            type="button"
            onClick={() => setHistoryNotice(null)}
            className="rounded-full px-2 py-1 text-green-900 hover:bg-green-100 transition"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
      {confirmationAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              {confirmationAction === "clear" ? "Clear all history" : "Delete history item"}
            </h3>
            <p className="text-slate-600 mb-6">
              {confirmationAction === "clear"
                ? "This will remove every saved search from your history."
                : "This will delete the selected history item permanently."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelConfirmation}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedPharmacy ? (
        <div>
          <PharmacyDetail pharmacy={selectedPharmacy} drugName={query} onBack={() => setSelectedPharmacy(null)} />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-slate-100">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-3">Find Your Medications</h1>
                <p className="text-slate-600 text-lg">Search across all partner pharmacies and compare prices instantly</p>
              </div>

              <div className="relative mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onFocus={() => {
                        if (query.trim()) setShowSuggestions(true)
                      }}
                      placeholder="Search for a medication or condition..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      onKeyDown={handleKeyDown}
                    />

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`w-full text-left px-4 py-3 transition ${
                              index === activeIndex ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50"
                            } ${index > 0 ? "border-t border-slate-100" : ""}`}
                          >
                            <Search className="inline w-4 h-4 mr-2 text-slate-400" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkSearchOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-primary-600 text-white border border-transparent hover:bg-primary-700 transition font-semibold whitespace-nowrap"
                  >
                    <Layers className="w-4 h-4" />
                    Bulk Search
                  </button>
                  <div className="inline-flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowFilters((s) => !s)}
                        aria-pressed={showFilters}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition"
                      >
                        <Filter className="w-4 h-4" />
                      </button>

                      {showFilters && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-slate-50 ${sortBy === 'closest' ? 'bg-primary-50 text-primary-700' : ''}`}
                            onClick={() => {
                              applySort('closest')
                              setShowFilters(false)
                            }}
                          >
                            Closest first
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-slate-50 ${sortBy === 'furthest' ? 'bg-primary-50 text-primary-700' : ''}`}
                            onClick={() => {
                              applySort('furthest')
                              setShowFilters(false)
                            }}
                          >
                            Furthest first
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFilterAmo((prev) => !prev)}
                      aria-pressed={filterAmo}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-slate-700 transition ${
                        filterAmo
                          ? 'bg-primary-600 text-white border border-transparent'
                          : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      AMO only
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-500">Press Enter to search, or use Bulk Search for multiple medications.</p>
              </div>
            </div>

            {results.length > 0 && view === "search" && (
              <div className="space-y-8">
                <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Searching for</p>
                      <h2 className="text-2xl font-semibold text-slate-900">{query || "your medication"}</h2>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
                      {results.length} pharmacy{results.length === 1 ? "" : "ies"} found
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setResultView('grid')}
                    className={`px-4 py-2 font-semibold rounded-lg transition ${
                      resultView === 'grid'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Grid View
                  </button>
                  <button
                    onClick={() => setResultView('list')}
                    className={`px-4 py-2 font-semibold rounded-lg transition ${
                      resultView === 'list'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    List View
                  </button>
                </div>

                {resultView === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results
                      .filter((p) => !filterAmo || (p.amo_supported && p.amo_rate != null))
                      .map((pharmacy, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedPharmacy(pharmacy)}
                          className="bg-white rounded-xl p-6 border-2 border-slate-100 hover:border-primary-400 cursor-pointer transition-all hover:shadow-lg"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{pharmacy.pharmacy}</h3>
                              <p className="text-slate-600">{pharmacy.city}</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm font-semibold">
                              Certified
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Price:</span>
                              <span className="text-2xl font-bold text-primary-600">{pharmacy.price} FCFA</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-500">
                              <span>{pharmacy.distanceKm ? `${pharmacy.distanceKm} km away` : "Distance unavailable"}</span>
                              {pharmacy.amo_supported && pharmacy.amo_rate != null && (
                                <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                                  <Shield className="w-4 h-4" />
                                  AMO Supported
                                </span>
                              )}
                            </div>
                          </div>

                          <button className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition">
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                )}

                {resultView === 'list' && (
                  <div className="space-y-4">
                    {results
                      .filter((p) => !filterAmo || (p.amo_supported && p.amo_rate != null))
                      .map((pharmacy, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedPharmacy(pharmacy)}
                          className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-primary-400 cursor-pointer transition-all hover:shadow-lg"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-slate-900">{pharmacy.pharmacy}</h3>
                                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm font-semibold">
                                  Certified
                                </span>
                              </div>
                              <p className="text-slate-600">{pharmacy.city}</p>
                            </div>
                            <div className="flex items-center gap-4 text-slate-700">
                              <span className="font-semibold text-primary-600">{pharmacy.price} FCFA</span>
                              {pharmacy.amo_supported && pharmacy.amo_rate != null && (
                                <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                                  <Shield className="w-4 h-4" />
                                  AMO
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">
                              {pharmacy.distanceKm ? `${pharmacy.distanceKm} km away` : "Distance unavailable"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-600 text-lg">No results found for "{query}"</p>
                <p className="text-slate-500 mt-2">Try searching for a different medication or condition</p>
              </div>
            )}
          </div>
        </div>
      )}
      <BulkSearchModal
        isOpen={bulkSearchOpen}
        onClose={() => setBulkSearchOpen(false)}
        onComplete={saveBulkSearchHistory}
        userLocation={userLocation}
        calculateDistanceKm={calculateDistanceKm}
      />
      {renderBulkHistoryDetailModal()}
    </>
  )
}
