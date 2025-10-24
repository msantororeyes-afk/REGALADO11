import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DealAlertModal({ onClose }) {
  const [keyword, setKeyword] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Data grouped by type
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

  // Parse the combined value later to detect its type
  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("⚠️ You must be logged in to save alerts.");
      setSaving(false);
      return;
    }

    let alertType = "";
    let alertValue = "";

    if (keyword) {
      alertType = "keyword";
      alertValue = keyword;
    } else if (selectedOption) {
      // Decode combined value
      const [type, value] = selectedOption.split("::");
      alertType = type;
      alertValue = value;
    } else {
      setMessage("⚠️ Please type a keyword or select an option.");
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

        <h2 style={{ marginBottom: "12px", color: "#0070f3" }}>Create a Deal Alert</h2>
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "12px" }}>
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
              setSelectedOption("");
            }}
            style={inputStyle}
          />
        </div>

        <div style={formGroup}>
          <label style={labelStyle}>Select Type</label>
          <select
            value={selectedOption}
            onChange={(e) => {
              setSelectedOption(e.target.value);
              setKeyword("");
            }}
            style={inputStyle}
          >
            <option value="">Select one...</option>

            <optgroup label="📦 Categories">
              {categories.map((cat) => (
                <option key={`category-${cat}`} value={`category::${cat}`}>
                  {cat}
                </option>
              ))}
            </optgroup>

            <optgroup label="🏷️ Coupons">
              {coupons.map((cp) => (
                <option key={`coupon-${cp}`} value={`coupon::${cp}`}>
                  {cp}
                </option>
              ))}
            </optgroup>

            <optgroup label="🛒 Affiliate Stores">
              {affiliateStores.map((st) => (
                <option key={`affiliate-${st}`} value={`affiliate_store::${st}`}>
                  {st}
                </option>
              ))}
            </optgroup>
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
