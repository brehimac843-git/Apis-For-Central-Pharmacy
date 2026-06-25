import { useState, useEffect } from "react";
import { API_BASE } from "../config";

type CatalogueDrug = {
  name: string;
  category: string;
  minPrice: number;
  availableAt: number;
};

type Props = {
  onSelectDrug: (drugName: string) => void;
};

export default function Catalogue({ onSelectDrug }: Props) {
  const [drugs, setDrugs] = useState<CatalogueDrug[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [catalogueError, setCatalogueError] = useState("");

  const fetchCatalogue = async (pageNumber: number) => {
    setLoading(true);
    setCatalogueError("");

    try {
      const response = await fetch(`${API_BASE}/api/catalogue?page=${pageNumber}&limit=50`);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Catalogue fetch failed: ${response.status} ${errorBody}`);
      }

      const result = await response.json();
      if (!result || !Array.isArray(result.data)) {
        throw new Error("Catalogue response missing data array");
      }

      if (result.data.length === 0 || pageNumber >= result.totalPages) {
        setHasMore(false);
      }

      setDrugs((prevDrugs) => {
        const existingNames = new Set(prevDrugs.map((d) => d.name));
        const newDrugs = result.data.filter((d: CatalogueDrug) => !existingNames.has(d.name));
        return [...prevDrugs, ...newDrugs];
      });
    } catch (error: any) {
      console.error("Error fetching catalogue:", error);
      setCatalogueError(error.message || "Unable to load catalogue.");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue(page);
  }, [page]);

  const filteredDrugs = drugs.filter((drug) => {
    const search = filterText.trim().toLowerCase();
    if (!search) return true;
    return (
      drug.name.toLowerCase().includes(search) ||
      drug.category.toLowerCase().includes(search)
    );
  });

  const groupedDrugs = filteredDrugs.reduce((acc, drug) => {
    const cat = drug.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(drug);
    return acc;
  }, {} as Record<string, CatalogueDrug[]>);

  return (
    <div style={{ padding: "20px", background: "#1e293b", borderRadius: "16px", marginTop: "20px", textAlign: "left" }}>
      <h2 style={{ color: "white", marginBottom: "20px" }}>Medication Catalogue</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search catalogue..."
          style={{ flex: 1, minWidth: '180px', padding: '12px', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
        />
        <button
          onClick={() => setFilterText("")}
          style={{ padding: '12px 18px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>

      {catalogueError ? (
        <p style={{ color: '#f87171' }}>{catalogueError}</p>
      ) : filteredDrugs.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No catalogue entries match your search.</p>
      ) : (
        Object.keys(groupedDrugs).map((category) => (
          <div key={category} style={{ marginBottom: "35px" }}>
            <h3 style={{ color: "#38bdf8", borderBottom: "1px solid #334155", paddingBottom: "10px", textTransform: "capitalize" }}>
              {category}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "15px", marginTop: "15px" }}>
              {groupedDrugs[category].map((drug, index) => (
                <div
                  key={index}
                  onClick={() => onSelectDrug(drug.name)}
                  style={{
                    backgroundColor: "#0f172a",
                    padding: "15px",
                    borderRadius: "10px",
                    border: "1px solid #334155",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155" }}
                >
                  <h4 style={{ color: "#e2e8f0", margin: "0 0 8px 0" }}>{drug.name}</h4>
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
                    Starting at <strong style={{ color: "#38bdf8" }}>{drug.minPrice} FCFA</strong>
                  </p>
                  <p style={{ color: "#64748b", fontSize: "11px", margin: "5px 0 0 0" }}>
                    Available in {drug.availableAt} pharmacies
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            {loading ? "Loading more..." : "Load More Categories"}
          </button>
        </div>
      )}
    </div>
  );
}
