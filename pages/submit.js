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
    url: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    const { original_price, price } = formData;
    if (original_price && price && parseFloat(original_price) > 0) {
      const discount = Math.round(
        ((parseFloat(original_price) - parseFloat(price)) / parseFloat(original_price)) * 100
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

      let posted_by = null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      posted_by = profile?.username || null;

      let image_url = null;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("deals-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("deals-images").getPublicUrl(fileName);

        image_url = publicUrl;
      }

      // 1️⃣ Insert the new deal
      const { data: insertedDeal, error: insertError } = await supabase
        .from("deals")
        .insert([
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            price: parseFloat(formData.price) || null,
            original_price: parseFloat(formData.original_price) || null,
            discount: parseInt(formData.discount) || null,
            url: formData.url.trim(),
            image_url,
            user_id: user.id,
            posted_by,
            created_at: new Date(),
          },
        ])
       .select();

      if (insertError) throw insertError;

      const dealId = insertedDeal.id;

      // 2️⃣ Find users with matching alerts
      const { data: alerts, error: alertsError } = await supabase
        .from("deal_alerts")
        .select("user_id, alert_type, alert_value");

      if (alertsError) throw alertsError;

      const matches = alerts.filter((a) => {
        if (a.alert_type === "category") {
          return a.alert_value === insertedDeal.category;
        }
        if (a.alert_type === "coupon") {
  return a.alert_value === insertedDeal.category;
}
        if (a.alert_type === "affiliate_store") {
          return a.alert_value === insertedDeal.category;
        }
      if (a.alert_type === "keyword") {
  const keyword = a.alert_value?.toLowerCase() || "";
  const title = insertedDeal.title?.toLowerCase() || "";
  const description = insertedDeal.description?.toLowerCase() || "";

  return title.includes(keyword) || description.includes(keyword);
}

        return false;
      });

      // 3️⃣ Insert matches into email_digest_queue
      if (matches.length > 0) {
        const entries = matches.map((m) => ({
          user_id: m.user_id,
          deal_id: dealId,
          immediate: false,
          created_at: new Date(),
        }));

        const { error: queueError } = await supabase
          .from("email_digest_queue")
          .insert(entries);

        if (queueError) throw queueError;
        console.log(`✅ Queued ${entries.length} users for digest`);
      } else {
        console.log("ℹ️ No alert matches found for this deal");
      }

      // 4️⃣ Final UI feedback
      setMessage("✅ Deal submitted successfully!");
      setFormData({
        title: "",
        description: "",
        category: "",
        price: "",
        original_price: "",
        discount: "",
        url: "",
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
            <input type="text" name="title" placeholder="Deal title" value={formData.title} onChange={handleChange} required />
            <textarea name="description" placeholder="Deal description" value={formData.description} onChange={handleChange} required />
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "0.95rem" }}
            >
              <option value="">Select one...</option>
              <optgroup label="📦 Categories">
                {categories.map((cat) => (
                  <option key={`category-${cat}`} value={cat}>{cat}</option>
                ))}
              </optgroup>
              <optgroup label="🏷️ Coupons">
                {coupons.map((cp) => (
                  <option key={`coupon-${cp}`} value={cp}>{cp}</option>
                ))}
              </optgroup>
              <optgroup label="🛒 Affiliate Stores">
                {affiliateStores.map((st) => (
                  <option key={`affiliate-${st}`} value={st}>{st}</option>
                ))}
              </optgroup>
            </select>

            <div className="price-row" style={{ display: "flex", gap: "8px" }}>
              <input type="number" name="original_price" placeholder="Original price (S/.)" value={formData.original_price} onChange={handleChange} />
              <input type="number" name="price" placeholder="Discounted price (S/.)" value={formData.price} onChange={handleChange} />
              <div style={{ display: "flex", alignItems: "center" }}>
                <input type="number" name="discount" placeholder="Discount %" value={formData.discount} readOnly style={{ backgroundColor: "#f9f9f9", width: "80px", textAlign: "center" }} />
                <span style={{ marginLeft: "4px", fontWeight: "600" }}>%</span>
              </div>
            </div>

            <input type="url" name="url" placeholder="Store or product link" value={formData.url} onChange={handleChange} />

            <label className="file-upload">
              Upload image:
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>

            <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Deal"}</button>
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
