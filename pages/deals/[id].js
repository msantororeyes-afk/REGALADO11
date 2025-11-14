import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header"; // unified header
import EditCommentModal from "../../components/EditCommentModal"; // ✏️ edit modal

export default function DealDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✏️ which comment is being edited (modal)
  const [editingComment, setEditingComment] = useState(null);

  // 📜 edit history state (per comment)
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [historyMap, setHistoryMap] = useState({}); // { [commentId]: [{ id, previous_content, edited_at }] }

  // -------- helper: reload comments with profiles + original_content + edited_at --------
  async function reloadComments(currentDealId = id) {
    if (!currentDealId) return;

    const { data: rawComments, error } = await supabase
      .from("comments")
      .select(
        "id, deal_id, user_id, content, original_content, created_at, edited_at"
      )
      .eq("deal_id", currentDealId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading comments:", error);
      return;
    }

    if (!rawComments || rawComments.length === 0) {
      setComments([]);
      return;
    }

    const userIds = [...new Set(rawComments.map((c) => c.user_id))];

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, reputation")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error loading comment profiles:", profilesError);
      setComments(rawComments);
      return;
    }

    const profileMap = {};
    for (const p of profilesData) {
      profileMap[p.id] = {
        username: p.username || "Anonymous",
        reputation: p.reputation ?? 0,
      };
    }

    const merged = rawComments.map((c) => ({
      ...c,
      username: profileMap[c.user_id]?.username || "Anonymous",
      reputation: profileMap[c.user_id]?.reputation ?? 0,
    }));

    setComments(merged);
  }

  // --------------- LOAD USER + DEAL ----------------
  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!id) return;

      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error(error);
      setDeal(data);
      setLoading(false);

      // once deal is known, load comments
      await reloadComments(id);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --------------- LOAD VOTES ----------------
  useEffect(() => {
    if (!id) return;

    async function fetchVotes() {
      const { data: allVotes, error } = await supabase
        .from("votes")
        .select("user_id, vote_value")
        .eq("deal_id", id);

      if (error) {
        console.error("Error loading votes:", error);
        return;
      }

      const total = (allVotes || []).reduce(
        (acc, v) => acc + v.vote_value,
        0
      );
      setVotes(total);

      if (user) {
        const existing = (allVotes || []).find((v) => v.user_id === user.id);
        setUserVote(existing ? existing.vote_value : null);
      }
    }

    fetchVotes();
  }, [id, user]);

  // --------------- VOTE HANDLER ----------------
  const handleVote = async (value) => {
    if (!user) return alert("Please sign in to vote.");
    if (!id || !user.id) return;

    try {
      if (userVote === value) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("deal_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setUserVote(null);
        setVotes((prev) => prev - value);
      } else {
        const { error } = await supabase.from("votes").upsert({
          deal_id: id,
          user_id: user.id,
          vote_value: value,
        });

        if (error) throw error;
        setVotes((prev) => prev + (value - (userVote || 0)));
        setUserVote(value);
      }
    } catch (err) {
      console.error("Voting error:", err.message);
    }
  };

  // --------------- ADD COMMENT ----------------
  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to comment.");
    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from("comments").insert([
        {
          deal_id: id,
          user_id: user.id,
          content: newComment.trim(),
          // original_content handled by DB trigger
        },
      ]);

      if (error) throw error;

      setNewComment("");

      // Reload comments (with profiles + original_content + edited_at)
      await reloadComments(id);
    } catch (err) {
      console.error("Error adding comment:", err.message);
    }

    setSubmitting(false);
  };

  // --------------- DELETE COMMENT ----------------
  const handleDeleteComment = async (commentId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id); // safety

      if (error) {
        console.error("Delete error:", error.message);
        return;
      }

      // Remove from local list
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Unexpected delete error:", err.message);
    }
  };

  // --------------- TOGGLE EDIT HISTORY (per comment) ----------------
  const toggleHistory = async (commentId) => {
    // close if already open
    if (openHistoryId === commentId) {
      setOpenHistoryId(null);
      return;
    }

    // if we already loaded this comment’s history, just open
    if (historyMap[commentId]) {
      setOpenHistoryId(commentId);
      return;
    }

    // otherwise fetch from comment_edits
    const { data, error } = await supabase
      .from("comment_edits")
      .select("id, previous_content, edited_at")
      .eq("comment_id", commentId)
      .order("edited_at", { ascending: false });

    if (error) {
      console.error("Error loading edit history:", error);
      return;
    }

    setHistoryMap((prev) => ({
      ...prev,
      [commentId]: data || [],
    }));
    setOpenHistoryId(commentId);
  };

  // ------------------- UI -------------------

  if (loading)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>
    );

  if (!deal)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Deal not found 🧐
      </p>
    );

  const hasDiscount = deal.original_price && deal.original_price > deal.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((deal.original_price - deal.price) / deal.original_price) * 100
      )
    : 0;

  return (
    <div className="deal-detail-page">
      <Header />

      <main
        className="container"
        style={{ maxWidth: "800px", margin: "40px auto" }}
      >
        <div
          className="form-card"
          style={{ padding: "30px", textAlign: "center" }}
        >
          {/* image */}
          {deal.image_url && (
            <img
              src={deal.image_url}
              alt={deal.title}
              style={{
                width: "100%",
                maxHeight: "350px",
                objectFit: "contain",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            />
          )}

          <h1>{deal.title}</h1>
          <p style={{ color: "#555", marginBottom: "15px" }}>
            {deal.description}
          </p>

          {/* prices */}
          <div className="price-section" style={{ marginBottom: "15px" }}>
            {hasDiscount ? (
              <>
                <span
                  style={{ textDecoration: "line-through", color: "#888" }}
                >
                  S/.{deal.original_price}
                </span>{" "}
                <span style={{ color: "#e63946", fontWeight: "bold" }}>
                  S/.{deal.price}
                </span>{" "}
                <span
                  style={{
                    background: "#e63946",
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  -{discountPercent}% OFF
                </span>
              </>
            ) : (
              <span style={{ color: "#e63946", fontWeight: "bold" }}>
                S/.{deal.price}
              </span>
            )}
          </div>

          {/* category */}
          <p>
            <strong>Category:</strong> {deal.category}
          </p>

          {/* Go to store */}
          {deal.url && (
            <a
              href={`/api/redirect/${deal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#0070f3",
                color: "white",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "1rem",
                marginTop: "15px",
              }}
            >
              🔗 Go to Store
            </a>
          )}

          {/* Votes */}
          <div style={{ marginTop: "25px" }}>
            <button
              onClick={() => handleVote(1)}
              style={{
                background: userVote === 1 ? "#0070f3" : "#eee",
                color: userVote === 1 ? "white" : "#333",
                marginRight: "10px",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              👍
            </button>
            <span style={{ fontWeight: "bold" }}>{votes}</span>
            <button
              onClick={() => handleVote(-1)}
              style={{
                background: userVote === -1 ? "#e63946" : "#eee",
                color: userVote === -1 ? "white" : "#333",
                marginLeft: "10px",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              👎
            </button>
          </div>

          {/* COMMENTS */}
          <div style={{ marginTop: "40px", textAlign: "left" }}>
            <h3>💬 Comments</h3>

            {/* COMMENT FORM */}
            {user ? (
              <form onSubmit={handleComment} style={{ marginBottom: "20px" }}>
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    marginBottom: "10px",
                  }}
                ></textarea>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "#0070f3",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </form>
            ) : (
              <p>Please log in to comment.</p>
            )}

            {/* COMMENTS LIST */}
            {comments.length > 0 ? (
              comments.map((c) => {
                const hasEdited = !!c.edited_at;
                const editedDate = hasEdited
                  ? new Date(c.edited_at).toLocaleString()
                  : null;
                const createdDate = new Date(c.created_at).toLocaleString();

                const history = historyMap[c.id] || [];

                return (
                  <div
                    key={c.id}
                    style={{
                      background: "#f9f9f9",
                      padding: "10px",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      position: "relative",
                    }}
                  >
                    {/* EDIT & DELETE BUTTONS (ONLY OWNER) */}
                    {user && c.user_id === user.id && (
                      <>
                        <button
                          onClick={() => setEditingComment(c)}
                          style={{
                            position: "absolute",
                            right: "40px",
                            top: "10px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#0070f3",
                            fontSize: "0.9rem",
                          }}
                          title="Edit comment"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "10px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#e63946",
                            fontSize: "0.9rem",
                          }}
                          title="Delete comment"
                        >
                          🗑️
                        </button>
                      </>
                    )}

                    {/* Original comment (first version, struck-through) */}
                    {hasEdited && c.original_content && (
                      <p
                        style={{
                          margin: 0,
                          background: "#f0f0f0",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          textDecoration: "line-through",
                          color: "#888",
                          fontSize: "0.9rem",
                          marginBottom: "4px",
                        }}
                      >
                        {c.original_content}
                      </p>
                    )}

                    {/* Current comment */}
                    <p style={{ margin: 0 }}>
                      <strong>
                        {c.username} ({c.reputation} pts):
                      </strong>{" "}
                      {c.content}
                    </p>

                    {/* timestamps + history button */}
                    <small style={{ color: "#666", display: "block" }}>
                      {createdDate}
                      {hasEdited && (
                        <span style={{ marginLeft: "6px" }}>
                          (edited at: {editedDate})
                        </span>
                      )}
                    </small>

                    {/* 📜 Edit history toggle (only if edited at least once) */}
                    {hasEdited && (
                      <button
                        type="button"
                        onClick={() => toggleHistory(c.id)}
                        style={{
                          marginTop: "4px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          color: "#0070f3",
                          padding: 0,
                        }}
                      >
                        {openHistoryId === c.id ? "Hide history" : "📜 Show edit history"}
                      </button>
                    )}

                    {/* Edit history panel */}
                    {hasEdited && openHistoryId === c.id && (
                      <div
                        style={{
                          marginTop: "6px",
                          paddingTop: "6px",
                          borderTop: "1px dashed #ddd",
                        }}
                      >
                        {history.length === 0 ? (
                          <small style={{ color: "#777" }}>
                            No previous versions recorded.
                          </small>
                        ) : (
                          history.map((h) => (
                            <div
                              key={h.id}
                              style={{
                                marginBottom: "6px",
                              }}
                            >
                              <div
                                style={{
                                  textDecoration: "line-through",
                                  color: "#888",
                                  fontSize: "0.85rem",
                                  background: "#f2f2f2",
                                  padding: "4px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {h.previous_content}
                              </div>
                              <small style={{ color: "#777" }}>
                                {new Date(h.edited_at).toLocaleString()}
                              </small>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p>No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using
          Next.js + Supabase
        </p>
      </footer>

      {/* ✏️ Edit Comment Modal */}
      {editingComment && (
        <EditCommentModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onUpdated={() => reloadComments(id)}
        />
      )}
    </div>
  );
}
