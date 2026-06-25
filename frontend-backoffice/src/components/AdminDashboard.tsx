import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import axios from "axios";
import { API_BASE } from "../config";

type PharmacyNode = {
  id: number;
  name: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  api_url: string;
  amo_supported: boolean;
  latitude: number;
  longitude: number;
  agentCount: number;
  activeAgentCount: number;
};

type AgentRecord = {
  id: string;
  agentNumber: string;
  name: string;
  isActive: boolean;
  pharmacyId: number;
  pharmacyName: string;
};

type ActivityEntry = {
  id: string;
  action: string;
  details?: string;
  pharmacyName: string;
  createdAt: string;
  agentNumber: string;
  agentName: string;
};

type PharmacyFormState = {
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  api_url: string;
  latitude: string;
  longitude: string;
  amo_supported: boolean;
};

type AgentFormState = {
  agentNumber: string;
  name: string;
  pharmacyId: string;
  isActive: boolean;
};

type Props = {
  token: string;
  admin: any;
  onLogout: () => void;
};

const defaultPharmacyForm: PharmacyFormState = {
  name: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  api_url: "",
  latitude: "",
  longitude: "",
  amo_supported: false,
};

const defaultAgentForm: AgentFormState = {
  agentNumber: "",
  name: "",
  pharmacyId: "",
  isActive: true,
};

