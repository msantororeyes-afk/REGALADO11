import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoryPage() {
  const router = useRouter();
  const { name } = router.query;
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    if (!name) return;
    async function fetchDeals() {
      const res = await fetch("/api/deals");
      const data = await res.json();
      const filtered = data.filter(
        (d) => d.category.toLowerCase() === decodeURIComponent(name).toLowerCase()
      );
      setDeals(filtered);
    }
    fetchDeals();
  }, [name]);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>
        Deals in {decodeURIComponent(name)} 🛍️
      </h1>

      {deals.length === 0 ? (
        <p style={{ textAlign: "center" }}>No deals found for this category yet.</p>
      ) : (
        <div className="deals-grid">
          {deals.map((deal) => (
            <Link key={deal.id} href={`/deal/${deal.id}`}>
              <div className="deal-card">
                {deal.image_url && <img src={deal.image_url} alt={deal.title} />}
                <div className="content">
                  <h2>{deal.title}</h2>
                  <p>{deal.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
