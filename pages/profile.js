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
  
  // Email alert settings
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
                {/* --- My Profile --- */}
                {activeTab === "profile" && (
                  <div className="profile-section">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    <p><strong>Reputation:</strong> {reputation} pts</p>
                    <p><strong>Votes given:</strong> {votesGiven}</p>

                    {!profile?.username && (
                      <div className="username-section">
                        <label><strong>Choose Username:</strong></label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose your username" />
                        <button onClick={handleSaveUsername} disabled={saving}>
                          {saving ? "Saving..." : "Save Username"}
                        </button>
                      </div>
                    )}

                    <button className="logout-btn" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                )}

                {/* --- My Deals & Alerts --- */}
                {activeTab === "deals" && (
                  <div className="deals-section">
                    <h3>Your Submitted Deals</h3>
                    {myDeals.length > 0 ? (
                      <div className="deals-grid">
                        {myDeals.map((deal) => (
                          <div key={deal.id} className="deal-card">
                            {deal.image_url && <img src={deal.image_url} alt={deal.title} />}
                            <div className="content">
                              <h2>{deal.title}</h2>
                              <p>{deal.description}</p>
                              <div className="price-section">
                                {deal.original_price && (
                                  <span className="old">S/.{deal.original_price}</span>
                                )}
                                {deal.price && (
                                  <span className="new">S/.{deal.price}</span>
                                )}
                                {deal.discount && (
                                  <span className="discount-badge">-{deal.discount}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>You haven’t submitted any deals yet.</p>
                    )}

                    {/* --- My Deal Alerts --- */}
                    <div style={{ marginTop: "40px" }}>
                      <h3>🔔 My Deal Alerts</h3>
                      {myAlerts.length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0 }}>
                          {myAlerts.map((alert) => {
                            // determine icon for each alert type
                            let icon = "🔔";
                            if (alert.alert_type === "keyword") icon = "🔍";
                            else if (alert.alert_type === "category") icon = "📦";
                            else if (alert.alert_type === "coupon") icon = "🏷️";
                            else if (alert.alert_type === "affiliate_store") icon = "🛒";

                            return (
                              <li
                                key={alert.id}
                                style={{
                                  background: "#f9f9f9",
                                  border: "1px solid #ddd",
                                  borderRadius: "8px",
                                  padding: "10px 14px",
                                  marginBottom: "10px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span style={{ fontSize: "0.8rem", color: "#333" }}>
                                  <strong>
                                    {icon}{" "}
                                    {alert.alert_type
                                      .replace("_", " ")
                                      .replace(/^\w/, (c) => c.toUpperCase())}
                                  </strong>
                                  : {alert.alert_value}
                                </span>
                                <button
                                  onClick={() => handleDeleteAlert(alert.id)}
                                  style={{
                                    background: "#ff4d4d",
                                    color: "white",
                                    border: "none",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p>You haven’t set up any alerts yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* --- Settings --- */}
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

                {/* --- Privacy --- */}
                {activeTab === "privacy" && (
                  <div className="privacy-section">
                    <h3>Privacy & Security</h3>
                    <label><input type="checkbox" defaultChecked /> Allow followers</label>
                    <label><input type="checkbox" defaultChecked /> Show my comments</label>
                    <label><input type="checkbox" /> Allow deal notifications</label>
                    <p style={{ marginTop: "10px", fontSize: "0.9em", color: "#777" }}>
                      These settings will be saved later in your user preferences.
                    </p>
                  </div>
                )}
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