export default function AdminDashboard({ token, admin, onLogout }: Props) {
  const [view, setView] = useState<"overview" | "pharmacies" | "agents" | "activity">("overview");
  const [pharmacies, setPharmacies] = useState<PharmacyNode[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);
  const [selectedPharmacyStock, setSelectedPharmacyStock] = useState<any[]>([]);
  const [stockError, setStockError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [editingPharmacyId, setEditingPharmacyId] = useState<number | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [pharmacyForm, setPharmacyForm] = useState<PharmacyFormState>(defaultPharmacyForm);
  const [agentForm, setAgentForm] = useState<AgentFormState>(defaultAgentForm);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const refreshData = async () => {
    try {
      const [pharmaciesRes, agentsRes, activityRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/pharmacies`, authHeader),
        axios.get(`${API_BASE}/api/admin/agents`, authHeader),
        axios.get(`${API_BASE}/api/admin/activity-logs`, authHeader),
      ]);
      setPharmacies(Array.isArray(pharmaciesRes.data) ? pharmaciesRes.data : []);
      setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
      setActivityLogs(Array.isArray(activityRes.data) ? activityRes.data : []);
    } catch (err: any) {
      console.error(err);
      setAdminMessage(err.response?.data?.error || "Failed to load admin data. Check that the API is running on port 3000.");
    }
  };

  useEffect(() => {
    refreshData();
  }, [token]);

  const loadStockForPharmacy = async (id: number) => {
    setStockError("");
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stock/${id}`, authHeader);
      setSelectedPharmacyStock(res.data.stock || []);
      setView("pharmacies");
    } catch (err: any) {
      console.error(err);
      setStockError(err.response?.data?.error || "Unable to load pharmacy stock.");
      setSelectedPharmacyStock([]);
    }
  };

  const clearPharmacyForm = () => {
    setEditingPharmacyId(null);
    setPharmacyForm(defaultPharmacyForm);
    setAdminMessage("");
  };

  const clearAgentForm = () => {
    setEditingAgentId(null);
    setAgentForm(defaultAgentForm);
    setAdminMessage("");
  };

  const handlePharmacySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionLoading(true);
    setAdminMessage("");

    try {
      const payload = {
        ...pharmacyForm,
        latitude: Number(pharmacyForm.latitude),
        longitude: Number(pharmacyForm.longitude),
      };

      if (editingPharmacyId) {
        await axios.put(`${API_BASE}/api/admin/pharmacies/${editingPharmacyId}`, payload, authHeader);
        setAdminMessage("Pharmacy updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/admin/pharmacies`, payload, authHeader);
        setAdminMessage("Pharmacy added successfully.");
      }

      clearPharmacyForm();
      await refreshData();
    } catch (err: any) {
      console.error(err);
      setAdminMessage(err.response?.data?.error || "Failed to save pharmacy.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAgentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionLoading(true);
    setAdminMessage("");

    try {
      const payload = {
        ...agentForm,
        pharmacyId: Number(agentForm.pharmacyId),
      };

      if (!payload.agentNumber || !payload.name || !payload.pharmacyId) {
        setAdminMessage("Agent number, name and pharmacy assignment are required.");
        setActionLoading(false);
        return;
      }

      if (editingAgentId) {
        await axios.put(`${API_BASE}/api/admin/agents/${editingAgentId}`, payload, authHeader);
        setAdminMessage("Agent record updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/admin/agents`, payload, authHeader);
        setAdminMessage("Agent created successfully.");
      }

      clearAgentForm();
      await refreshData();
    } catch (err: any) {
      console.error(err);
      setAdminMessage(err.response?.data?.error || "Failed to save agent.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePharmacyEdit = (pharmacy: PharmacyNode) => {
    setEditingPharmacyId(pharmacy.id);
    setPharmacyForm({
      name: pharmacy.name,
      city: pharmacy.city,
      address: pharmacy.address,
      phone: pharmacy.phone,
      email: pharmacy.email,
      api_url: pharmacy.api_url,
      latitude: String(pharmacy.latitude),
      longitude: String(pharmacy.longitude),
      amo_supported: pharmacy.amo_supported,
    });
    setView("pharmacies");
  };

  const handlePharmacyDelete = async (id: number) => {
    if (!window.confirm("Remove this pharmacy from the central registry? This will delete all related agent assignments.")) {
      return;
    }
    setActionLoading(true);
    setAdminMessage("");

    try {
      await axios.delete(`${API_BASE}/api/admin/pharmacies/${id}`, authHeader);
      setAdminMessage("Pharmacy removed successfully.");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      setAdminMessage(err.response?.data?.error || "Failed to delete pharmacy.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAgentEdit = (agent: AgentRecord) => {
    setEditingAgentId(agent.id);
    setAgentForm({
      agentNumber: agent.agentNumber,
      name: agent.name,
      pharmacyId: String(agent.pharmacyId),
      isActive: agent.isActive,
    });
    setView("agents");
  };

  const handleAgentDelete = async (id: string) => {
    if (!window.confirm("Delete this agent record permanently?")) {
      return;
    }
    setActionLoading(true);
    setAdminMessage("");

    try {
      await axios.delete(`${API_BASE}/api/admin/agents/${id}`, authHeader);
      setAdminMessage("Agent removed successfully.");
      await refreshData();
    } catch (err: any) {
      console.error(err);
      setAdminMessage(err.response?.data?.error || "Failed to delete agent.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAgentToggleActive = async (agent: AgentRecord) => {
    setActionLoading(true);
    setAdminMessage("");

    try {
      await axios.put(`${API_BASE}/api/admin/agents/${agent.id}`, {
        isActive: !agent.isActive,
      }, authHeader);
      setAdminMessage(`Agent ${agent.agentNumber} is now ${agent.isActive ? "inactive" : "active"}.`);
      await refreshData();
    } catch (err: any) {
      console.error(err);
      setAdminMessage(err.response?.data?.error || "Failed to update agent status.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Central Admin Console</h1>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Logged in as {admin?.email || "Administrator"}</p>
        </div>

        <button onClick={onLogout} style={{ padding: "10px 18px", borderRadius: "12px", border: "none", background: "#ef4444", color: "white", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "30px" }}>
        {(["overview", "pharmacies", "agents", "activity"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: view === mode ? "1px solid #60a5fa" : "1px solid #334155",
              background: view === mode ? "#1e40af" : "#0f172a",
              color: "white",
              cursor: "pointer",
            }}
          >
            {mode === "overview" ? "Overview" : mode === "pharmacies" ? "Pharmacies" : mode === "agents" ? "Agents" : "Activity"}
          </button>
        ))}
      </div>

      {adminMessage && (
        <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "14px", background: "#111827", color: "#cbd5e1", border: "1px solid #334155" }}>
          {adminMessage}
        </div>
      )}

      {view === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
          <div style={{ padding: "22px", background: "#111827", borderRadius: "18px" }}>
            <h2 style={{ marginTop: 0 }}>Pharmacies</h2>
            <p style={{ fontSize: "3rem", margin: 0 }}>{pharmacies.length}</p>
          </div>
          <div style={{ padding: "22px", background: "#111827", borderRadius: "18px" }}>
            <h2 style={{ marginTop: 0 }}>Agents</h2>
            <p style={{ fontSize: "3rem", margin: 0 }}>{agents.length}</p>
          </div>
          <div style={{ padding: "22px", background: "#111827", borderRadius: "18px" }}>
            <h2 style={{ marginTop: 0 }}>Recent Actions</h2>
            <p style={{ fontSize: "3rem", margin: 0 }}>{activityLogs.length}</p>
          </div>
        </div>
      )}

      {view === "pharmacies" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div style={{ padding: "20px", background: "#111827", borderRadius: "18px" }}>
              <h2>{editingPharmacyId ? "Edit Pharmacy" : "Add New Pharmacy"}</h2>
              <form onSubmit={handlePharmacySubmit} style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <input
                  value={pharmacyForm.name}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                  placeholder="Name"
                  style={inputStyle}
                />
                <input
                  value={pharmacyForm.city}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, city: e.target.value })}
                  placeholder="City"
                  style={inputStyle}
                />
                <input
                  value={pharmacyForm.address}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                  placeholder="Address"
                  style={inputStyle}
                />
                <input
                  value={pharmacyForm.phone}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
                  placeholder="Phone"
                  style={inputStyle}
                />
                <input
                  value={pharmacyForm.email}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, email: e.target.value })}
                  placeholder="Email"
                  style={inputStyle}
                />
                <input
                  value={pharmacyForm.api_url}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, api_url: e.target.value })}
                  placeholder="API URL"
                  style={inputStyle}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <input
                    value={pharmacyForm.latitude}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, latitude: e.target.value })}
                    placeholder="Latitude"
                    style={inputStyle}
                  />
                  <input
                    value={pharmacyForm.longitude}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, longitude: e.target.value })}
                    placeholder="Longitude"
                    style={inputStyle}
                  />
                </div>
                <label style={{ display: "flex", gap: "10px", alignItems: "center", color: "#cbd5e1" }}>
                  <input
                    type="checkbox"
                    checked={pharmacyForm.amo_supported}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, amo_supported: e.target.checked })}
                  />
                  AMO supported
                </label>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="submit" disabled={actionLoading} style={buttonPrimaryStyle}>
                    {editingPharmacyId ? "Save Changes" : "Create Pharmacy"}
                  </button>
                  {editingPharmacyId && (
                    <button type="button" onClick={clearPharmacyForm} style={buttonSecondaryStyle}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div style={{ padding: "20px", background: "#111827", borderRadius: "18px" }}>
              <h2>Pharmacy Registry</h2>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                {pharmacies.map((pharmacy) => (
                  <div key={pharmacy.id} style={{ padding: "16px", background: "#0f172a", borderRadius: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{pharmacy.name}</h3>
                        <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>{pharmacy.city} • {pharmacy.address}</p>
                        <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>Agents: {pharmacy.agentCount} ({pharmacy.activeAgentCount} active)</p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button onClick={() => handlePharmacyEdit(pharmacy)} style={smallButtonStyle}>
                          Edit
                        </button>
                        <button onClick={() => handlePharmacyDelete(pharmacy.id)} style={smallDangerStyle}>
                          Delete
                        </button>
                        <button onClick={() => loadStockForPharmacy(pharmacy.id)} style={smallButtonStyle}>
                          Stock
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {stockError && (
            <div style={{ marginTop: "20px", padding: "16px", borderRadius: "12px", background: "#7f1d1d", color: "white" }}>
              {stockError}
            </div>
          )}

          {selectedPharmacyStock.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3>Live Stock</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#cbd5e1", borderBottom: "1px solid #334155" }}>
                    <th style={{ padding: "12px" }}>Name</th>
                    <th style={{ padding: "12px" }}>Quantity</th>
                    <th style={{ padding: "12px" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPharmacyStock.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "12px" }}>{item.name}</td>
                      <td style={{ padding: "12px" }}>{item.stock_quantity}</td>
                      <td style={{ padding: "12px" }}>{item.selling_price} FCFA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "agents" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ padding: "20px", background: "#111827", borderRadius: "18px" }}>
            <h2>{editingAgentId ? "Edit Agent" : "Add New Agent"}</h2>
            <form onSubmit={handleAgentSubmit} style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
              <input
                value={agentForm.agentNumber}
                onChange={(e) => setAgentForm({ ...agentForm, agentNumber: e.target.value })}
                placeholder="Agent Number"
                style={inputStyle}
              />
              <input
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                placeholder="Agent Name"
                style={inputStyle}
              />
              <select
                value={agentForm.pharmacyId}
                onChange={(e) => setAgentForm({ ...agentForm, pharmacyId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select Pharmacy</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
                ))}
              </select>
              <label style={{ display: "flex", gap: "10px", alignItems: "center", color: "#cbd5e1" }}>
                <input
                  type="checkbox"
                  checked={agentForm.isActive}
                  onChange={(e) => setAgentForm({ ...agentForm, isActive: e.target.checked })}
                />
                Active agent
              </label>
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="submit" disabled={actionLoading} style={buttonPrimaryStyle}>
                  {editingAgentId ? "Save Agent" : "Create Agent"}
                </button>
                {editingAgentId && (
                  <button type="button" onClick={clearAgentForm} style={buttonSecondaryStyle}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{ padding: "20px", background: "#111827", borderRadius: "18px" }}>
            <h2>Agent Roster</h2>
            <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
              {agents.map((agent) => (
                <div key={agent.id} style={{ padding: "16px", background: "#0f172a", borderRadius: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{agent.name}</h3>
                      <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}><strong>{agent.agentNumber}</strong> • {agent.pharmacyName}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button onClick={() => handleAgentToggleActive(agent)} style={smallButtonStyle}>
                        {agent.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => handleAgentEdit(agent)} style={smallButtonStyle}>
                        Edit
                      </button>
                      <button onClick={() => handleAgentDelete(agent.id)} style={smallDangerStyle}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "activity" && (
        <div>
          <h2>Recent Agent Activity</h2>
          <div style={{ marginTop: "18px", display: "grid", gap: "16px" }}>
            {activityLogs.map((entry) => (
              <div key={entry.id} style={{ padding: "18px", background: "#111827", borderRadius: "18px" }}>
                <p style={{ margin: 0, color: "#cbd5e1" }}><strong>{entry.action}</strong> • {entry.pharmacyName}</p>
                <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{entry.agentName} ({entry.agentNumber})</p>
                {entry.details && <p style={{ margin: "10px 0 0", color: "#cbd5b2" }}>{entry.details}</p>}
                <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: "0.9rem" }}>{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
};

const buttonPrimaryStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  flex: 1,
};

const buttonSecondaryStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid #334155",
  background: "transparent",
  color: "#cbd5e1",
  cursor: "pointer",
  flex: 1,
};

const smallButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
};

const smallDangerStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
};
