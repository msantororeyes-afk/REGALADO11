// pages/submit.js
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export default function SubmitDeal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function uploadImage(file) {
    if (!file) return null;
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `deals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("deals-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("deals-images")
        .getPublicUrl(filePath);

      return publicData?.publicUrl || null;
    } catch (err) {
      console.error("Unexpected upload error:", err);
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("Submitting...");

    // Upload image first (if provided)
    let imageUrl = null;
    if (file) {
      setStatus("Uploading image...");
      imageUrl = await uploadImage(file);
      if (!imageUrl) {
        setStatus("❌ Image upload failed — try again.");
        setLoading(false);
        return;
      }
    }

    // Send deal to API
    try {
      const res = await fetch("/api/add-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          original_price: originalPrice,
          category,
          image_url: imageUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("API error:", json);
        setStatus("Error saving deal: " + (json.error || json.message));
      } else {
        setStatus("✅ Deal submitted successfully!");
        setTitle("");
        setDescription("");
        setOriginalPrice("");
        setPrice("");
        setCategory("");
        setFile(null);
      }
    } catch (err) {
      console.error(err);
      setStatus("Network or server error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: "bold" }}>Submit a New Deal</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: 20 }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Original Price (S/)"
          value={originalPrice}
          onChange={(e) => setOriginalPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Discounted Price (S/)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Category (e.g. Tech, Fashion, etc.)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Deal"}
        </button>
      </form>
      <p style={{ marginTop: 10 }}>{status}</p>
    </div>
  );
}
