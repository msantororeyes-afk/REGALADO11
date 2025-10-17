import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadDeals() {
      const res = await fetch("/api/deals");
      const data = await res.json();
      setDeals(data);
    }
    loadDeals();
  }, []);

  const filteredDeals = deals.filter(
    (deal) =>
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* HEADER */}
      <header className="header">
        <a href="/" className="logo">
          REGALADO
        </a>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search deals, stores, or brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
        {filteredDeals.map((deal) => {
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

                  {/* Go to Store Button */}
                  {deal.product_url && (
                    <a
                      href={deal.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: "10px",
                        background: "#0070f3",
                        color: "white",
                        textDecoration: "none",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetch("/api/click", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: deal.id }),
                          });
                        } catch (err) {
                          console.error("Failed to record click:", err);
                        }
                      }}
                    >
                      🔗 Go to Store
                    </a>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} REGALADO — Built in Peru 🇵🇪 |{" "}
          <a href="/submit">Submit a Deal</a> |{" "}
          <a
            href="https://t.me/regaladope"
            target="_blank"
            rel="noreferrer"
          >
            Join our Telegram
          </a>
        </p>
      </footer>
    </div>
  );
}
