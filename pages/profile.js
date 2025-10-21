import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [myDeals, setMyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const reputation = 125;
  const votesGiven = 42;

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.error("Error fetching user:", error);
      setUser(user);

      if (user) {
        // ✅ Load username from "profiles" table
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setUsername(profileData.username || "");
        }

        // ✅ Load user's deals
        const { data: deals } = await supabase
          .from("deals")
          .select("*")
          .eq("posted_by", user.id)
          .order("id", { ascending: false });

        setMyDeals(deals || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ✅ Save or update username
  const handleSaveUsername = async () => {
    if (!user || !username.trim()) {
      alert("Please enter a valid username.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.trim(),
      created_at: new Date(),
    });
    setSaving(false);

    if (error) {
      console.error(error);
      alert("❌ Error saving username. Try again.");
    } else {
      alert("✅ Username saved!");
      setProfile({ username: username.trim() });
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
                Welcome{profile?.username ? `, ${profile.username} 👋` : ""}!
              </h2>

              {/* ---------- TABS ---------- */}
              <div className="tabs">
                <button
                  className={activeTab === "profile" ? "active" : ""}
                  onClick={() => setActiveTab("profile")}
                >
                  👤 My Profile
                </button>
                <button
                  className={activeTab === "deals" ? "active" : ""}
                  onClick={() => setActiveTab("deals")}
                >
                  💸 My Deals
                </button>
                <button
                  className={activeTab === "settings" ? "active" : ""}
                  onClick={() => setActiveTab("settings")}
                >
                  ⚙️ Settings & Options
                </button>
                <button
                  className={activeTab === "privacy" ? "active" : ""}
                  onClick={() => setActiveTab("privacy")}
                >
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

                    {/* ✅ Username Section */}
                    <div className="username-section">
                      <label><strong>Username:</strong></label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose your username"
                      />
                      <button onClick={handleSaveUsername} disabled={saving}>
                        {saving ? "Saving..." : "Save Username"}
                      </button>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                )}

                {/* --- My Deals --- */}
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
                                {deal.original_price && <span className="old">S/.{deal.original_price}</span>}
                                {deal.price && <span className="new">S/.{deal.price}</span>}
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
                  </div>
                )}

                {/* --- Settings --- */}
                {activeTab === "settings" && (
                  <div className="settings-section">
                    <h3>Settings & Options</h3>
                    <button>Change Password</button>
                    <button>Update Email</button>
                    <button>Link Account</button>
                    <p style={{ marginTop: "10px", fontSize: "0.9em", color: "#777" }}>
                      These buttons are placeholders. We’ll connect them later to Supabase Auth.
                    </p>
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

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js + Supabase
        </p>
      </footer>

      {/* ---------- STYLES ---------- */}
      <style jsx>{`
        .tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .tabs button {
          background: #f5f5f5;
          border: 1px solid #ddd;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .tabs button:hover {
          background: #e9e9e9;
        }
        .tabs button.active {
          background: #0070f3;
          color: white;
          border-color: #0070f3;
        }
        .tab-content {
          text-align: left;
        }
        .profile-section p {
          margin: 8px 0;
        }
        .username-section {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }
        .username-section input {
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 1rem;
        }
        .username-section button {
          margin-top: 10px;
          background: #0070f3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
        .logout-btn {
          margin-top: 20px;
          background: #e63946;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
