import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [myDeals, setMyDeals] = useState([]);
  const [myAlerts, setMyAlerts] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const [favCategories, setFavCategories] = useState([]);
  const [favCoupons, setFavCoupons] = useState([]);

  // ✅ NEW STATE for alert settings
  const [immediateEnabled, setImmediateEnabled] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);

  const reputation = 125;
  const votesGiven = 42;

  const allCategories = [
    "Automotive","Babies & Kids","Books & Media","Fashion","Food & Beverages","Gaming","Groceries",
    "Health & Beauty","Home & Living","Housing","Office Supplies","Pets","Restaurants",
    "Sports & Outdoors","Tech & Electronics","Toys & Hobbies","Travel",
  ].sort();

  const allCoupons = [
    "Amazon","Cabify","Falabella","Linio","MercadoLibre","Oechsle","PedidosYa","PlazaVea","Rappi",
    "Ripley","Sodimac","Tottus","Others",
  ].sort();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Error fetching user:", error);
      setUser(user);

      if (user) {
        // Load profile info
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, favorite_categories, favorite_coupons")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116")
          console.error(profileError);

        if (profileData) {
          setProfile(profileData);
          setUsername(profileData.username || "");
          setFavCategories(profileData.favorite_categories || []);
          setFavCoupons(profileData.favorite_coupons || []);
        }

        // Load user's submitted deals  ✅ use user_id (uuid), not posted_by
        const { data: deals } = await supabase
          .from("deals")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false });
        setMyDeals(deals || []);

        // ✅ Load user's deal alerts
        const { data: alerts, error: alertsError } = await supabase
          .from("deal_alerts")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false });

        if (alertsError) console.error("Error fetching alerts:", alertsError);
        setMyAlerts(alerts || []);

        // ✅ Load alert settings
        const { data: settings, error: settingsError } = await supabase
          .from("alert_settings")
          .select("immediate_enabled, digest_enabled")
          .eq("user_id", user.id)
          .single();
        if (settingsError && settingsError.code !== "PGRST116") console.error(settingsError);
        if (settings) {
          setImmediateEnabled(settings.immediate_enabled ?? false);
          setDigestEnabled(settings.digest_enabled ?? true);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSaveUsername = async () => {
    if (!user) return alert("You must be logged in to save settings.");
    if (!username.trim()) return alert("Please enter a valid username.");

    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.trim(),
      favorite_categories: favCategories,
      favorite_coupons: favCoupons,
      updated_at: new Date(),
    });
    setSaving(false);

    if (error) {
      console.error(error);
      alert("❌ Error saving preferences. Try again.");
    } else {
      alert("✅ Preferences saved!");
      setProfile((prev) => ({
        ...prev,
        username: username.trim(),
        favorite_categories: favCategories,
        favorite_coupons: favCoupons,
      }));
    }
  };

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

  // ✅ Delete an alert
  const handleDeleteAlert = async (id) => {
    const { error } = await supabase.from("deal_alerts").delete().eq("id", id);
    if (error) {
      alert("❌ Error deleting alert.");
      console.error(error);
    } else {
      setMyAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // ✅ Save alert settings
  const handleAlertSettingsToggle = async (type, value) => {
    if (!user) return;
    if (type === "immediate") setImmediateEnabled(value);
    if (type === "digest") setDigestEnabled(value);

    const { error } = await supabase.from("alert_settings").upsert({
      user_id: user.id,
      immediate_enabled: type === "immediate" ? value : immediateEnabled,
      digest_enabled: type === "digest" ? value : digestEnabled,
      updated_at: new Date(),
    });

    if (error) console.error("Error saving alert settings:", error);
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-page">
      <Header />

      <main className="submit-container">
        <div className="form-card">
          <h1>My Profile</h1>

          {!user ? (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <p>Please sign in to view your profile.</p>
              <a href="/auth">
                <button>Sign In</button>
              </a>
            </div>
          ) : (
            <>
              {/* ---------- WELCOME MESSAGE ---------- */}
              <h2 style={{ textAlign: "center", color: "#0070f3", marginBottom: "10px" }}>
                {profile?.username
                  ? `Welcome, ${profile.username} 👋`
                  : "Welcome! Please choose your username 👇"}
              </h2>

              {/* ---------- TABS ---------- */}
              <div className="tabs">
                <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
                  👤 My Profile
                </button>
                <button className={activeTab === "deals" ? "active" : ""} onClick={() => setActiveTab("deals")}>
                  💸 My Deals & Alerts
                </button>
                <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
                  ⚙️ Settings & Options
                </button>
                <button className={activeTab === "privacy" ? "active" : ""} onClick={() => setActiveTab("privacy")}>
                  🔒 Privacy & Security
                </button>
              </div>

              {/* ---------- TAB CONTENT ---------- */}
              <div className="tab-content">

                {/* existing tabs remain unchanged until Settings */}

                {activeTab === "settings" && (
                  <div className="settings-section">
                    <h3>Settings & Options</h3>
                    {profile?.username && (
                      <div className="username-section">
                        <label><strong>Change Username:</strong></label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                        <button onClick={handleSaveUsername} disabled={saving}>
                          {saving ? "Saving..." : "Update Username"}
                        </button>
                      </div>
                    )}

                    <div style={{ marginTop: "30px" }}>
                      <h4>Favorite Categories</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
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
                              padding: "8px",
                              cursor: "pointer",
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <h4 style={{ marginTop: "25px" }}>Favorite Coupon Partners</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
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
                              padding: "8px",
                              cursor: "pointer",
                            }}
                          >
                            {cp}
                          </button>
                        ))}
                      </div>

                      {/* ✅ NEW SECTION: Email Alert Settings */}
                      <h4 style={{ marginTop: "25px" }}>Email Notification Settings</h4>
                      <div style={{ marginTop: "8px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="checkbox"
                            checked={immediateEnabled}
                            onChange={(e) => handleAlertSettingsToggle("immediate", e.target.checked)}
                          />
                          Receive immediate deal alerts
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                          <input
                            type="checkbox"
                            checked={digestEnabled}
                            onChange={(e) => handleAlertSettingsToggle("digest", e.target.checked)}
                          />
                          Receive daily deal digest emails
                        </label>
                      </div>

                      <button
                        onClick={handleSaveUsername}
                        disabled={saving}
                        style={{
                          marginTop: "20px",
                          background: "#0070f3",
                          color: "white",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: "8px",
                        }}
                      >
                        {saving ? "Saving..." : "Save Preferences"}
                      </button>
                    </div>
                  </div>
                )}

                {/* --- Privacy --- (unchanged) */}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js + Supabase</p>
      </footer>
    </div>
  );
}
