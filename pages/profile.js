import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Header from "../components/Header"; 

export default function Profile({ session }) {
  const [user, setUser] = useState(null);
  const [myDeals, setMyDeals] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      setUser(u);

      if (!u) {
        // Redirect to login if no user
        router.push("/auth");
        return;
      }

      // Fetch user's own deals
      const { data: deals, error } = await supabase
        .from("deals")
        .select("*")
        .eq("posted_by", u.id)
        .order("id", { ascending: false });

      if (error) console.error(error);
      else setMyDeals(deals || []);
    }

    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div>
      <Header session={session} />
      <main className="container" style={{ maxWidth: 700, margin: "0 auto", padding: "20px" }}>
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
          <p>Loading profile...</p>
        )}
      </main>
    </div>
  );
}
