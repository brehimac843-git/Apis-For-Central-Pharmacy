import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { LayoutDashboard, Store, Users, Activity, Edit2, Trash2, Eye, LogOut, ChevronDown } from "lucide-react";
import { API_BASE } from "../config";
import Logo from "./Logo";

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

type UserRecord = {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  isActive: boolean;
  createdAt: string;
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

type StockItem = {
  id: number | string;
  name: string;
  stock_quantity: number;
  selling_price: number | string;
};

type AdminProfile = {
  id: string;
  email: string;
  name?: string;
  role?: string;
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

type UserFormState = {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
};

type Props = {
  token: string;
  admin: AdminProfile | null;
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

const defaultUserForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  isActive: true,
};

export default function AdminDashboard({ token, admin, onLogout }: Props) {
  const [view, setView] = useState<"overview" | "pharmacies" | "agents" | "users" | "activity">("overview");
  const [pharmacies, setPharmacies] = useState<PharmacyNode[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);
  const [selectedPharmacyStock, setSelectedPharmacyStock] = useState<StockItem[]>([]);
  const [stockError, setStockError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [editingPharmacyId, setEditingPharmacyId] = useState<number | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [pharmacyForm, setPharmacyForm] = useState<PharmacyFormState>(defaultPharmacyForm);
  const [agentForm, setAgentForm] = useState<AgentFormState>(defaultAgentForm);
  const [userForm, setUserForm] = useState<UserFormState>(defaultUserForm);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const getApiError = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.error || fallback;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  };

  const refreshData = async () => {
    try {
      const [pharmaciesRes, agentsRes, usersRes, activityRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/pharmacies`, authHeader),
        axios.get(`${API_BASE}/api/admin/agents`, authHeader),
        axios.get(`${API_BASE}/api/admin/users`, authHeader),
        axios.get(`${API_BASE}/api/admin/activity-logs`, authHeader),
      ]);
      setPharmacies(Array.isArray(pharmaciesRes.data) ? pharmaciesRes.data : []);
      setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setActivityLogs(Array.isArray(activityRes.data) ? activityRes.data : []);
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage(getApiError(error, "Failed to load admin data."));
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const authHeaderInsideEffect = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const [pharmaciesRes, agentsRes, usersRes, activityRes] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/pharmacies`, authHeaderInsideEffect),
          axios.get(`${API_BASE}/api/admin/agents`, authHeaderInsideEffect),
          axios.get(`${API_BASE}/api/admin/users`, authHeaderInsideEffect),
          axios.get(`${API_BASE}/api/admin/activity-logs`, authHeaderInsideEffect),
        ]);
        setPharmacies(Array.isArray(pharmaciesRes.data) ? pharmaciesRes.data : []);
        setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setActivityLogs(Array.isArray(activityRes.data) ? activityRes.data : []);
      } catch (error: unknown) {
        console.error(error);
        setAdminMessage(getApiError(error, "Failed to load admin data."));
      }
    };

    void loadData();
  }, [token]);

  const loadStockForPharmacy = async (id: number) => {
    setStockError("");
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stock/${id}`, authHeader);
      setSelectedPharmacyStock(res.data.stock || []);
      setView("pharmacies");
    } catch (error: unknown) {
      console.error(error);
      setStockError(getApiError(error, "Unable to load pharmacy stock."));
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

  const clearUserForm = () => {
    setEditingUserId(null);
    setUserForm(defaultUserForm);
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
        setAdminMessage("✅ Pharmacy updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/admin/pharmacies`, payload, authHeader);
        setAdminMessage("✅ Pharmacy added successfully.");
      }

      clearPharmacyForm();
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to save pharmacy."));
    } finally {
      setActionLoading(false);
    }
  };

  const formatAgentResultMessage = (successMessage: string, data?: { warning?: string }) => {
    if (data?.warning) {
      return `⚠️ ${successMessage} ${data.warning}`;
    }
    return `✅ ${successMessage}`;
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
        setAdminMessage("❌ Agent number, name and pharmacy assignment are required.");
        setActionLoading(false);
        return;
      }

      if (editingAgentId) {
        const response = await axios.put(`${API_BASE}/api/admin/agents/${editingAgentId}`, payload, authHeader);
        setAdminMessage(formatAgentResultMessage("Agent record updated successfully.", response.data));
      } else {
        const response = await axios.post(`${API_BASE}/api/admin/agents`, payload, authHeader);
        setAdminMessage(formatAgentResultMessage("Agent created successfully.", response.data));
      }

      clearAgentForm();
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to save agent."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionLoading(true);
    setAdminMessage("");

    try {
      const payload: Partial<UserFormState> = {
        name: userForm.name,
        email: userForm.email,
        isActive: userForm.isActive,
      };

      if (!editingUserId) {
        if (!userForm.name || !userForm.email || !userForm.password) {
          setAdminMessage("❌ Name, email and password are required.");
          setActionLoading(false);
          return;
        }
        payload.password = userForm.password;
      } else if (userForm.password.trim()) {
        payload.password = userForm.password;
      }

      if (editingUserId) {
        await axios.put(`${API_BASE}/api/admin/users/${editingUserId}`, payload, authHeader);
        setAdminMessage("✅ User updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/admin/users`, payload, authHeader);
        setAdminMessage("✅ User created successfully.");
      }

      clearUserForm();
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to save user."));
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
      setAdminMessage("✅ Pharmacy removed successfully.");
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to delete pharmacy."));
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
      const response = await axios.delete(`${API_BASE}/api/admin/agents/${id}`, authHeader);
      setAdminMessage(formatAgentResultMessage("Agent removed successfully.", response.data));
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to delete agent."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAgentToggleActive = async (agent: AgentRecord) => {
    setActionLoading(true);
    setAdminMessage("");

    try {
      const response = await axios.put(`${API_BASE}/api/admin/agents/${agent.id}`, {
        isActive: !agent.isActive,
      }, authHeader);
      setAdminMessage(
        formatAgentResultMessage(
          `Agent ${agent.agentNumber} is now ${agent.isActive ? "inactive" : "active"}.`,
          response.data
        )
      );
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to update agent status."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserEdit = (user: UserRecord) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      isActive: user.isActive,
    });
    setView("users");
  };

  const handleUserDelete = async (id: string) => {
    if (!window.confirm("Delete this user account permanently?")) {
      return;
    }
    setActionLoading(true);
    setAdminMessage("");

    try {
      await axios.delete(`${API_BASE}/api/admin/users/${id}`, authHeader);
      setAdminMessage("✅ User removed successfully.");
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to delete user."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserToggleActive = async (user: UserRecord) => {
    setActionLoading(true);
    setAdminMessage("");

    try {
      await axios.put(`${API_BASE}/api/admin/users/${user.id}`, {
        isActive: !user.isActive,
      }, authHeader);
      setAdminMessage(`✅ User ${user.email} is now ${user.isActive ? "inactive" : "active"}.`);
      await refreshData();
    } catch (error: unknown) {
      console.error(error);
      setAdminMessage("❌ " + getApiError(error, "Failed to update user status."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="flex justify-between items-center gap-6 flex-wrap">
            <div>
              <Logo subtitle="Console administrateur" />
              <p className="text-slate-600 m-0 mt-3">Connecté en tant que {admin?.email || "Administrateur"}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {(["overview", "pharmacies", "agents", "users", "activity"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`px-6 py-3 rounded-full font-semibold transition flex items-center gap-2 ${
                view === mode
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {mode === "overview" && <LayoutDashboard className="w-5 h-5" />}
              {mode === "pharmacies" && <Store className="w-5 h-5" />}
              {(mode === "agents" || mode === "users") && <Users className="w-5 h-5" />}
              {mode === "activity" && <Activity className="w-5 h-5" />}
              <span className="hidden sm:inline">{mode === 'overview' ? 'Aperçu' : mode === 'pharmacies' ? 'Pharmacies' : mode === 'agents' ? 'Agents' : mode === 'users' ? 'Utilisateurs' : 'Activité'}</span>
            </button>
          ))}
        </div>

        {/* Status Message */}
        {adminMessage && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            adminMessage.startsWith("✅")
              ? "bg-green-50 border-green-500 text-green-700"
              : adminMessage.startsWith("⚠️")
              ? "bg-amber-50 border-amber-500 text-amber-800"
              : "bg-red-50 border-red-500 text-red-700"
          }`}>
            {adminMessage}
          </div>
        )}

        {/* Overview */}
        {view === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            <StatCard icon={<Store className="w-8 h-8" />} label="Pharmacies" value={pharmacies.length} color="bg-blue-600" />
            <StatCard icon={<Users className="w-8 h-8" />} label="Agents" value={agents.length} color="bg-purple-600" />
            <StatCard icon={<Users className="w-8 h-8" />} label="Utilisateurs" value={users.length} color="bg-indigo-600" />
            <StatCard icon={<Activity className="w-8 h-8" />} label="Actions récentes" value={activityLogs.length} color="bg-green-600" />
            <StatCard icon={<ChevronDown className="w-8 h-8" />} label="Agents actifs" value={agents.filter(a => a.isActive).length} color="bg-orange-600" />
          </div>
        )}

        {/* Pharmacies View */}
        {view === "pharmacies" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingPharmacyId ? "Modifier la pharmacie" : "Ajouter une pharmacie"}</h2>
              <form onSubmit={handlePharmacySubmit} className="space-y-4">
                <input
                  value={pharmacyForm.name}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                  placeholder="Nom"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  value={pharmacyForm.city}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, city: e.target.value })}
                  placeholder="Ville"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  value={pharmacyForm.address}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                  placeholder="Adresse"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  value={pharmacyForm.phone}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
                  placeholder="Téléphone"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  value={pharmacyForm.email}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, email: e.target.value })}
                  placeholder="Email"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  value={pharmacyForm.api_url}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, api_url: e.target.value })}
                  placeholder="URL API"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={pharmacyForm.latitude}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, latitude: e.target.value })}
                    placeholder="Latitude"
                    className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    value={pharmacyForm.longitude}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, longitude: e.target.value })}
                    placeholder="Longitude"
                    className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <label className="flex gap-3 items-center text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pharmacyForm.amo_supported}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, amo_supported: e.target.checked })}
                    className="w-4 h-4"
                  />
                  AMO supportée
                </label>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={actionLoading} 
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-full transition"
                  >
                    {editingPharmacyId ? "Enregistrer" : "Créer la pharmacie"}
                  </button>
                  {editingPharmacyId && (
                    <button
                      type="button"
                      onClick={clearPharmacyForm}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full transition"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Pharmacies List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Registre des pharmacies ({pharmacies.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pharmacies.map((pharmacy) => (
                  <div key={pharmacy.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 transition shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">{pharmacy.name}</h3>
                        <p className="text-slate-500 text-sm mt-1">{pharmacy.city} • {pharmacy.address}</p>
                        <p className="text-slate-500 text-sm mt-2">Agents : {pharmacy.agentCount} ({pharmacy.activeAgentCount} actifs)</p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button 
                          onClick={() => handlePharmacyEdit(pharmacy)} 
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => loadStockForPharmacy(pharmacy.id)} 
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                          title="Voir le stock"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handlePharmacyDelete(pharmacy.id)} 
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stock Table */}
              {stockError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700">
                  {stockError}
                </div>
              )}
              {selectedPharmacyStock.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg">Stock en direct</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-100 text-sm bg-slate-50">
                          <th className="px-4 py-2">Nom</th>
                          <th className="px-4 py-2">Quantité</th>
                          <th className="px-4 py-2">Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPharmacyStock.map((item: StockItem) => (
                          <tr key={item.id} className="border-b border-slate-100 text-slate-700 text-sm">
                            <td className="px-4 py-3">{item.name}</td>
                            <td className="px-4 py-3">{item.stock_quantity}</td>
                            <td className="px-4 py-3 text-primary-700 font-semibold">{item.selling_price} FCFA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agents View */}
        {view === "agents" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingAgentId ? "Modifier l'agent" : "Ajouter un agent"}</h2>
              <form onSubmit={handleAgentSubmit} className="space-y-4">
                <input
                  value={agentForm.agentNumber}
                  onChange={(e) => setAgentForm({ ...agentForm, agentNumber: e.target.value })}
                  placeholder="Numéro d'agent"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="Nom de l'agent"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={agentForm.pharmacyId}
                  onChange={(e) => setAgentForm({ ...agentForm, pharmacyId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner une pharmacie</option>
                  {pharmacies.map((pharmacy) => (
                    <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
                  ))}
                </select>
                <label className="flex gap-3 items-center text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentForm.isActive}
                    onChange={(e) => setAgentForm({ ...agentForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Agent actif
                </label>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={actionLoading} 
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-full transition"
                  >
                    {editingAgentId ? "Enregistrer l'agent" : "Créer l'agent"}
                  </button>
                  {editingAgentId && (
                    <button
                      type="button"
                      onClick={clearAgentForm}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full transition"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Agents List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Liste des agents ({agents.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-4 rounded-xl border transition shadow-sm ${
                      agent.isActive
                        ? "bg-white border-slate-200 hover:border-primary-300"
                        : "bg-slate-50 border-slate-200 opacity-80"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg">{agent.name}</h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            agent.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                          }`}>
                            {agent.isActive ? "ACTIF" : "INACTIF"}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm mt-1">#{agent.agentNumber} • {agent.pharmacyName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAgentToggleActive(agent)} 
                          className={`p-2 rounded-lg transition ${
                            agent.isActive
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                          title={agent.isActive ? "Désactiver" : "Activer"}
                        >
                          {agent.isActive ? "Désactiver" : "Activer"}
                        </button>
                        <button 
                          onClick={() => handleAgentEdit(agent)} 
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAgentDelete(agent.id)} 
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users View */}
        {view === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingUserId ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</h2>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Nom complet"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="Adresse email"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUserId ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <label className="flex gap-3 items-center text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Utilisateur actif
                </label>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-full transition"
                  >
                    {editingUserId ? "Enregistrer l'utilisateur" : "Créer l'utilisateur"}
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={clearUserForm}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full transition"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Liste des utilisateurs ({users.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 rounded-xl border transition shadow-sm ${
                      user.isActive
                        ? "bg-white border-slate-200 hover:border-primary-300"
                        : "bg-slate-50 border-slate-200 opacity-80"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            user.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                          }`}>
                            {user.isActive ? "ACTIF" : "INACTIF"}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm mt-1">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUserToggleActive(user)}
                          className={`p-2 rounded-lg transition ${
                            user.isActive
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                          title={user.isActive ? "Désactiver" : "Activer"}
                        >
                          {user.isActive ? "Désactiver" : "Activer"}
                        </button>
                        <button
                          onClick={() => handleUserEdit(user)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserDelete(user.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity View */}
        {view === "activity" && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Activité récente des agents</h2>
            <div className="space-y-4">
              {activityLogs.map((entry) => (
                <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 transition shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-slate-900 font-semibold">{entry.action} <span className="text-primary-600">• {entry.pharmacyName}</span></p>
                      <p className="text-slate-500 text-sm mt-2">{entry.agentName} (#{entry.agentNumber})</p>
                      {entry.details && <p className="text-slate-600 text-sm mt-2 italic">{entry.details}</p>}
                    </div>
                    <p className="text-slate-500 text-xs whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-xl text-white`}>{icon}</div>
      </div>
    </div>
  );
}
