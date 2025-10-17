import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CouponPage() {
  const router = useRouter();
  const { name } = router.query;
  const [showCategories, setShowCategories] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const categories = ["Tech & Electronics", "Fashion", "Travel", "Groceries", "Housing"];
  const coupons = ["Rappi", "PedidosYa", "Cabify", "MercadoLibre"];

  const couponLinks = {
    Rappi: "https://www.rappi.pe/",
    PedidosYa: "https://www.pedidosya.com.pe/",
    Cabify: "https://cabify.com/pe",
    MercadoLibre: "https://www.mercadolibre.com.pe/",
  };

  const link = couponLinks[name] || null;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown")) {
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

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* HEADER */}
      <header className="header">
        <a href="/" className="logo">REGALADO</a>

        <div className="search-bar">
          <input type="text" placeholder="Search deals..." />
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
                padding: "10px 0",
                width: isMobile ? "100%" : "auto",
              }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${encodeURIComponent(cat)}`}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    color: "#333",
                    textDecoration: "none",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => setShowCategories(false)}
                >
                  {cat}
                </Link>
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
                padding: "10px 0",
                width: isMobile ? "100%" : "auto",
              }}
            >
              {coupons.map((cp) => (
                <Link
                  key={cp}
                  href={`/coupon/${encodeURIComponent(cp)}`}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    color: "#333",
                    textDecoration: "none",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => setShowCoupons(false)}
                >
                  {cp}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <h1>
          Coupons for {decodeURIComponent(name || "")} 💸
        </h1>

        {link ? (
          <div style={{ marginTop: "30px" }}>
            <p>Use our affiliate link below to get exclusive deals:</p>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#0070f3",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "8px",
                fontWeight: 600,
                textDecoration: "none",
                marginTop: "12px",
              }}
            >
              🔗 Go to {decodeURIComponent(name)}
            </a>
          </div>
        ) : (
          <p>No coupons found for this store yet.</p>
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
