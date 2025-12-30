import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import DealCard from "../../components/DealCard";
import { supabase } from "../../lib/supabase";

export default function CategoryPage() {
  const router = useRouter();
  const { name } = router.query;
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    async function fetchDeals() {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const filtered = (data || []).filter(
        (d) =>
          d.category &&
          d.category.toLowerCase() ===
            decodeURIComponent(name)?.toLowerCase()
      );

      const ids = filtered.map((d) => d.id);

      const { data: voteData } = await supabase
        .from("votes")
        .select("deal_id, vote_value")
        .in("deal_id", ids);

      const { data: commentData } = await supabase
        .from("comments")
        .select("deal_id")
        .in("deal_id", ids);

      const scoreMap = {};
      voteData?.forEach((v) => {
        scoreMap[v.deal_id] = (scoreMap[v.deal_id] || 0) + v.vote_value;
      });

      const commentsMap = {};
      commentData?.forEach((c) => {
        commentsMap[c.deal_id] = (commentsMap[c.deal_id] || 0) + 1;
      });

      const withMeta = filtered.map((d) => ({
        ...d,
        score: scoreMap[d.id] || 0,
        comments_count: commentsMap[d.id] || 0,
      }));

      setDeals(withMeta);
    }

    if (name) fetchDeals();
  }, [name]);

  // ✅ ADDITION — Fashion as first-class menu
  const fashionCategories = [
    "Shoes – Sneakers",
    "Shoes – Running",
    "Shoes – Sports",
    "Shoes – Formal",
    "Women – Jackets",
    "Women – Shirts",
    "Women – Dresses",
    "Women – Underwear",
    "Women – Other",
    "Men – Jackets",
    "Men – Shirts",
    "Men – Pants",
    "Men – Underwear",
    "Men – Other",
    "Kids – Jackets",
    "Kids – Shirts",
    "Kids – Pants",
    "Kids – Other",
  ];

  const categories = [
    "Automotive",
    "Babies & Kids",
    "Books & Media",
    "Food & Beverages",
    "Gaming",
    "Groceries",
    "Health & Beauty",
    "Home & Living",
    "Housing",
    "Office Supplies",
    "Pets",
    "Restaurants",
    "Sports & Outdoors",
    "Tech & Electronics",
    "Toys & Hobbies",
    "Travel",
  ].sort();

  const coupons = [
    "Amazon",
    "Cabify",
    "Falabella",
    "Linio",
    "MercadoLibre",
    "Oechsle",
    "PedidosYa",
    "PlazaVea",
    "Rappi",
    "Ripley",
    "Sodimac",
    "Tottus",
    "Others",
  ].sort();

  const handleCategoryClick = (cat) => {
    router.push(`/category/${encodeURIComponent(cat)}`);
  };

  const handleCouponClick = (cp) => {
    router.push(`/coupon/${encodeURIComponent(cp)}`);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <Header />

      <nav className="navbar">
        <div className="dropdown">
          <span>Fashion ⌄</span>
          <div>
            {fashionCategories.map((f) => (
              <a
                key={f}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/category/${encodeURIComponent(f)}`);
                }}
              >
                {f}
              </a>
            ))}
          </div>
        </div>

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
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>

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
