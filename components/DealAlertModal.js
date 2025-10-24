import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DealAlertModal({ onClose }) {
  const [selectedOption, setSelectedOption] = useState("");
  const [keyword, setKeyword] = useState("");
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

    let alertType = "";
    let alertValue = "";

    if (selectedOption.startsWith("keyword")) {
      if (!keyword.trim()) {
        setMessage("⚠️ Please enter a keyword.");
        setSaving(false);
        return;
      }
      alertType = "keyword";
      alertValue = keyword.trim();
    } else if (selectedOption.includes("category::")) {
      alertType = "category";
      alertValue = selectedOption.split("::")[1];
    } else if (selectedOption.includes("coupon::")) {
      alertType = "coupon";
      alertValue = selectedOption.split("::")[1];
    } else if (selectedOption.includes("affiliate::")) {
      alertType = "affiliate_store";
      alertValue = selectedOption.split("::")[1];
    } else {
      setMessage("⚠️ Please choose an alert type or keyword.");
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

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>✕</button>

        <h2 style={{ marginBottom: "16px", color: "#0070f3" }}>Create a Deal Alert</h2>
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "14px" }}>
          Choose ONE category per try. You can choose multiple ones on different tries.
        </p>

        <div style={formGroup}>
          <label style={labelStyle}>Alert Type</label>
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            style={dropdownStyle}
          >
            <option value="">Select one...</option>
            <option value="keyword::custom">🔍 Keyword</option>

            <optgroup label="📦 Categories" style={optgroupStyle}>
              {categories.map((cat) => (
                <option key={`category-${cat}`} value={`category::${cat}`} style={optionStyle}>
                  {cat}
                </option>
              ))}
            </optgroup>

            <optgroup label="🏷️ Coupons" style={optgroupStyle}>
              {coupons.map((cp) => (
                <option key={`coupon-${cp}`} value={`coupon::${cp}`} style={optionStyle}>
                  {cp}
                </option>
              ))}
            </optgroup>

            <optgroup label="🛒 Affiliate Stores" style={optgroupStyle}>
              {affiliateStores.map((st) => (
                <option key={`affiliate-${st}`} value={`affiliate::${st}`} style={optionStyle}>
                  {st}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {selectedOption === "keyword::custom" && (
          <div style={formGroup}>
            <label style={labelStyle}>Enter keyword</label>
            <input
              type="text"
              placeholder="e.g., running shoes, laptop..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

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
const dropdownStyle = { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "0.95rem", backgroundColor: "#fff", color: "#333", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" };
const optgroupStyle = { fontWeight: 600, color: "#444", backgroundColor: "#f2f2f2", padding: "6px 0", borderTop: "1px solid #ddd", borderBottom: "1px solid #ddd" };
const optionStyle = { paddingLeft: "10px", fontWeight: 400, color: "#333", backgroundColor: "#fff" };
const inputStyle = { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "0.95rem" };
const saveButtonStyle = { background: "#0070f3", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "1rem", transition: "0.3s" };
