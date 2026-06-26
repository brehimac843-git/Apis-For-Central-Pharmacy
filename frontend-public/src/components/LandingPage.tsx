import { LogIn, UserPlus, Pill, MapPin, TrendingUp, ArrowRight } from "lucide-react"
import Logo from "./Logo"

type Props = {
  onLoginClick: () => void
  onSignupClick: () => void
  onGetStartedClick?: () => void
}

export default function LandingPage({ onLoginClick, onSignupClick, onGetStartedClick }: Props) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="light" showWordmark={false} />
            <span className="text-2xl font-bold text-white">PharmaCare</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onLoginClick}
              className="px-6 py-2 text-white hover:bg-white/10 rounded-lg transition font-semibold flex items-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Login
            </button>
            <button
              onClick={onSignupClick}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-semibold flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
                Find Your Medications
                <span className="text-primary-400"> Instantly</span>
              </h1>
              <p className="text-xl text-slate-200">
                Locate nearby pharmacies, check real-time availability, and manage your health with confidence.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <Feature
                icon={<MapPin className="w-6 h-6" />}
                title="Find Nearby Pharmacies"
                description="Locate pharmacies near you with real-time stock information"
              />
              <Feature
                icon={<TrendingUp className="w-6 h-6" />}
                title="Compare Availability"
                description="See availability across multiple pharmacies"
              />
              <Feature
                icon={<Pill className="w-6 h-6" />}
                title="Instant Search"
                description="Search for medications and get instant results with availability"
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onGetStartedClick || onSignupClick}
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition flex items-center gap-2 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              <button
                onClick={onLoginClick}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition border border-white/30"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Right Hero Image */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-400 rounded-3xl blur-3xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-primary-500 to-blue-600 rounded-3xl p-12 shadow-2xl">
                <div className="space-y-6">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Pill className="w-6 h-6 text-primary-200" />
                      <span className="text-white font-semibold">Quick Search</span>
                    </div>
                    <p className="text-white/80 text-sm">Find medications by name or condition</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-6 h-6 text-primary-200" />
                      <span className="text-white font-semibold">Locate Pharmacies</span>
                    </div>
                    <p className="text-white/80 text-sm">View on interactive map</p>
                  </div>
                  {/* Price comparison removed per request */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer and stats removed per request */}
    </div>
  )
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 p-3 bg-primary-500/20 rounded-lg">
        <div className="text-primary-300">{icon}</div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-slate-300 mt-1">{description}</p>
      </div>
    </div>
  )
}

