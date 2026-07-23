import PharmacyMap from "./PharmacyMap"

type PharmacyDetailProps = {
  pharmacy: {
    pharmacy: string;
    city: string;
    address?: string;
    price: number;
    stock: number;
    amo_supported: boolean;
    latitude: number;
    longitude: number;
  };
  onBack: () => void;
}

export default function PharmacyDetail({ pharmacy, onBack }: PharmacyDetailProps) {
  return (
    <div className="app-container" style={{ textAlign: 'left' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px' }}>
        ← Back to Results
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* INFO SIDE */}
        <div>
          <h1 style={{ textAlign: 'left', fontSize: '2.5rem' }}>{pharmacy.pharmacy}</h1>
          <div className="pharmacy-card" style={{ border: 'none', boxShadow: 'none', background: '#f1f5f9' }}>
            <p style={{ fontSize: '1.2rem' }}><strong>City:</strong> {pharmacy.city}</p>
            <p className="price-tag" style={{ display: 'inline-block' }}>{pharmacy.price} FCFA</p>
            <p style={{ marginTop: '15px' }}><strong>Availability:</strong> {pharmacy.stock} units currently in stock</p>
            <p><strong>Insurance:</strong> {pharmacy.amo_supported ? "✅ AMO Accepted" : "❌ Cash Only"}</p>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #cbd5e1', borderRadius: '10px' }}>
            <h4>Pharmacist Note</h4>
            <p style={{ color: '#64748b' }}>Please call ahead to reserve your medication. Stock levels update every 30 minutes.</p>
          </div>
        </div>

        {/* MAP SIDE */}
        <div>
          <h3>Location</h3>
          <PharmacyMap pharmacies={[pharmacy]} />
        </div>
      </div>
    </div>
  )
}