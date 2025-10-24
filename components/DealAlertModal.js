import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DealAlertModal({ onClose }) {
  const [mode, setMode] = useState(""); // 'keyword' | 'category' | 'coupon' | 'affiliate'
  const [value, setValue] = useState("");
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

  // ---------- SAVE ----------
  const handleSave = async () => {
    if (!mode || !value) {
      setMessage("Please choose one alert type and fill it in before saving.");
      return;
    }

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

    // Build insert payload
    const payload = {
      user_id: user.id,
      keyword: mode === "keyword" ? value : null,
      category: mode === "category" ? value : null,
      coupon: mode === "coupon" ? value : null,
      affiliate_store: mode === "affiliate" ? value : null,
      created_at: new Date(),
    };

    const { error } = await supabase.from("deal_alerts").insert([payload]);
    setSaving(false);

    if (error) {
      console.error("❌ Error saving alert:", error);
      setMessage("❌ Error saving your alert. Please try again.");
    } else {
      setMessage("✅ Alert saved! You’ll be notified when matching deals appear.");
      setTimeout(onClose, 1500);
    }
  };

  // ---------- RENDER ----------
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: "16px", color: "#0070f3" }}>Create a Deal Alert</h2>

        {/* Select Mode */}
        <div style={formGroup}>
          <label style={labelStyle}>Choose alert type:</label>
          <select
            value={mode}
            onChange={(e) => { setMode(e.target.value); setValue(""); }}
            style={inputStyle}
          >
            <option value="">Select...</option>
            <option value="keyword">Keyword</option>
            <option value="category">Category</option>
            <option value="coupon">Coupon</option>
            <option value="affiliate">Affiliate Store</option>
          </select>
        </div>

        {/* Input Field depending on mode */}
        {mode === "keyword" && (
          <div style={formGroup}>
            <label style={labelStyle}>Keyword</label>
            <input
              type="text"
              placeholder="e.g. running shoes, laptop, etc."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        {mode === "category" && (
          <div style={formGroup}>
            <label style={labelStyle}>Category</label>
            <select value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {mode === "coupon" && (
          <div style={formGroup}>
            <label style={labelStyle}>Coupon / Store</label>
            <select value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle}>
              <option value="">Select store</option>
              {coupons.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {mode === "affiliate" && (
          <div style={formGroup}>
            <label style={labelStyle}>Affiliate Store</label>
            <select value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle}>
              <option value="">Select affiliate</option>
              {affiliateStores.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}

        {message && <p style={{ marginTop: "10px", color: "#444" }}>{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...saveButtonStyle,
            opacity: saving ? 0.6 : 1,


