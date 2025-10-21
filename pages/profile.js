import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import Header from "../components/Header";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [myDeals, setMyDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load the logged-in user and their deals
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.error("Error fetching user:", error);

      setUser(user);

      if (user) {
        const { data: deals, error: dealsError } = await supabase
          .from("deals")
          .select("*")
          .eq("posted_by", user.id)
          .order("id", { ascending: false });

        if (dealsError) console.error("Error fetching deals:", dealsError);
        else setMyDeals(deals || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  // ✅ Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Redirect to homepage
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-page">
      <Header />

      <main className="container">
        {user ? (
          <div>
            <h1>Welcome, {user.email}</h1>
            <h3>Your Submitted Deals</h3>
            {myDeals.length > 0 ? (
              <div className="deals-grid">
                {myDeals.map((deal) => (
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
                          <span className="discount-badge">
                            -{deal.discount}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>You haven’t submitted any deals yet.</p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Please sign in to view your profile</h2>
            <Link href="/auth">
              <button>Go to Sign In</button>
            </Link>
          </div>
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
