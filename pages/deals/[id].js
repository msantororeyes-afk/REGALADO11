import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import EditCommentModal from "../../components/EditCommentModal";
import CommentContent from "../../components/CommentContent";
import {
  getCommentReactions,
  toggleReaction,
} from "../../lib/commentReactions";

// Current emoji set
const REACTION_EMOJIS = ["😍", "😂", "🔥"];

const HOT_SCORE_THRESHOLD = 11;

function getReputationBadge(reputation = 0) {
  if (reputation >= 1000) return "Platinum";
  if (reputation >= 500) return "Gold";
  if (reputation >= 250) return "Silver";
  if (reputation >= 50) return "Bronze";
  return null;
}

function getReputationBadgeIcon(label) {
  if (label === "Bronze") return "🥉";
  if (label === "Silver") return "🥈";
  if (label === "Gold") return "🥇";
  if (label === "Platinum") return "🌟";
  return "⭐";
}

function getHotDealBadge(hotDealsCount = 0) {
  if (hotDealsCount >= 100) return "Leyenda del regalado";
  if (hotDealsCount >= 50) return "Seño del ahorro";
  if (hotDealsCount >= 15) return "Caserito VIP";
  if (hotDealsCount >= 5) return "Regatero experimentado";
  if (hotDealsCount >= 1) return "Novato del ahorro";
  return null;
}

