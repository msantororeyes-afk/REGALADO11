import { useState } from "react";

export default function SubmitDeal() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    original_price: "",
    category: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/add-deal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (res.ok) {
      alert("Deal submitted successfully!");
      setForm({
        title: "",
        description: "",
        price: "",
        original_price: "",
        category: "",
        image_url: "",
      });
    } else {
      alert("Error submitting deal.");
    }
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
      <h2>Submit a New Deal</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Original Price (e.g. 1200)"
          value={form.original_price}
          onChange={(e) => setForm({ ...form, original_price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Discounted Price (e.g. 899)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Category (e.g. Tech, Fashion, etc.)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Image URL (optional)"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Deal"}
        </button>
      </form>
    </div>
  );
}
