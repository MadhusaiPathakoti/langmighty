const RESEND_API_URL = "https://api.resend.com/emails";

// No persistent client to build (this is a single REST call), so — same as
// the other _lib getters — env vars are read fresh on every call rather than
// cached at import time.
//
// Fails open (logs and returns { skipped: true }) rather than throwing when
// RESEND_API_KEY isn't configured, so a ticket still gets recorded in
// support_tickets/the admin inbox even before email notifications are set up.
export async function sendAdminNotificationEmail({ subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn("Resend not configured (RESEND_API_KEY/ADMIN_NOTIFICATION_EMAIL missing) — skipping email send.");
    return { skipped: true };
  }

  // resend.dev's shared sender works without verifying a domain first, so
  // notifications work out of the box; set RESEND_FROM_EMAIL once a sending
  // domain is verified in the Resend dashboard.
  const from = process.env.RESEND_FROM_EMAIL || "LangMighty <onboarding@resend.dev>";

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API error: ${errText}`);
  }

  return response.json();
}
