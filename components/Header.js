import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Header() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // ✅ Detect user session and listen for auth changes
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

  // ✅ Log out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <header className="header">
      <Link href="/" legacyBehavior>
        <a className="logo" style={{ cursor: "pointer" }}>
          <img src="/logo.png" alt="Regalado logo" className="logo-image" />
        </a>
      </Link>

      {/* ✅ Search bar only visible on homepage */}
      {router.pathname === "/" && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search deals, stores, or brands..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const query = e.target.value.trim();
                if (query.length > 0)
                  router.push(`/?search=${encodeURIComponent(query)}`);
              }
            }}
          />
          <button aria-label="Search">🔍</button>
        </div>
      )}

      <div className="header-buttons">
        <button onClick={() => router.push("/")}>Home</button>
        <button onClick={() => router.push("/submit")}>Submit Deal</button>

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
  );
}
