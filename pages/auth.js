import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleAuth(e) {
    e.preventDefault();
    setMessage("");

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) return setMessage(`❌ ${error.message}`);

    setMessage(isLogin ? "✅ Logged in successfully" : "✅ Check your email to confirm account");

    // redirect to homepage if login succeeds
    if (isLogin && data?.session) router.push("/");
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", textAlign: "center" }}>
      <Link href="/">
        <img src="/logo.png" alt="Regalado logo" style={{ height: 90, marginBottom: 30 }} />
      </Link>

      <h2 style={{ color: "#0070f3", marginBottom: 20 }}>
        {isLogin ? "Log In to Regalado" : "Create Account"}
      </h2>

      <form
        onSubmit={handleAuth}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          style={{
            background: "#0070f3",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {isLogin ? "Log In" : "Sign Up"}
        </button>
      </form>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}

      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{
          background: "none",
          border: "none",
          color: "#0070f3",
          cursor: "pointer",
          marginTop: 20,
        }}
      >
        {isLogin ? "Need an account? Sign Up" : "Already have one? Log In"}
      </button>
    </div>
  );
}
