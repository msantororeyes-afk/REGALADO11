// Server-side redirect handler: increments click count then redirects to target URL stored in 'url' or 'product_url'
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    // 🟢 Fetch the deal using your actual column names
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, url, product_url")
      .eq("id", id)
      .maybeSingle();

    if (dealError || !deal) {
      console.error("Deal fetch error:", dealError);
      return res.status(404).json({
        message: "Error fetching deal",
        details: dealError?.message || "No deal found",
      });
    }

    // 🟢 Choose which URL to redirect to
    const target = deal.product_url || deal.url;

    if (!target) {
      return res
        .status(400)
        .json({ message: "Deal has no valid URL or product_url field" });
    }

    // 🟢 Increment click count in deals table
    const { error: clickError } = await supabaseAdmin.rpc("increment_clicks", {
      deal_id: id,
    });

    if (clickError) {
      console.warn("Click increment failed:", clickError.message);
    }

    // 🟢 Redirect user
    res.writeHead(302, { Location: target });
    res.end();
  } catch (err) {
    console.error("Redirect handler error:", err);
    res
      .status(500)
      .json({ message: "Unexpected error", details: err.message });
  }
}
