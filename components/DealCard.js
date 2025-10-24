import Link from "next/link";

export default function DealCard({ deal }) {
  const score = deal?.score || 0;
  const comments = deal?.comments_count || 0;
  const hasDiscount = typeof deal?.discount === "number" && !isNaN(deal.discount);

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
        <div className="meta" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <span className="votes" title="Score">
            {score >= 0 ? "▲" : "▼"} {Math.abs(score)}
          </span>
          <span className="comments" title="Comments">💬 {comments}</span>
          <span className="finder" style={{ color: "#666", fontSize: "0.9em" }}>
            Found by <strong>{deal.posted_by || "user"}</strong>
          </span>
          <a className="go" href={`/api/redirect/${deal.id}`} rel="noreferrer" style={{ marginLeft: "auto" }}>
            Go to offer
          </a>
        </div>
      </div>
    </div>
  );
}
