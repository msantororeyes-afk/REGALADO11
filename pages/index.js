import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [hotDeals, setHotDeals] = useState([]);
  const [trendingDeals, setTrendingDeals] = useState([]);
  const [personalDeals, setPersonalDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  // ---------- FETCH DEALS ----------
  async function fetchDeals() {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      return;
    }

    setDeals(data);
    setAllDeals(data);

    // --- Hot Deals = latest uploaded ---
    setHotDeals(data.slice(0, 6));

    // --- Trending Deals = most voted or commented ---
    const { data: voteData } = await supabase
      .from("votes")
      .select("deal_id, vote_value");
    const scoreMap = {};
    voteData?.forEach((v) => {
      scoreMap[v.deal_id] = (scoreMap[v.deal_id] || 0) + v.vote_value;
    });
    const trending = [...data].sort(
      (a, b) => (scoreMap[b.id] || 0) - (scoreMap[a.id] || 0)
    );
    setTrendingDeals(trending.slice(0, 6));

    // --- Default placeholder for personalized deals ---
    setPersonalDeals(data.sort(() => 0.5 - Math.random()).slice(0, 6));
  }

  // ---------- LOAD USER ----------
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ---------- INITIAL FETCH ----------
  useEffect(() => {
    fetchDeals();
    const handleRouteChange = (url) => {
      if (url === "/") fetchDeals();
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  // ---------- BEHAVIOR-BASED PERSONALIZATION ----------
  useEffect(() => {
    if (!user || allDeals.length === 0) return;

    async function buildPersonalized() {
      // 1. Fetch user's votes and comments
      const { data: votes } = await supabase
        .from("votes")
        .select("deal_id, vote_value")
        .eq("user_id", user.id);

      const { data: comments } = await supabase
        .from("comments")
        .select("deal_id")
        .eq("user_id", user.id);

      // 2. Combine to create category interest scores
      const interestMap = {};
      for (const v of votes || []) {
        const deal = allDeals.find((d) => d.id === v.deal_id);
        if (!deal?.category) continue;
        interestMap[deal.category] = (interestMap[deal.category] || 0) + v.vote_value * 2;
      }
      for (const c of comments || []) {
        const deal = allDeals.find((d) => d.id === c.deal_id);
        if (!deal?.category) continue;
        interestMap[deal.category] = (interestMap[deal.category] || 0) + 1;
      }

      // 3. Sort top categories
      const topCategories = Object.entries(interestMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      // 4. Filter deals that match those top categories
      let personalized;
      if (topCategories.length > 0) {
        personalized = allDeals.filter((d) => topCategories.includes(d.category));
      } else {
        personalized = allDeals.sort(() => 0.5 - Math.random()).slice(0, 6);
      }

      setPersonalDeals(personalized.slice(0, 6));
    }

    buildPersonalized();
  }, [user, allDeals]);

  // ---------- SEARCH ----------
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

  // ---------- CATEGORY & COUPON NAVIGATION ----------
  const handleCategoryClick = (category) => {
    router.push(`/category/${encodeURIComponent(category)}`);
  };

  const handleCouponClick = (coupon) => {
    router.push(`/coupon/${encodeURIComponent(coupon)}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  // --- ✅ Updated Category List (alphabetized + new ones) ---
  const categories = [
    "Babies & Kids",
    "Fashion",
    "Groceries",
    "Health & Beauty",
    "Housing",
    "Office Supplies",
    "Pets",
    "Restaurants",
    "Tech & Electronics",
    "Travel",
  ].sort();

  // --- ✅ Updated Coupon List (alphabetized + Others) ---
  const coupons = ["Cabify", "MercadoLibre", "PedidosYa", "Rappi", "Others"].sort();

  return (
    <div>
      {/* ---------- HEADER ---------- */}
      <header className="header">
        <Link href="/" legacyBehavior>
          <a className="logo" style={{ cursor: "pointer" }}>
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search deals, stores, or brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
          <button onClick={() => (window.location.href = "/submit")}>
            Submit Deal
          </button>

          {user ? (
            <>
              <Link href="/profile">
                <button>Profile</button>
              </Link>
              <button onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <Link href="/auth">
              <button>Sign Up / Login</button>
            </Link>
          )}
        </div>
      </header>

      {/* ---------- NAVBAR ---------- */}
      <nav className="navbar">
        <div className="dropdown">
          <span>Categories ⌄</span>
          <div>
            {categories.map((cat) => (
              <a key={cat} href="#" onClick={() => handleCategoryClick(cat)}>
                {cat}
              </a>
            ))}
          </div>
        </div>

        <div className="dropdown">
          <span>Coupons ⌄</span>
          <div>
            {coupons.map((cp) => (
              <a key={cp} href="#" onClick={() => handleCouponClick(cp)}>
                {cp}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ---------- HOME SECTIONS ---------- */}
      <section style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center" }}>🔥 Hot Deals</h2>
        <div className="deals-grid">
          {hotDeals.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} legacyBehavior>
              <a className="deal-card">
                {deal.image_url && <img src={deal.image_url} alt={deal.title} />}
                <div className="content">
                  <h2>{deal.title}</h2>
                  <p>{deal.description}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center" }}>🚀 Trending Deals</h2>
        <div className="deals-grid">
          {trendingDeals.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} legacyBehavior>
              <a className="deal-card">
                {deal.image_url && <img src={deal.image_url} alt={deal.title} />}
                <div className="content">
                  <h2>{deal.title}</h2>
                  <p>{deal.description}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center" }}>🎯 Just for You</h2>
        <div className="deals-grid">
          {personalDeals.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} legacyBehavior>
              <a className="deal-card">
                {deal.image_url && <img src={deal.image_url} alt={deal.title} />}
                <div className="content">
                  <h2>{deal.title}</h2>
                  <p>{deal.description}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js + Supabase
        </p>
      </footer>
    </div>
  );
}
