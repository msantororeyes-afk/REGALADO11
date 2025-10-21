import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DealDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchDeal() {
      try {
        const res = await fetch(`/api/deals?id=${id}`);
        const data = await res.json();
        setDeal(data[0]);
      } catch (err) {
        console.error("Failed to fetch deal:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDeal();
  }, [id]);

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;
  if (!deal)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Deal not found. 🧐
      </p>
    );

  const hasDiscount = deal.original_price && deal.original_price > deal.price;
  const discountPercent = hasDiscount
    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
    : 0;

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "Inter, sans-serif",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}
    >
      {deal.image_url && (
        <img
          src={deal.image_url}
          alt={deal.title}
          style={{
            width: "100%",
            maxHeight: "350px",
            objectFit: "contain",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
          }}
        />
      )}

      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "10px" }}>{deal.title}</h1>
        <p style={{ color: "#555", fontSize: "1rem" }}>{deal.description}</p>

        <div style={{ marginTop: "10px" }}>
          {hasDiscount ? (
            <p style={{ fontSize: "1.2rem" }}>
              <span style={{ textDecoration: "line-through", color: "#888", marginRight: "10px" }}>
                S/{deal.original_price}
              </span>
              <span style={{ color: "#e63946", fontWeight: "bold" }}>S/{deal.price}</span>
              <span
                style={{
                  background: "#e63946",
                  color: "white",
                  fontSize: "0.9rem",
                  padding: "3px 8px",
                  borderRadius: "8px",
                  marginLeft: "10px",
                }}
              >
                -{discountPercent}% OFF
              </span>
            </p>
          ) : (
            <p style={{ color: "#e63946", fontWeight: "bold", fontSize: "1.2rem" }}>
              S/{deal.price}
            </p>
          )}
        </div>

        <p style={{ marginTop: "5px", color: "#333" }}>
          <strong>Category:</strong> {deal.category}
        </p>

        {(deal.link || deal.product_url) && (
          <a
            href={deal.link || deal.product_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "20px",
              background: "#0070f3",
              color: "white",
              textDecoration: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "1rem",
              transition: "background 0.3s ease",
            }}
          >
            🔗 Go to Store
          </a>
        )}
      </div>
    </div>
  );
}
