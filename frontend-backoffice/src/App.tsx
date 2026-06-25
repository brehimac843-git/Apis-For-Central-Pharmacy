import { useState, useRef } from "react"
import axios from "axios"
import PharmacyMap from "./components/PharmacyMap"
import Catalogue from "./components/Catalogue"
import AgentLogin from "./components/AgentLogin"
import AdminLogin from "./components/AdminLogin"
import AgentDashboard from "./components/AgentDashboard"
import AdminDashboard from "./components/AdminDashboard"
import { API_BASE } from "./config"
import "./App.css"

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
  const [activeAgent, setActiveAgent] = useState<any>(() => {
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
  const [activeAdmin, setActiveAdmin] = useState<any>(() => {
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

  const handleLoginSuccess = (token: string, agent: any, pharmacyId: number, nodeApiUrl: string) => {
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

  const handleAdminLoginSuccess = (token: string, admin: any) => {
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
    return (
      <div className="app-container">
        <AdminDashboard token={adminToken} admin={activeAdmin} onLogout={handleStaffLogout} />
      </div>
    )
  }

  if (viewMode === 'dashboard' && agentToken && activeAgent) {
    return (
      <div className="app-container">
        <AgentDashboard
          token={agentToken}
          agent={activeAgent}
          pharmacyId={agentPharmacyId}
          nodeApiUrl={agentNodeApiUrl}
          onLogout={handleStaffLogout}
        />
      </div>
    )
  }

  if (viewMode === 'login') {
    return (
      <div className="app-container">
        <AgentLogin onLoginSuccess={handleLoginSuccess} onCancel={() => setViewMode('public')} />
      </div>
    )
  }

  if (viewMode === 'login-admin') {
    return (
      <div className="app-container">
        <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onCancel={() => setViewMode('public')} />
      </div>
    )
  }

  if (selectedPharmacy) {
    const rate = extractAmoRate(selectedPharmacy)
    const discount = selectedPharmacy.price * (rate / 100)
    const finalPrice = selectedPharmacy.price - discount

    return (
      <div className="app-container">
        <button className="back-button" onClick={() => setSelectedPharmacy(null)}>← Back to results</button>
        <main className="detail-grid">
          <section className="info-section">
            <h1 className="detail-title">{selectedPharmacy.pharmacy}</h1>
            <div className="detail-card">
              <p className="detail-city">📍 {selectedPharmacy.city}, Mali</p>
              <div className="price-section">
                <div className="price-badge">{selectedPharmacy.price} FCFA</div>
                {rate > 0 && <div className="amo-tag">✅ AMO Covered: {rate}% (-{discount.toFixed(0)} FCFA)</div>}
              </div>
              <div className="total-to-pay">
                <strong>Total to pay:</strong> <span>{(rate > 0 ? finalPrice : selectedPharmacy.price).toFixed(0)} FCFA</span>
              </div>
              <a className="directions-button" href={`https://maps.google.com/?q=${selectedPharmacy.latitude},${selectedPharmacy.longitude}`} target="_blank" rel="noreferrer">Get Directions ↗</a>
            </div>
          </section>
          <section className="map-section">
            <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Location on Map</h3>
            <PharmacyMap pharmacies={[selectedPharmacy]} />
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div className="logo-area" style={{ cursor: 'pointer' }} onClick={() => { setShowCatalogue(false); setResults([]) }}>
          <span style={{ fontSize: '3rem' }}>💊</span>
          <h1>Pharmacy Back Office</h1>
        </div>

        <div className="search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <input
              className="search-input"
              placeholder="Search medicine (e.g. Paracetamol)..."
              value={query}
              style={{ flex: 1 }}
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
            <button
              onClick={() => { setShowCatalogue(!showCatalogue); setResults([]) }}
              style={{ padding: '0 20px', borderRadius: '24px', background: showCatalogue ? '#ef4444' : '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {showCatalogue ? "Close Catalogue" : "Browse Catalogue"}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown" style={{ maxWidth: '600px', position: 'absolute', left: 0, right: 0, zIndex: 1000, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', marginTop: '5px' }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  style={{ padding: '10px 15px', cursor: 'pointer', color: '#e2e8f0', backgroundColor: i === activeIndex ? '#1e293b' : 'transparent' }}
                  onMouseDown={() => { setQuery(s); setShowSuggestions(false); searchDrug(s) }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  🔍 {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {agentToken ? (
            <button onClick={() => setViewMode('dashboard')} style={{ padding: '10px 20px', borderRadius: '24px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              💻 Agent Portal
            </button>
          ) : (
            <button onClick={() => setViewMode('login')} style={{ padding: '10px 20px', borderRadius: '24px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold' }}>
              🔒 Agent Login
            </button>
          )}
          <button onClick={() => setViewMode('login-admin')} style={{ padding: '10px 20px', borderRadius: '24px', background: 'transparent', color: '#f8b400', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold' }}>
            👑 Admin Login
          </button>
        </div>
      </header>

      <main className="results-list">
        {showCatalogue ? (
          <Catalogue onSelectDrug={(drugName) => { setQuery(drugName); setShowCatalogue(false); searchDrug(drugName) }} />
        ) : (
          <>
            <h2>{loading ? "Searching databases..." : results.length > 0 ? "Available Pharmacies" : ""}</h2>
            {results.length > 0 && (
              <div className="filter-bar" style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', backgroundColor: '#1e293b', padding: '10px 15px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={filterAmo} onChange={(e) => setFilterAmo(e.target.checked)} /> Only show AMO Covered ✅
                </label>
                <select value={sortByPrice} onChange={(e) => setSortByPrice(e.target.value)} style={{ padding: '8px', borderRadius: '5px', background: '#0f172a', color: '#e2e8f0', cursor: 'pointer' }}>
                  <option value="default">Sort: Default</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            )}
            <div className="cards-grid">
              {displayedResults.map((r, i) => {
                const cardRate = extractAmoRate(r)
                return (
                  <div key={i} className="pharmacy-card clickable" onClick={() => setSelectedPharmacy(r)}>
                    <div className="card-header">
                      <h3>{r.pharmacy}</h3>
                      <span className="price-tag">{r.price} FCFA</span>
                    </div>
                    <p>📍 {r.city}, Mali</p>
                    <div className="card-footer">
                      {cardRate > 0 ? <span className="amo-label">AMO {cardRate}%</span> : ""}
                    </div>
                    <span className="view-details-link">View details & map →</span>
                  </div>
                )
              })}
              {displayedResults.length === 0 && results.length > 0 && (
                <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                  No pharmacies match your current filters.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
