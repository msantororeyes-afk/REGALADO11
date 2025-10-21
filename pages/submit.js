import { useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("⚠️ Please log in before submitting a deal.");
        setLoading(false);
        return;
      }

      let image_url = null;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("deal-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("deal-images").getPublicUrl(fileName);

        image_url = publicUrl;
      }

      const newDeal = {
        ...formData,
        price: parseFloat(formData.price) || null,
        original_price: parseFloat(formData.original_price) || null,
        discount: parseInt(formData.discount) || null,
        image_url,
        posted_by: user.id,
      };

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
      <Header />

      <main className="submit-container">
        <div className="form-card">
          <h1>Submit a New Deal</h1>
          <p className="form-subtitle">
            Share a great offer you found! Include the link and image for better visibility.
          </p>

          <form onSubmit={handleSubmit} className="deal-form">
            <input type="text" name="title" placeholder="Deal title" value={formData.title} onChange={handleChange} required />
            <textarea name="description" placeholder="Deal description" value={formData.description} onChange={handleChange} required></textarea>

            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select category</option>
              <option value="Tech & Electronics">Tech & Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Housing">Housing</option>
              <option value="Groceries">Groceries</option>
              <option value="Travel">Travel</option>
            </select>

            <div className="price-row">
              <input type="number" name="original_price" placeholder="Original price (S/.)" value={formData.original_price} onChange={handleChange} />
              <input type="number" name="price" placeholder="Discounted price (S/.)" value={formData.price} onChange={handleChange} />
              <input type="number" name="discount" placeholder="Discount %" value={formData.discount} onChange={handleChange} />
            </div>

            <input type="url" name="link" placeholder="Store or product link" value={formData.link} onChange={handleChange} />

            <label className="file-upload">
              Upload image:
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Deal"}
            </button>
          </form>

          {message && <p className="status-message">{message}</p>}
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js + Supabase</p>
      </footer>
    </div>
  );
}
