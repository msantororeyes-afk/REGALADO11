import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

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

  // ✅ Load user and deal
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
    }

    fetchData();
  }, [id]);

  // ✅ Load votes & user’s vote
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

      const total = allVotes.reduce((acc, v) => acc + v.vote_value, 0);
      setVotes(total);

      if (user) {
        const existing = allVotes.find((v) => v.user_id === user.id);
        setUserVote(existing ? existing.vote_value : null);
      }
    }

    fetchVotes();
  }, [id, user]);

  // ✅ Load comments with usernames
  useEffect(() => {
    if (!id) return;
    async function fetchComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(username)")
        .eq("deal_id", id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setComments(data || []);
    }

    fetchComments();
  }, [id]);

  // ✅ Handle voting
  const handleVote = async (value) => {
    if (!user) {
      alert("Please sign in to vote.");
      return;
    }

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

  // ✅ Handle comment submit
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
        },
      ]);
      if (error) throw error;

      setNewComment("");

      const { data } = await supabase
        .from("comments")
        .select("*, profiles(username)")
        .eq("deal_id", id)
        .order("created_at", { ascending: false });

      setComments(data || []);
    } catch (err) {
      console.error("Error adding comment:", err.message);
    }
    setSubmitting(false);
  };

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;
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
      {/* ---------- HEADER ---------- */}
      <header className="header">
        <Link href="/" legacyBehavior>
          <a className="logo" style={{ cursor: "pointer" }}>
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>
        <div className="header-buttons">
          <Link href="/">
            <button>Home</button>
          </Link>
          <Link href="/submit">
            <button>Submit Deal</button>
          </Link>
          <Link href="/profile">
            <button>Profile</button>
          </Link>
        </div>
      </header>

      {/* ---------- MAIN ---------- */}
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
          <p style={{ color: "#555", marginBottom: "15px" }}>
            {deal.description}
          </p>

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

          <p>
            <strong>Category:</strong> {deal.category}
          </p>

          {/* ✅ Fixed Go to Store button */}
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

          {/* ---------- VOTES ---------- */}
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

          {/* ---------- COMMENTS ---------- */}
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

            {comments.length > 0 ? (
              comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "#f9f9f9",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>{c.profiles?.username || "Anonymous"}:</strong>{" "}
                    {c.content}
                  </p>
                  <small style={{ color: "#666" }}>
                    {new Date(c.created_at).toLocaleString()}
                  </small>
                </div>
              ))
            ) : (
              <p>No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js +
          Supabase
        </p>
      </footer>
    </div>
  );
}
