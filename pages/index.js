import { useEffect, useState } from "react";

export default function Home() {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((data) => setDeals(data))
      .catch((err) => console.error("Error fetching deals:", err));
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>REGALADO — Best Deals in Peru 🇵🇪</h1>

      {deals.map((deal) => (
        <div
          key={deal.id}
          style={{
            border: "1px solid #eee",
            borderRadius: "10px",
            padding: "12px",
            background: "#fff",
            marginBottom: "16px",
          }}
        >
          {/* Image (if available) */}
          {deal.image_url && (
            <img
              src={deal.image_url}
              alt={deal.title}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "8px",
              }}
            />
          )}

          {/* Title and description */}
          <h3 style={{ margin: "6px 0", fontWeight: "600" }}>{deal.title}</h3>
          <p style={{ color: "#555", marginBottom: "6px" }}>{deal.description}</p>

          {/* Prices */}
          <div style={{ marginTop: "8px" }}>
            {deal.original_price && (
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  marginRight: "8px",
                }}
              >
                S/{Number(deal.original_price).toFixed(2)}
              </span>
            )}
            <span style={{ color: "#1a7f37", fontWeight: "700" }}>
              S/{Number(deal.price).toFixed(2)}
            </span>
          </div>

          {/* Category */}
          <div style={{ marginTop: "8px", fontSize: "13px", color: "#0b74de" }}>
            {deal.category}
          </div>
        </div>
      ))}
    </div>
  );
}
