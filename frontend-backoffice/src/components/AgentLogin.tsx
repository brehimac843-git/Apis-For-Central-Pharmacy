import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config";

type PharmacyNode = {
  id: number;
  name: string;
  city: string;
  api_url: string;
};

type Props = {
  onLoginSuccess: (token: string, agent: any, pharmacyId: number, nodeApiUrl: string) => void;
  onCancel: () => void;
};

export default function AgentLogin({ onLoginSuccess, onCancel }: Props) {
  const [pharmacies, setPharmacies] = useState<PharmacyNode[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [agentNumber, setAgentNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPharmacies() {
      try {
        const res = await axios.get(`${API_BASE}/api/pharmacies`);
        setPharmacies(res.data);
      } catch {
        setPharmacies([
          { id: 1, name: "Pharmacie DB1", city: "Bamako", api_url: "http://localhost:3001" },
          { id: 2, name: "Pharmacie DB2", city: "Bamako", api_url: "http://localhost:3002" },
          { id: 3, name: "Pharmacie DB3", city: "Bamako", api_url: "http://localhost:3003" },
        ]);
      }
    }
    loadPharmacies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmacy || !agentNumber.trim()) {
      setError("Please select your branch and input your agent credentials.");
      return;
    }

    setLoading(true);
    setError("");

    const pharmacy = pharmacies.find((p) => p.id === Number(selectedPharmacy));

    try {
      const response = await axios.post(`${API_BASE}/api/auth/agent-login`, {
        agentNumber: agentNumber.trim(),
        pharmacyId: Number(selectedPharmacy),
      });

      const { token, user: agent } = response.data;
      onLoginSuccess(token, agent, Number(selectedPharmacy), pharmacy?.api_url || "");
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed at the branch node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "450px", margin: "60px auto", padding: "30px", background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", textAlign: "left" }}>
      <h2 style={{ color: "white", marginTop: 0, marginBottom: "5px" }}>Agent Portal</h2>
      <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "25px" }}>Branch Decentralized Verification</p>

      {error && (
        <div style={{ padding: "12px", background: "#ef444422", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171", fontSize: "14px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={{ color: "#cbd5e1", display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>Select Your Pharmacy Branch</label>
          <select
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid #334155", cursor: "pointer" }}
          >
            <option value="">-- Choose Branch --</option>
            {pharmacies.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ color: "#cbd5e1", display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>Agent Verification Number</label>
          <input
            type="text"
            placeholder="e.g. AG-74920"
            value={agentNumber}
            onChange={(e) => setAgentNumber(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid #334155", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: "12px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {loading ? "Verifying..." : "Secure Connect →"}
          </button>
        </div>
      </form>
    </div>
  );
}
