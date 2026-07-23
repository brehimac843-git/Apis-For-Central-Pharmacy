import { useState } from "react";
import { ArrowLeft, MapPin, Phone, Clock, Navigation } from "lucide-react";
import PharmacyMap from "./PharmacyMap"

type Pharmacy = {
  pharmacy: string
  city: string
  latitude: number
  longitude: number
  price: number
  stock: number
  amo_supported: boolean
  amo_rate: number | null
}

type Props = {
  pharmacy: Pharmacy
  drugName: string
  onBack: () => void
}

export default function PharmacyDetail({ pharmacy, drugName, onBack }: Props) {
  const [directionsStatus, setDirectionsStatus] = useState<string | null>(null)

  const openDirections = (origin?: { latitude: number; longitude: number }) => {
    const destination = `${pharmacy.latitude},${pharmacy.longitude}`
    let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
    if (origin) {
      const originCoords = `${origin.latitude},${origin.longitude}`
      url += `&origin=${encodeURIComponent(originCoords)}`
    }
    window.open(url, "_blank")
  }

  const handleGetDirections = () => {
    if (!navigator.geolocation) {
      setDirectionsStatus("Browser geolocation unavailable. Opening directions to the pharmacy.")
      openDirections()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setDirectionsStatus("Opening navigation from your current location...")
        openDirections(origin)
      },
      () => {
        setDirectionsStatus("Location permission denied. Opening directions to the pharmacy without your current location.")
        openDirections()
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-primary-600 font-medium transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux résultats
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-100 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Searching for</p>
                  <h1 className="text-3xl font-bold text-slate-900">{drugName || pharmacy.pharmacy}</h1>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm font-semibold">
                  Certifié
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-6">
                <MapPin className="w-5 h-5 text-primary-500" />
                <span className="text-lg">{pharmacy.city}</span>
              </div>

              {/* Price Highlight */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 mb-6 border border-primary-200">
                <span className="text-sm text-slate-600">Current Price</span>
                <div className="text-4xl font-bold text-primary-600 mt-2">
                  {pharmacy.price} <span className="text-xl text-slate-500">FCFA</span>
                </div>

                {pharmacy.amo_supported && pharmacy.amo_rate != null ? (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-slate-700">
                    <p className="text-sm font-semibold text-emerald-800">AMO reimbursement rate: {pharmacy.amo_rate}%</p>
                    <p className="mt-2 text-sm">
                      Coût pour le patient après AMO : <span className="font-semibold text-slate-900">{Math.max(0, Math.round(pharmacy.price * (1 - pharmacy.amo_rate / 100)))} FCFA</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Vous économisez environ {Math.round(pharmacy.price * (pharmacy.amo_rate / 100))} FCFA avec l'AMO.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    This drug is not AMO covered at this pharmacy.
                  </div>
                )}
              </div>
            </div>

            {/* Contact & Hours */}
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm text-slate-600">Contact Pharmacy</p>
                  <p className="font-semibold text-slate-900">Contacter la pharmacie</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm text-slate-600">Business Hours</p>
                  <p className="font-semibold text-slate-900">Heures d'ouverture</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-4">
              <PharmacyMap pharmacies={[pharmacy]} />
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Get directions</h2>
                    <p className="text-sm text-slate-500">Itinéraire</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetDirections}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-white font-semibold hover:bg-primary-700 transition"
                  >
                    <Navigation className="w-4 h-4" />
                    Ouvrir l'itinéraire
                  </button>
                </div>
                {directionsStatus && (
                  <p className="mt-3 text-sm text-slate-600">{directionsStatus}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
      </div>
    </div>
  )
}