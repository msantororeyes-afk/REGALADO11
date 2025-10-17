import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div
      style={{
        padding: "20px",
        fontFamily: "Inter, sans-serif",
        maxWidth: "100%",
        margin: "0 auto",
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: "bold" }}>
        REGALADO — Best Deals in Peru 🇵🇪
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "15px",
          marginTop: "20px",
          padding: "0 10px",
          justifyItems: "center",
        }}
      >
        {deals.map((deal) => {
          const hasDiscount =
            deal.original_price && deal.original_price > deal.price;
          const discountPercent = hasDiscount
            ? Math.round(
                ((deal.original_price - deal.price) / deal.original_price) * 100
              )
            : 0;
          const isHot = discountPercent >= 40;

          return (
            <Link
              key={deal.id}
              href={`/deal/${deal.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  border: isHot ? "2px solid #e63946" : "1px solid #eee",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: isHot
                    ? "0 4px 10px rgba(230,57,70,0.25)"
                    : "0 2px 6px rgba(0,0,0,0.1)",
                  transition:
                    "transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease",
                  cursor: "pointer",
                  maxWidth: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.04)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 14px rgba(0,0,0,0.15)";
                  const overlay = e.currentTarget.querySelector(".overlay");
                  if (overlay) overlay.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 6px rgba(0,0,0,0.1)";
                  const overlay = e.currentTarget.querySelector(".overlay");
                  if (overlay) overlay.style.opacity = "0";
                }}
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
                      zIndex: 3,
                    }}
                  >
                    🔥 Hot Deal!
                  </div>
                )}

                {/* Image container */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "180px",
                    overflow: "hidden",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {deal.image_url && (
                    <img
                      src={deal.image_url}
                      alt={deal.title}
                      className="deal-image"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "filter 0.3s ease",
                        zIndex: 1,
                      }}
                    />
                  )}

                  <div
                    className="overlay"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.4)",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      opacity: 0,
                      zIndex: 2,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    👀 View Details
                  </div>
                </div>

                {/* Deal text content */}
                <div style={{ padding: "15px", width: "100%" }}>
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
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

      </div>
    </div>
  );
}
