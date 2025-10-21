import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch deals function
  async function fetchDeals() {
    console.log("Fetching deals from:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
    } else {
      console.log("✅ Deals fetched:", data?.length);
      setDeals(data);
      setAllDeals(data);
    }
  }

  // ✅ Fetch on mount and when returning home
  useEffect(() => {
    fetchDeals();

    const handleRouteChange = (url) => {
      if (url === "/") {
        console.log("↩ Returning to homepage — refetching deals");
        fetchDeals();
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  // ✅ Search handling
  const handleSearch = () => {
    const query = searchTerm.toLowerCase();
    const filtered = allDeals.filter(
      (deal) =>
        (deal.title && deal.title.toLowerCase().includes(query)) ||
        (deal.description && deal.description.toLowerCase().includes(query)) ||
        (deal.category && deal.category.toLowerCase().includes(query))
    );
    setDeals(filtered);
  };

  // ✅ Filter by category
  const handleCategoryClick = (category) => {
    const filtered = allDeals.filter(
      (deal) =>
        deal.category &&
        deal.category.toLowerCase().includes(category.toLowerCase())
    );
    setDeals(filtered);
  };

  // ✅ Filter by coupon partner
  const handleCouponClick = (partner) => {
    const filtered = allDeals.filter(
      (deal) =>
        deal.description &&
        deal.description.toLowerCase().includes(partner.toLowerCase())
    );
    setDeals(filtered);
  };

  return (
    <div>
      {/* ---------- HEADER ---------- */}
      <header className="header">
        <Link href="/" legacyBehavior>
          <a className="logo" style={{ cursor: "pointer" }}>
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>

        {/* ---------- SEARCH BAR ---------- */}
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

        {/* ---------- HEADER BUTTONS ---------- */}
        <div className="header-buttons">
          <button>Deal Alert</button>
          <button onClick={() => (window.location.href = "/submit")}>
            Submit Deal
          </button>
          <Link href="/auth">
            <button>Sign Up / Login</button>
          </Link>
        </div>
      </header>

      {/* ---------- NAVBAR ---------- */}
      <nav className="navbar">
        <div className="dropdown">
          <span>Categories ⌄</span>
          <div>
            <a href="#" onClick={() => handleCategoryClick("Tech & Electronics")}>
              Tech & Electronics
            </a>
            <a href="#" onClick={() => handleCategoryClick("Fashion")}>
              Fashion
            </a>
            <a href="#" onClick={() => handleCategoryClick("Housing")}>
              Housing
            </a>
            <a href="#" onClick={() => handleCategoryClick("Groceries")}>
              Groceries
            </a>
            <a href="#" onClick={() => handleCategoryClick("Travel")}>
              Travel
            </a>
          </div>
        </div>

        <div className="dropdown">
          <span>Coupons ⌄</span>
          <div>
            <a href="#" onClick={() => handleCouponClick("Rappi")}>Rappi</a>
            <a href="#" onClick={() => handleCouponClick("PedidosYa")}>PedidosYa</a>
            <a href="#" onClick={() => handleCouponClick("Cabify")}>Cabify</a>
            <a href="#" onClick={() => handleCouponClick("MercadoLibre")}>MercadoLibre</a>
          </div>
        </div>
      </nav>

      {/* ---------- RESET BUTTON ---------- */}
      {deals.length > 0 && deals.length !== allDeals.length && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            style={{
              background: "#0070f3",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => setDeals(allDeals)}
          >
            Show All Deals
          </button>
        </div>
      )}

      {/* ---------- DEALS GRID ---------- */}
      <main className="deals-grid">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <div key={deal.id} className="deal-card">
              {deal.image_url && <img src={deal.image_url} alt={deal.title} />}
              <div className="content">
                <h2>{deal.title}</h2>
                <p>{deal.description}</p>

                <div className="price-section">
                  {deal.original_price && (
                    <span className="old">S/.{deal.original_price}</span>
                  )}
                  {deal.price && <span className="new">S/.{deal.price}</span>}
                  {deal.discount && (
                    <span className="discount-badge">-{deal.discount}%</span>
                  )}
                </div>

                {deal.link && (
                  <a
                    href={deal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-link"
                  >
                    Go to store →
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", marginTop: "50px" }}>
            No deals found.
          </p>
        )}
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js + Supabase
        </p>
      </footer>
    </div>
  );
}
