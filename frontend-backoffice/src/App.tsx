import { useState, useRef } from "react"
import axios from "axios"
import { Search, Shield, ArrowLeft, MapPin, Lock, Crown, Monitor } from "lucide-react"
import PharmacyMap from "./components/PharmacyMap"
import Catalogue from "./components/Catalogue"
import AgentLogin from "./components/AgentLogin"
import AdminLogin from "./components/AdminLogin"
import AgentDashboard from "./components/AgentDashboard"
import AdminDashboard from "./components/AdminDashboard"
import Logo from "./components/Logo"
import { API_BASE } from "./config"

type AgentProfile = {
  id: string
  agentNumber: string
  name: string
  pharmacyId?: number
  pharmacyName?: string
  email?: string
  role?: string
}

type AdminProfile = {
  id: string
  email: string
  name?: string
  role?: string
}

type Pharmacy = {
  pharmacy: string
  city: string
  latitude: number
  longitude: number
  price: number
  stock: number
  amo_supported: boolean
  amo_rate: number | null
}

function App() {
  const [viewMode, setViewMode] = useState<'public' | 'login' | 'login-admin' | 'dashboard' | 'admin-dashboard'>(() => {
    if (localStorage.getItem("admin_token")) return 'admin-dashboard'
    if (localStorage.getItem("agent_token")) return 'dashboard'
    return 'public'
  })

  const [agentToken, setAgentToken] = useState<string | null>(localStorage.getItem("agent_token"))
  const [activeAgent, setActiveAgent] = useState<AgentProfile | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("agent_profile") || "null")
    } catch {
      return null
    }
  })
  const [agentPharmacyId, setAgentPharmacyId] = useState<number>(() => {
    return Number(localStorage.getItem("agent_pharmacy_id") || "0")
  })
  const [agentNodeApiUrl, setAgentNodeApiUrl] = useState<string>(
    localStorage.getItem("agent_node_api_url") || ""
  )
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem("admin_token"))
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("admin_profile") || "null")
    } catch {
      return null
    }
  })

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [results, setResults] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const [filterAmo, setFilterAmo] = useState(false)
  const [sortByPrice, setSortByPrice] = useState("default")

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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

  async function searchDrug(name: string) {
    if (!name.trim()) return
    setShowCatalogue(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (abortControllerRef.current) abortControllerRef.current.abort()

    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/aggregate-stock/${encodeURIComponent(name.trim())}`)
      setResults(res.data)
      setSuggestions([])
      setShowSuggestions(false)
      setFilterAmo(false)
      setSortByPrice("default")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim().length >= 1) searchDrug(query)
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          setQuery(suggestions[activeIndex])
          searchDrug(suggestions[activeIndex])
        } else {
          searchDrug(query)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  const extractAmoRate = (pharmacy: Pharmacy): number => pharmacy.amo_rate ?? 0

  const displayedResults = results
    .filter((r) => (filterAmo ? extractAmoRate(r) > 0 : true))
    .sort((a, b) => {
      if (sortByPrice === "price_asc") return a.price - b.price
      if (sortByPrice === "price_desc") return b.price - a.price
      return 0
    })

  const handleLoginSuccess = (token: string, agent: AgentProfile, pharmacyId: number, nodeApiUrl: string) => {
    localStorage.setItem("agent_token", token)
    localStorage.setItem("agent_profile", JSON.stringify(agent))
    localStorage.setItem("agent_pharmacy_id", String(pharmacyId))
    localStorage.setItem("agent_node_api_url", nodeApiUrl)
    setAgentToken(token)
    setActiveAgent(agent)
    setAgentPharmacyId(Number(pharmacyId))
    setAgentNodeApiUrl(nodeApiUrl)
    setViewMode('dashboard')
  }

  const handleAdminLoginSuccess = (token: string, admin: AdminProfile) => {
    localStorage.setItem("admin_token", token)
    localStorage.setItem("admin_profile", JSON.stringify(admin))
    setAdminToken(token)
    setActiveAdmin(admin)
    setViewMode('admin-dashboard')
  }

  const handleStaffLogout = () => {
    localStorage.removeItem("agent_token")
    localStorage.removeItem("agent_profile")
    localStorage.removeItem("agent_pharmacy_id")
    localStorage.removeItem("agent_node_api_url")
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_profile")
    setAgentToken(null)
    setActiveAgent(null)
    setAgentPharmacyId(0)
    setAgentNodeApiUrl("")
    setAdminToken(null)
    setActiveAdmin(null)
    setViewMode('public')
  }

  if (viewMode === 'admin-dashboard' && adminToken && activeAdmin) {
    return <AdminDashboard token={adminToken} admin={activeAdmin} onLogout={handleStaffLogout} />
  }

  if (viewMode === 'dashboard' && agentToken && activeAgent) {
    return (
      <AgentDashboard
        token={agentToken}
        agent={activeAgent}
        pharmacyId={agentPharmacyId}
        nodeApiUrl={agentNodeApiUrl}
        onLogout={handleStaffLogout}
      />
    )
  }

  if (viewMode === 'login') {
    return <AgentLogin onLoginSuccess={handleLoginSuccess} onCancel={() => setViewMode('public')} />
  }

  if (viewMode === 'login-admin') {
    return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onCancel={() => setViewMode('public')} />
  }

  if (selectedPharmacy) {
    const rate = extractAmoRate(selectedPharmacy)
    const discount = selectedPharmacy.price * (rate / 100)
    const finalPrice = selectedPharmacy.price - discount

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSelectedPharmacy(null)}
            className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to results
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedPharmacy.pharmacy}</h1>
              <p className="inline-flex items-center gap-2 text-slate-600 mb-6">
                <MapPin className="w-4 h-4" />
                {selectedPharmacy.city}, Mali
              </p>

              <div className="space-y-4">
                <div className="rounded-2xl bg-primary-50 border border-primary-100 px-4 py-3">
                  <p className="text-sm text-slate-500">Listed price</p>
                  <p className="text-3xl font-bold text-primary-700">{selectedPharmacy.price} FCFA</p>
                </div>

                {rate > 0 && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-800">
                    <p className="font-semibold">AMO covered: {rate}%</p>
                    <p className="text-sm mt-1">You save {discount.toFixed(0)} FCFA</p>
                  </div>
                )}

                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Total to pay</span>
                  <span className="text-2xl font-bold text-primary-700">
                    {(rate > 0 ? finalPrice : selectedPharmacy.price).toFixed(0)} FCFA
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Location on map</h3>
              <PharmacyMap pharmacies={[selectedPharmacy]} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={() => { setShowCatalogue(false); setResults([]) }}
              className="text-left"
            >
              <Logo subtitle="Back office" />
            </button>

            <div className="flex gap-2 flex-wrap">
              {agentToken ? (
                <button
                  type="button"
                  onClick={() => setViewMode('dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition font-semibold"
                >
                  <Monitor className="w-4 h-4" />
                  Agent portal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-semibold"
                >
                  <Lock className="w-4 h-4" />
                  Agent login
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode('login-admin')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition font-semibold"
              >
                <Crown className="w-4 h-4" />
                Admin login
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Pharmacy Back Office</h1>
            <p className="text-slate-600 text-lg">Search stock across the network or open staff portals</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicine (e.g. Paracetamol)..."
                value={query}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onChange={(e) => {
                  const val = e.target.value
                  setQuery(val)
                  setActiveIndex(-1)
                  setShowSuggestions(true)
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                  typingTimeoutRef.current = setTimeout(() => { fetchSuggestions(val) }, 250)
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      className={`w-full text-left px-4 py-3 transition ${
                        i === activeIndex ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50 text-slate-700"
                      } ${i > 0 ? "border-t border-slate-100" : ""}`}
                      onMouseDown={() => { setQuery(s); setShowSuggestions(false); searchDrug(s) }}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <Search className="inline w-4 h-4 mr-2 text-slate-400" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setShowCatalogue(!showCatalogue); setResults([]) }}
              className={`px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition ${
                showCatalogue
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              }`}
            >
              {showCatalogue ? "Close catalogue" : "Browse catalogue"}
            </button>
          </div>
        </div>

        {showCatalogue ? (
          <Catalogue onSelectDrug={(drugName) => { setQuery(drugName); setShowCatalogue(false); searchDrug(drugName) }} />
        ) : (
          <>
            {loading && (
              <p className="text-center text-slate-600 mb-6">Searching databases...</p>
            )}

            {results.length > 0 && (
              <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 m-0">Available pharmacies</h2>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={filterAmo}
                      onChange={(e) => setFilterAmo(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600"
                    />
                    AMO only
                  </label>
                  <select
                    value={sortByPrice}
                    onChange={(e) => setSortByPrice(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm"
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedResults.map((r, i) => {
                const cardRate = extractAmoRate(r)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPharmacy(r)}
                    className="text-left bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-primary-400 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{r.pharmacy}</h3>
                        <p className="text-slate-600 mt-1">{r.city}, Mali</p>
                      </div>
                      <span className="text-xl font-bold text-primary-600 shrink-0">{r.price} FCFA</span>
                    </div>
                    {cardRate > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-semibold">
                        <Shield className="w-3.5 h-3.5" />
                        AMO {cardRate}%
                      </span>
                    )}
                    <p className="text-sm text-primary-600 font-semibold mt-4">View details →</p>
                  </button>
                )
              })}
            </div>

            {displayedResults.length === 0 && results.length > 0 && (
              <p className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-200">
                No pharmacies match your current filters.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
