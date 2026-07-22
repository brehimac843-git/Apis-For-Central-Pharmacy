import { useState, useEffect } from "react"
import axios from "axios"
import { Building2, Hash, ArrowLeft } from "lucide-react"
import { API_BASE } from "../config"
import Logo from "./Logo"

type PharmacyNode = {
  id: number
  name: string
  city: string
  api_url: string
}

type AgentProfile = {
  id: string
  agentNumber: string
  name: string
  pharmacyId?: number
  pharmacyName?: string
  email?: string
  role?: string
}

type Props = {
  onLoginSuccess: (token: string, agent: AgentProfile, pharmacyId: number, nodeApiUrl: string) => void
  onCancel: () => void
}

export default function AgentLogin({ onLoginSuccess, onCancel }: Props) {
  const [pharmacies, setPharmacies] = useState<PharmacyNode[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState("")
  const [agentNumber, setAgentNumber] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadPharmacies() {
      try {
        const res = await axios.get(`${API_BASE}/api/pharmacies`)
        setPharmacies(res.data)
      } catch {
        setPharmacies([
          { id: 1, name: "Pharmacie DB1", city: "Bamako", api_url: "http://localhost:3001" },
          { id: 2, name: "Pharmacie DB2", city: "Bamako", api_url: "http://localhost:3002" },
          { id: 3, name: "Pharmacie DB3", city: "Bamako", api_url: "http://localhost:3003" },
        ])
      }
    }
    loadPharmacies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPharmacy || !agentNumber.trim()) {
      setError("Veuillez sélectionner votre succursale et saisir votre numéro d'agent.")
      return
    }

    setLoading(true)
    setError("")

    const pharmacy = pharmacies.find((p) => p.id === Number(selectedPharmacy))

    try {
      const response = await axios.post(`${API_BASE}/api/auth/agent-login`, {
        agentNumber: agentNumber.trim(),
        pharmacyId: Number(selectedPharmacy),
      })

      const { token, user: agent } = response.data
      onLoginSuccess(token, agent, Number(selectedPharmacy), pharmacy?.api_url || "")
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "Unable to connect right now. Please try again.")
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Unable to connect right now. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
        <div className="mb-8">
          <Logo subtitle="Portail agent" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Portail agent</h2>
        <p className="text-slate-600 mb-6">Connectez-vous à votre succursale pour gérer la visibilité des stocks.</p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Succursale de la pharmacie
              </span>
            </label>
            <select
              value={selectedPharmacy}
              onChange={(e) => setSelectedPharmacy(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Choisissez la succursale</option>
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Numéro d'agent
              </span>
            </label>
            <input
              type="text"
              placeholder="ex. AG-74920"
              value={agentNumber}
              onChange={(e) => setAgentNumber(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
