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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Medication Catalogue</h2>
      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search catalogue..."
          className="flex-1 min-w-[180px] px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={() => setFilterText("")}
          className="px-5 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition font-semibold"
        >
          Clear
        </button>
      </div>

      {catalogueError ? (
        <p className="text-red-600">{catalogueError}</p>
      ) : filteredDrugs.length === 0 ? (
        <p className="text-slate-500">No catalogue entries match your search.</p>
      ) : (
        Object.keys(groupedDrugs).map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-primary-700 border-b border-slate-200 pb-2 capitalize font-semibold">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {groupedDrugs[category].map((drug, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelectDrug(drug.name)}
                  className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-primary-400 hover:shadow-md transition"
                >
                  <h4 className="text-slate-900 font-semibold mb-2">{drug.name}</h4>
                  <p className="text-slate-600 text-sm">
                    Starting at <strong className="text-primary-600">{drug.minPrice} FCFA</strong>
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Available in {drug.availableAt} pharmacies
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {hasMore && (
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition font-semibold"
          >
            {loading ? "Loading more..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
