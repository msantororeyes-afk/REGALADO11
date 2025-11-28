// /components/Leaderboard.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Leaderboard() {
  const [activeRange, setActiveRange] = useState("daily"); // "daily" | "weekly" | "monthly"
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setErrorMsg("");

      let tableName = "leaderboard_daily";
      if (activeRange === "weekly") tableName = "leaderboard_weekly";
      if (activeRange === "monthly") tableName = "leaderboard_monthly";

      const { data, error } = await supabase
        .from(tableName)
        .select("user_id, username, points")
        .order("points", { ascending: false })
        .limit(10);

      if (error) {
        console.error("❌ Error fetching leaderboard:", error);
        setErrorMsg("Could not load leaderboard.");
        setEntries([]);
      } else {
        setEntries(data || []);
      }

      setLoading(false);
    }

    fetchLeaderboard();
  }, [activeRange]);

  return (
    <div className="leaderboard-card">
      <h3 className="leaderboard-title">🏆 Top Savers</h3>

      <div className="leaderboard-tabs">
        <button
          className={activeRange === "daily" ? "active" : ""}
          onClick={() => setActiveRange("daily")}
        >
          Today
        </button>
        <button
          className={activeRange === "weekly" ? "active" : ""}
          onClick={() => setActiveRange("weekly")}
        >
          This week
        </button>
        <button
          className={activeRange === "monthly" ? "active" : ""}
          onClick={() => setActiveRange("monthly")}
        >
          This month
        </button>
      </div>

      {loading ? (
        <p className="leaderboard-hint">Loading...</p>
      ) : errorMsg ? (
        <p className="leaderboard-hint">{errorMsg}</p>
      ) : entries.length === 0 ? (
        <p className="leaderboard-hint">
          No data yet. Be the first to earn reputation!
        </p>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((row, index) => (
            <li key={row.user_id || index}>
              <span className="leaderboard-rank">{index + 1}</span>
              <span className="leaderboard-name">
                {row.username || "user"}
              </span>
              <span className="leaderboard-points">{row.points} pts</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

