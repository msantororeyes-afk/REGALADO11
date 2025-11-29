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
              {activeTab === "users" && <UsersSection currentUser={user} />}
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

        /* --- Users table styles --- */

        .admin-users-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .admin-users-search {
          flex: 1;
          min-width: 220px;
        }

        .admin-users-search input {
          width: 100%;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 0.9rem;
        }

        .admin-users-refresh {
          font-size: 0.8rem;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          cursor: pointer;
        }

        .admin-users-refresh:hover {
          background: #e5e7eb;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .admin-table th,
        .admin-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        .admin-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #4b5563;
        }

        .admin-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .admin-tag-role {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .admin-tag-banned {
          background: #fee2e2;
          color: #b91c1c;
        }

        .admin-tag-ok {
          background: #ecfdf3;
          color: #15803d;
        }

        .admin-tag-flagged {
          background: #fef3c7;
          color: #92400e;
        }

        .admin-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .admin-small-btn {
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          cursor: pointer;
        }

        .admin-small-btn:hover {
          background: #e5e7eb;
        }

        .admin-small-btn[disabled] {
          opacity: 0.5;
          cursor: default;
        }

        .admin-note {
          font-size: 0.75rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 18px 10px 30px;
          }

          .admin-title {
            font-size: 1.4rem;
          }

          .admin-table {
            font-size: 0.8rem;
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

function UsersSection({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, reputation, role, banned, needs_username_change, username_flag_reason, created_at, updated_at"
      )
      .order("reputation", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading users for admin:", error);
      setErrorMsg("Could not load users.");
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }

  async function updateProfileRow(id, patch) {
    setWorkingId(id);
    setErrorMsg("");

    const { error } = await supabase.from("profiles").update(patch).eq("id", id);

    if (error) {
      console.error("Error updating profile:", error);
      setErrorMsg("Update failed. Check console for details.");
    } else {
      await fetchUsers();
    }

    setWorkingId(null);
  }

  async function handleToggleBan(user) {
    const action = user.banned ? "unban" : "ban";
    const ok = window.confirm(
      `Are you sure you want to ${action} user "${user.username || user.id}"?`
    );
    if (!ok) return;

    await updateProfileRow(user.id, { banned: !user.banned });
  }

  async function handleToggleRole(user) {
    const isSelf = currentUser && user.id === currentUser.id;
    if (isSelf && user.role === "admin") {
      alert("You cannot demote your own admin account.");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";
    const ok = window.confirm(
      `Change role of "${user.username || user.id}" from ${user.role} to ${newRole}?`
    );
    if (!ok) return;

    await updateProfileRow(user.id, { role: newRole });
  }

  async function handleEditReputation(user) {
    const current = user.reputation ?? 0;
    const input = window.prompt(
      `Set new reputation for "${user.username || user.id}":`,
      String(current)
    );
    if (input === null) return;

    const parsed = parseInt(input, 10);
    if (Number.isNaN(parsed)) {
      alert("Please enter a valid integer.");
      return;
    }

    const newValue = Math.max(0, parsed);
    await updateProfileRow(user.id, { reputation: newValue });
  }

  async function handleResetReputation(user) {
    const ok = window.confirm(
      `Reset reputation of "${user.username || user.id}" to 0?`
    );
    if (!ok) return;

    await updateProfileRow(user.id, { reputation: 0 });
  }

  async function handleFlagUsername(user) {
    const reason =
      window.prompt(
        `Reason for flagging username "${user.username || user.id}"? (optional)`,
        user.username_flag_reason || ""
      ) || null;

    await updateProfileRow(user.id, {
      needs_username_change: true,
      username_flag_reason: reason,
    });
  }

  async function handleClearUsernameFlag(user) {
    await updateProfileRow(user.id, {
      needs_username_change: false,
      username_flag_reason: null,
    });
  }

  const filtered = rows.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const uname = (u.username || "").toLowerCase();
    const id = (u.id || "").toLowerCase();
    return uname.includes(q) || id.includes(q);
  });

  return (
    <div>
      <h2 className="admin-section-title">👥 Users</h2>
      <p className="admin-section-subtitle">
        Search users, adjust reputation, manage roles and apply soft bans.
      </p>

      <div className="admin-users-controls">
        <div className="admin-users-search">
          <input
            type="text"
            placeholder="Search by username or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="admin-users-refresh" onClick={fetchUsers}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <p className="admin-placeholder">Loading users…</p>
      ) : errorMsg ? (
        <p className="admin-placeholder">{errorMsg}</p>
      ) : filtered.length === 0 ? (
        <p className="admin-placeholder">No users match this search.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>User ID</th>
                <th>Reputation</th>
                <th>Role</th>
                <th>Status</th>
                <th>Username flag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = currentUser && u.id === currentUser.id;
                return (
                  <tr key={u.id}>
                    <td>{u.username || <em>(no username)</em>}</td>
                    <td style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {u.id}
                    </td>
                    <td>{u.reputation ?? 0} pts</td>
                    <td>
                      <span className="admin-tag admin-tag-role">
                        {u.role || "user"}
                      </span>
                      {isSelf && (
                        <span className="admin-note"> (you)</span>
                      )}
                    </td>
                    <td>
                      {u.banned ? (
                        <span className="admin-tag admin-tag-banned">
                          Banned
                        </span>
                      ) : (
                        <span className="admin-tag admin-tag-ok">
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      {u.needs_username_change ? (
                        <div>
                          <span className="admin-tag admin-tag-flagged">
                            Needs change
                          </span>
                          {u.username_flag_reason && (
                            <div className="admin-note">
                              {u.username_flag_reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="admin-tag admin-tag-ok">OK</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-small-btn"
                          disabled={workingId === u.id}
                          onClick={() => handleEditReputation(u)}
                        >
                          Edit rep
                        </button>
                        <button
                          className="admin-small-btn"
                          disabled={workingId === u.id}
                          onClick={() => handleResetReputation(u)}
                        >
                          Reset rep
                        </button>
                        <button
                          className="admin-small-btn"
                          disabled={workingId === u.id}
                          onClick={() => handleToggleRole(u)}
                        >
                          {u.role === "admin" ? "Make user" : "Make admin"}
                        </button>
                        <button
                          className="admin-small-btn"
                          disabled={workingId === u.id || isSelf}
                          onClick={() => handleToggleBan(u)}
                        >
                          {u.banned ? "Unban" : "Ban"}
                        </button>
                        {u.needs_username_change ? (
                          <button
                            className="admin-small-btn"
                            disabled={workingId === u.id}
                            onClick={() => handleClearUsernameFlag(u)}
                          >
                            Clear flag
                          </button>
                        ) : (
                          <button
                            className="admin-small-btn"
                            disabled={workingId === u.id}
                            onClick={() => handleFlagUsername(u)}
                          >
                            Flag username
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="admin-note" style={{ marginTop: "8px" }}>
            Showing up to 100 users ordered by reputation. Actions are applied
            directly to the <code>profiles</code> table.
          </p>
        </>
      )}
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
