import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DealPage() {
  const router = useRouter();
  const { id } = router.query;
  const [deal, setDeal] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchDeal() {
      const res = await fetch(`/api/deals?id=${id}`);
      const data = await res.json();
      if (!data || data.length === 0) {
        setNotFound(true);
      } else {
        setDeal(data[0]);
      }
    }
    fetchDeal();
  }, [id]);

  if (notFound) {
    return (
     <div
  style={{
    padding: "20px",
    fontFamily: "Inter, sans-serif",
    maxWidth: "100%",
    margin: "0 auto",
  }}
>

        <h1>😕 Deal Not Found</h1>
        <p>This deal might have been deleted or the link is incorrect.</p>
        <button
          onClick={() => router.push("/")}
          style={{
            marginTop: "20px",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          ← Back to Deals
        </button>
      </div>
    );
  }

  if (!deal) {
    return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading...</p>;
  }

  const hasDiscount = deal.original_price && deal.original_price > deal.price;
  const discountPercent = hasDiscount
    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
    : 0;
  const isHot = discountPercent >= 40;

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isHot && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "#e63946",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              padding: "4px 8px",
              fontSize: "0.8rem",
              zIndex: 2,
            }}
          >
            🔥 Hot Deal!
          </div>
        )}

        {deal.image_url && (
          <img
            src={deal.image_url}
            alt={deal.title}
            style={{
              width: "100%",
              height: "300px",
              objectFit: "cover",
              filter: isHot ? "brightness(0.9)" : "none",
              display: "block",
            }}
          />
        )}

        <div style={{ padding: "20px" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>{deal.title}</h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>{deal.description}</p>

          <div style={{ marginTop: "15px" }}>
            {hasDiscount ? (
              <>
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#999",
                    marginRight: "8px",
                  }}
                >
                  S/{deal.original_price}
                </span>
                <span
                  style={{
                    color: "#e63946",
                    fontWeight: "bold",
                    fontSize: "1.3rem",
                  }}
                >
                  S/{deal.price}
                </span>
                <span
                  style={{
                    marginLeft: "8px",
                    background: "#e63946",
                    color: "white",
                    borderRadius: "6px",
                    padding: "2px 6px",
                    fontSize: "0.85rem",
                  }}
                >
                  {discountPercent}% OFF {isHot ? "⚡" : ""}
                </span>
              </>
            ) : (
              <span
                style={{
                  color: "#333",
                  fontWeight: "bold",
                  fontSize: "1.3rem",
                }}
              >
                S/{deal.price}
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: "0.9rem",
              marginTop: "10px",
              color: "#0b74de",
            }}
          >
            <strong>Category:</strong> {deal.category}
          </p>

          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: "25px",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 18px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            ← Back to Deals
          </button>
        </div>
      </div>
    </div>
  );
}
