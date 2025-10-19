import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomePage() {
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch deals from Supabase
  useEffect(() => {
    async function fetchDeals() {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("id", { ascending: false });
      if (error) console.error("Error fetching deals:", error);
      else setDeals(data);
    }
    fetchDeals();
  }, []);

  // Handle search filtering
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

  return (
    <div>
      {/* ---------- HEADER ---------- */}
      <header className="header">
        <div className="logo">
          <img src="/logo.png" alt="Regalado logo" className="logo-image" />
        </div>

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

  <button
    onClick={() => (window.location.href = "/submit")}
  >
    Submit Deal
  </button>

  <button>Sign Up</button>
</div>

      </header>

      {/* ---------- NAVBAR ---------- */}
   <nav className="navbar">
  <div className="dropdown">
    <span>Categories ⌄</span>
    <div>
      <a href="/category/tech">Tech & Electronics</a>
      <a href="/category/fashion">Fashion</a>
      <a href="/category/housing">Housing</a>
      <a href="/category/groceries">Groceries</a>
      <a href="/category/travel">Travel</a>
    </div>
  </div>

  <div className="dropdown">
    <span>Coupons ⌄</span>
    <div>
      <a href="/coupons/rappi">Rappi</a>
      <a href="/coupons/pedidosya">PedidosYa</a>
      <a href="/coupons/cabify">Cabify</a>
      <a href="/coupons/mercadolibre">MercadoLibre</a>
    </div>
  </div>
</nav>

      {/* ---------- DEALS GRID ---------- */}
      <main className="deals-grid">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <div key={deal.id} className="deal-card">
              {deal.image_url && (
                <img src={deal.image_url} alt={deal.title} />
              )}
              <div className="content">
                <h2>{deal.title}</h2>
                <p>{deal.description}</p>
                <div className="price-section">
                  {deal.original_price && (
                    <span className="old">S/.{deal.original_price}</span>
                  )}
                  {deal.price && (
                    <span className="new">S/.{deal.price}</span>
                  )}
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
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using
          Next.js + Supabase
        </p>
      </footer>
    </div>
  );
}
