import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      title,
      description,
      price,
      original_price,
      category,
      image_url,
      product_url,
    } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: "Title and price are required." });
    }

    const { data, error } = await supabase
      .from("deals")
      .insert([
        {
          title,
          description,
          price: parseFloat(price),
          original_price: original_price ? parseFloat(original_price) : null,
          category,
          image_url,
          product_url, // ✅ make sure this gets stored!
        },
      ])
      .select("*");

    if (error) throw error;

    res.status(200).json({ message: "Deal added successfully", data });
  } catch (err) {
    console.error("Error adding deal:", err.message);
    res.status(500).json({ error: err.message });
  }
}
