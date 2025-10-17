// pages/api/deals.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { id } = req.query;

    if (id) {
      // 🔹 Fetch a single deal by ID (for /deal/[id].js)
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .limit(1);

      if (error) throw error;
      return res.status(200).json(data);
    } else {
      // 🔹 Fetch all deals (for homepage)
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }
  } catch (err) {
    console.error("💥 API error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
