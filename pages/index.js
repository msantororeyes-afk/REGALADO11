import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import DealAlertModal from "../components/DealAlertModal";
import DealCard from "../components/DealCard";
import Header from "../components/Header"; // ✅ unified header

const HOT_SCORE_THRESHOLD = 11;

function getReputationBadge(reputation = 0) {
  if (reputation >= 1000) return "Platinum";
  if (reputation >= 500) return "Gold";
  if (reputation >= 250) return "Silver";
  if (reputation >= 50) return "Bronze";
  return null;
}

function getHotDealBadge(hotDealsCount = 0) {
  if (hotDealsCount >= 100) return "Leyenda del regalado";
  if (hotDealsCount >= 50) return "Seño del ahorro";
  if (hotDealsCount >= 15) return "Caserito VIP";
  if (hotDealsCount >= 5) return "Regatero experimentado";
  if (hotDealsCount >= 1) return "Novato del ahorro";
  return null;
}

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

    const withMeta = (data || []).map((d) => {
      const computedScore = scoreMap[d.id] || 0;
      return {
        ...d,
        score: computedScore,
        comments_count: commentsMap[d.id] || 0,
      };
    });

    // Collect user IDs
    const userIds = [
      ...new Set(
        (withMeta || [])
          .map((d) => d.user_id)
          .filter((id) => !!id)
      ),
    ];

    // Fetch profiles of deal owners
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, reputation")
        .in("id", userIds);

      if (profilesError) {
        console.error("❌ Error fetching profiles for deals:", profilesError);
      } else {
        profiles = profilesData || [];
      }
    }

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.id] = {
        username: p.username || null,
        reputation: p.reputation ?? 0,
      };
    });

    // Count hot deals by user (score >= 11)
    const hotCountMap = {};
    withMeta.forEach((d) => {
      const uid = d.user_id;
      const s = d.score || 0;
      if (!uid) return;
      if (s >= HOT_SCORE_THRESHOLD) {
        hotCountMap[uid] = (hotCountMap[uid] || 0) + 1;
      }
    });

    // Attach username + badges to each deal
    const withBadges = withMeta.map((d) => {
      const prof = profileMap[d.user_id] || {};
      const reputation = prof.reputation ?? 0;
      const hotDealsCount = hotCountMap[d.user_id] || 0;

      return {
        ...d,
        username: prof.username || d.posted_by || "user",
        reputation,
        hot_deals_count: hotDealsCount,
        reputation_badge: getReputationBadge(reputation),
        hot_deal_badge: getHotDealBadge(hotDealsCount),
      };
    });

    setDeals(withBadges);
    setAllDeals(withBadges);
    setHotDeals(withBadges.slice(0, 6));

    const trending = [...withBadges].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );
    setTrendingDeals(trending.slice(0, 6));
    setPersonalDeals(
      withBadges.sort(() => 0.5 - Math.random()).slice(0, 6)
    );
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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ---------- INITIAL FETCH ----------
  useEffect(() => {
    fetchDeals();
    const handleRouteChange = (url) => {
      if (url === "/") fetchDeals();
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () =>
      router.events.off("routeChangeComplete", handleRouteChange);
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
      const hybridCategories = [
        ...new Set([...manualCats, ...topBehavioralCats]),
      ];

      let personalized;
      if (hybridCategories.length > 0) {
        personalized = allDeals.filter((d) =>
          hybridCategories.includes(d.category)
        );
      } else {
        personalized = allDeals
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);
      }

      setPersonalDeals(personalized.slice(0, 6));
    }

    buildPersonalized();
  }, [user, allDeals]);

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
      {/* ✅ Unified Header */}
      <Header />

      {/* ---------- NAVBAR ---------- */}
      <nav className="navbar">
        <div className="dropdown">
          <span>Categories ⌄</span>
          <div>
            {categories.map((cat) => (
              <a
                key={cat}
                href="#"
                onClick={() => router.push(`/category/${cat}`)}
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
                onClick={() => router.push(`/coupon/${cp}`)}
              >
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
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using
          Next.js + Supabase
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
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  );
}
