import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  try {
    const msg = {
      to: "msantororeyes@gmail.com", // change this to where you want the test email delivered
      from: process.env.SENDGRID_FROM_EMAIL, // must be your verified sender in SendGrid
      subject: "✅ Test Email from Regalado",
      text: "If you received this, SendGrid is configured correctly!",
    };

    await sgMail.send(msg);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("SendGrid error:", error);
    const details = error?.response?.body || error.message || "Unknown error";
    res.status(500).json({ success: false, error: details });
  }
}
