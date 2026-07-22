import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Check, X, DollarSign } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "../utils/fixLeafletIcon";

type Pharmacy = {
  pharmacy: string;
  latitude: number;
  longitude: number;
  price: number;
  stock: number;
  amo_supported: boolean;
};

// ✅ HELPER COMPONENT: This tells the map to move when the results change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function PharmacyMap({ pharmacies }: { pharmacies: Pharmacy[] }) {
  if (pharmacies.length === 0) return null;

  const center: [number, number] = [
    pharmacies[0].latitude,
    pharmacies[0].longitude,
  ];

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-slate-100 h-96">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <ChangeView center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pharmacies.map((p, index) => (
            <Marker
              key={index}
              position={[p.latitude, p.longitude]}
            >
              <Popup>
                <div className="p-3">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{p.pharmacy}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-primary-600">
                      <DollarSign className="w-4 h-4" />
                      <span>{p.price} FCFA</span>
                    </div>
                    <div className="mt-2">
                      {p.amo_supported ? (
                        <div className="flex items-center gap-2 text-success">
                          <Check className="w-4 h-4" />
                          <span>Couvert par l'AMO</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-danger">
                          <X className="w-4 h-4" />
                          <span>Pas d'AMO</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
