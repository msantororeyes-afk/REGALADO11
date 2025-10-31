// /lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// 🧭 Log for sanity check during local development
console.log("🔍 SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

// ✅ Read from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 🚫 Safety check to warn if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
}

// ✅ Create a single client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Keeps user logged in between refreshes
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
