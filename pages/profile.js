import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [myDeals, setMyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error);
        setLoading(false);
        return;
      }

      const u = data?.user;
      setUser(u);

      if (!u) {
        router.push("/auth"); // redirect if not logged in
        return;
      }

      const { data: deals, error: dealError } = await supabase
        .from("deals")
        .select("*")
        .eq("posted_by", u.id)
        .order("id", { ascending: false });

      if (dealError) console.error(dealError);
      else setMyDeals(deals || []);

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading profile...</p>;

  return (
    <div>
      <Header />

      <main
        className="container"
        style={{ maxWidth: 700, margin: "0 auto", padding: "20px", textAlign: "center" }}
      >
        {user ? (
          <>
            <h1 style={{ color: "#0070f3" }}>My Profile</h1>
            <p>{user.email}</p>

            <button
              onClick={handleLogout}
              style={{
                background: "#0070f3",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                marginBottom: "30px",
              }}
            >
              Log Out
            </button>

            <h3>My Deals</h3>
            {myDeals.length > 0 ? (
              myDeals.map((d) => (
                <div
                  key={d.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "10px",
                    marginBottom: "10px",
                    textAlign: "left",
                  }}
                >
                  <h4>{d.title}</h4>
                  <p>{d.description}</p>
                </div>
              ))
            ) : (
              <p style={{ color: "#666" }}>You haven’t submitted any deals yet.</p>
            )}
          </>
        ) : (
          <p>You are not logged in.</p>
        )}
      </main>
    </div>
  );
}
