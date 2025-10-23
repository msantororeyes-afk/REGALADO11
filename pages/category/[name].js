import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoryPage() {
  const router = useRouter();
  const { name } = router.query;
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [name]);

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
