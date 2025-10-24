import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DealAlertModal({ onClose }) {
  const [categories] = useState([
    "Automotive",
    "Babies & Kids",
    "Books & Media",
    "Fashion",
    "Food & Beverages",
    "Gaming",
    "Groceries",
    "Health & Beauty",
    "Home & Living",
    "Housing",
    "Office Supplies",
    "Pets",
    "Restaurants",
    "Sports & Outdoors",
    "Tech & Electronics",
    "Toys & Hobbies",
    "Travel",
  ]);

  const [coupons] = useState([
    "Amazon",
    "Cabify",
    "Falabella",
    "Linio",
    "MercadoLibre",
    "Oechsle",
    "PedidosYa",
    "PlazaVea",
    "Rappi",
    "Ripley",
    "Sodimac",
    "Tottus",
    "Others",
  ]);

  const [affiliateStores] = useState([
    "Amazon",
    "AliExpress",
    "Shein",
    "Linio",
    "Falabella",
    "Ripley",
    "Oechsle",
    "PlazaVea",
    "Tottus",
    "MercadoLibre",
    "Coolbox",
    "Estilos",
    "Promart",
    "Sodimac",
    "Booking.com",
    "Trip.com",
    "Despegar",
    "Rappi",
    "PedidosYa",
  ]);

  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in to save alerts.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("deal_alerts").insert([
      {
        user_id: user.id,
        categories: selectedCategory ? [selectedCategory] : [],
        coupons: selectedCoupon ? [selectedCoupon] : [],
        affiliate_stores: selectedAffiliate ? [selectedAffiliate] : [],
        keyword: keyword || null,
        created_at: new Date(),
      },
    ]);

    setSaving(false);

    if (error) {
      console.error("Error saving alert:", error);
      setMessage("❌ Error saving your alert. Please try again.");
    } else {
      setMessage("✅ Alert saved! You’ll be notified when matching deals appear.");
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: "16px", color: "#0070f3" }}>Create a Deal Alert</h2>

        <div style={formGroup}>
          <label style={labelStyle}>Keyword (optional)</label>
          <input
            type="text"
            placeholder="e.g., running shoes, laptop, jersey..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={formGroup}>
          <label style={labelStyle}>Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={inputStyle}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={formGroup}>
          <label style={labelStyle}>Store / Coupon</label>
          <select
            value={selectedCoupon}
            onChange={(e) => setSelectedCoupon(e.target.value)}
            style={inputStyle}
          >
            <option value="">All stores</option>
            {coupons.map((cp) => (
              <option key={cp} value={cp}>{cp}</option>
            ))}
          </select>
        </div>

        <div style={formGroup}>
          <label style={labelStyle}>Affiliate Stores</label>
          <select
            value={selectedAffiliate}
            onChange={(e) => setSelectedAffiliate(e.target.value)}
            style={inputStyle}
          >
            <option value="">All affiliate stores</option>
            {affiliateStores.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {message && <p style={{ marginTop: "10px", color: "#444" }}>{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...saveButtonStyle,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Alert"}
        </button>
      </div>
    </div>
  );
}

// ---------- Styles ----------
const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 };
const modalStyle = { background: "#fff", borderRadius: "12px", padding: "24px 30px", maxWidth: "420px", width: "90%", boxShadow: "0 6px 20px rgba(0,0,0,0.1)", position: "relative", textAlign: "center" };
const closeButtonStyle = { position: "absolute", top: "10px", right: "12px", border: "none", background: "transparent", fontSize: "20px", cursor: "pointer" };
const formGroup = { marginBottom: "14px", textAlign: "left" };
const labelStyle = { display: "block", marginBottom: "6px", fontWeight: 600, color: "#333" };
const inputStyle = { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "0.95rem" };
const saveButtonStyle = { background: "#0070f3", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "1rem", transition: "0.3s" };
