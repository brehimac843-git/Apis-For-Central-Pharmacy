import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config";

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

  const branchApiUrl = nodeApiUrl || `http://localhost:${3000 + pharmacyId}`;

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
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
            // Directly extract the pure string name saved by the backend
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
              // Only resolve via local ID if no text names were sent
              const matchedDrug = localDrugs.find((d: any) => d.id === item);
              if (matchedDrug) {
                hiddenNames.add(matchedDrug.name.trim().toLowerCase());
              }
            }
          });
        }

        setHiddenDrugNames(hiddenNames);
      } catch (err) {
        console.error("Dashboard payload mapping exception:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [pharmacyId, branchApiUrl, token]);

  const handleToggleVisibility = async (drugId: number, currentName: string) => {
    const normalizedName = currentName.trim().toLowerCase();
    const isCurrentlyHidden = hiddenDrugNames.has(normalizedName);
    const targetVisibilityState = isCurrentlyHidden;

    try {
      await axios.post(
        `${API_BASE}/api/visibility/toggle`,
        { 
          pharmacyId: Number(pharmacyId), 
          drugId: Number(drugId),
          drugName: currentName.trim(), 
          hide: !isCurrentlyHidden,
          isVisible: targetVisibilityState 
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
      alert("Failed to sync visibility modification states.");
    }
  };

  return (
    <div style={{ padding: "20px", background: "#1e293b", borderRadius: "16px", marginTop: "20px", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "20px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "white", margin: 0 }}>Branch Inventory Control</h2>
          <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
            Logged in as: <strong style={{ color: "#38bdf8" }}>{agent?.agentName || "Pharmacy Agent"}</strong> at {agent?.pharmacyName || `Branch Node #${pharmacyId}`}
          </p>
        </div>
        <button onClick={onLogout} style={{ padding: "10px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          Disconnect
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Querying branch hardware stack...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #334155", color: "#94a3b8", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>Medication Layout</th>
              <th style={{ padding: "12px" }}>Form / Dosage</th>
              <th style={{ padding: "12px" }}>Stock Volume</th>
              <th style={{ padding: "12px" }}>Price</th>
              <th style={{ padding: "12px", textAlign: "right" }}>Public Search Access</th>
            </tr>
          </thead>
          <tbody>
            {drugs.map((drug) => {
              const isHidden = hiddenDrugNames.has(drug.name.trim().toLowerCase());
              return (
                <tr key={drug.id} style={{ borderBottom: "1px solid #334155", backgroundColor: isHidden ? "#33415533" : "transparent" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>{drug.name}</td>
                  <td style={{ padding: "12px", color: "#94a3b8" }}>{drug.form} ({drug.dosage})</td>
                  <td style={{ padding: "12px", color: drug.stock_quantity > 0 ? "#4ade80" : "#f87171" }}>{drug.stock_quantity} units</td>
                  <td style={{ padding: "12px" }}>{drug.selling_price} FCFA</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button
                      onClick={() => handleToggleVisibility(drug.id, drug.name)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "none",
                        fontWeight: "bold",
                        cursor: "pointer",
                        background: isHidden ? "#ef4444" : "#22c55e",
                        color: "white"
                      }}
                    >
                      {isHidden ? "🚫 Hidden (Click to Show)" : "👁️ Visible (Click to Hide)"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}