import { useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function SubmitDeal() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    original_price: "",
    discount: "",
    link: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---------- Handle form field changes ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ---------- Handle image file ----------
  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // ---------- Handle deal submission ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // ✅ Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("⚠️ Please log in before submitting a deal.");
        setLoading(false);
        return;
      }

      // ✅ Upload image to Supabase Storage
      let image_url = null;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("deal-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("deal-images").getPublicUrl(fileName);

        image_url = publicUrl;
      }

      // ✅ Prepare deal data
      const newDeal = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price) || null,
        original_price: parseFloat(formData.original_price) || null,
        discount: parseInt(formData.discount) || null,
        link: formData.link,
        image_url,
        posted_by: user.id, // 🔗 link deal to user
      };

      // ✅ Insert deal into Supabase
      const { error: insertError } = await supabase.from("deals").insert([newDeal]);
      if (insertError) throw insertError;

      setMessage("✅ Deal submitted successfully!");
      setFormData({
        title: "",
        description: "",
        category: "",
        price: "",
        original_price: "",
        discount: "",
        link: "",
      });
      setImageFile(null);
    } catch (error) {
      console.error("Error submitting deal:", error);
      setMessage("❌ Error submitting deal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-page">
      {/* ---------- HEADER ---------- */}
      <header className="header">
        <Link href="/" legacyBehavior>
          <a className="logo" style={{ cursor: "pointer" }}>
            <img src="/logo.png" alt="Regalado logo" className="logo-image" />
          </a>
        </Link>

        <div className="header-buttons">
          <Link href="/">
            <button>Home</button>
          </Link>
          <Link href="/profile">
            <button>Profile</button>
          </Link>
        </div>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="container">
        <h1>Submit a New Deal</h1>

        <form onSubmit={handleSubmit} className="deal-form">
          <input
            type="text"
            name="title"
            placeholder="Deal title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Deal description"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Tech & Electronics">Tech & Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Housing">Housing</option>
            <option value="Groceries">Groceries</option>
            <option value="Travel">Travel</option>
          </select>

          <input
            type="number"
            name="original_price"
            placeholder="Original price (S/.)"
            value={formData.original_price}
            onChange={handleChange}
          />
          <input
            type="number"
            name="price"
            placeholder="Discounted price (S/.)"
            value={formData.price}
            onChange={handleChange}
          />
          <input
            type="number"
            name="discount"
            placeholder="Discount %"
            value={formData.discount}
            onChange={handleChange}
          />

          <input
            type="url"
            name="link"
            placeholder="Store or product link"
            value={formData.link}
            onChange={handleChange}
          />

          <label>
            Upload image:
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Deal"}
          </button>
        </form>

        {message && <p style={{ marginTop: "20px" }}>{message}</p>}
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using
          Next.js + Supabase
        </p>
      </footer>
    </div>
  );
}
