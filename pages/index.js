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
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* HEADER */}
      <header className="header">
        <a href="/" className="logo">
          REGALADO
        </a>

        <div className="search-bar">
          <input type="text" placeholder="Search deals, stores, or brands..." />
        </div>

        <div className="header-buttons">
          <button>Deal Alert</button>
          <button onClick={() => (window.location.href = "/submit")}>
            Submit Deal
          </button>
          <button>Sign Up</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <h1
        style={{
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: "bold",
          marginTop: "30px",
        }}
      >
        Best Deals in Peru 🇵🇪
      </h1>

      <div className="deals-grid">
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
              <div className="deal-card">
                {deal.image_url && (
                  <img src={deal.image_url} alt={deal.title} />
                )}

                <div className="content">
                  <h2>{deal.title}</h2>
                  <p>{deal.description}</p>

                  <div className="price-section">
                    {hasDiscount ? (
                      <>
                        <span className="old">S/{deal.original_price}</span>
                        <span className="new">S/{deal.price}</span>
                        <span className="discount-badge">
                          {discountPercent}% OFF {isHot ? "⚡" : ""}
                        </span>
                      </>
                    ) : (
                      <span className="new">S/{deal.price}</span>
                    )}
                  </div>

                  <p>
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
