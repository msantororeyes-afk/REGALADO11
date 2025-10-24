import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DealAlertModal({ onClose }) {
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const categories = [
    "Automotive", "Babies & Kids", "Books & Media", "Fashion", "Food & Beverages",
    "Gaming", "Groceries", "Health & Beauty", "Home & Living", "Housing",
    "Office Supplies", "Pets", "Restaurants", "Sports & Outdoors",
    "Tech & Electronics", "Toys & Hobbies", "Travel",
  ];

  const coupons = [
    "Amazon", "Cabify", "Falabella", "Linio", "MercadoLibre", "Oechsle",
    "PedidosYa", "PlazaVea", "Rappi", "Ripley", "Sodimac", "Tottus", "Others",
  ];

  const affiliateStores = [
    "Amazon", "AliExpress", "Shein", "Linio", "Falabella", "Ripley", "Oechsle",
    "PlazaVea", "Tottus", "MercadoLibre", "Coolbox", "Estilos", "Promart",
    "Sodimac", "Booking.com", "Trip.com", "Despegar", "Rappi", "PedidosYa",
  ];

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("⚠️ You must be logged in to save alerts.");
      setSaving(false);
      return;
    }

    // Determine alert type
    let alertType = "";
    let alertValue = "";

    if (keyword) {
      alertType = "keyword";
      alertValue = keyword;
    } else if (selectedCategory) {
      alertType = "category";
      alertValue = selectedCategory;
    } else if (selectedCoupon) {
      alertType = "coupon";
      alertValue = selectedCoupon;
    } else if (selectedAffiliate) {
      alertType = "affiliate_store";
      alertValue = selectedAffiliate;
    } else {
      setMessage("⚠️ Please select or type at least one alert.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("deal_alerts").insert([
      {
        user_id: user.id,
        alert_type: alertType,
        alert_value: alertValue,
        created_at: new Date(),
      },
    ]);

    setSaving(false);

    if (error) {
      console.error("❌ Error saving alert:", error);
      setMessage("❌ Error saving your alert. Please try again.");
    } else {
      setMessage("✅ Alert saved! You’ll be notified when matching deals appear.");
      setTimeout(onClose, 1500);
    }
  };

  // ---------- UI ----------
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>✕</button>

        <h2 style={{ marginBottom: "16px", color: "#0070f3" }}>Create a Deal Alert</h2>
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "14px" }}>
          Choose ONE category per try. You can choose multiple ones on different tries.
        </p>

        <div style={formGroup}>
          <label style={labelStyle}>Keyword (optional)</label>
          <input
            type="text"
            placeholder="e.g., running shoes, TV, laptop..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setSelectedCategory("");
              setSelectedCoupon("");
              setSelectedAffiliate("");
            }}
            style={inputStyle}
          />
        </div>

        {/* Grouped Alert Type Section */}
        <div style={groupBox}>
          <p style={groupTitle}>Choose one alert type below:</p>

          <div style={formGroup}>
            <label style={labelStyle}>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setKeyword("");
                setSelectedCoupon("");
                setSelectedAffiliate("");
              }}
              style={inputStyle}
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>Coupon / Store</label>
            <select
              value={selectedCoupon}
              onChange={(e) => {
                setSelectedCoupon(e.target.value);
                setKeyword("");
                setSelectedCategory("");
                setSelectedAffiliate("");
              }}
              style={inputStyle}
            >
              <option value="">None</option>
              {coupons.map((cp) => (
                <option key={cp} value={cp}>{cp}</option>
              ))}
            </select>
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>Affiliate Store</label>
            <select
              value={selectedAffiliate}
              onChange={(e) => {
                setSelectedAffiliate(e.target.value);
                setKeyword("");
                setSelectedCategory("");
                setSelectedCoupon("");
              }}
              style={inputStyle}
            >
              <option value="">None</option>
              {affiliateStores.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
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
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "24px 30px",
  maxWidth: "420px",
  width: "90%",
  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  position: "relative",
  textAlign: "center",
};

const groupBox = {
  background: "#f9f9f9",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "10px 14px",
  marginTop: "10px",
  marginBottom: "14px",
};

const groupTitle = {
  fontWeight: 600,
  color: "#333",
  fontSize: "0.95rem",
  marginBottom: "8px",
};

const closeButtonStyle = {
  position: "absolute",
  top: "10px",
  right: "12px",
  border: "none",
  background: "transparent",
  fontSize: "20px",
  cursor: "pointer",
};

const formGroup = { marginBottom: "14px", textAlign: "left" };
const labelStyle = { display: "block", marginBottom: "6px", fontWeight: 600, color: "#333" };
const inputStyle = { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "0.95rem" };
const saveButtonStyle = { background: "#0070f3", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "1rem", transition: "0.3s" };
