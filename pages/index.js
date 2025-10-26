import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import DealAlertModal from "../components/DealAlertModal";
import DealCard from "../components/DealCard";
import Header from "../components/Header"; // ✅ unified header

export default function HomePage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [hotDeals, setHotDeals] = useState([]);
  const [trendingDeals, setTrendingDeals] = useState([]);
  const [personalDeals, setPersonalDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

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

    const { data: voteData } = await supabase
      .from("votes")
      .select("deal_id, vote_value");

    const { data: commentData } = await supabase
      .from("comments")
      .select("deal_id");

    const scoreMap = {};
    voteData?.forEach((v) => {
      scoreMap[v.deal_id] = (scoreMap[v.deal_id] || 0) + v.vote_value;
    });

    const commentsMap = {};
    commentData?.forEach((c) => {
      commentsMap[c.deal_id] = (commentsMap[c.deal_id] || 0) + 1;
    });

    const withMeta = (data || []).map((d) => ({
      ...d,
      score: scoreMap[d.id] || 0,
      comments_count: commentsMap[d.id] || 0,
    }));

    setDeals(withMeta);
    setAllDeals(withMeta);
    setHotDeals(withMeta.slice(0, 6));

    const trending = [...withMeta].sort((a, b) => (b.score || 0) - (a.score || 0));
    setTrendingDeals(trending.slice(0, 6));
    setPersonalDeals(withMeta.sort(() => 0.5 - Math.random()).slice(0, 6));
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

  // ---------- PERSONALIZED ----------
  useEffect(() => {
    if (!user || allDeals.length === 0) return;

    async function buildPersonalized() {
      const { data: votes } = await supabase
        .from("votes")
        .select("deal_id, vote_value")
        .eq("user_id", user.id);

      const { data: comments } = await supabase
        .from("comments")
        .select("deal_id")
        .eq("user_id", user.id);

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("favorite_categories, favorite_coupons")
        .eq("id", user.id)
        .single();

      const manualCats = profile?.favorite_categories || [];
      const hybridCategories = [...new Set([...manualCats, ...topBehavioralCats])];

      let personalized;
      if (hybridCategories.length > 0) {
        personalized = allDeals.filter((d) => hybridCategories.includes(d.category));
      } else {
        personalized = allDeals.sort(() => 0.5 - Math.random()).slice(0, 6);
      }

      setPersonalDeals(personalized.slice(0, 6));
    }

    buildPersonalized();
  }, [user, allDeals]);

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

  return (
    <div>
      {/* ✅ Unified Header */}
      <Header />

      {/* ---------- NAVBAR ---------- */}
      <nav className="navbar">
        <div className="dropdown">
          <span>Categories ⌄</span>
          <div>
            {categories.map((cat) => (
              <a key={cat} href="#" onClick={() => router.push(`/category/${cat}`)}>
                {cat}
              </a>
            ))}
          </div>
        </div>
        <div className="dropdown">
          <span>Coupons ⌄</span>
          <div>
            {coupons.map((cp) => (
              <a key={cp} href="#" onClick={() => router.push(`/coupon/${cp}`)}>
                {cp}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <Section title="🔥 Hot Deals" deals={hotDeals} />
      <Section title="🚀 Trending Deals" deals={trendingDeals} />
      <Section title="🎯 Just for You" deals={personalDeals} />

      <footer className="footer">
        <p>© 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js + Supabase</p>
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
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  );
}
