import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function DealAlertModal({ onClose }) {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedCps, setSelectedCps] = useState([]);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchUser();

    setCategories([
      "Tech & Electronics", "Fashion", "Travel", "Gaming", "Restaurants", "Groceries"
    ]);
    setCoupons(["Amazon", "Rappi", "Linio", "Ripley", "Falabella"]);
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      alert("Please log in to create deal alerts.");
      return;
    }

    const { error } = await supabase
      .from("deal_alerts")
      .upsert({
        user_id: user.id,
        categories: selectedCats,
        coupons: selectedCps,
      });

    if (error) console.error(error);
    else alert("✅ Deal alerts saved successfully!");
    onClose();
  };

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>Set Deal Alerts</h2>

        <h3>Categories</h3>
        <div className="checkbox-group">
          {categories.map(cat => (
            <label key={cat}>
              <input
                type="checkbox"
                checked={selectedCats.includes(cat)}
                onChange={() => toggle(selectedCats, setSelectedCats, cat)}
              />
              {cat}
            </label>
          ))}
        </div>

        <h3>Stores / Coupons</h3>
        <div className="checkbox-group">
          {coupons.map(cp => (
            <label key={cp}>
              <input
                type="checkbox"
                checked={selectedCps.includes(cp)}
                onChange={() => toggle(selectedCps, setSelectedCps, cp)}
              />
              {cp}
            </label>
          ))}
        </div>

        <div className="modal-buttons">
          <button onClick={handleSubmit}>Save Alerts</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
