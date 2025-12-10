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

      <style jsx>{`
        .admin-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 20px 24px 40px;
        }

        .admin-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #111;
          text-align: left;
        }

        .admin-subtitle {
          font-size: 1rem;
          color: #555;
          margin-bottom: 24px;
        }

        .admin-warning {
          background: #fff6d1;
          border: 1px solid #f2d57c;
          padding: 12px 18px;
          border-radius: 10px;
          color: #8a6d1f;
          font-weight: 500;
          margin-bottom: 24px;
        }

        .admin-tabs {
          display: flex;
          gap: 14px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .admin-tab-button {
          padding: 10px 18px;
          border-radius: 8px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          font-weight: 600;
          transition: 0.2s;
        }

        .admin-tab-button:hover {
          background: #e5e7eb;
        }

        .admin-tab-button-active {
          background: #0070f3;
          color: white;
          border-color: #0070f3;
        }

        .admin-content {
          background: #ffffff;
          padding: 24px;
          border-radius: 14px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .admin-section-title {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #111;
        }

        .admin-section-subtitle {
          font-size: 0.95rem;
          color: #555;
          margin-bottom: 20px;
        }

        .admin-users-controls {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .admin-users-search input {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          width: 240px;
        }

        .admin-users-refresh {
          background: #0070f3;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        .admin-table th {
          text-align: left;
          padding: 10px;
          font-size: 0.9rem;
          color: #444;
          border-bottom: 1px solid #e5e7eb;
        }

        .admin-table td {
          padding: 10px;
          border-bottom: 1px solid #f3f4f6;
          color: #333;
          vertical-align: top;
        }

        .admin-tag {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .admin-tag-ok {
          background: #e6f4ff;
          color: #0070f3;
        }

        .admin-tag-banned {
          background: #ffe5e5;
          color: #d60000;
        }

        .admin-tag-flagged {
          background: #fff1d6;
          color: #8a5a00;
        }

        .admin-small-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-right: 4px;
        }

        .admin-small-btn:hover {
          background: #e5e7eb;
        }

        .admin-no-access {
          background: #fff;
          padding: 24px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          text-align: center;
          max-width: 500px;
          margin: 40px auto;
        }

        .admin-no-access button {
          margin-top: 10px;
          padding: 8px 16px;
          border-radius: 8px;
          background: #0070f3;
          color: #fff;
          font-weight: 600;
        }

        .admin-note {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .admin-placeholder {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .admin-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 16px 12px 32px;
          }

          .admin-content {
            padding: 18px;
          }

          .admin-table th,
          .admin-table td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------- DASHBOARD SECTION (LIVE DATA) ---------------- */

function DashboardSection() {
  const [totalUsers, setTotalUsers] = useState(null);
  const [dealsLast24h, setDealsLast24h] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState(null);
  const [repEventsToday, setRepEventsToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setErr("");

      try {
        // Total users from profiles
        const { count: usersCount, error: usersError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        if (usersError) throw usersError;
        setTotalUsers(usersCount ?? 0);

        // Deals created in last 24h
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const {
          count: deals24hCount,
          error: dealsError,
        } = await supabase
          .from("deals")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since);

        if (dealsError) throw dealsError;
        setDealsLast24h(deals24hCount ?? 0);

        // Pending alerts: from both queues
        let pending = 0;

        try {
          const { count: immediateCount } = await supabase
            .from("deal_alert_queue")
            .select("*", { count: "exact", head: true })
            .eq("processed", false);
          pending += immediateCount ?? 0;
        } catch (e) {
          console.warn("deal_alert_queue count error:", e);
        }

        try {
          const { count: digestCount } = await supabase
            .from("email_digest_queue")
            .select("*", { count: "exact", head: true })
            .eq("processed", false);
          pending += digestCount ?? 0;
        } catch (e) {
          console.warn("email_digest_queue count error:", e);
        }

        setPendingAlerts(pending);

        // Reputation events today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const {
          count: repCount,
          error: repError,
        } = await supabase
          .from("reputation_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfDay.toISOString());

        if (repError) throw repError;
        setRepEventsToday(repCount ?? 0);
      } catch (e) {
        console.error("Error loading dashboard stats:", e);
        setErr("Could not load some dashboard stats. Check console.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div>
      <h2 className="admin-section-title">📊 Overview</h2>
      <p className="admin-section-subtitle">
        Live snapshot of REGALADO&apos;s current activity (profiles, deals,
        alerts and reputation events).
      </p>

      {loading ? (
        <p className="admin-placeholder">Loading dashboard stats…</p>
      ) : (
        <>
          {err && <p className="admin-placeholder">{err}</p>}

          <div className="admin-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-label">Total users</div>
              <div className="admin-stat-value">{totalUsers ?? "—"}</div>
              <div className="admin-placeholder">
                Count from <code>profiles</code>.
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Deals (last 24h)</div>
              <div className="admin-stat-value">{dealsLast24h ?? "—"}</div>
              <div className="admin-placeholder">
                Using <code>deals.created_at</code> &gt;= now - 24h.
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Pending alerts</div>
              <div className="admin-stat-value">{pendingAlerts ?? "—"}</div>
              <div className="admin-placeholder">
                From <code>deal_alert_queue</code> &{" "}
                <code>email_digest_queue</code>.
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Reputation events (today)</div>
              <div className="admin-stat-value">{repEventsToday ?? "—"}</div>
              <div className="admin-placeholder">
                From <code>reputation_events</code> since midnight.
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .admin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .admin-stat-card {
          background: #fff;
          padding: 18px;
          border-radius: 14px;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.045);
        }

        .admin-stat-label {
          font-size: 0.95rem;
          color: #555;
          margin-bottom: 6px;
        }

        .admin-stat-value {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .admin-placeholder {
          color: #777;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}

/* ---------------- USERS SECTION (UNCHANGED TOOLS + FIXED NaN) ---------------- */

function UsersSection({ currentUser }) {
  const PAGE_SIZE = 20;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                      {isSelf && <span className="admin-note"> (you)</span>}
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

/* ---------------- DEALS SECTION (LIVE READ + EDIT / FLAG / DELETE) ---------------- */

function DealsSection() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  useEffect(() => {
    fetchDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder]);

  async function fetchDeals() {
    setLoading(true);
    setErrorMsg("");

    try {
      // Base deals (no order here; we'll apply COALESCE logic client-side)
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select("*")
        .limit(200);

      if (dealsError) throw dealsError;

      const baseDeals = dealsData || [];
      const dealIds = baseDeals.map((d) => d.id);

      // Votes
      let scoreMap = {};
      try {
        const { data: voteData } = await supabase
          .from("votes")
          .select("deal_id, vote_value")
          .in("deal_id", dealIds);

        (voteData || []).forEach((v) => {
          scoreMap[v.deal_id] = (scoreMap[v.deal_id] || 0) + v.vote_value;
        });
      } catch (e) {
        console.warn("Error loading votes for deals:", e);
      }

      // Comments count
      let commentsMap = {};
      try {
        const { data: commentData } = await supabase
          .from("comments")
          .select("deal_id")
          .in("deal_id", dealIds);

        (commentData || []).forEach((c) => {
          commentsMap[c.deal_id] = (commentsMap[c.deal_id] || 0) + 1;
        });
      } catch (e) {
        console.warn("Error loading comments for deals:", e);
      }

      let withMeta = baseDeals.map((d) => ({
        ...d,
        score: scoreMap[d.id] || 0,
        comments_count: commentsMap[d.id] || 0,
      }));

      // Sort using COALESCE(submitted_at, created_at)
      withMeta.sort((a, b) => {
        const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
        const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
        if (sortOrder === "newest") {
          return dateB - dateA; // newest first
        } else {
          return dateA - dateB; // oldest first
        }
      });

      setDeals(withMeta);
    } catch (e) {
      console.error("Error loading deals for admin:", e);
      setErrorMsg("Could not load deals.");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditDeal(deal) {
    const newTitle =
      window.prompt("New title:", deal.title || "") ?? deal.title;
    const newCategory =
      window.prompt("New category:", deal.category || "") ?? deal.category;

    if (newTitle === deal.title && newCategory === deal.category) {
      return;
    }

    const patch = {};
    if (newTitle && newTitle.trim()) patch.title = newTitle.trim();
    if (newCategory && newCategory.trim())
      patch.category = newCategory.trim();

    if (Object.keys(patch).length === 0) return;

    const ok = window.confirm("Save these changes to the deal?");
    if (!ok) return;

    const { error } = await supabase
      .from("deals")
      .update(patch)
      .eq("id", deal.id);

    if (error) {
      console.error("Error updating deal:", error);
      alert("Error updating deal. Check console.");
    } else {
      fetchDeals();
    }
  }

  // Admin-only flagging to separate `deal_flags` table
  async function handleFlagDeal(deal, flagType) {
    const defaultReason =
      flagType === "sold_out"
        ? "Deal is sold out / expired"
        : "Inappropriate / spam / other";

    const reason =
      window.prompt(
        `Reason for flagging this deal as "${flagType.replace(
          "_",
          " "
        )}"? (optional)`,
        defaultReason
      ) || defaultReason;

    const { error } = await supabase.from("deal_flags").insert({
      deal_id: deal.id,
      flag_type: flagType,
      reason,
    });

    if (error) {
      console.error("Error flagging deal:", error);
      alert("Error flagging deal. Check console.");
    } else {
      alert("Deal flagged for review.");
    }
  }

  // Admin delete deal
  async function handleDeleteDeal(deal) {
    const ok = window.confirm(
      `Delete deal "${deal.title || deal.id}"? This cannot be undone.`
    );
    if (!ok) return;

    const { error } = await supabase.from("deals").delete().eq("id", deal.id);

    if (error) {
      console.error("Error deleting deal:", error);
      alert("Error deleting deal. Check console.");
    } else {
      setDeals((prev) => prev.filter((d) => d.id !== deal.id));
    }
  }

  const filteredDeals = deals.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (d.title || "").toLowerCase().includes(q) ||
      (d.description || "").toLowerCase().includes(q) ||
      (d.store || "").toLowerCase().includes(q) ||
      (d.category || "").toLowerCase().includes(q) ||
      String(d.id).includes(q)
    );
  });

  return (
    <div>
      <h2 className="admin-section-title">💸 Deals</h2>
      <p className="admin-section-subtitle">
        Internal view of submitted deals with score, comments, quick fixes,
        flagging and admin deletion.
      </p>

      <div className="admin-users-controls">
        <div className="admin-users-search">
          <input
            type="text"
            placeholder="Search by title, store, category or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="admin-note">Sort:</span>
          <button
            className="admin-small-btn"
            onClick={() => setSortOrder("newest")}
            disabled={sortOrder === "newest"}
          >
            Newest
          </button>
          <button
            className="admin-small-btn"
            onClick={() => setSortOrder("oldest")}
            disabled={sortOrder === "oldest"}
          >
            Oldest
          </button>

          <button
            className="admin-users-refresh"
            style={{ marginLeft: 8 }}
            onClick={fetchDeals}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="admin-placeholder">Loading deals…</p>
      ) : errorMsg ? (
        <p className="admin-placeholder">{errorMsg}</p>
      ) : filteredDeals.length === 0 ? (
        <p className="admin-placeholder">No deals match this search.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title & store</th>
              <th>Category</th>
              <th>Price</th>
              <th>Score</th>
              <th>Comments</th>
              <th>Submitted</th>
              <th>Tools</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map((d) => (
              <tr key={d.id}>
                <td style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {d.id}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{d.title}</div>
                  <div className="admin-note">
                    {d.store || d.coupon || "—"}
                  </div>
                </td>
                <td>{d.category || "—"}</td>
                <td>
                  {d.price != null ? (
                    <>
                      S/.{d.price}{" "}
                      {d.original_price ? (
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#9ca3af",
                            marginLeft: 4,
                          }}
                        >
                          S/.{d.original_price}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{d.score}</td>
                <td>{d.comments_count}</td>
                <td>
                  {d.submitted_at
                    ? new Date(d.submitted_at).toLocaleString()
                    : d.created_at
                    ? new Date(d.created_at).toLocaleString()
                    : "—"}
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="admin-small-btn"
                      onClick={() => handleEditDeal(d)}
                    >
                      Fix title/category
                    </button>

                    <button
                      className="admin-small-btn"
                      onClick={() => handleFlagDeal(d, "sold_out")}
                    >
                      Flag sold out
                    </button>

                    <button
                      className="admin-small-btn"
                      onClick={() => handleFlagDeal(d, "inappropriate")}
                    >
                      Flag inappropriate
                    </button>

                    {d.url && (
                      <a
                        href={`/api/redirect/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-small-btn"
                        style={{
                          display: "inline-block",
                          textDecoration: "none",
                          textAlign: "center",
                        }}
                      >
                        Open link
                      </a>
                    )}

                    <button
                      className="admin-small-btn"
                      onClick={() => handleDeleteDeal(d)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- ALERTS SECTION (LIVE QUEUES VIEW) ---------------- */

function AlertsSection() {
  const [immediateQueue, setImmediateQueue] = useState([]);
  const [digestQueue, setDigestQueue] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ fixed typo
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchQueues();
  }, []);

  async function fetchQueues() {
    setLoading(true);
    setErrorMsg("");

    try {
      // Immediate alerts
      let immediate = [];
      try {
        const { data, error } = await supabase
          .from("deal_alert_queue")
          .select("*")
          .eq("processed", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        immediate = data || [];
      } catch (e) {
        console.warn("Error loading deal_alert_queue:", e);
      }

      // Digest alerts
      let digest = [];
      try {
        const { data, error } = await supabase
          .from("email_digest_queue")
          .select("*")
          .eq("processed", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        digest = data || [];
      } catch (e) {
        console.warn("Error loading email_digest_queue:", e);
      }

      setImmediateQueue(immediate);
      setDigestQueue(digest);
    } catch (e) {
      console.error("Error loading queues:", e);
      setErrorMsg("Could not load alert queues.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="admin-section-title">🔔 Alerts & Emails</h2>
      <p className="admin-section-subtitle">
        Monitor pending immediate alerts and daily digests (from Supabase
        queues).
      </p>

      <div className="admin-users-controls">
        <div />
        <button className="admin-users-refresh" onClick={fetchQueues}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <p className="admin-placeholder">Loading alerts…</p>
      ) : errorMsg ? (
        <p className="admin-placeholder">{errorMsg}</p>
      ) : (
        <>
          <h3 style={{ marginBottom: 6 }}>Immediate alerts queue</h3>
          {immediateQueue.length === 0 ? (
            <p className="admin-placeholder">
              No pending items in <code>deal_alert_queue</code>.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Deal</th>
                  <th>Created at</th>
                </tr>
              </thead>
              <tbody>
                {immediateQueue.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td className="admin-note">{q.user_id || "—"}</td>
                    <td className="admin-note">{q.deal_id || "—"}</td>
                    <td>
                      {q.created_at
                        ? new Date(q.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 style={{ marginTop: 24, marginBottom: 6 }}>
            Digest alerts queue
          </h3>
          {digestQueue.length === 0 ? (
            <p className="admin-placeholder">
              No pending items in <code>email_digest_queue</code>.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Deal</th>
                  <th>Immediate?</th>
                  <th>Created at</th>
                </tr>
              </thead>
              <tbody>
                {digestQueue.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td className="admin-note">{q.user_id || "—"}</td>
                    <td className="admin-note">{q.deal_id || "—"}</td>
                    <td>{q.immediate ? "Yes" : "No"}</td>
                    <td>
                      {q.created_at
                        ? new Date(q.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- LEADERBOARD SECTION (HOMEPAGE LOGIC MIRRORED) ---------------- */

function LeaderboardSection() {
  const [period, setPeriod] = useState("daily"); // "daily" | "weekly" | "monthly"
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setErrorMsg("");

      // Same table selection logic as /components/Leaderboard.js
      let tableName = "leaderboard_daily";
      if (period === "weekly") tableName = "leaderboard_weekly";
      if (period === "monthly") tableName = "leaderboard_monthly";

      const { data, error } = await supabase
        .from(tableName)
        .select("user_id, username, points")
        .order("points", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching admin leaderboard:", error);
        setErrorMsg("Could not load leaderboard.");
        setRows([]);
      } else {
        setRows(data || []);
      }

      setLoading(false);
    }

    fetchLeaderboard();
  }, [period]);

  return (
    <div>
      <h2 className="admin-section-title">🏆 Leaderboard</h2>
      <p className="admin-section-subtitle">
        Internal view of daily, weekly and monthly leaderboard tables (same data
        as homepage widget).
      </p>

      <div className="leaderboard-tabs" style={{ marginBottom: 16 }}>
        <button
          className={
            "leaderboard-tab-btn" + (period === "daily" ? " active" : "")
          }
          onClick={() => setPeriod("daily")}
        >
          Today
        </button>
        <button
          className={
            "leaderboard-tab-btn" + (period === "weekly" ? " active" : "")
          }
          onClick={() => setPeriod("weekly")}
        >
          This week
        </button>
        <button
          className={
            "leaderboard-tab-btn" + (period === "monthly" ? " active" : "")
          }
          onClick={() => setPeriod("monthly")}
        >
          This month
        </button>
      </div>

      {loading ? (
        <p className="admin-placeholder">Loading leaderboard…</p>
      ) : errorMsg ? (
        <p className="admin-placeholder">{errorMsg}</p>
      ) : rows.length === 0 ? (
        <p className="admin-placeholder">
          No leaderboard data yet. Earn reputation by sharing great deals!
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>User</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.user_id || idx}>
                <td>{idx + 1}</td>
                <td>{r.username || "user"}</td>
                <td>{r.points} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .leaderboard-tab-btn {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          margin-right: 6px;
        }

        .leaderboard-tab-btn.active {
          background: #0070f3;
          color: #ffffff;
          border-color: #0070f3;
        }
      `}</style>
    </div>
  );
}

