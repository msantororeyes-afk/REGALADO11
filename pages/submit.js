import { useState } from "react";

export default function SubmitDeal() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    link: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    const res = await fetch("/api/add-deal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("✅ Deal submitted successfully!");
      setForm({ title: "", description: "", price: "", category: "", link: "" });
    } else {
      setStatus("❌ Error submitting deal");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Submit a New Deal</h1>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Deal title"
          value={form.title}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <input
          name="price"
          placeholder="Price or Discount"
          value={form.price}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <input
          name="link"
          placeholder="Store link (optional)"
          value={form.link}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#0070f3",
            color: "white",
            padding: "10px 20px",
            border: "none",
            cursor: "pointer",
            borderRadius: 6,
          }}
        >
          Submit
        </button>
      </form>
      <p style={{ marginTop: 20 }}>{status}</p>
    </div>
  );
}
