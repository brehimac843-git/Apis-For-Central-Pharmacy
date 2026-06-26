import { ChevronDown, LogIn, Upload, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ROUTES } from "../routes"
import Logo from "./Logo"

type Props = {
  user: any
  onLogout: () => void
  onUpdateUserPhoto: (photo: string) => Promise<void>
  onOpenLogin: () => void
  onOpenSignup: () => void
}

export default function Header({ user, onLogout, onUpdateUserPhoto, onOpenLogin, onOpenSignup }: Props) {
  const navigate = useNavigate()
  const isGuest = user?.guest === true
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [signInDropdownOpen, setSignInDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const signInRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
      if (signInRef.current && !signInRef.current.contains(event.target as Node)) {
        setSignInDropdownOpen(false)
      }
    }
    if (profileDropdownOpen || signInDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileDropdownOpen, signInDropdownOpen])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const preview = reader.result as string
      try {
        await onUpdateUserPhoto(preview)
      } catch (error) {
        console.error("Failed to save profile photo", error)
      } finally {
        setProfileDropdownOpen(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.dashboard} className="hover:opacity-90 transition">
              <Logo />
            </Link>

            <button
              type="button"
              onClick={() => navigate(ROUTES.catalogue)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition"
            >
              <span className="text-sm font-semibold text-slate-700">Catalogue</span>
            </button>

            {!isGuest && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.history)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full shadow-sm hover:bg-primary-700 transition"
              >
                <span className="text-sm font-semibold">History</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && !user.guest ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((s) => !s)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 overflow-hidden"
                  aria-label="Open profile"
                >
                  {user.photo ? (
                    <img src={user.photo} alt="profile" className="w-10 h-10 object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-600" />
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click()
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition text-slate-700 font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Change photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLogout()
                        setProfileDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition text-slate-700 font-medium border-t border-slate-100"
                    >
                      Logout
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="profile-photo-upload"
                />
              </div>
            ) : (
              <div className="relative" ref={signInRef}>
                <button
                  type="button"
                  onClick={() => setSignInDropdownOpen((open) => !open)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition text-slate-700"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-semibold">Sign In</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {signInDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenLogin()
                        setSignInDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition text-slate-700 font-medium"
                    >
                      <span className="block font-semibold">Log in</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Already have an account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSignup()
                        setSignInDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition text-slate-700 font-medium border-t border-slate-100"
                    >
                      <span className="block font-semibold">Sign up</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Create a new account</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
