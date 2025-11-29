// /pages/admin/index.js
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    async function loadUser() {
      // 1. Load auth session
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error loading admin user:", error);
      }

      // If no user is logged in → done
      if (!user) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setUser(user);

      // 2. Fetch profile to check role
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      setProfile(profileData || null);
      setLoadingUser(false);
    }

    loadUser();
  }, []);

  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "users", label: "👥 Users" },
    { id: "deals", label: "💸 Deals" },
    { id: "alerts", label: "🔔 Alerts" },
    { id: "leaderboard", label: "🏆 Leaderboard" },
  ];

  const isAdmin = profile?.role === "admin";

  return (
    <div className="admin-page">
      <Header />

      <main className="admin-container">
        <h1 className="admin-title">Admin Panel</h1>
        <p className="admin-subtitle">
          Internal tools to manage users, deals, alerts and leaderboard.
        </p>

        {loadingUser ? (
          <p className="admin-loading">Loading admin session...</p>
        ) : !user ? (
          <div className="admin-no-access">
            <h2>Restricted area</h2>
            <p>You must be signed in to access the admin panel.</p>
            <a href="/auth">
              <button>Go to sign in</button>
            </a>
          </div>
        ) : !isAdmin ? (
          <div className="admin-no-access">
            <h2>Restricted area</h2>
            <p>Your account does not have admin permissions.</p>
            <a href="/">
              <button>Return to homepage</button>
            </a>
          </div>
        ) : (
          <>
            <div className="admin-warning">
              ⚠️ Access control is now enforced. Only admin accounts may use
              this panel.
            </div>

            <div className="admin-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={
                    "admin-tab-button" +
                    (activeTab === tab.id ? " admin-tab-button-active" : "")
                  }
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <section className="admin-content">
              {activeTab === "dashboard" && <DashboardSection />}
              {activeTab === "users" && <UsersSection />}
              {activeTab === "deals" && <DealsSection />}
              {activeTab === "alerts" && <AlertsSection />}
              {activeTab === "leaderboard" && <LeaderboardSection />}
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: #f3f4f6;
        }

        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }

        .admin-title {
          font-size: 1.8rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 4px;
        }

        .admin-subtitle {
          text-align: center;
          color: #6b7280;
          font-size: 0.95rem;
          margin-bottom: 20px;
        }

        .admin-loading {
          text-align: center;
          margin-top: 40px;
          color: #4b5563;
        }

        .admin-no-access {
          max-width: 420px;
          margin: 40px auto 0;
          background: #ffffff;
          border-radius: 12px;
          padding: 24px 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          text-align: center;
        }

        .admin-no-access h2 {
          margin-bottom: 8px;
        }

        .admin-no-access p {
          color: #4b5563;
          margin-bottom: 16px;
          font-size: 0.95rem;
        }

        .admin-no-access button {
          background: #0070f3;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
        }

        .admin-warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          color: #92400e;
          font-size: 0.85rem;
          padding: 8px 10px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .admin-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }

        .admin-tab-button {
          background: #f9fafb;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          padding: 8px 14px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .admin-tab-button:hover {
          background: #e5e7eb;
        }

        .admin-tab-button-active {
          background: #0070f3;
          border-color: #0070f3;
          color: #ffffff;
        }

        .admin-content {
          background: #ffffff;
          border-radius: 14px;
          padding: 18px 16px 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .admin-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .admin-section-subtitle {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 16px;
        }

        .admin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .admin-stat-card {
          background: #f9fafb;
          border-radius: 10px;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
        }

        .admin-stat-label {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .admin-stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          margin-top: 4px;
        }

        .admin-placeholder {
          font-size: 0.9rem;
          color: #4b5563;
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 18px 10px 30px;
          }

          .admin-title {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------- DASHBOARD SECTION ---------------- */

function DashboardSection() {
  return (
    <div>
      <h2 className="admin-section-title">📊 Overview</h2>
      <p className="admin-section-subtitle">
        Quick glance at REGALADO&apos;s current activity. Later we will link
        these stats to real Supabase queries.
      </p>

      <div className="admin-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total users</div>
          <div className="admin-stat-value">—</div>
          <div className="admin-placeholder">
            Will show count from <code>auth.users</code>.
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Deals (last 24h)</div>
          <div className="admin-stat-value">—</div>
          <div className="admin-placeholder">
            Will use <code>deals.created_at</code> filter.
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Pending alerts</div>
          <div className="admin-stat-value">—</div>
          <div className="admin-placeholder">
            From <code>deal_alert_queue</code> &{" "}
            <code>email_digest_queue</code>.
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Reputation events (today)</div>
          <div className="admin-stat-value">—</div>
          <div className="admin-placeholder">
            From <code>reputation_events</code>.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- USERS SECTION ---------------- */

function UsersSection() {
  return (
    <div>
      <h2 className="admin-section-title">👥 Users</h2>
      <p className="admin-section-subtitle">
        Here you will be able to search users, edit usernames, view reputation
        and manage access.
      </p>

      <p className="admin-placeholder">
        Next steps here:
        <br />• Search bar for user email / username
        <br />• Table with reputation, badges, last login
        <br />• Actions: reset reputation, ban user, grant bonus points
      </p>
    </div>
  );
}

/* ---------------- DEALS SECTION ---------------- */

function DealsSection() {
  return (
    <div>
      <h2 className="admin-section-title">💸 Deals</h2>
      <p className="admin-section-subtitle">
        Internal view of submitted deals. Later we&apos;ll add approval,
        removal and &quot;mark as hot&quot; tools.
      </p>

      <p className="admin-placeholder">
        Next steps here:
        <br />• Filter by status, store, date
        <br />• Show votes and comments per deal
        <br />• Actions: feature deal, hide deal, fix title or category
      </p>
    </div>
  );
}

/* ---------------- ALERTS SECTION ---------------- */

function AlertsSection() {
  return (
    <div>
      <h2 className="admin-section-title">🔔 Alerts & Emails</h2>
      <p className="admin-section-subtitle">
        Monitor immediate alerts and daily digests (SendGrid + queues).
      </p>

      <p className="admin-placeholder">
        Next steps here:
        <br />• Show pending items in <code>deal_alert_queue</code> and{" "}
        <code>email_digest_queue</code>
        <br />• See last run of edge functions
        <br />• Manual &quot;re-send&quot; or &quot;retry&quot; buttons
      </p>
    </div>
  );
}

/* ---------------- LEADERBOARD SECTION ---------------- */

function LeaderboardSection() {
  return (
    <div>
      <h2 className="admin-section-title">🏆 Leaderboard</h2>
      <p className="admin-section-subtitle">
        Internal view of daily, weekly and monthly leaderboard tables.
      </p>

      <p className="admin-placeholder">
        Next steps here:
        <br />• Small tables reading from{" "}
        <code>leaderboard_daily / weekly / monthly</code>
        <br />• Show last refresh timestamps
        <br />• Manual &quot;refresh leaderboard&quot; button for debugging
      </p>
    </div>
  );
}
