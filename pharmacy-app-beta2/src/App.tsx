import { useState } from "react"
import axios from "axios"
import PharmacyMap from "./components/PharmacyMap"
import "./App.css"

const API = "http://localhost:3000"

// ✅ Type now includes the specific drug's AMO rate
type Pharmacy = {
  pharmacy: string
  city: string
  latitude: number
  longitude: number
  price: number
  stock: number
  amo_supported: boolean
  amo_rate: number | null // <--- The new field from your JOIN query
}

function App() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [results, setResults] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchSuggestions(q: string) {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await axios.get(`${API}/api/suggestions?q=${q}`)
      setSuggestions(res.data)
    } catch (err) { console.error(err) }
  }

  async function searchDrug(name: string) {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/aggregate-stock/${name}`)
      setResults(res.data)
      setSuggestions([])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  // --- DETAIL VIEW RENDER ---
  if (selectedPharmacy) {
    // Calculate the discount if AMO is available for this drug
    const coveragePercent = selectedPharmacy.amo_rate || 0;
    const discount = selectedPharmacy.price * (coveragePercent / 100);
    const finalPrice = selectedPharmacy.price - discount;

    return (
      <div className="app-container">
      <button className="back-button" onClick={() => setSelectedPharmacy(null)}>
      ← Back to results
      </button>

      <main className="detail-grid">
      <section className="info-section">
      <h1 className="detail-title">{selectedPharmacy.pharmacy}</h1>
      <div className="detail-card">
      <p className="detail-city">📍 {selectedPharmacy.city}, Mali</p>

      <div className="price-section">
      <div className="price-badge">{selectedPharmacy.price} FCFA</div>
      {selectedPharmacy.amo_rate && (
        <div className="amo-tag">
        ✅ AMO Covered: {selectedPharmacy.amo_rate}% (-{discount.toFixed(0)} FCFA)
        </div>
      )}
      </div>

      <div className="detail-stats">
      <p><strong>Stock Status:</strong> {selectedPharmacy.stock} units available</p>
      <div className="total-to-pay">
      <strong>Total to pay:</strong>
      <span>{finalPrice.toFixed(0)} FCFA</span>
      </div>
      </div>

      <a
      className="directions-button"
      href={`https://www.google.com/maps/search/?api=1&query=${selectedPharmacy.latitude},${selectedPharmacy.longitude}`}
      target="_blank"
      rel="noreferrer"
      >
      Get Directions ↗
      </a>
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

  // --- LIST VIEW RENDER ---
  return (
    <div className="app-container">
    <header>
    <div className="logo-area">
    <span style={{ fontSize: '3rem' }}>💊</span>
    <h1>Pharmacy Finder</h1>
    </div>
    <div className="search-wrapper">
    <input
    className="search-input"
    placeholder="Search medicine (e.g. Amoxicillin)..."
    value={query}
    onChange={(e) => {
      setQuery(e.target.value)
      fetchSuggestions(e.target.value)
    }}
    />
    {suggestions.length > 0 && (
      <div className="suggestions-dropdown">
      {suggestions.map((s, i) => (
        <div key={i} className="suggestion-item" onClick={() => { setQuery(s); searchDrug(s); }}>
        🔍 {s}
        </div>
      ))}
      </div>
    )}
    </div>
    </header>

    <main className="results-list">
    <h2>{loading ? "Searching databases..." : results.length > 0 ? "Available Pharmacies" : ""}</h2>
    <div className="cards-grid">
    {results.map((r, i) => (
      <div key={i} className="pharmacy-card clickable" onClick={() => setSelectedPharmacy(r)}>
      <div className="card-header">
      <h3>{r.pharmacy}</h3>
      <span className="price-tag">{r.price} FCFA</span>
      </div>
      <p>📍 {r.city}</p>
      <div className="card-footer">
      <span>📦 Stock: {r.stock}</span>
      {r.amo_rate ? <span className="amo-label">AMO %</span> : ""}
      </div>
      <span className="view-details-link">View details & map →</span>
      </div>
    ))}
    </div>
    </main>
    </div>
  )
}

export default App
