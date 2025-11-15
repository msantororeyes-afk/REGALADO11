// /pages/api/comment-redirect.js
export default function handler(req, res) {
  try {
    const raw = req.query.url;
    if (!raw) return res.status(400).send("Missing URL");

    const url = decodeURIComponent(raw);

    // 1) Block dangerous schemes
    if (
      url.startsWith("javascript:") ||
      url.startsWith("data:") ||
      url.startsWith("vbscript:")
    ) {
      return res.status(400).send("Unsafe URL blocked");
    }

    // 2) Basic URL validation
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return res.status(400).send("Invalid URL");
    }

    // 3) OPTIONAL: Domain allowlist (edit this anytime)
    const allowed = [
      "falabella.com",
      "plazavea.com.pe",
      "oechsle.pe",
      "sodimac.com.pe",
      "amazon.com",
      "mercadolibre.com.pe",
      "linio.com.pe",
      "hiraoka.com.pe",
      // Add more safely
    ];

    const rootDomain = parsed.hostname.replace("www.", "");

    // If you want STRICT allowlist:
    // if (!allowed.includes(rootDomain)) {
    //   return res.status(403).send("Domain not allowed");
    // }

    // 4) Perform redirect
    res.writeHead(307, { Location: url });
    res.end();
  } catch (err) {
    console.error("comment redirect error:", err);
    res.status(500).send("Internal server error");
  }
}
