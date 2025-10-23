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
    setHotDeals(data.slice(0, 6));

    // --- Trending Deals ---
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

  // ---------- HYBRID PERSONALIZATION (now with realtime updates) ----------
  useEffect(() => {
    if (!user || allDeals.length === 0) return;

    async function buildPersonalized() {
      // --- 1. Fetch votes and comments (behavioral signals) ---
      const { data: votes } = await supabase
        .from("votes")
        .select("deal_id, vote_value")
        .eq("user_id", user.id);

      const { data: comments } = await supabase
        .from("comments")
        .select("deal_id")
        .eq("user_id", user.id);

      // --- 2. Build interest map from user interactions ---
      const interestMap = {};
      for (const v of votes || []) {
        const deal = allDeals.find((d) => d.id === v.deal_id);
        if (!deal?.category) continue;
        interestMap[deal.category] =
          (interestMap[deal.category] || 0) + v.vote_value * 2;
      }
      for (const c of comments || []) {
        const deal = allDeals.find((d) => d.id === c.deal_id);
        if (!deal?.category) continue;
        interestMap[deal.category] = (interestMap[deal.category] || 0) + 1;
      }

      const topBehavioralCats = Object.entries(interestMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      // --- 3. Fetch manual favorites from profile ---
      const { data: profile } = await supabase
        .from("profiles")
        .select("favorite_categories, favorite_coupons")
        .eq("id", user.id)
        .single();

      const manualCats = profile?.favorite_categories || [];
      const hybridCategories = [...new Set([...manualCats, ...topBehavioralCats])];

      // --- 4. Choose deals matching both manual + behavioral ---
      let personalized;
      if (hybridCategories.length > 0) {
        personalized = allDeals.filter((d) =>
          hybridCategories.includes(d.category)
        );
      } else {
        personalized = allDeals.sort(() => 0.5 - Math.random()).slice(0, 6);
      }

      setPersonalDeals(personalized.slice(0, 6));
    }

    buildPersonalized();

    // ✅ Realtime listener for profiles, votes, and comments
    const profileSub = supabase
      .channel("profile-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            console.log("🔄 Profile changed — refreshing personalized deals...");
            buildPersonalized();
          }
        }
      )
      .subscribe();

    const votesSub = supabase
      .channel("vote-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        (payload) => {
          console.log("⚡ Vote change detected — refreshing deals...");
          fetchDeals();
          buildPersonalized();
        }
      )
      .subscribe();

    const commentsSub = supabase
      .channel("comment-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          console.log("💬 Comment change detected — refreshing personalized deals...");
          buildPersonalized();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(votesSub);
      supabase.removeChannel(commentsSub);
    };
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

  // ---------- CATEGORIES & COUPONS ----------
  const categories = [
    "Automotive",
    "Babies & Kids",
    "Books & Media",
    "Fashion",
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
          <button className="search-button" onClick={handleSearch}>
            🔍
          </button>
        </div>

        <div className="header-buttons">
          <button>Deal Alert</button>
          <button onClick={() => (window.location.href = "/submit")}>Submit Deal</button>
          {user ? (
            <>
              <Link href="/profile"><button>Profile</button></Link>
              <button onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <Link href="/auth"><button>Sign Up / Login</button></Link>
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
      <Section title="🔥 Hot Deals" deals={hotDeals} />
      <Section title="🚀 Trending Deals" deals={trendingDeals} />
      <Section title="🎯 Just for You" deals={personalDeals} />

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js + Supabase
        </p>
      </footer>
    </div>
  );
}

function Section({ title, deals }) {
  return (
    <section style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>{title}</h2>
      <div className="deals-grid">
        {deals.map((deal) => (
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
  );
}
