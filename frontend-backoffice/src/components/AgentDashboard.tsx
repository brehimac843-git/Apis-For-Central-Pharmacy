import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, EyeOff, LogOut, Package, DollarSign, AlertCircle } from "lucide-react";
import { API_BASE } from "../config";
import Logo from "./Logo";

type LocalDrug = {
  id: number;
  name: string;
  dosage: string;
  form: string;
  stock_quantity: number;
  selling_price: string;
};

type Props = {
  token: string;
  agent: any;
  pharmacyId: number;
  nodeApiUrl: string;
  onLogout: () => void;
};

export default function AgentDashboard({ token, agent, pharmacyId, nodeApiUrl, onLogout }: Props) {
  const [drugs, setDrugs] = useState<LocalDrug[]>([]);
  const [hiddenDrugNames, setHiddenDrugNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchApiUrl = nodeApiUrl || `http://localhost:${3000 + pharmacyId}`;

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const stockRes = await axios.get(`${branchApiUrl}/api/public-stock`);
        const localDrugs = stockRes.data;
        setDrugs(localDrugs);

        const visibilityRes = await axios.get(`${API_BASE}/api/visibility/${pharmacyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("🔄 Central Aggregator Visibility Payload:", visibilityRes.data);

        const hiddenNames = new Set<string>();

        // ⭐ PRIORITY 1: Parse the explicit 'records' or 'rules' array containing full objects
        const primaryRecords = visibilityRes.data?.records || visibilityRes.data?.rules;

        if (Array.isArray(primaryRecords) && primaryRecords.length > 0) {
          primaryRecords.forEach((rule: any) => {
            const name = rule.drugName || rule.name;
            if (name) {
              hiddenNames.add(String(name).trim().toLowerCase());
            }
          });
        } 
        // 🛡️ PRIORITY 2: Fallback handling if records don't exist
        else {
          const fallbackList = Array.isArray(visibilityRes.data) 
            ? visibilityRes.data 
            : (visibilityRes.data?.hiddenIds || visibilityRes.data?.hiddenDrugs || []);

          fallbackList.forEach((item: any) => {
            if (typeof item === "string") {
              hiddenNames.add(item.trim().toLowerCase());
            } else if (typeof item === "number") {
              const matchedDrug = localDrugs.find((d: any) => d.id === item);
              if (matchedDrug) {
                hiddenNames.add(matchedDrug.name.trim().toLowerCase());
              }
            }
          });
        }

        setHiddenDrugNames(hiddenNames);
      } catch (err: any) {
        console.error("Dashboard payload mapping exception:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [pharmacyId, branchApiUrl, token]);

  const handleToggleVisibility = async (drugId: number, currentName: string) => {
    const normalizedName = currentName.trim().toLowerCase();
    const isCurrentlyHidden = hiddenDrugNames.has(normalizedName);

    try {
      await axios.post(
        `${API_BASE}/api/visibility/toggle`,
        { 
          pharmacyId: Number(pharmacyId), 
          drugId: Number(drugId),
          drugName: currentName.trim(), 
          hide: !isCurrentlyHidden,
          isVisible: isCurrentlyHidden
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHiddenDrugNames((prev) => {
        const next = new Set(prev);
        if (isCurrentlyHidden) {
          next.delete(normalizedName);
        } else {
          next.add(normalizedName);
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to sync visibility modification states.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <Logo subtitle="Agent portal" />
              <p className="text-slate-600 m-0 mt-3">
                Agent: <span className="font-semibold text-primary-600">{agent?.agentName || "Pharmacy Agent"}</span>
                {" · "}
                Branch: <span className="font-semibold text-primary-600">{agent?.pharmacyName || `Node #${pharmacyId}`}</span>
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Disconnect
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Data</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="inline-flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Loading inventory data...</p>
            </div>
          </div>
        ) : drugs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No medications in stock</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Medication</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Form & Dosage</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Stock
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Price
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Public Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {drugs.map((drug) => {
                    const isHidden = hiddenDrugNames.has(drug.name.trim().toLowerCase());
                    const isLowStock = drug.stock_quantity < 10;
                    return (
                      <tr 
                        key={drug.id} 
                        className={`transition hover:bg-slate-50 ${isHidden ? "bg-red-50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{drug.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {drug.form} • {drug.dosage}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            isLowStock
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {drug.stock_quantity} units
                            {isLowStock && <AlertCircle className="w-4 h-4" />}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-primary-600">{drug.selling_price} FCFA</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleVisibility(drug.id, drug.name)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                              isHidden
                                ? "bg-red-100 hover:bg-red-200 text-red-700"
                                : "bg-green-100 hover:bg-green-200 text-green-700"
                            }`}
                          >
                            {isHidden ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                <span className="hidden sm:inline">Hidden</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">Visible</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Stats */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Total Medications</p>
                <p className="text-2xl font-bold text-slate-900">{drugs.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Visible in Search</p>
                <p className="text-2xl font-bold text-green-600">{drugs.length - hiddenDrugNames.size}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Hidden from Public</p>
                <p className="text-2xl font-bold text-red-600">{hiddenDrugNames.size}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}