import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // If an ID is provided (for detail view)
    if (req.query.id) {
      const { data, error } = await supabase
        .from("deals")
        .select("*") // ✅ fetch all columns, including product_url
        .eq("id", req.query.id);

      if (error) throw error;
      return res.status(200).json(data);
    }

    // Otherwise, return all deals
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching deals:", err.message);
    res.status(500).json({ error: err.message });
  }
}
