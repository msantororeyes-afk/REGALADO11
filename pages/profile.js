import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [favCategories, setFavCategories] = useState([]);
  const [favCoupons, setFavCoupons] = useState([]);
  const [saving, setSaving] = useState(false);

  // ---------- CATEGORIES & COUPONS ----------
  const allCategories = [
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
  ].sort();

  const allCoupons = [
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
  ].sort();

  // ---------- LOAD USER ----------
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth";
        return;
      }
      setUser(user);
      await loadProfile(user.id);
    }
    fetchUser();
  }, []);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, favorite_categories, favorite_coupons")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Profile load error:", error);
      return;
    }

    if (data) {
      setUsername(data.username || "");
      setFavCategories(data.favorite_categories || []);
      setFavCoupons(data.favorite_coupons || []);
    }
  }

  // ---------- TOGGLE FAVORITES ----------
  const toggleCategory = (cat) => {
    setFavCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleCoupon = (cp) => {
    setFavCoupons((prev) =>
      prev.includes(cp) ? prev.filter((c) => c !== cp) : [...prev, cp]
    );
  };

  // ---------- SAVE PREFERENCES ----------
  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username,
      favorite_categories: favCategories,
      favorite_coupons: favCoupons,
      updated_at: new Date(),
    });
    setSaving(false);
    if (error) console.error("Error saving profile:", error);
    else alert("✅ Preferences saved!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ---------- UI ----------
  return (
    <div>
      {/* ---------- HEADER ---------- */}
      <header className="header">
        <Link href="/" legacyBehavior>
          <a className="logo" style={{ cursor: "pointer" }}>
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>

        <div className="search-bar">
          <input type="text" placeholder="Search deals..." disabled />
        </div>

        <div className="header-buttons">
          <Link href="/submit"><button>Submit Deal</button></Link>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      {/* ---------- PROFILE SECTION ---------- */}
      <main
        style={{
          maxWidth: "900px",
          margin: "50px auto",
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#0070f3" }}>
          👤 My Profile
        </h1>

        <div style={{ marginTop: "30px" }}>
          <label
            style={{
              fontWeight: 600,
              display: "block",
              marginBottom: "6px",
              color: "#333",
            }}
          >
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "20px",
            }}
          />
        </div>

        {/* ---------- FAVORITE CATEGORIES ---------- */}
        <h3 style={{ marginBottom: "10px" }}>Favorite Categories</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginBottom: "30px",
          }}
        >
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              style={{
                borderRadius: "8px",
                border: favCategories.includes(cat)
                  ? "2px solid #0070f3"
                  : "1px solid #ccc",
                background: favCategories.includes(cat)
                  ? "#e6f0ff"
                  : "white",
                padding: "10px",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ---------- FAVORITE COUPONS ---------- */}
        <h3 style={{ marginBottom: "10px" }}>Favorite Coupon Partners</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {allCoupons.map((cp) => (
            <button
              key={cp}
              onClick={() => toggleCoupon(cp)}
              style={{
                borderRadius: "8px",
                border: favCoupons.includes(cp)
                  ? "2px solid #0070f3"
                  : "1px solid #ccc",
                background: favCoupons.includes(cp)
                  ? "#e6f0ff"
                  : "white",
                padding: "10px",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              {cp}
            </button>
          ))}
        </div>

        {/* ---------- SAVE BUTTON ---------- */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={savePreferences}
            disabled={saving}
            style={{
              background: "#0070f3",
              color: "white",
              padding: "12px 24px",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <p>
          © 2025 Regalado — Personalized Deals for You 🇵🇪 | Built with ❤️ using
          Next.js + Supabase
        </p>
      </footer>
    </div>
  );
}
