import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmitDeal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const discountPercent = originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

    const { error } = await supabase.from("deals").insert([
      {
        title,
        description,
        price,
        original_price: originalPrice,
        category,
        link,
        image_url: imageUrl,
        discount_percent: discountPercent,
      },
    ]);

    if (error) {
      console.error(error);
      setMessage("❌ Error submitting deal.");
    } else {
      setMessage("✅ Deal submitted successfully!");
      setTitle("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setCategory("");
      setLink("");
      setImageUrl("");
    }
  };

  return (
    <div>
      {/* ---------- HEADER ---------- */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link href="/" className="logo" style={{ cursor: "pointer" }}>
          <img
            src="/logo.png"
            alt="Regalado logo"
            style={{ height: "45px", width: "auto" }}
          />
        </Link>

        <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link href="/" className="nav-item">
            Categories
          </Link>
          <Link href="/" className="nav-item">
            Coupons
          </Link>
        </nav>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#0070f3",
          }}
        >
          Submit a New Deal
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
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
            required
          />
          <input
            type="number"
            placeholder="Current price (S/)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Original price (S/)"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
          />
          <input
            type="text"
            placeholder="Category (e.g., Tech, Fashion)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            type="text"
            placeholder="Store or product link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <button
            type="submit"
            style={{
              background: "#0070f3",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Submit Deal
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
              color: message.includes("✅") ? "green" : "red",
            }}
          >
            {message}
          </p>
        )}
      </main>
    </div>
  );
}
