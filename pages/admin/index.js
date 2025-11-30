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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.error("Error loading admin user:", error);

      if (!user) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setUser(user);

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

      {/* STYLES (unchanged) */}
      <style jsx>{`
        /* ... ALL YOUR ORIGINAL CSS REMAINS UNCHANGED ... */
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

/* ---------------- USERS SECTION (UPDATED WITH PAGINATION) ---------------- */

function UsersSection({ currentUser }) {
  const PAGE_SIZE = 20;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0); // 🔥 new pagination state
  const [isLastPage, setIsLastPage] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    setLoading(true);
    setErrorMsg("");

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, reputation, role, banned, needs_username_change, username_flag_reason, created_at, updated_at"
      )
      .order("reputation", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error loading users for admin:", error);
      setErrorMsg("Could not load users.");
      setRows([]);
    } else {
      setRows(data || []);
      setIsLastPage((data || []).length < PAGE_SIZE);
    }

    setLoading(false);
  }

  async function updateProfileRow(id, patch) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);

    if (error) {
      console.error("Error updating profile:", error);
      setErrorMsg("Update failed. Check console for details.");
    } else {
      fetchUsers();
    }
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

    await updateProfileRow(user.id, { reputation: Math.max(0, parsed) });
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
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.id || "").toLowerCase().includes(q)
    );
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
          {/* TABLE */}
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
                        {u.role}
                      </span>
                      {isSelf && (
                        <span className="admin-note"> (you)</span>
                      )}
                    </td>

                    <td>
                      {u.banned ? (
                        <span className="admin-tag admin-tag-banned">Banned</span>
                      ) : (
                        <span className="admin-tag admin-tag-ok">Active</span>
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
                          onClick={() => handleEditReputation(u)}
                        >
                          Edit rep
                        </button>

                        <button
                          className="admin-small-btn"
                          onClick={() => handleResetReputation(u)}
                        >
                          Reset rep
                        </button>

                        <button
                          className="admin-small-btn"
                          onClick={() => handleToggleRole(u)}
                          disabled={isSelf}
                        >
                          {u.role === "admin" ? "Make user" : "Make admin"}
                        </button>

                        <button
                          className="admin-small-btn"
                          disabled={isSelf}
                          onClick={() => handleToggleBan(u)}
                        >
                          {u.banned ? "Unban" : "Ban"}
                        </button>

                        {u.needs_username_change ? (
                          <button
                            className="admin-small-btn"
                            onClick={() => handleClearUsernameFlag(u)}
                          >
                            Clear flag
                          </button>
                        ) : (
                          <button
                            className="admin-small-btn"
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

          {/* PAGINATION BUTTONS */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              className="admin-users-refresh"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Previous
            </button>

            <button
              className="admin-users-refresh"
              disabled={isLastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>

          <p className="admin-note" style={{ marginTop: "8px" }}>
            Page {page + 1}
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
