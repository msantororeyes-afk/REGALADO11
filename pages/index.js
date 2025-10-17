import { useEffect, useState } from "react";

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch("/api/deals");
        if (!response.ok) throw new Error("Failed to fetch deals");
        const data = await response.json();
        setDeals(data);
      } catch (err) {
        console.error(err);
        setError("Could not load deals");
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  if (loading) return <main style={styles.main}><h2>Loading deals...</h2></main>;
  if (error) return <main style={styles.main}><h2>{error}</h2></main>;

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>REGALADO — Best Deals in Peru 🇵🇪</h1>
      <div style={styles.grid}>
        {deals.length === 0 ? (
          <p>No deals available yet.</p>
        ) :{deals.map((deal) => (
  <div
    key={deal.id}
    style={{
      border: "1px solid #eee",
      borderRadius: "10px",
      padding: "12px",
      background: "#fff",
      marginBottom: "16px",
    }}
  >
    {/* Image (if available) */}
    {deal.image_url && (
      <img
        src={deal.image_url}
        alt={deal.title}
        style={{
          width: "100%",
          height: "180px",
          objectFit: "cover",
          borderRadius: "8px",
          marginBottom: "8px",
        }}
      />
    )}

    {/* Title and description */}
    <h3 style={{ margin: "6px 0", fontWeight: "600" }}>{deal.title}</h3>
    <p style={{ color: "#555", marginBottom: "6px" }}>{deal.description}</p>

    {/* Prices */}
    <div style={{ marginTop: "8px" }}>
      {deal.original_price && (
        <span
          style={{
            textDecoration: "line-through",
            color: "#999",
            marginRight: "8px",
          }}
        >
          S/{Number(deal.original_price).toFixed(2)}
        </span>
      )}
      <span style={{ color: "#1a7f37", fontWeight: "700" }}>
        S/{Number(deal.price).toFixed(2)}
      </span>
    </div>

    {/* Category */}
    <div style={{ marginTop: "8px", fontSize: "13px", color: "#0b74de" }}>
      {deal.category}
    </div>
  </div>
))}


const styles = {
  main: {
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  title: {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: "2rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
  },
  card: {
    background: "#fff",
    padding: "1rem",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
};
