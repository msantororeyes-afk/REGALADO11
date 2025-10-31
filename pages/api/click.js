import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing deal ID" });
  }

  try {
    // Increment the click count in the database
    const { error } = await supabase.rpc("increment_clicks", { deal_id: id });

    if (error) throw error;

    res.status(200).json({ message: "Click recorded" });
  } catch (err) {
    console.error("Click tracking error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
