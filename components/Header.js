import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Header({ session }) {
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
      <div className="container">
        {/* ---------- LOGO ---------- */}
        <Link href="/" legacyBehavior>
          <a className="logo">
            <img
              src="/logo.png"
              alt="Regalado"
              style={{ height: "35px", verticalAlign: "middle" }}
            />{" "}
            REGALADO
          </a>
        </Link>

        {/* ---------- NAVIGATION ---------- */}
        <nav>
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

        {/* ---------- AUTH SECTION ---------- */}
        <div className="auth">
          {user ? (
            <>
              {/* ✅ Greeting */}
              <span className="username-display">
                Hi, {username || "user"} 👋
              </span>
              <Link href="/profile" legacyBehavior>
                <a>Profile</a>
              </Link>
              <button onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link href="/auth" legacyBehavior>
              <a>Sign in</a>
            </Link>
          )}
        </div>
      </div>

      {/* ---------- STYLES ---------- */}
      <style jsx>{`
        .header {
          background: white;
          border-bottom: 1px solid #eee;
          padding: 12px 20px;
          display: flex;
          justify-content: center;
        }
        .container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1100px;
        }
        .logo {
          font-weight: 700;
          font-size: 1.2rem;
          color: #0070f3;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        nav a {
          margin: 0 10px;
          color: #333;
          text-decoration: none;
          font-weight: 500;
        }
        nav a:hover {
          color: #0070f3;
        }
        .auth {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .auth a {
          text-decoration: none;
          color: #0070f3;
          font-weight: 500;
        }
        .auth button {
          background: #e63946;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        .auth button:hover {
          opacity: 0.9;
        }
        .username-display {
          color: #333;
          font-weight: 600;
          margin-right: 5px;
        }
      `}</style>
    </header>
  );
}
