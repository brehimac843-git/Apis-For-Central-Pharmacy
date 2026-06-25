import { useState, useEffect, useRef } from "react"
import axios from "axios"
import PharmacyMap from "./components/PharmacyMap"
import Catalogue from "./components/Catalogue"
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

type SearchHistoryItem = {
  id: string
  query: string
  createdAt: string
}

function App() {
  const [publicToken, setPublicToken] = useState<string | null>(localStorage.getItem("public_token"))
  const [publicUser, setPublicUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("public_user") || "null")
    } catch {
      return null
    }
  })
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'signup'>('none')
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const [authForm, setAuthForm] = useState({ name: "", surname: "", email: "", password: "" })
  const [authError, setAuthError] = useState("")

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

  useEffect(() => {
    if (publicUser?.email && publicToken) {
      loadSearchHistory()
    } else {
      setSearchHistory([])
      setShowHistory(false)
    }
  }, [publicUser, publicToken])

  const loadSearchHistory = async () => {
    if (!publicUser?.email || !publicToken) {
      setSearchHistory([])
      return
    }
    try {
      const res = await axios.get(`${API_BASE}/api/public/history`, {
        headers: { Authorization: `Bearer ${publicToken}` },
      })
      setSearchHistory(res.data || [])
      setHistoryError("")
    } catch {
      setHistoryError("Unable to load saved history. Please try again later.")
      setSearchHistory([])
    }
  }

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

      if (publicToken && publicUser) {
        try {
          const historyRes = await axios.post(
            `${API_BASE}/api/public/history`,
            { query: name.trim() },
            { headers: { Authorization: `Bearer ${publicToken}` } }
          )
          const historyItem = historyRes.data?.historyItem
          if (historyItem) {
            setSearchHistory((prev) => {
              const filtered = prev.filter((item) => item.query.toLowerCase() !== name.trim().toLowerCase())
              return [historyItem, ...filtered].slice(0, 10)
            })
          } else {
            loadSearchHistory()
          }
        } catch (error) {
          console.error("Failed to persist search history", error)
        }
      }
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
          const selected = suggestions[activeIndex]
          setQuery(selected)
          searchDrug(selected)
        } else {
          searchDrug(query)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    try {
      if (authMode === 'signup') {
        const combinedName = `${authForm.name.trim()} ${authForm.surname.trim()}`
        const res = await axios.post(`${API_BASE}/api/public/register`, {
          name: combinedName,
          email: authForm.email,
          password: authForm.password,
        })
        localStorage.setItem("public_token", res.data.token)
        localStorage.setItem("public_user", JSON.stringify(res.data.user))
        setPublicToken(res.data.token)
        setPublicUser(res.data.user)
      } else {
        const res = await axios.post(`${API_BASE}/api/public/login`, {
          email: authForm.email,
          password: authForm.password,
        })
        localStorage.setItem("public_token", res.data.token)
        localStorage.setItem("public_user", JSON.stringify(res.data.user))
        setPublicToken(res.data.token)
        setPublicUser(res.data.user)
      }
      setAuthMode('none')
      setAuthForm({ name: "", surname: "", email: "", password: "" })
    } catch (err: any) {
      setAuthError(err.response?.data?.message || "Authentication failed.")
    }
  }

  const handlePublicLogout = () => {
    localStorage.removeItem("public_token")
    localStorage.removeItem("public_user")
    setPublicToken(null)
    setPublicUser(null)
    setSearchHistory([])
    setShowHistory(false)
  }

  const clearHistory = async () => {
    if (!publicUser || !publicToken) {
      setSearchHistory([])
      return
    }
    try {
      await axios.delete(`${API_BASE}/api/public/history`, {
        headers: { Authorization: `Bearer ${publicToken}` },
      })
      setSearchHistory([])
      setShowHistory(false)
      setHistoryError("")
    } catch {
      setHistoryError("Unable to clear history right now.")
    }
  }

  const deleteHistoryItem = async (id: string) => {
    if (!publicUser || !publicToken) return
    try {
      await axios.delete(`${API_BASE}/api/public/history/${id}`, {
        headers: { Authorization: `Bearer ${publicToken}` },
      })
      setSearchHistory((prev) => prev.filter((item) => item.id !== id))
    } catch {
      setHistoryError("Unable to delete that entry.")
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
    <div className="app-container" style={{ position: 'relative' }}>
      {authMode !== 'none' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000 }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', width: '100%', maxWidth: '420px', color: 'white' }}>
            <h2 style={{ marginTop: 0, color: '#38bdf8' }}>{authMode === 'login' ? "Welcome Back" : "Create Account"}</h2>
            {authError && <p style={{ color: '#f87171', fontSize: '0.9rem', background: '#7f1d1d44', padding: '10px', borderRadius: '6px' }}>{authError}</p>}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {authMode === 'signup' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="text" placeholder="First Name" required value={authForm.name} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white', minWidth: '0' }} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
                  <input type="text" placeholder="Surname" required value={authForm.surname} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white', minWidth: '0' }} onChange={(e) => setAuthForm({ ...authForm, surname: e.target.value })} />
                </div>
              )}
              <input type="email" placeholder="Email Address" required value={authForm.email} style={{ padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
              <input type="password" placeholder="Password" required value={authForm.password} style={{ padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
              <button type="submit" style={{ padding: '12px', borderRadius: '8px', background: '#38bdf8', color: '#0f172a', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                {authMode === 'login' ? "Sign In" : "Register"}
              </button>
            </form>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>
              {authMode === 'login' ? "New to Pharmacy Finder? " : "Already have an account? "}
              <span style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setAuthError(""); setAuthMode(authMode === 'login' ? 'signup' : 'login') }}>
                {authMode === 'login' ? "Register here" : "Sign in here"}
              </span>
            </p>
            <button onClick={() => { setAuthMode('none'); setAuthError("") }} style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div className="logo-area" style={{ cursor: 'pointer' }} onClick={() => { setShowCatalogue(false); setResults([]) }}>
          <span style={{ fontSize: '3rem' }}>💊</span>
          <h1>Pharmacy Finder</h1>
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {publicToken && publicUser ? (
            <>
              <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '10px 15px', borderRadius: '24px', background: showHistory ? '#38bdf8' : '#1e293b', color: showHistory ? '#0f172a' : 'white', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold' }}>
                📜 {showHistory ? "Hide History" : "History"}
              </button>
              <div style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>
                Hi, <strong style={{ color: '#38bdf8' }}>{publicUser.name ? publicUser.name.split(' ')[0] : "User"}</strong>
              </div>
              <button onClick={handlePublicLogout} style={{ padding: '10px 20px', borderRadius: '24px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthMode('login')} style={{ padding: '10px 18px', borderRadius: '24px', background: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', cursor: 'pointer', fontWeight: 'bold' }}>
                Sign In
              </button>
              <button onClick={() => setAuthMode('signup')} style={{ padding: '10px 18px', borderRadius: '24px', background: '#38bdf8', color: '#0f172a', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {publicToken && showHistory && (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '15px', borderRadius: '12px', marginTop: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Your Recent Searches</h4>
            {searchHistory.length > 0 && (
              <button onClick={clearHistory} style={{ background: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                Clear All
              </button>
            )}
          </div>
          {historyError && <p style={{ color: '#f87171', margin: '8px 0', fontSize: '0.85rem' }}>{historyError}</p>}
          {searchHistory.length === 0 ? (
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>No recent drug searches found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {searchHistory.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }}>
                  <button onClick={() => { setQuery(item.query); searchDrug(item.query) }} style={{ textAlign: 'left', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.95rem', padding: 0, flex: 1 }}>
                    <div style={{ marginBottom: '4px' }}>🕒 {item.query}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(item.createdAt).toLocaleString()}</div>
                  </button>
                  <button onClick={() => deleteHistoryItem(item.id)} style={{ marginLeft: '12px', padding: '8px 12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
