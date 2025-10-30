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

  // ✅ ADDED: new state for alert settings
  const [immediateEnabled, setImmediateEnabled] = useState(false);

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

        // ✅ ADDED: load immediate alert setting
        const { data: settings } = await supabase
          .from("alert_settings")
          .select("immediate_enabled")
          .eq("user_id", user.id)
          .single();

        if (settings && settings.immediate_enabled !== undefined) {
          setImmediateEnabled(settings.immediate_enabled);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  // ✅ ADDED: save toggle
  const handleImmediateToggle = async (checked) => {
    setImmediateEnabled(checked);
    if (!user) return;
    const { error } = await supabase.from("alert_settings").upsert({
      user_id: user.id,
      immediate_enabled: checked,
      updated_at: new Date(),
    });
    if (error) console.error("Error saving immediate alert setting:", error);
  };

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
                    {/* existing code unchanged */}
                    {/* ... */}
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

                    {/* ✅ ADDED: Immediate Alert toggle (keeps your layout) */}
                    <div style={{ marginTop: "20px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                        <input
                          type="checkbox"
                          checked={immediateEnabled}
                          onChange={(e) => handleImmediateToggle(e.target.checked)}
                        />
                        Receive immediate email alerts for new deals
                      </label>
                    </div>

                    {/* existing favorites section below unchanged */}
                    <div style={{ marginTop: "30px" }}>
                      <h4>Favorite Categories</h4>
                      {/* rest of your original code untouched */}
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
