import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Deal {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  url: string;
  created_at: string;
}

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching deals:", error.message);
      } else {
        setDeals(data || []);
      }
      setLoading(false);
    }

    fetchDeals();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading deals...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">🔥 REGALADO Deals</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <a
              key={deal.id}
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-2xl p-5 shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">{deal.title}</h2>
              <p className="text-gray-600 mb-2">{deal.description}</p>
              <p className="font-bold text-green-600 text-lg mb-2">
                ${deal.price.toFixed(2)}
              </p>
              <span className="text-sm text-blue-500">{deal.category}</span>
            </a>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No deals available yet.
          </p>
        )}
      </div>
    </div>
  );
}
