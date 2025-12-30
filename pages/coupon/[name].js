import { useRouter } from "next/router";
import Header from "../../components/Header"; // ✅ added
import DealCard from "../../components/DealCard"; // ✅ show deals too
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CouponPage() {
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

      // show deals tagged with this coupon name (some users submit as category, some as coupon)
      const filtered = (data || []).filter((d) => {
        const n = decodeURIComponent(name || "").toLowerCase();
        return (
          (d.category && d.category.toLowerCase() === n) ||
          (d.coupon && d.coupon.toLowerCase() === n)
        );
      });

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

  const categories = [
    "Automotive","Babies & Kids","Books & Media","Food & Beverages",
    "Gaming","Groceries","Health & Beauty","Home & Living","Housing",
    "Office Supplies","Pets","Restaurants","Sports & Outdoors",
    "Tech & Electronics","Toys & Hobbies","Travel",
  ].sort();

  const coupons = [
    "Amazon","Cabify","Falabella","Linio","MercadoLibre","Oechsle",
    "PedidosYa","PlazaVea","Rappi","Ripley","Sodimac","Tottus","Others",
  ].sort();

  const couponLinks = {
    Rappi: "https://www.rappi.pe/",
    PedidosYa: "https://www.pedidosya.com.pe/",
    Cabify: "https://cabify.com/pe",
    MercadoLibre: "https://www.mercadolibre.com.pe/",
    Amazon: "https://www.amazon.com/",
    Falabella: "https://www.falabella.com.pe/",
    Ripley: "https://simple.ripley.com.pe/",
    Linio: "https://www.linio.com.pe/",
    Oechsle: "https://www.oechsle.pe/",
    PlazaVea: "https://www.plazavea.com.pe/",
    Sodimac: "https://www.sodimac.com.pe/",
    Tottus: "https://www.tottus.com.pe/",
  };

  const link = couponLinks[name] || null;

  const handleCategoryClick = (cat) => {
    router.push(`/category/${encodeURIComponent(cat)}`);
  };

  const handleCouponClick = (cp) => {
    router.push(`/coupon/${encodeURIComponent(cp)}`);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ✅ Shared Header */}
      <Header />

      {/* NAVBAR */}
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

      {/* MAIN CONTENT */}
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <h1>Coupons for {decodeURIComponent(name || "")} 💸</h1>

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

      {/* Deals tagged with this coupon/store */}
      <section style={{ padding: "0 20px 30px" }}>
        <h2 style={{ textAlign: "center" }}>Latest deals for {decodeURIComponent(name || "")}</h2>
        <div className="deals-grid">
          {deals.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555", width: "100%" }}>
              No deals posted for this store yet.
            </p>
          ) : (
            deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
          )}
        </div>
      </section>

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
