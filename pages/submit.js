import { useState } from "react";

export default function SubmitDeal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting...");

    const res = await fetch("/api/add-deal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, price, category, link }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Deal submitted successfully!");
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setLink("");
    } else {
      setMessage(`❌ Error: ${data.error}`);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Submit a Deal 💸</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="number"
          placeholder="Price (S/)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="url"
          placeholder="Deal Link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>Submit</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
