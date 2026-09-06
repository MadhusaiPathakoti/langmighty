import LegalPageShell from "./LegalPageShell.jsx";

const SUPPORT_EMAIL = "langmighty@gmail.com";

export default function ContactUsPage() {
  return (
    <LegalPageShell path="/contact-us" title="Contact Us" updated="6 September 2026">
      <p>
        LangMighty is operated by <strong>Madhusai Pathakoti</strong>, an individual seller based in
        Hyderabad, Telangana, India.
      </p>

      <h2>Get in touch</h2>
      <p>
        For questions about your account, a purchase from the PDF Store, a subscription, or anything
        else, email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. You can also use the{" "}
        <strong>🛟 Contact Admin</strong> button available inside the app (no sign-in required) to send
        a report directly, with screenshots if helpful.
      </p>

      <h2>Business address</h2>
      <p>Hyderabad, Telangana, India</p>

      <h2>Response time</h2>
      <p>We aim to respond to all support requests within 2–3 business days.</p>
    </LegalPageShell>
  );
}
