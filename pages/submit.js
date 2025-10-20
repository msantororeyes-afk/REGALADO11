// /pages/submit.js
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmitDeal() {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");

  // Image upload state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const categories = [
    "Tech & Electronics",
    "Fashion",
    "Housing",
    "Groceries",
    "Travel",
  ];

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // optional 5MB cap
    if (f.size > 5 * 1024 * 1024) {
      setMessage("❌ Image too large (max 5MB).");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  async function uploadImageToStorage(fileObj) {
    // Ensure you’ve created a public bucket named: deal-images
    const fileExt = fileObj.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from("deal-images")
      .upload(filePath, fileObj, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase
      .storage
      .from("deal-images")
      .getPublicUrl(filePath);

    return publicData.publicUrl; // final CDN url
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      let image_url = null;
      if (file) {
        image_url = await uploadImageToStorage(file);
      }

      const priceNum = price ? parseFloat(price) : null;
      const origNum = originalPrice ? parseFloat(originalPrice) : null;

      const discount_percent =
        priceNum && origNum && origNum > priceNum
          ? Math.round(((origNum - priceNum) / origNum) * 100)
          : null;

      const { error } = await supabase.from("deals").insert([
        {
          title,
          description,
          price: priceNum,
          original_price: origNum,
          category,
          link,
          image_url,
          discount: discount_percent, // if your column is discount_percent, rename here
        },
      ]);

      if (error) {
        console.error(error);
        setMessage("❌ Error submitting deal.");
      } else {
        setMessage("✅ Deal submitted successfully!");
        // Reset form
        setTitle("");
        setDescription("");
        setPrice("");
        setOriginalPrice("");
        setCategory("");
        setLink("");
        setFile(null);
        setPreview("");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Image upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* HEADER (uses global classes so the logo is large like homepage) */}
      <header className="header">
        <Link href="/" className="logo">
          <img src="/logo.png" alt="Regalado logo" className="logo-image" />
        </Link>

        <div className="search-bar">
          <input disabled placeholder="Search disabled on this page" />
          <button className="search-button" aria-label="Search" disabled>
            🔍
          </button>
        </div>

        <div className="header-buttons">
          <Link href="/"><button>Home</button></Link>
          <Link href="/"><button>Categories</button></Link>
          <Link href="/"><button>Coupons</button></Link>
        </div>
      </header>

      {/* Simple subnav (optional) */}
      <nav className="navbar">
        <div className="dropdown">
          <span>Categories ⌄</span>
          <div>
            {categories.map((c) => (
              <Link key={c} href={`/category/${encodeURIComponent(c)}`}>{c}</Link>
            ))}
          </div>
        </div>

        <div className="dropdown">
          <span>Coupons ⌄</span>
          <div>
            <Link href="/coupons/rappi">Rappi</Link>
            <Link href="/coupons/pedidosya">PedidosYa</Link>
            <Link href="/coupons/cabify">Cabify</Link>
            <Link href="/coupons/mercadolibre">MercadoLibre</Link>
          </div>
        </div>
      </nav>

      {/* FORM */}
      <main style={{ maxWidth: 760, margin: "30px auto", padding: "0 16px" }}>
        <h1 style={{ textAlign: "center", marginBottom: 18, color: "#0070f3" }}>
          Submit a New Deal
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            display: "grid",
            gap: 12,
          }}
        >
          <input
            type="text"
            placeholder="Deal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              type="number"
              step="0.01"
              placeholder="Current price (S/.)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Original price (S/.)"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              type="text"
              placeholder="Category (e.g., Tech & Electronics)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <input
              type="url"
              placeholder="Store or product link (https://...)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {/* FILE UPLOAD */}
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 10,
              padding: 16,
              background: "#f9fafb",
            }}
          >
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              Product image (JPG/PNG, max 5MB)
            </label>
            <input type="file" accept="image/*" onChange={onFileChange} />
            {preview && (
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{ maxWidth: "100%", height: 180, objectFit: "contain" }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? "#93c5fd" : "#0070f3",
              color: "white",
              border: "none",
              padding: "12px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Deal"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: 12,
              textAlign: "center",
              color: message.startsWith("✅") ? "green" : "red",
            }}
          >
            {message}
          </p>
        )}
      </main>
    </div>
  );
}
