// /components/Header.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import DealAlertModal from "./DealAlertModal"; // ✅ modal

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [showDealAlert, setShowDealAlert] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ restored search term

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (!error && profileData?.username) {
          setUsername(profileData.username);
        }
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) setUsername("");
    });

    return () => {
      try {
        listener?.subscription?.unsubscribe();
      } catch (_) {}
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    location.reload();
  }

  // 🔍 SEARCH — Navigate to homepage with search filter
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    router.push({
      pathname: "/",
      query: { search: searchTerm.trim() },
    });
  };

  return (
    <header className="header">
      {/* ---------- LEFT: LOGO ---------- */}
      <div className="logo-container">
        <Link href="/" legacyBehavior>
          <a className="logo-link">
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>
      </div>

      {/* ---------- CENTER: SEARCH BAR ---------- */}
      <div className="search-bar">
        <form onSubmit={handleSearch} style={{ width: "100%" }}>
          <input
            type="text"
            placeholder="Search deals, stores, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button" type="submit">
            🔍
          </button>
        </form>
      </div>

      {/* ---------- RIGHT: BUTTONS ---------- */}
      <div className="header-buttons">
        <button onClick={() => setShowDealAlert(true)}>Deal Alert</button>

        <Link href="/submit" legacyBehavior>
          <button>Submit Deal</button>
        </Link>

        {user ? (
          <>
            <span className="username-display">
              Hi, <strong>{username || "user"}</strong> 👋
            </span>
            <Link href="/profile" legacyBehavior>
              <button>Profile</button>
            </Link>
            <button onClick={signOut}>Log Out</button>
          </>
        ) : (
          <Link href="/auth" legacyBehavior>
            <button>Sign In</button>
          </Link>
        )}
      </div>

      {/* Deal alert modal */}
      {showDealAlert && <DealAlertModal onClose={() => setShowDealAlert(false)} />}

      {/* ---------- STYLES (UNCHANGED EXCEPT FOR SEARCH) ---------- */}
      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          border-bottom: 1px solid #eaeaea;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 110px;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          height: 100%;
        }

        .logo-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          height: 100%;
        }

        .logo-image {
          object-fit: contain;
          display: block;
          flex-shrink: 0;
        }

        /* SEARCH BAR restored */
        .search-bar {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 0 20px;
        }

        .search-bar input {
          width: 100%;
          max-width: 550px;
          height: 44px;
          padding: 10px 45px 10px 16px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 1rem;
          background-color: #f9fafb;
        }

        .search-button {
          position: absolute;
          right: 60px;
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #9ca3af;
          cursor: pointer;
        }

        .header-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-buttons button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
      `}</style>
    </header>
  );
}
