// pages/api/add-deal.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { title, description, price, original_price, category, image_url, url } = req.body;

    // Basic validation
    if (!title || !description || !price || !original_price || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase.from("deals").insert([
      {
        title,
        description,
        price,
        original_price,
        category,
        image_url: image_url || null,
        url: url || null,
      },
    ]).select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
