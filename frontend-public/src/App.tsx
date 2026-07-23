import { useState, useEffect, useCallback } from "react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE } from "./config"
import { ROUTES } from "./routes"
import LandingPage from "./components/LandingPage"
import AuthModal from "./components/AuthModal"
import Header from "./components/Header"
import Dashboard from "./components/Dashboard"
import "./App.css"

type AuthMode = "none" | "login" | "signup"

type PublicUser = {
  guest?: boolean
  name?: string
  surname?: string
  email?: string
  photo?: string
}

type AuthSubmitData = {
  email: string
  password: string
  name?: string
  surname?: string
  photo?: File | null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function persistUser(user: PublicUser) {
  localStorage.setItem("public_user", JSON.stringify(user))
}

function App() {
  const navigate = useNavigate()

  // Authentication State
  const [publicToken, setPublicToken] = useState<string | null>(() => {
    return localStorage.getItem("public_token")
  })
  const [publicUser, setPublicUser] = useState<PublicUser | null>(() => {
    try {
      const user = localStorage.getItem("public_user")
      return user ? (JSON.parse(user) as PublicUser) : null
    } catch {
      return null
    }
  })

  // Auth UI State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  const hasAppAccess = !!(publicToken && publicUser)

  const handleLogin = async (data: { email: string; password: string }) => {
    setAuthError("")
    setAuthLoading(true)

    try {
      const res = await axios.post(`${API_BASE}/api/public/login`, {
        email: data.email,
        password: data.password,
      })

      const { token, user } = res.data

      localStorage.setItem("public_token", token)
      persistUser(user)

      setPublicToken(token)
      setPublicUser(user)
      setAuthModalOpen(false)
      setAuthError("")
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setAuthError(error.response?.data?.error || "Login failed. Please try again.")
      } else {
        setAuthError("Login failed. Please try again.")
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignup = async (data: AuthSubmitData) => {
    setAuthError("")
    setAuthLoading(true)

    try {
      const photo = data.photo ? await fileToBase64(data.photo) : undefined
      const res = await axios.post(`${API_BASE}/api/public/register`, {
        email: data.email,
        password: data.password,
        name: `${data.name} ${data.surname}`.trim(),
        photo,
      })

      const { token, user } = res.data

      localStorage.setItem("public_token", token)
      persistUser(user)

      setPublicToken(token)
      setPublicUser(user)
      setAuthModalOpen(false)
      setAuthError("")
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setAuthError(error.response?.data?.error || "Signup failed. Please try again.")
      } else {
        setAuthError("Signup failed. Please try again.")
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleAuthSubmit = async (data: AuthSubmitData) => {
    if (authMode === "login") {
      await handleLogin(data)
    } else {
      await handleSignup(data)
    }
  }

  const enterGuestMode = () => {
    setPublicToken("guest")
    setPublicUser({ guest: true, name: "Guest" })
  }

  const logout = useCallback(() => {
    localStorage.removeItem("public_token")
    localStorage.removeItem("public_user")
    enterGuestMode()
    navigate(ROUTES.dashboard, { replace: true })
  }, [navigate])

  const verifyToken = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/public/verify`, {
        headers: { Authorization: `Bearer ${publicToken}` },
      })
      if (res.data?.user) {
        setPublicUser(res.data.user)
        persistUser(res.data.user)
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error("Token verification failed", error)
      }
      logout()
    }
  }, [logout, publicToken])

  // Check if user is already logged in on mount or when token/user change
  useEffect(() => {
    if (!publicToken || !publicUser || publicToken === "guest") return

    const verify = async () => {
      await verifyToken()
    }

    void verify()
  }, [publicToken, publicUser, verifyToken])

  const updateUser = (updatedUser: PublicUser) => {
    setPublicUser(updatedUser)
    persistUser(updatedUser)
  }

  const updateUserPhoto = async (photo: string) => {
    if (!publicToken || publicToken === "guest") {
      updateUser({ ...(publicUser ?? { guest: true }), photo })
      return
    }

    const res = await axios.put(
      `${API_BASE}/api/public/profile/photo`,
      { photo },
      { headers: { Authorization: `Bearer ${publicToken}` } }
    )
    updateUser(res.data.user)
  }

  const openLoginModal = () => {
    setAuthMode("login")
    setAuthModalOpen(true)
    setAuthError("")
  }

  const openSignupModal = () => {
    setAuthMode("signup")
    setAuthModalOpen(true)
    setAuthError("")
  }

  const handleGetStarted = () => {
    enterGuestMode()
    navigate(ROUTES.dashboard)
  }

  const authModal = (
    <AuthModal
      isOpen={authModalOpen}
      mode={authMode as "login" | "signup"}
      onClose={() => {
        setAuthModalOpen(false)
        setAuthError("")
      }}
      onSwitchMode={() => {
        setAuthMode(authMode === "login" ? "signup" : "login")
        setAuthError("")
      }}
      onSubmit={handleAuthSubmit}
      error={authError}
      loading={authLoading}
    />
  )

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.home} replace />} />

        <Route
          path={ROUTES.home}
          element={
            hasAppAccess ? (
              <Navigate to={ROUTES.dashboard} replace />
            ) : (
              <>
                <LandingPage
                  onLoginClick={openLoginModal}
                  onSignupClick={openSignupModal}
                  onGetStartedClick={handleGetStarted}
                />
                {authModal}
              </>
            )
          }
        />

        <Route
          path="/pharmahub/*"
          element={
            hasAppAccess ? (
              <>
                <Header
                  user={publicUser}
                  onLogout={logout}
                  onUpdateUserPhoto={updateUserPhoto}
                  onOpenLogin={openLoginModal}
                  onOpenSignup={openSignupModal}
                />
                <Dashboard token={publicToken!} isGuest={publicUser?.guest === true} />
                {authModal}
              </>
            ) : (
              <Navigate to={ROUTES.home} replace />
            )
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </>
  )
}

export default App
