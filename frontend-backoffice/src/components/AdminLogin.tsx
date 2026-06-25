import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { API_BASE } from "../config";

type Props = {
  onLoginSuccess: (token: string, admin: any) => void;
  onCancel: () => void;
};

export default function AdminLogin({ onLoginSuccess, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API_BASE}/api/auth/admin-login`, {
        email: email.trim(),
        password: password.trim(),
      });
      onLoginSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto", padding: "32px", background: "#1f2937", borderRadius: "18px", border: "1px solid #334155" }}>
      <h2 style={{ color: "white", marginTop: 0 }}>Central Admin Login</h2>
      <p style={{ color: "#cbd5e1", marginBottom: "24px" }}>Use your central administrator account to manage pharmacies, agents, and visibility rules.</p>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: "10px", padding: "12px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <label style={{ color: "#e2e8f0" }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@pharma.ml"
            style={{ width: "100%", marginTop: "8px", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white" }}
          />
        </label>

        <label style={{ color: "#e2e8f0" }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: "100%", marginTop: "8px", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white" }}
          />
        </label>

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "transparent", border: "1px solid #334155", color: "#cbd5e1", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", cursor: "pointer" }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
