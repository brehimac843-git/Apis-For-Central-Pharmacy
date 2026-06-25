import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
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
      map.setView(center, 13); // 13 is the zoom level
    }
  }, [center, map]);
  return null;
}

export default function PharmacyMap({ pharmacies }: { pharmacies: Pharmacy[] }) {
  if (pharmacies.length === 0) return null;

  // We take the first pharmacy as the center point
  const center: [number, number] = [
    pharmacies[0].latitude,
    pharmacies[0].longitude,
  ];

  return (
    <div style={{ height: "400px", width: "100%", marginTop: "20px", borderRadius: "10px", overflow: "hidden" }}>
    <MapContainer
    center={center}
    zoom={13}
    style={{ height: "100%", width: "100%" }}
    >
    {/* ✅ This makes the map jump to the new location */}
    <ChangeView center={center} />

    <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  {pharmacies.map((p, index) => (
    <Marker key={index} position={[p.latitude, p.longitude]}>
    <Popup>
    <div style={{ fontFamily: "Arial" }}>
    <strong style={{ fontSize: "16px" }}>{p.pharmacy}</strong> <br />
    <span style={{ color: "#2c3e50" }}>💰 {p.price} FCFA</span> <br />
    <span>📦 Stock: {p.stock}</span> <br />
    <span>{p.amo_supported ? "✅ AMO Supported" : "❌ No AMO"}</span>
    </div>
    </Popup>
    </Marker>
  ))}
  </MapContainer>
  </div>
  );
}
