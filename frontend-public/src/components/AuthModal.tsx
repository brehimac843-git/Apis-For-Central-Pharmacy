import { useState } from "react"
import { X, Mail, Lock, User, Upload } from "lucide-react"

type Props = {
  isOpen: boolean
  mode: "login" | "signup"
  onClose: () => void
  onSwitchMode: () => void
  onSubmit: (data: any) => Promise<void>
  error?: string
  loading?: boolean
}

export default function AuthModal({ isOpen, mode, onClose, onSwitchMode, onSubmit, error, loading }: Props) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    photo: null as File | null,
    photoPreview: "" as string,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      surname: formData.surname,
      photo: formData.photo,
    }
    await onSubmit(submitData)
    // Clear form after submission
    setFormData({
      email: "",
      password: "",
      name: "",
      surname: "",
      photo: null,
      photoPreview: "",
    })
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          photo: file,
          photoPreview: reader.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Surname (Sign Up Only) */}
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    First Name
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Profile Photo (Optional)
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-input"
                  />
                  <label
                    htmlFor="photo-input"
                    className="block px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition"
                  >
                    {formData.photoPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={formData.photoPreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <p className="text-xs text-slate-600">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <p className="text-sm text-slate-600">Click to upload photo</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </div>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition mt-6"
          >
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-6 text-center border-t border-slate-200 pt-6">
          <p className="text-slate-600 text-sm">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            {" "}
            <button
              onClick={onSwitchMode}
              className="text-primary-600 hover:text-primary-700 font-semibold transition"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
