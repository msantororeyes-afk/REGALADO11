import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoryPage() {
  const router = useRouter();
  const { name } = router.query;
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    async function fetchDeals() {
      const res = await fetch("/api/deals");
      const data = await res.json();
      const filtered = data.filter(
        (d) => d.category.toLowerCase() === decodeURIComponent(name)?.toLowerCase()
      );
      setDeals(filtered);
    }
    if (name) fetchDeals();

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [name]);

  const categories = [
    "Automotive", "Babies & Kids", "Books & Media", "Fashion", "Food & Beverages",
    "Gaming", "Groceries", "Health & Beauty", "Home & Living", "Housing",
    "Office Supplies", "Pets", "Restaurants", "Sports & Outdoors",
    "Tech & Electronics", "Toys & Hobbies", "Travel",
  ].sort();

  const coupons = [
    "Amazon", "Cabify", "Falabella", "Linio", "MercadoLibre", "Oechsle",
    "PedidosYa", "PlazaVea", "Rappi", "Ripley", "Sodimac", "Tottus", "Others",
  ].sort();

  const handleCategoryClick = (cat) => {
    setShowCategories(false);
    router.push(`/category/${encodeURIComponent(cat)}`);
  };

  const handleCouponClick = (cp) => {
    setShowCoupons(false);
    router.push(`/coupon/${encodeURIComponent(cp)}`);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* HEADER */}
      <header className="header">
        <Link href="/" className="logo">
          <img src="/logo.png" alt="Regalado logo" className="logo-image" />
        </Link>

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
          <button onClick={() => (window.location.href = "/submit")}>Submit Deal</button>
          <button>Sign Up</button>
        </div>
      </header>

      {/* SUBHEADER NAVIGATION */}
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "40px",
          padding: "10px 0",
          position: "sticky",
          top: "80px",
          zIndex: 50,
        }}
      >
        {/* Categories */}
        <div className="dropdown" style={{ position: "relative" }}>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowCategories(!showCategories);
              setShowCoupons(false);
            }}
            style={{
              fontWeight: 600,
              color: "#0070f3",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            Categories ▾
          </span>
          {showCategories && (
            <div
              style={{
                position: isMobile ? "relative" : "absolute",
                top: isMobile ? "10px" : "28px",
                left: 0,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: isMobile ? "none" : "0 4px 10px rgba(0,0,0,0.1)",
                padding: "10px 0",
                width: isMobile ? "100%" : "auto",
                zIndex: 999,
              }}
            >
              {categories.map((cat) => (
                <a
                  key={cat}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCategoryClick(cat);
                  }}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    fontSize: "1rem",
                    color: "#333",
                    textDecoration: "none",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {cat}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Coupons */}
        <div className="dropdown" style={{ position: "relative" }}>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowCoupons(!showCoupons);
              setShowCategories(false);
            }}
            style={{
              fontWeight: 600,
              color: "#0070f3",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            Coupons ▾
          </span>
          {showCoupons && (
            <div
              style={{
                position: isMobile ? "relative" : "absolute",
                top: isMobile ? "10px" : "28px",
                left: 0,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: isMobile ? "none" : "0 4px 10px rgba(0,0,0,0.1)",
                padding: "10px 0",
                width: isMobile ? "100%" : "auto",
                zIndex: 999,
              }}
            >
              {coupons.map((cp) => (
                <a
                  key={cp}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCouponClick(cp);
                  }}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    fontSize: "1rem",
                    color: "#333",
                    textDecoration: "none",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {cp}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <h1
        style={{
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: "bold",
          marginTop: "30px",
        }}
      >
        Deals in {decodeURIComponent(name || "")} 🛍️
      </h1>

      <div className="deals-grid">
        {deals.length === 0 ? (
          <p style={{ textAlign: "center", color: "#555" }}>
            No deals found in this category.
          </p>
        ) : (
          deals.map((deal) => (
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
                  <p>
                    <strong>Price:</strong> S/{deal.price}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
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
