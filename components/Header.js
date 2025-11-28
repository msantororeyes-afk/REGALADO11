// /components/Header.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import DealAlertModal from "./DealAlertModal";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [showDealAlert, setShowDealAlert] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (!session?.user) setUsername("");
      }
    );

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
      {/* LEFT: LOGO */}
      <div className="logo-container">
        <Link href="/" legacyBehavior>
          <a className="logo-link">
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>
      </div>

      {/* CENTER: SEARCH BAR */}
      <form className="search-wrapper" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search deals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button type="submit" className="search-button">
          🔍
        </button>
      </form>

      {/* RIGHT: BUTTONS */}
      <div className="header-buttons">
        <button onClick={() => setShowDealAlert(true)}>Deal Alert</button>

        <Link href="/submit" legacyBehavior>
          <button>Submit Deal</button>
        </Link>

        {user ? (
          <>
            <span className="username-display">
              Hi, <strong>{username || "user"}</strong>
              <span className="greet-hand">👋</span>
            </span>

            <Link href="/profile" legacyBehavior>
              <button className="match-button">Profile</button>
            </Link>

            <button className="match-button" onClick={signOut}>
              Log Out
            </button>
          </>
        ) : (
          <Link href="/auth" legacyBehavior>
            <button className="match-button">Sign In</button>
          </Link>
        )}
      </div>

      {showDealAlert && (
        <DealAlertModal onClose={() => setShowDealAlert(false)} />
      )}

      {/* ---------- STYLES ---------- */}
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

        .search-wrapper {
          position: relative;
          width: 100%;
          max-width: 550px;
          display: flex;
          align-items: center;
        }

        .search-wrapper input {
          width: 100%;
          height: 44px;
          padding: 10px 52px 10px 16px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 1rem;
          background-color: #f9fafb;
        }

        .search-button {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.6rem;    /* BIGGER ICON */
          line-height: 1;
          cursor: pointer;
          padding: 0;
          color: #555;
        }

        .search-button:hover {
          color: #0070f3;
        }

        /* Fix username + emoji alignment */
        .username-display {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #333;
        }

        .greet-hand {
          display: inline-flex;
          align-items: center;
          font-size: 1.1rem;
          line-height: 1;
        }

        /* BUTTON FIX — make Profile same size as others */
        .header-buttons button,
        .match-button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 16px;   /* uniform sizing */
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .header-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-container,
        .logo-link,
        .logo-image {
          display: flex;
          align-items: center;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            padding: 18px 16px 24px;
            height: auto;
          }

          .search-wrapper {
            width: 100%;
            padding: 0 10px;
            margin-top: 10px;
          }
        }
      `}</style>
    </header>
  );
}
