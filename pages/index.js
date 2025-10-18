import { useEffect, useState } from "react";
import Link from "next/link";

function Home() {
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const handleSearch = () => {
  const query = searchTerm.toLowerCase();
  const filtered = deals.filter(
    (deal) =>
      deal.title.toLowerCase().includes(query) ||
      deal.description.toLowerCase().includes(query) ||
      deal.category.toLowerCase().includes(query)
  );
  setDeals(filtered);
};


  useEffect(() => {
    async function loadDeals() {
      const res = await fetch("/api/deals");
      const data = await res.json();
      setDeals(data);
    }
    loadDeals();

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown")) {
        setShowCategories(false);
        setShowCoupons(false);
      }
    };
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const filteredDeals = deals.filter(
    (deal) =>
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ["Tech & Electronics", "Fashion", "Travel", "Groceries", "Housing"];
  const coupons = ["Rappi", "PedidosYa", "Cabify", "MercadoLibre"];

  return (
    <div>
      {/* HEADER */}
      <header className="header">
      <a href="/" className="logo">
  <img
    src="/logo.png"
    alt="Regalado"
    className="logo-image"
  />
</a>

       <div className="search-bar">
  <input
    type="text"
    placeholder="Search deals, stores, or brands..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") handleSearch();
    }}
  />
  <button
    className="search-button"
    onClick={handleSearch}
    aria-label="Search"
  >
    🔍
  </button>
</div>

        <div className="header-buttons">
          <button>Deal Alert</button>
          <button onClick={() => (window.location.href = "/submit")}>Submit Deal</button>
          <button>Sign Up</button>
        </div>
      </header>

      {/* NAVIGATION */}
     <nav className="navbar">
        <div className="dropdown">
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowCategories(!showCategories);
              setShowCoupons(false);
            }}
          >
            Categories ▾
          </span>
          {showCategories && (
            <div>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${encodeURIComponent(cat)}`}
                  onClick={() => setShowCategories(false)}
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="dropdown">
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowCoupons(!showCoupons);
              setShowCategories(false);
            }}
          >
            Coupons ▾
          </span>
          {showCoupons && (
            <div>
              {coupons.map((cp) => (
                <Link
                  key={cp}
                  href={`/coupon/${encodeURIComponent(cp)}`}
                  onClick={() => setShowCoupons(false)}
                >
                  {cp}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* DEALS GRID */}
      <h1 style={{ textAlign: "center", margin: "30px 0", fontWeight: "700" }}>
        Best Deals in Peru 🇵🇪
      </h1>

      <div className="deals-grid">
        {filteredDeals.map((deal) => {
          const hasDiscount = deal.original_price && deal.original_price > deal.price;
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
                {deal.image_url && <img src={deal.image_url} alt={deal.title} />}
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
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "0.9rem",
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
          <a href="https://t.me/regaladope" target="_blank" rel="noreferrer">
            Join our Telegram
          </a>
        </p>
      </footer>
    </div>
  );
}

export default Home;
