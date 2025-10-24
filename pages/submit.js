import { useState, useEffect } from "react";
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

  // Unified dropdown data
  const categories = [
    "Automotive", "Babies & Kids", "Books & Media", "Fashion", "Food & Beverages",
    "Gaming", "Groceries", "Health & Beauty", "Home & Living", "Housing",
    "Office Supplies", "Pets", "Restaurants", "Sports & Outdoors",
    "Tech & Electronics", "Toys & Hobbies", "Travel",
  ];

  const coupons = [
    "Amazon", "Cabify", "Falabella", "Linio", "MercadoLibre", "Oechsle",
    "PedidosYa", "PlazaVea", "Rappi", "Ripley", "Sodimac", "Tottus", "Others",
  ];

  const affiliateStores = [
    "Amazon", "AliExpress", "Shein", "Linio", "Falabella", "Ripley", "Oechsle",
    "PlazaVea", "Tottus", "MercadoLibre", "Coolbox", "Estilos", "Promart",
    "Sodimac", "Booking.com", "Trip.com", "Despegar", "Rappi", "PedidosYa",
  ];

  // Auto-calculate discount whenever prices change
  useEffect(() => {
    const { original_price, price } = formData;
    if (original_price && price && parseFloat(original_price) > 0) {
      const discount = Math.round(
        ((parseFloat(original_price) - parseFloat(price)) /
          parseFloat(original_price)) *
          100
      );
      setFormData((prev) => ({ ...prev, discount: discount.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, discount: "" }));
    }
  }, [formData.original_price, formData.price]);

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

      // Upload image if available
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

      // Prepare deal data
      const newDeal = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price) || null,
        original_price: parseFloat(formData.original_price) || null,
        discount: parseInt(formData.discount) || null,
        link: formData.link.trim(),
        image_url,
        user_id: user.id,
        created_at: new Date(),
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
      console.error("❌ Error submitting deal:", error);
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

            {/* Unified dropdown for categories/coupons/affiliates */}
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                fontSize: "0.95rem",
              }}
            >
              <option value="">Select one...</option>
              <optgroup label="📦 Categories">
                {categories.map((cat) => (
                  <option key={`category-${cat}`} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🏷️ Coupons">
                {coupons.map((cp) => (
                  <option key={`coupon-${cp}`} value={cp}>
                    {cp}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🛒 Affiliate Stores">
                {affiliateStores.map((st) => (
                  <option key={`affiliate-${st}`} value={st}>
                    {st}
                  </option>
                ))}
              </optgroup>
            </select>

            <div className="price-row">
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
                readOnly
                style={{ backgroundColor: "#f9f9f9" }}
              />
            </div>

            <input
              type="url"
              name="link"
              placeholder="Store or product link"
              value={formData.link}
              onChange={handleChange}
            />

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
        <p>
          © 2025 Regalado — Best Deals in Peru 🇵🇪 | Built with ❤️ using Next.js +
          Supabase
        </p>
      </footer>
    </div>
  );
}
