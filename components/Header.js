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
        // ✅ Fetch username from profiles table
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") console.error(error);
        if (profileData?.username) setUsername(profileData.username);
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
      <Link href="/" legacyBehavior>
        <a className="logo" style={{ cursor: "pointer" }}>
          <img
            src="/logo.png"
            alt="Regalado logo"
            className="logo-image"
            style={{ height: "40px", verticalAlign: "middle" }}
          />
        </a>
      </Link>

      {/* ---------- CENTER: NAV LINKS ---------- */}
      <nav className="nav-links">
        <Link href="/?sort=new" legacyBehavior>
          <a>New</a>
        </Link>
        <Link href="/?sort=top" legacyBehavior>
          <a>Top</a>
        </Link>
        <Link href="/submit" legacyBehavior>
          <a>Submit</a>
        </Link>
      </nav>

      {/* ---------- RIGHT: USER & BUTTONS ---------- */}
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
          padding: 10px 20px;
          background: #fff;
          border-bottom: 1px solid #eaeaea;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          font-weight: bold;
          color: #0070f3;
        }
        .nav-links {
          display: flex;
          gap: 20px;
        }
        .nav-links a {
          text-decoration: none;
          color: #333;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-links a:hover {
          color: #0070f3;
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
          .nav-links {
            display: none;
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
