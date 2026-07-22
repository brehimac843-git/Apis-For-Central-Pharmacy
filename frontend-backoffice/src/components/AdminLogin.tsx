import { useState } from "react"
import type { FormEvent } from "react"
import axios from "axios"
import { Mail, Lock, ArrowLeft } from "lucide-react"
import { API_BASE } from "../config"
import Logo from "./Logo"

type AdminProfile = {
  id: string
  email: string
  name?: string
  role?: string
}

type Props = {
  onLoginSuccess: (token: string, admin: AdminProfile) => void
  onCancel: () => void
}

export default function AdminLogin({ onLoginSuccess, onCancel }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("L'email et le mot de passe sont requis.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await axios.post(`${API_BASE}/api/auth/admin-login`, {
        email: email.trim(),
        password: password.trim(),
      })
      onLoginSuccess(response.data.token, response.data.user)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "Login failed. Please verify your credentials.")
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Login failed. Please verify your credentials.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
        <div className="mb-8">
          <Logo subtitle="Console administrateur" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connexion administrateur centrale</h2>
        <p className="text-slate-600 mb-6">
          Gérez les pharmacies, les agents et les règles de visibilité depuis la console centrale.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="inline-flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pharma.ml"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mot de passe
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
