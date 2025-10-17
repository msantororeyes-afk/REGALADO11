import { useEffect, useState } from "react";

export default function Home() {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    async function loadDeals() {
      const res = await fetch("/api/deals");
      const data = await res.json();
      setDeals(data);
    }
    loadDeals();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: "bold" }}>
        REGALADO — Best Deals in Peru 🇵🇪
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {deals.map((deal) => {
          // Calculate discount %
          const hasDiscount =
            deal.original_price && deal.original_price > deal.price;
          const discountPercent = hasDiscount
            ? Math.round(
                ((deal.original_price - deal.price) / deal.original_price) * 100
              )
            : 0;

          // Mark hot deals (over 40% off)
          const isHot = discountPercent >= 40;

          return (
            <div
              key={deal.id}
              style={{
                border: isHot ? "2px solid #e63946" : "1px solid #eee",
                borderRadius: "12px",
                padding: "15px",
                background: "#fff",
                boxShadow: isHot
                  ? "0 3px 8px rgba(230,57,70,0.3)"
                  : "0 2px 6px rgba(0,0,0,0.1)",
                position: "relative",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              {isHot && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "#ff4747",
                    color: "white",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    animation: "pulse 1s infinite alternate",
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
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginBottom: "10px",
                  }}
                />
              )}

              <h2
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "6px",
                  color: "#222",
                }}
              >
                {deal.title}
              </h2>

              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                {deal.description}
              </p>

              <div style={{ marginTop: "10px" }}>
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
                        fontSize: "1.1rem",
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
                        fontSize: "0.8rem",
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
                      fontSize: "1.1rem",
                    }}
                  >
                    S/{deal.price}
                  </span>
                )}
              </div>

              <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>
                <strong>Category:</strong> {deal.category}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
