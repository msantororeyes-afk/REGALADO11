import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import EditCommentModal from "../../components/EditCommentModal";
import CommentContent from "../../components/CommentContent";

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

  const [editingComment, setEditingComment] = useState(null);

  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [historyMap, setHistoryMap] = useState({});

  async function reloadComments(currentDealId = id) {
    if (!currentDealId) return;

    const { data: raw, error } = await supabase
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

    if (!raw || raw.length === 0) {
      setComments([]);
      return;
    }

    const userIds = [...new Set(raw.map((c) => c.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, reputation")
      .in("id", userIds);

    const pmap = {};
    for (const p of profiles) {
      pmap[p.id] = {
        username: p.username || "Anonymous",
        reputation: p.reputation ?? 0,
      };
    }

    setComments(
      raw.map((c) => ({
        ...c,
        username: pmap[c.user_id]?.username || "Anonymous",
        reputation: pmap[c.user_id]?.reputation ?? 0,
      }))
    );
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!id) return;

      const { data } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();

      setDeal(data);
      setLoading(false);

      await reloadComments(id);
    }

    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    async function loadVotes() {
      const { data: allVotes } = await supabase
        .from("votes")
        .select("user_id, vote_value")
        .eq("deal_id", id);

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

    loadVotes();
  }, [id, user]);

  const handleVote = async (value) => {
    if (!user) return alert("Please sign in to vote.");

    if (userVote === value) {
      await supabase
        .from("votes")
        .delete()
        .eq("deal_id", id)
        .eq("user_id", user.id);

      setUserVote(null);
      setVotes((prev) => prev - value);
    } else {
      await supabase.from("votes").upsert({
        deal_id: id,
        user_id: user.id,
        vote_value: value,
      });

      setVotes((prev) => prev + (value - (userVote || 0)));
      setUserVote(value);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);

    await supabase.from("comments").insert([
      {
        deal_id: id,
        user_id: user.id,
        content: newComment.trim(),
      },
    ]);

    setNewComment("");
    await reloadComments(id);
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;

    await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const toggleHistory = async (commentId) => {
    if (openHistoryId === commentId) {
      setOpenHistoryId(null);
      return;
    }

    if (historyMap[commentId]) {
      setOpenHistoryId(commentId);
      return;
    }

    const { data } = await supabase
      .from("comment_edits")
      .select("id, previous_content, edited_at")
      .eq("comment_id", commentId)
      .order("edited_at", { ascending: false });

    setHistoryMap((prev) => ({
      ...prev,
      [commentId]: data || [],
    }));

    setOpenHistoryId(commentId);
  };

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;

  if (!deal)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Deal not found 🧐
      </p>
    );

  const hasDiscount =
    deal.original_price && deal.original_price > deal.price;

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
          <p style={{ color: "#555" }}>{deal.description}</p>

          <div style={{ marginBottom: "15px" }}>
            {hasDiscount ? (
              <>
                <span style={{ textDecoration: "line-through", color: "#888" }}>
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

          <p>
            <strong>Category:</strong> {deal.category}
          </p>

          {deal.url && (
            <a
              href={`/api/redirect/${deal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#0070f3",
                color: "white",
                padding: "12px 20px",
                borderRadius: "8px",
                fontWeight: "600",
                marginTop: "15px",
              }}
            >
              🔗 Go to Store
            </a>
          )}

          <div style={{ marginTop: "25px" }}>
            <button
              onClick={() => handleVote(1)}
              style={{
                background: userVote === 1 ? "#0070f3" : "#eee",
                color: userVote === 1 ? "white" : "#333",
                marginRight: "10px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
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
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              👎
            </button>
          </div>

          {/* COMMENTS */}
          <div style={{ marginTop: "40px", textAlign: "left" }}>
            <h3>💬 Comments</h3>

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
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
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
                          }}
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
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )}

                    {/* ORIGINAL CONTENT (first edit) */}
                    {c.edited_at && c.original_content && (
                      <div
                        style={{
                          background: "#f0f0f0",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          textDecoration: "line-through",
                          color: "#888",
                          fontSize: "0.9rem",
                          marginBottom: "4px",
                        }}
                      >
                        <CommentContent text={c.original_content} />
                      </div>
                    )}

                    {/* CURRENT COMMENT (markdown-rendered) */}
                    <div style={{ margin: 0 }}>
                      <strong>
                        {c.username} ({c.reputation} pts):
                      </strong>
                      <CommentContent text={c.content} />
                    </div>

                    {/* TIMESTAMPS */}
                    <small style={{ color: "#666", display: "block" }}>
                      {new Date(c.created_at).toLocaleString()}
                      {c.edited_at && (
                        <span style={{ marginLeft: "6px" }}>
                          (edited at:{" "}
                          {new Date(c.edited_at).toLocaleString()})
                        </span>
                      )}
                    </small>

                    {/* HISTORY BUTTON */}
                    {c.edited_at && (
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
                        {openHistoryId === c.id
                          ? "Hide history"
                          : "📜 Show edit history"}
                      </button>
                    )}

                    {/* HISTORY PANEL */}
                    {c.edited_at &&
                      openHistoryId === c.id &&
                      (history.length > 0 ? (
                        <div
                          style={{
                            marginTop: "6px",
                            paddingTop: "6px",
                            borderTop: "1px dashed #ddd",
                          }}
                        >
                          {history.map((h) => (
                            <div key={h.id} style={{ marginBottom: "6px" }}>
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
                                <CommentContent
                                  text={h.previous_content}
                                />
                              </div>
                              <small style={{ color: "#777" }}>
                                {new Date(h.edited_at).toLocaleString()}
                              </small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <small style={{ color: "#777" }}>
                          No previous versions recorded.
                        </small>
                      ))}
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
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js +
          Supabase
        </p>
      </footer>

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
