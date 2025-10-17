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
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadImage(file) {
    if (!file) return null;
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Put images under a folder for easier housekeeping
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
      console.error("Unexpected upload error", err);
      return null;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Submitting...");

    // Basic validation
    if (!title || !description || !price || !originalPrice || !category) {
      setStatus("Please fill all required fields.");
      setLoading(false);
      return;
    }

    // Upload image first (if any)
    let imageUrl = null;
    if (file) {
      setStatus("Uploading image...");
      imageUrl = await uploadImage(file);
      if (!imageUrl) {
        setStatus("Image upload failed — try again.");
        setLoading(false);
        return;
      }
    }

    // Now POST to your server API that inserts to Supabase
    setStatus("Saving deal...");
    try {
      const resp = await fetch("/api/add-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          original_price: originalPrice,
          price,
          category,
          image_url: imageUrl,
          url: "", // optional - you can add a link field on the form and pass it
        }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        console.error("API error", json);
        setStatus("Error saving deal: " + (json.error || json.message || resp.status));
      } else {
        setStatus("✅ Deal submitted!");
        // reset form
        setTitle("");
        setDescription("");
        setOriginalPrice("");
        setPrice("");
        setCategory("");
        setFile(null);
      }
    } catch (err) {
      console.error(err);
      setStatus("Network or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Submit a Deal</h1>
      <form onSubmit={handleSubmit}>
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={fieldStyle} />
        <textarea required placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...fieldStyle, minHeight: 100 }} />
        <input required placeholder="Original price (S/)" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} style={fieldStyle} />
        <input required placeholder="Discount price (S/)" value={price} onChange={(e) => setPrice(e.target.value)} style={fieldStyle} />
        <input required placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={fieldStyle} />
        <div style={{ marginBottom: 12 }}>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Working..." : "Submit Deal"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>{status}</p>
    </div>
  );
}

const fieldStyle = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #ddd",
};

const buttonStyle = {
  background: "#0070f3",
  color: "#fff",
  padding: "10px 16px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

