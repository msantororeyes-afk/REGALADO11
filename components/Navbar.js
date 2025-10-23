import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();
  const [showCategories, setShowCategories] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    // Automatically close menus when navigating
    const handleRouteChange = () => {
      setShowCategories(false);
      setShowCoupons(false);
    };
    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  return (
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
        zIndex: 100,
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
                  router.push(`/category/${encodeURIComponent(cat)}`);
                }}
                style={{
                  display: "block",
                  padding: "10px 20px",
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
                  router.push(`/coupon/${encodeURIComponent(cp)}`);
                }}
                style={{
                  display: "block",
                  padding: "10px 20px",
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
  );
}
