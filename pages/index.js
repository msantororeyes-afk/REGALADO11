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
        ) : (
          deals.map((deal) => (
            <div key={deal.id} style={styles.card}>
              <h3>{deal.title}</h3>
              <p>{deal.description}</p>
              {deal.price && <p><strong>Price:</strong> S/{deal.price}</p>}
              {deal.discount && <p><strong>Discount:</strong> {deal.discount}%</p>}
              {deal.category && <p><em>Category:</em> {deal.category}</p>}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

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
