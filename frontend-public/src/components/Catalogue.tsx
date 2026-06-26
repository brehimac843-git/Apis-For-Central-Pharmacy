import { useState, useEffect } from "react";
import { Search, ShoppingCart, Pill, TrendingUp } from "lucide-react";
import { API_BASE } from "../config";

type CatalogueDrug = {
  name: string;
  category: string;
  minPrice: number;
  availableAt: number;
  description?: string;
};

type Props = {
  onSelectDrug: (drug: CatalogueDrug) => void;
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

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes("palu")) return "🦟";
    if (lower.includes("antibio")) return "💊";
    if (lower.includes("vitamin")) return "🌟";
    if (lower.includes("pain")) return "💉";
    return "📦";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 rounded-full mb-4">
              <Pill className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-success">Central Pharma</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Medication Catalog</h1>
            <p className="text-slate-600">Browse our extensive collection of medicines and healthcare products</p>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search for medications, categories..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-slate-50"
              />
            </div>
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {catalogueError ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 font-medium">{catalogueError}</p>
          </div>
        ) : filteredDrugs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No medications match your search</p>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(groupedDrugs).map((category) => (
              <div key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-primary-200">
                  <span className="text-3xl">{getCategoryIcon(category)}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 capitalize">
                      {category}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {groupedDrugs[category].length} products available
                    </p>
                  </div>
                </div>

                {/* Drug Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupedDrugs[category].map((drug, index) => (
                    <div
                      key={index}
                      onClick={() => onSelectDrug(drug)}
                      className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-primary-400 p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                      {/* Drug Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition mb-2">
                            {drug.name}
                          </h3>
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                            {category}
                          </span>
                        </div>
                        <ShoppingCart className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition" />
                      </div>

                      {/* Stats */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Min Price</span>
                          <span className="text-xl font-bold text-success">
                            {drug.minPrice.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <TrendingUp className="w-4 h-4 text-primary-500" />
                          <span>Available at <strong>{drug.availableAt}</strong> pharmacies</span>
                        </div>
                      </div>

                      {/* Call to Action */}
                      <button className="w-full mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition text-sm">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-16">
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition inline-flex items-center gap-2"
            >
              <span>{loading ? "Loading..." : "Load More Medications"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}