function getHotDealBadgeIcon(label) {
  if (label === "Novato del ahorro") return "🏷️";
  if (label === "Regatero experimentado") return "🛒";
  if (label === "Caserito VIP") return "🛍️";
  if (label === "Seño del ahorro") return "📣";
  if (label === "Leyenda del regalado") return "🏆";
  return "🔥";
}

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

  // Reactions state
  const [reactionsByComment, setReactionsByComment] = useState({});

  // 🆕 NEW — reply threading
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  // 🆕 FLAG SYSTEM (added)
  const [showFlagMenu, setShowFlagMenu] = useState(false);
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  async function reloadComments(currentDealId = id) {
    if (!currentDealId) return;

    const { data: raw, error } = await supabase
      .from("comments")
      .select(
        "id, deal_id, user_id, content, original_content, created_at, edited_at, parent_id"
      )
      .eq("deal_id", currentDealId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
      return;
    }

    if (!raw || raw.length === 0) {
      setComments([]);
      setReactionsByComment({});
      return;
    }

    const userIds = [
      ...new Set(
        raw
          .map((c) => c.user_id)
          .filter((uid) => !!uid)
      ),
    ];

    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, reputation")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error loading profiles for comments:", profilesError);
      } else {
        profiles = profilesData || [];
      }
    }

    const pmap = {};
    profiles.forEach((p) => {
      pmap[p.id] = {
        username: p.username || "Anonymous",
        reputation: p.reputation ?? 0,
      };
    });

    // hot deal counts per user (score ≥ 11)
    const hotCountsByUser = {};
    if (userIds.length > 0) {
      const { data: dealsByUser, error: dealsError } = await supabase
        .from("deals")
        .select("user_id, score")
        .in("user_id", userIds);

      if (dealsError) {
        console.error("Error loading user deals for hot badges:", dealsError);
      } else if (dealsByUser) {
        dealsByUser.forEach((d) => {
          const uid = d.user_id;
          if (!uid) return;
          const score = d.score || 0;
          if (score >= HOT_SCORE_THRESHOLD) {
            hotCountsByUser[uid] = (hotCountsByUser[uid] || 0) + 1;
          }
        });
      }
    }

    const merged = raw.map((c) => {
      const profileData = pmap[c.user_id] || {};
      const reputation = profileData.reputation ?? 0;
      const hotCount = hotCountsByUser[c.user_id] || 0;
      const reputationBadge = getReputationBadge(reputation);
      const hotDealBadge = getHotDealBadge(hotCount);

      return {
        ...c,
        username: profileData.username || "Anonymous",
        reputation,
        hot_deals_count: hotCount,
        reputation_badge: reputationBadge,
        hot_deal_badge: hotDealBadge,
      };
    });

    // 🆕 Build threaded structure
    const roots = merged.filter((c) => !c.parent_id);
    const replies = merged.filter((c) => c.parent_id);

    const replyMap = {};
    replies.forEach((r) => {
      if (!replyMap[r.parent_id]) replyMap[r.parent_id] = [];
      replyMap[r.parent_id].push(r);
    });

    const threaded = roots.map((root) => ({
      ...root,
      replies: replyMap[root.id] || [],
    }));

    setComments(threaded);

    // Load reactions
    try {
      const allIds = merged.map((x) => x.id);
      const reactionMap = await getCommentReactions(allIds);
      setReactionsByComment(reactionMap);
    } catch (err) {
      console.error("Error loading reactions:", err);
    }
  }

  useEffect(() => {
    async function load() {
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

      if (error) {
        console.error("Error loading deal:", error);
        setLoading(false);
        return;
      }

      // Load owner profile + hot deal count
      let ownerUsername = data.posted_by || "user";
      let ownerReputation = 0;
      let ownerHotDealsCount = 0;

      if (data.user_id) {
        const { data: ownerProfile, error: ownerError } = await supabase
          .from("profiles")
          .select("username, reputation")
          .eq("id", data.user_id)
          .single();

        if (!ownerError && ownerProfile) {
          ownerUsername = ownerProfile.username || ownerUsername;
          ownerReputation = ownerProfile.reputation ?? 0;
        }

        const { data: ownerDeals, error: ownerDealsError } = await supabase
          .from("deals")
          .select("score")
          .eq("user_id", data.user_id);

        if (!ownerDealsError && ownerDeals) {
          ownerDeals.forEach((d) => {
            const s = d.score || 0;
            if (s >= HOT_SCORE_THRESHOLD) {
              ownerHotDealsCount += 1;
            }
          });
        }
      }

      const ownerReputationBadge = getReputationBadge(ownerReputation);
      const ownerHotDealBadge = getHotDealBadge(ownerHotDealsCount);

      setDeal({
        ...data,
        owner_username: ownerUsername,
        owner_reputation: ownerReputation,
        owner_hot_deals_count: ownerHotDealsCount,
        owner_reputation_badge: ownerReputationBadge,
        owner_hot_deal_badge: ownerHotDealBadge,
      });

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
        const existing = (allVotes || []).find(
          (v) => v.user_id === user.id
        );
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

  // 🆕 FLAG SYSTEM (added)
  const handleFlagDeal = async (reason) => {
    if (!user) return alert("Please sign in to flag a deal.");

    setFlagSubmitting(true);

    const { error } = await supabase.from("deal_flags").insert([
      {
        deal_id: id,
        user_id: user.id,

        // ✅ ONLY CHANGE TO FIX THE ERROR:
        flag_type: reason,
      },
    ]);

    setFlagSubmitting(false);
    setShowFlagMenu(false);

    if (error) {
      console.error("Error submitting flag:", error);
      return alert("Error submitting flag. Please try again.");
    }

    alert("Thanks — the deal has been flagged for review.");
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
        parent_id: null,
      },
    ]);

    setNewComment("");
    await reloadComments(id);
    setSubmitting(false);
  };

  // 🆕 Post a reply
  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim()) return;

    await supabase.from("comments").insert([
      {
        deal_id: id,
        user_id: user.id,
        content: replyText.trim(),
        parent_id: parentId,
      },
    ]);

    setReplyText("");
    setReplyTo(null);
    await reloadComments(id);
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;

    await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    await reloadComments(id);
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

  const handleReactionClick = async (commentId, emoji) => {
    if (!user) {
      alert("Please log in to react.");
      return;
    }

    const result = await toggleReaction(commentId, emoji, user.id);

    if (result.error) return;

    setReactionsByComment((prev) => {
      const currentForComment = prev[commentId] || {};
      const currentCount = currentForComment[emoji] || 0;

      let newCount = currentCount;
      if (result.added) newCount = currentCount + 1;
      if (result.removed) newCount = Math.max(0, currentCount - 1);

      return {
        ...prev,
        [commentId]: {
          ...currentForComment,
          [emoji]: newCount,
        },
      };
    });
  };

  if (loading)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Loading...
      </p>
    );

  if (!deal)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Deal not found 🧐
      </p>
    );

    const isSoldOut = !!deal.sold_out;

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

          {isSoldOut && (
            <div
              style={{
                margin: "12px auto 0",
                padding: "8px 14px",
                background: "#fdecea",
                color: "#b42318",
                border: "1px solid #f5c2c7",
                borderRadius: "10px",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              🚫 SOLD OUT
            </div>
          )}

          <p style={{ color: "#555" }}>{deal.description}</p>

          <div style={{ marginBottom: "15px" }}>
            {hasDiscount ? (
              <>
                <span
                  style={{ textDecoration: "line-through", color: "#888" }}
                >
                  S/.{deal.original_price}
                </span>{" "}
                <span
                  style={{ color: "#e63946", fontWeight: "bold" }}
                >
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
              <span
                style={{ color: "#e63946", fontWeight: "bold" }}
              >
                S/.{deal.price}
              </span>
            )}
          </div>

          <p>
            <strong>Category:</strong> {deal.category}
          </p>

          {/* 🧑‍💻 Found by + badges */}
          <p
            style={{
              marginTop: "10px",
              color: "#555",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            Found by <strong>{deal.owner_username}</strong>
            {deal.owner_reputation_badge && (
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 6px",
                  borderRadius: "999px",
                  background: "#f3f0ff",
                  color: "#4b3f72",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
                title={`Reputation: ${deal.owner_reputation_badge}`}
              >
                <span>
                  {getReputationBadgeIcon(deal.owner_reputation_badge)}
                </span>
                <span>{deal.owner_reputation_badge}</span>
              </span>
            )}
            {deal.owner_hot_deal_badge && (
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 6px",
                  borderRadius: "999px",
                  background: "#fff4e6",
                  color: "#8b4513",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
                title={`Hot deals badge: ${deal.owner_hot_deal_badge}`}
              >
                <span>
                  {getHotDealBadgeIcon(deal.owner_hot_deal_badge)}
                </span>
                <span>{deal.owner_hot_deal_badge}</span>
              </span>
            )}
          </p>

          {deal.url && !isSoldOut && (
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
              onClick={() => !isSoldOut && handleVote(1)}
              style={{
                background: userVote === 1 ? "#0070f3" : "#eee",
                color: userVote === 1 ? "white" : "#333",
                marginRight: "10px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                cursor: isSoldOut ? "not-allowed" : "pointer",
              }}
            >
              👍
            </button>

            <span style={{ fontWeight: "bold" }}>{votes}</span>

            <button
              onClick={() => !isSoldOut && handleVote(-1)}
              style={{
                background: userVote === -1 ? "#e63946" : "#eee",
                color: userVote === -1 ? "white" : "#333",
                marginLeft: "10px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                cursor: isSoldOut ? "not-allowed" : "pointer",
              }}
            >
              👎
            </button>

            {/* 🆕 FLAG SYSTEM (added) */}
            {user && (
              <div style={{ display: "inline-block", position: "relative", marginLeft: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowFlagMenu((v) => !v)}
                  style={{
                    background: "#eee",
                    color: "#333",
                    marginLeft: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: isSoldOut ? "not-allowed" : "pointer",
                  }}
                  title="Flag deal"
                >
                  ⋮
                </button>

                {showFlagMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "110%",
                      right: 0,
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      minWidth: "180px",
                      zIndex: 50,
                      boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      disabled={flagSubmitting}
                      onClick={() => handleFlagDeal("sold_out")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: isSoldOut ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      🚫 Deal sold out
                    </button>

                    <div style={{ height: "1px", background: "#eee" }} />

                    <button
                      type="button"
                      disabled={flagSubmitting}
                      onClick={() => handleFlagDeal("inappropriate")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: isSoldOut ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      ⚠️ Inappropriate
                    </button>
                  </div>
                )}
              </div>
            )}
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
                    border: "1px solid #ccc",   // <-- FIXED HERE
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
                    cursor: isSoldOut ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </form>
            ) : (
              <p>Please log in to comment.</p>
            )}

            {/* COMMENT TREE */}
            {comments.length > 0 ? (
              comments.map((c) => {
                const history = historyMap[c.id] || [];
                const commentReactions = reactionsByComment[c.id] || {};

                return (
                  <div key={c.id} style={{ marginBottom: "16px" }}>
                    {/* MAIN COMMENT */}
                    <div
                      style={{
                        background: "#f9f9f9",
                        padding: "10px",
                        borderRadius: "8px",
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
                              cursor: isSoldOut ? "not-allowed" : "pointer",
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
                              cursor: isSoldOut ? "not-allowed" : "pointer",
                              color: "#e63946",
                            }}
                          >
                            🗑️
                          </button>
                        </>
                      )}

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

                      <strong>
                        {c.username} ({c.reputation} pts)
                        {c.reputation_badge && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.75rem",
                              padding: "2px 6px",
                              borderRadius: "999px",
                              background: "#f3f0ff",
                              color: "#4b3f72",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title={`Reputation: ${c.reputation_badge}`}
                          >
                            <span>
                              {getReputationBadgeIcon(c.reputation_badge)}
                            </span>
                            <span>{c.reputation_badge}</span>
                          </span>
                        )}
                        {c.hot_deal_badge && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.75rem",
                              padding: "2px 6px",
                              borderRadius: "999px",
                              background: "#fff4e6",
                              color: "#8b4513",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title={`Hot deals badge: ${c.hot_deal_badge}`}
                          >
                            <span>
                              {getHotDealBadgeIcon(c.hot_deal_badge)}
                            </span>
                            <span>{c.hot_deal_badge}</span>
                          </span>
                        )}
                        :
                      </strong>
                      <CommentContent text={c.content} />

                      <small style={{ color: "#666", display: "block" }}>
                        {new Date(c.created_at).toLocaleString()}
                        {c.edited_at && (
                          <span style={{ marginLeft: "6px" }}>
                            (edited at:{" "}
                            {new Date(c.edited_at).toLocaleString()})
                          </span>
                        )}
                      </small>

                      {/* Reactions */}
                      <div
                        style={{
                          marginTop: "4px",
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {REACTION_EMOJIS.map((emoji) => {
                          const count = commentReactions[emoji] || 0;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() =>
                                handleReactionClick(c.id, emoji)
                              }
                              style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "2px 8px",
                                fontSize: "0.85rem",
                                cursor: isSoldOut ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background:
                                  count > 0 ? "#ffe3f0" : "#eee",
                              }}
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Reply button */}
                      {user && (
                        <button
                          onClick={() =>
                            setReplyTo(replyTo === c.id ? null : c.id)
                          }
                          style={{
                            marginTop: "6px",
                            border: "none",
                            background: "transparent",
                            cursor: isSoldOut ? "not-allowed" : "pointer",
                            color: "#0070f3",
                            fontSize: "0.8rem",
                          }}
                        >
                          💬 Reply
                        </button>
                      )}

                      {/* Reply box */}
                      {replyTo === c.id && (
                        <div style={{ marginTop: "10px" }}>
                          <textarea
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) =>
                              setReplyText(e.target.value)
                            }
                            style={{
                              width: "100%",
                              minHeight: "60px",
                              padding: "8px",
                              border: "1px solid #ccc",
                              borderRadius: "6px",
                              marginBottom: "6px",
                            }}
                          ></textarea>
                          <button
                            onClick={() => handleReplySubmit(c.id)}
                            style={{
                              background: "#0070f3",
                              color: "white",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "none",
                              cursor: isSoldOut ? "not-allowed" : "pointer",
                            }}
                          >
                            Reply
                          </button>
                        </div>
                      )}

                      {/* History */}
                      {c.edited_at && (
                        <button
                          type="button"
                          onClick={() => toggleHistory(c.id)}
                          style={{
                            marginTop: "4px",
                            border: "none",
                            background: "transparent",
                            cursor: isSoldOut ? "not-allowed" : "pointer",
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
                              <div
                                key={h.id}
                                style={{ marginBottom: "6px" }}
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
                                  <CommentContent
                                    text={h.previous_content}
                                  />
                                </div>
                                <small style={{ color: "#777" }}>
                                  {new Date(
                                    h.edited_at
                                  ).toLocaleString()}
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

                    {/* 🧵 Render replies (1 level) */}
                    {c.replies.length > 0 && (
                      <div
                        style={{ marginLeft: "30px", marginTop: "10px" }}
                      >
                        {c.replies.map((r) => {
                          const rReactions =
                            reactionsByComment[r.id] || {};
                          return (
                            <div
                              key={r.id}
                              style={{
                                background: "#f0f0f0",
                                padding: "10px",
                                borderRadius: "8px",
                                marginBottom: "8px",
                                position: "relative",
                              }}
                            >
                              <strong>
                                {r.username} ({r.reputation} pts)
                                {r.reputation_badge && (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      fontSize: "0.75rem",
                                      padding: "2px 6px",
                                      borderRadius: "999px",
                                      background: "#f3f0ff",
                                      color: "#4b3f72",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                    title={`Reputation: ${r.reputation_badge}`}
                                  >
                                    <span>
                                      {getReputationBadgeIcon(
                                        r.reputation_badge
                                      )}
                                    </span>
                                    <span>{r.reputation_badge}</span>
                                  </span>
                                )}
                                {r.hot_deal_badge && (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      fontSize: "0.75rem",
                                      padding: "2px 6px",
                                      borderRadius: "999px",
                                      background: "#fff4e6",
                                      color: "#8b4513",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                    title={`Hot deals badge: ${r.hot_deal_badge}`}
                                  >
                                    <span>
                                      {getHotDealBadgeIcon(
                                        r.hot_deal_badge
                                      )}
                                    </span>
                                    <span>{r.hot_deal_badge}</span>
                                  </span>
                                )}
                                :
                              </strong>
                              <CommentContent text={r.content} />

                              <small
                                style={{ color: "#666", display: "block" }}
                              >
                                {new Date(
                                  r.created_at
                                ).toLocaleString()}
                              </small>

                              {/* Reactions */}
                              <div
                                style={{
                                  marginTop: "4px",
                                  display: "flex",
                                  gap: "6px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {REACTION_EMOJIS.map((emoji) => {
                                  const count =
                                    rReactions[emoji] || 0;
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() =>
                                        handleReactionClick(
                                          r.id,
                                          emoji
                                        )
                                      }
                                      style={{
                                        border: "none",
                                        borderRadius: "999px",
                                        padding: "2px 8px",
                                        fontSize: "0.85rem",
                                        cursor: isSoldOut ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        background:
                                          count > 0 ? "#ffe3f0" : "#eee",
                                      }}
                                    >
                                      <span>{emoji}</span>
                                      <span>{count}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Reply button for reply */}
                              {user && (
                                <button
                                  onClick={() =>
                                    setReplyTo(
                                      replyTo === r.id ? null : r.id
                                    )
                                  }
                                  style={{
                                    marginTop: "6px",
                                    border: "none",
                                    background: "transparent",
                                    cursor: isSoldOut ? "not-allowed" : "pointer",
                                    color: "#0070f3",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  💬 Reply
                                </button>
                              )}

                              {/* Reply form for reply */}
                              {replyTo === r.id && (
                                <div style={{ marginTop: "10px" }}>
                                  <textarea
                                    placeholder="Write a reply..."
                                    value={replyText}
                                    onChange={(e) =>
                                      setReplyText(e.target.value)
                                    }
                                    style={{
                                      width: "100%",
                                      minHeight: "60px",
                                      padding: "8px",
                                      border: "1px solid #ccc",
                                      borderRadius: "6px",
                                      marginBottom: "6px",
                                    }}
                                  ></textarea>
                                  <button
                                    onClick={() =>
                                      handleReplySubmit(r.id)
                                    }
                                    style={{
                                      background: "#0070f3",
                                      color: "white",
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      border: "none",
                                      cursor: isSoldOut ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    Reply
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
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
