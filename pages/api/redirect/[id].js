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

    // 🟣 Affiliate injection (safe fallback: if anything fails, redirect to target)
    let finalUrl = target;
    let matchedMerchant = null;

    try {
      const targetUrl = new URL(target);
      const host = (targetUrl.hostname || "").replace(/^www\./i, "").toLowerCase();

      const { data: merchants, error: merchantsError } = await supabaseAdmin
        .from("affiliate_merchants")
        .select("merchant_key, base_domain, affiliate_type, affiliate_param, affiliate_value, active")
        .eq("active", true);

      if (!merchantsError && Array.isArray(merchants) && merchants.length > 0) {
        matchedMerchant =
          merchants.find((m) => {
            const base = (m.base_domain || "").replace(/^www\./i, "").toLowerCase();
            if (!base) return false;
            return host === base || host.endsWith("." + base);
          }) || null;

        if (matchedMerchant) {
          const type = matchedMerchant.affiliate_type;

          if (type === "query_param") {
            const p = matchedMerchant.affiliate_param;
            const v = matchedMerchant.affiliate_value;
            if (p && v && !targetUrl.searchParams.has(p)) {
              targetUrl.searchParams.set(p, v);
            }
            finalUrl = targetUrl.toString();
          } else if (type === "utm") {
            if (!targetUrl.searchParams.has("utm_source")) {
              targetUrl.searchParams.set("utm_source", "regalado");
            }
            if (!targetUrl.searchParams.has("utm_medium")) {
              targetUrl.searchParams.set("utm_medium", "affiliate");
            }
            finalUrl = targetUrl.toString();
          } else if (type === "redirect") {
            const tpl = matchedMerchant.affiliate_value;
            if (tpl && typeof tpl === "string") {
              finalUrl = tpl.replace("{url}", encodeURIComponent(target));
            }
          }
        }
      }
    } catch (e) {
      console.warn("Affiliate injection skipped:", e?.message || e);
      finalUrl = target;
      matchedMerchant = null;
    }

    // 🟢 Increment click count in deals table
    const { error: clickError } = await supabaseAdmin.rpc("increment_clicks", {
      deal_id: id,
    });

    if (clickError) {
      console.warn("Click increment failed:", clickError.message);
    }

    // 🟣 Log affiliate click (non-blocking)
    try {
      if (matchedMerchant && finalUrl) {
        const { error: logError } = await supabaseAdmin.from("affiliate_clicks").insert({
          deal_id: id,
          merchant_key: matchedMerchant.merchant_key,
          redirected_url: finalUrl,
        });

        if (logError) {
          console.warn("Affiliate click log failed:", logError.message);
        }
      }
    } catch (e) {
      console.warn("Affiliate click log exception:", e?.message || e);
    }

    // 🟢 Redirect user
    res.writeHead(302, { Location: finalUrl || target });
    res.end();
  } catch (err) {
    console.error("Redirect handler error:", err);
    res
      .status(500)
      .json({ message: "Unexpected error", details: err.message });
  }
}
