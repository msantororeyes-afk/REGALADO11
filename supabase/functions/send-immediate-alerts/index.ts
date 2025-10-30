// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv/load.ts";

// Environment variables (automatically injected in Supabase)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Resend API setup
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_API_URL = "https://api.resend.com/emails";

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();

    if (!record) {
      return new Response("No record payload found.", { status: 400 });
    }

    const deal = record;
    console.log("🆕 New deal detected:", deal.title);

    // Fetch all user alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("deal_alerts")
      .select("user_id, alert_type, alert_value");

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      return new Response("No alerts to check.", { status: 200 });
    }

    // Match alerts
    const matches = alerts.filter((a) => {
      if (a.alert_type === "category") {
        return a.alert_value === deal.category;
      }
      if (a.alert_type === "coupon") {
        return a.alert_value === deal.category;
      }
      if (a.alert_type === "affiliate_store") {
        return a.alert_value === deal.category;
      }
      if (a.alert_type === "keyword") {
        const keyword = a.alert_value.toLowerCase();
        return (
          deal.title?.toLowerCase().includes(keyword) ||
          deal.description?.toLowerCase().includes(keyword)
        );
      }
      return false;
    });

    if (matches.length === 0) {
      console.log("ℹ️ No users matched alerts for this deal.");
      return new Response("No matches.", { status: 200 });
    }

    // Get users that have immediate notifications enabled
    const userIds = matches.map((m) => m.user_id);
    const { data: settings, error: settingsError } = await supabase
      .from("alert_settings")
      .select("user_id, immediate_enabled")
      .in("user_id", userIds);

    if (settingsError) throw settingsError;

    const usersToNotify = settings
      ?.filter((s) => s.immediate_enabled)
      .map((s) => s.user_id);

    if (!usersToNotify || usersToNotify.length === 0) {
      console.log("ℹ️ No users with immediate alerts enabled.");
      return new Response("No immediate alerts to send.", { status: 200 });
    }

    // Get user emails
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", usersToNotify);

    if (profilesError) throw profilesError;

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const userMap: Record<string, string> = {};
    authUsers.users.forEach((u) => {
      userMap[u.id] = u.email!;
    });

    // Send Resend emails
    for (const userId of usersToNotify) {
      const email = userMap[userId];
      if (!email) continue;

      const subject = `🔥 New deal that matches your alert: ${deal.title}`;
      const html = `
        <div style="font-family:Arial, sans-serif; line-height:1.5;">
          <h2 style="color:#e63946;">${deal.title}</h2>
          <p>${deal.description}</p>
          ${
            deal.image_url
              ? `<img src="${deal.image_url}" alt="${deal.title}" style="max-width:100%; border-radius:8px;">`
              : ""
          }
          <p><strong>Category:</strong> ${deal.category}</p>
          <p><strong>Discount:</strong> ${
            deal.discount ? deal.discount + "%" : "N/A"
          }</p>
          <a href="${deal.url}" target="_blank" style="background:#0070f3; color:white; padding:10px 20px; border-radius:5px; text-decoration:none;">View Deal</a>
          <br><br>
          <small>You're receiving this alert because you have "Immediate deal notifications" enabled in your Regalado profile.</small>
        </div>
      `;

      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Regalado Alerts <alerts@regalado.pe>",
          to: [email],
          subject,
          html,
        }),
      });

      console.log(`📧 Sent email to ${email}: ${res.status}`);
    }

    return new Response("Immediate alerts sent.", { status: 200 });
  } catch (err: any) {
    console.error("❌ Error in send-immediate-alerts:", err);
    return new Response("Error processing alert", { status: 500 });
  }
});
