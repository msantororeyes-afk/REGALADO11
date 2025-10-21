import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Header() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

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
          <a className="logo">
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>
      </div>

      {/* ---------- RIGHT: BUTTONS ---------- */}
      <div className="header-buttons">
        <button>Deal Alert</button>
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

      {/* ---------- STYLES ---------- */}
      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          border-bottom: 1px solid #eaeaea;
          padding: 10px 24px;
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 85px; /* Force equal height everywhere */
        }

        .logo-container {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .logo {
          display: flex;
          align-items: center;
          height: 100%;
          text-decoration: none;
        }

        .logo-image {
          height: 65px !important;
          width: auto !important;
          object-fit: contain;
          display: block;
        }

        .header-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-buttons button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
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
            height: 70px;
            padding: 0 16px;
          }

          .logo-image {
            height: 50px !important;
          }

          .header-buttons {
            gap: 6px;
          }

          .header-buttons button {
            padding: 6px 10px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </header>
  );
}
