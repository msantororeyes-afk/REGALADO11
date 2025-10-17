import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { title, description, price, category, link } = req.body;

    const { error } = await supabase.from("deals").insert([
      { title, description, price, category, link },
    ]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
