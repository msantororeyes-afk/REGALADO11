// /components/Header.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import DealAlertModal from "./DealAlertModal"; // ✅ add modal

export default function Header() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [showDealAlert, setShowDealAlert] = useState(false); // ✅ modal state

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

    // ✅ keep user in sync across client-side nav
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

      {/* ---------- RIGHT: BUTTONS ---------- */}
      <div className="header-buttons">
        <button onClick={() => setShowDealAlert(true)}>Deal Alert</button> {/* ✅ open modal */}
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

      {/* ✅ render modal globally from Header */}
      {showDealAlert && <DealAlertModal onClose={() => setShowDealAlert(false)} />}

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
          height: 110px; /* same as homepage */
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
          transition: background 0.2s;
        }

        .header-buttons button:hover {
          background: #005bb5;
        }

        .username-display {
          color: #333;
          font-weight: 500;
          margin-right: 5px;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            height: auto;
            padding: 18px 16px 24px;
          }

          .header-buttons {
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
          }

          .header-buttons button {
            padding: 8px 14px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </header>
  );
}

