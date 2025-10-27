// pages/api/cron/send-digests.js
// Sends 2 digests per day (morning & evening) to users with digest_enabled=true.
// Groups all unsent queued deals per user since last send, then marks them sent.

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We’ll use RESEND for email (simple + reliable). You can switch to SendGrid easily.
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: pick current digest slot and its time window
function currentDigestWindow(now = new Date()) {
  // Morning digest window: items since 00:00 local to 12:00
  // Evening digest window: items since 12:00 to 23:59
  // Because Vercel runs in UTC, consider APP_TIMEZONE if you want; here we keep it simple and use UTC.
  const hour = now.getUTCHours();
  const slot = hour < 12 ? "AM" : "PM";

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), slot === "AM" ? 0 : 12, 0, 0));
  const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), slot === "AM" ? 12 : 23, slot === "AM" ? 0 : 59, slot === "AM" ? 0 : 59));

  return { slot, start: start.toISOString(), end: end.toISOString() };
}

export default async function handler(req, res) {
  try {
    // Only allow cron (GET)
    if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

    const { start, end } = currentDigestWindow(new Date());

    // Find all users who want digests and have unsent queued items in the current window
    const { data: users, error: usersErr } = await supabase
      .from("alert_settings")
      .select("user_id")
      .eq("digest_enabled", true);

    if (usersErr) throw usersErr;
    if (!users?.length) return res.status(200).json({ message: "No digest-enabled users" });

    const userIds = users.map(u => u.user_id);

    const { data: queue, error: queueErr } = await supabase
      .from("email_digest_queue")
      .select("id, user_id, deal_id, created_at, sent_at")
      .is("sent_at", null)
      .gte("created_at", start)
      .lte("created_at", end)
      .in("user_id", userIds);

    if (queueErr) throw queueErr;
    if (!queue?.length) return res.status(200).json({ message: "No queued items for this window" });

    // Group by user
    const byUser = new Map();
    for (const row of queue) {
      if (!byUser.has(row.user_id)) byUser.set(row.user_id, []);
      byUser.get(row.user_id).push(row);
    }

    // Preload deals for all needed ids
    const dealIds = Array.from(new Set(queue.map(q => q.deal_id)));
    const { data: deals, error: dealsErr } = await supabase
      .from("deals")
      .select("id, title, category, price, original_price, image_url")
      .in("id", dealIds);

    if (dealsErr) throw dealsErr;
    const dealsMap = new Map(deals.map(d => [d.id, d]));

    // Load user emails
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, email, username")
      .in("id", Array.from(byUser.keys()));

    if (profErr) throw profErr;
    const profMap = new Map(profiles.map(p => [p.id, p]));

    const baseUrl = process.env.APP_BASE_URL || "https://your-app-domain.com";

    // Send one email per user
    for (const [userId, rows] of byUser.entries()) {
      const prof = profMap.get(userId);
      if (!prof?.email) continue;

      const lines = rows
        .map(r => {
          const d = dealsMap.get(r.deal_id);
          if (!d) return null;
          const price = d.price ? `S/.${d.price}` : "";
          const was   = d.original_price ? ` (was S/.${d.original_price})` : "";
          return `• ${d.title} — ${d.category} ${price}${was}\n  ${baseUrl}/deals/${d.id}`;
        })
        .filter(Boolean)
        .join("\n\n");

      const html = `
        <div style="font-family:Inter,system-ui,Arial,sans-serif;line-height:1.5">
          <h2>Today’s deals for you</h2>
          <p>Hi ${prof.username || ""}!</p>
          <p>Here are the new deals that match your alerts:</p>
          <pre style="white-space:pre-wrap">${lines}</pre>
          <hr/>
          <p style="font-size:13px;color:#666">
            You’re receiving this because digests are enabled. 
            <a href="${baseUrl}/profile">Manage alert settings</a>
          </p>
        </div>
      `;

      // Send email
      await resend.emails.send({
        from: process.env.ALERTS_FROM_EMAIL || "alerts@your-domain.com",
        to: prof.email,
        subject: "Your Regalado deal digest",
        html
      });

      // Mark as sent
      const ids = rows.map(r => r.id);
      await supabase
        .from("email_digest_queue")
        .update({ sent_at: new Date().toISOString() })
        .in("id", ids);
    }

    return res.status(200).json({ message: "Digest sent" });
  } catch (err) {
    console.error("send-digests:", err);
    return res.status(500).json({ message: "Internal error" });
  }
}
