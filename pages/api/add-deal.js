// pages/api/add-deal.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    console.log('🔹 Incoming body:', req.body);

    const { title, description, price, category } = req.body;

    if (!title || !description || !price || !category) {
      console.error('❌ Missing fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('✅ Attempting to insert into Supabase...');

    const { data, error } = await supabase
      .from('deals')
      .insert([{ title, description, price, category }])
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Deal added successfully:', data);
    return res.status(200).json({ message: 'Deal added successfully', data });
  } catch (err) {
    console.error('💥 Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}
