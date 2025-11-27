import Link from "next/link";

const REPUTATION_BADGE_EMOJI = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "🌟",
};

const HOT_DEAL_BADGE_EMOJI = {
  "Novato del ahorro": "🏷️",
  "Regatero experimentado": "🛒",
  "Caserito VIP": "🛍️",
  "Seño del ahorro": "📣",
  "Leyenda del regalado": "🏆",
};

export default function DealCard({ deal }) {
  const score = deal?.score || 0;
  const comments = deal?.comments_count || 0;
  const hasDiscount = typeof deal?.discount === "number" && !isNaN(deal.discount);

  // These fields will be filled from pages/index.js
  const displayName = deal.username || deal.posted_by || "user";
  const reputationBadge = deal.reputation_badge || null;
  const hotDealBadge = deal.hot_deal_badge || null;

  return (
    <div className="deal-card">
      <img src={deal.image_url || "/placeholder.png"} alt={deal.title || ""} />
      <div className="deal-body">
        <h3>
          <Link href={`/deals/${deal.id}`} legacyBehavior>
            <a>{deal.title}</a>
          </Link>
        </h3>

        <p className="desc">{deal.description?.slice(0, 140)}</p>

        {/* price area like your profile cards */}
        <div className="price-section" style={{ marginTop: 6 }}>
          {deal.original_price ? (
            <span className="old">S/.{deal.original_price}</span>
          ) : null}
          {deal.price ? <span className="new">S/.{deal.price}</span> : null}
          {hasDiscount ? (
            <span className="discount-badge">-{deal.discount}%</span>
          ) : null}
        </div>

        {/* footer meta */}
        <div
          className="meta"
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span className="votes" title="Score">
            {score >= 0 ? "▲" : "▼"} {Math.abs(score)}
          </span>
          <span className="comments" title="Comments">
            💬 {comments}
          </span>

          <span
            className="finder"
            style={{
              color: "#666",
              fontSize: "0.9em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Found by <strong>{displayName}</strong>
            {reputationBadge && (
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
                title={`Reputation: ${reputationBadge}`}
              >
                <span>{REPUTATION_BADGE_EMOJI[reputationBadge] || "⭐"}</span>
                <span>{reputationBadge}</span>
              </span>
            )}
            {hotDealBadge && (
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
                title={`Hot deals badge: ${hotDealBadge}`}
              >
                <span>{HOT_DEAL_BADGE_EMOJI[hotDealBadge] || "🔥"}</span>
                <span>{hotDealBadge}</span>
              </span>
            )}
          </span>

          {/* internal detail page */}
          <Link href={`/deals/${deal.id}`} legacyBehavior>
            <a
              className="go"
              style={{
                marginLeft: "auto",
                background: "#0070f3",
                color: "white",
                padding: "6px 12px",
                borderRadius: "8px",
                fontWeight: "600",
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Go to deal
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
