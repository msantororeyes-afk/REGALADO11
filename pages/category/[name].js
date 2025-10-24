import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header"; // ✅ added

export default function CategoryPage() {
  const router = useRouter();
  const { name } = router.query;
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchDeals() {
      const res = await fetch("/api/deals");
      const data = await res.json();
      const filtered = data.filter(
        (d) =>
          d.category &&
          d.category.toLowerCase() === decodeURIComponent(name)?.toLowerCase()
      );
      setDeals(filtered);
    }
    if (name) fetchDeals();
  }, [name]);

  const categories = [
    "Automotive","Babies & Kids","Books & Media","Fashion","Food & Beverages",
    "Gaming","Groceries","Health & Beauty","Home & Living","Housing",
    "Office Supplies","Pets","Restaurants","Sports & Outdoors",
    "Tech & Electronics","Toys & Hobbies","Travel",
  ].sort();

  const coupons = [
    "Amazon","Cabify","Falabella","Linio","MercadoLibre","Oechsle",
    "PedidosYa","PlazaVea","Rappi","Ripley","Sodimac","Tottus","Others",
  ].sort();

  const handleCategoryClick = (cat) => {
    router.push(`/category/${encodeURIComponent(cat)}`);
  };

  const handleCouponClick = (cp) => {
    router.push(`/coupon/${encodeURIComponent(cp)}`);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ✅ Shared Header keeps user session, greeting, and Deal Alert */}
      <Header />

      {/* NAVBAR (hover-based) */}
      <nav className="navbar">
        <div className="dropdown">
          <span>Categories ⌄</span>
          <div>
            {categories.map((cat) => (
              <a
                key={cat}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(cat);
                }}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>

        <div className="dropdown">
          <span>Coupons ⌄</span>
          <div>
            {coupons.map((cp) => (
              <a
                key={cp}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleCouponClick(cp);
                }}
              >
                {cp}
              </a>
            ))}
          </div>
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
