import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CouponPage() {
  const router = useRouter();
  const { name } = router.query;
  const [couponCode, setCouponCode] = useState(null);

  // You can expand this later to fetch from Supabase
  const couponLinks = {
    rappi: "https://www.rappi.pe/",
    pedidosya: "https://www.pedidosya.com.pe/",
    cabify: "https://cabify.com/pe",
    mercadolibre: "https://www.mercadolibre.com.pe/",
  };

  useEffect(() => {
    if (name) {
      setCouponCode(couponLinks[name.toLowerCase()]);
    }
  }, [name]);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>
        Coupons for {decodeURIComponent(name)} 💸
      </h1>

      {couponCode ? (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <p>Visit the site below to access exclusive coupons:</p>
          <a
            href={couponCode}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#0070f3",
              color: "white",
              textDecoration: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              marginTop: "15px",
            }}
          >
            🔗 Go to {decodeURIComponent(name)}
          </a>
        </div>
      ) : (
        <p style={{ textAlign: "center" }}>No coupons available yet.</p>
      )}
    </div>
  );
}
