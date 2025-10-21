import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [myDeals, setMyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Mock stats (we’ll calculate later)
  const reputation = 125; // placeholder
  const votesGiven = 42; // placeholder

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.error("Error fetching user:", error);

      setUser(user);

      if (user) {
        const { data: deals, error: dealsError } = await supabase
          .from("deals")
          .select("*")
          .eq("posted_by", user.id)
          .order("id", { ascending: false });

        if (dealsError) console.error("Error fetching deals:", dealsError);
        else setMyDeals(deals || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
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
                    <button onClick={handleLogout} style={{ marginTop: "20px" }}>
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
                            {deal.image_url && (
                              <img src={deal.image_url} alt={deal.title} />
                            )}
                            <div className="content">
                              <h2>{deal.title}</h2>
                              <p>{deal.description}</p>
                              <div className="price-section">
                                {deal.original_price && (
                                  <span className="old">
                                    S/.{deal.original_price}
                                  </span>
                                )}
                                {deal.price && (
                                  <span className="new">S/.{deal.price}</span>
                                )}
                                {deal.discount && (
                                  <span className="discount-badge">
                                    -{deal.discount}%
                                  </span>
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
                    <label>
                      <input type="checkbox" defaultChecked /> Allow followers
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked /> Show my comments
                    </label>
                    <label>
                      <input type="checkbox" /> Allow deal notifications
                    </label>
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
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using
          Next.js + Supabase
        </p>
      </footer>

      {/* ---------- SIMPLE STYLES ---------- */}
      <style jsx>{`
        .tabs {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .tabs button {
          background: #f1f1f1;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        .tabs button.active {
          background: #0070f3;
          color: white;
        }
        .tab-content {
          text-align: left;
        }
        .profile-section p {
          margin: 8px 0;
        }
        .settings-section button {
          display: block;
          margin: 8px 0;
          background: #eee;
          border: none;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        .privacy-section label {
          display: block;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}
