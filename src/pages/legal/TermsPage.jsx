import LegalPageShell from "./LegalPageShell.jsx";

const SUPPORT_EMAIL = "langmighty@gmail.com";

export default function TermsPage() {
  return (
    <LegalPageShell path="/terms-and-conditions" title="Terms & Conditions" updated="6 September 2026">
      <p>
        These Terms & Conditions govern your use of LangMighty (langmighty.in), operated by Madhusai
        Pathakoti, Hyderabad, Telangana, India. By using LangMighty, you agree to these terms.
      </p>

      <h2>Using LangMighty</h2>
      <p>
        Translate and AI Chat require a signed-in account. You're responsible for keeping your account
        credentials secure and for all activity under your account. Content you translate or chat about
        is sent to third-party AI providers (Google Gemini, Groq) to generate a response — don't submit
        content you don't have the right to share.
      </p>

      <h2>PDF Store</h2>
      <p>
        PDF Store items are one-time digital purchases, paid via Razorpay. On successful payment you
        receive a password-protected download that is yours to keep. See our{" "}
        <a href="/refund-policy">Refund & Cancellation Policy</a> for details on refunds. Purchased
        PDFs are for your personal use only — you may not redistribute, resell, or publicly share the
        downloaded files or their password.
      </p>

      <h2>Subscriptions</h2>
      <p>
        Paid subscription plans renew automatically at the price shown at checkout until you cancel.
        You can cancel anytime from the Plans page; see our{" "}
        <a href="/refund-policy">Refund & Cancellation Policy</a> for how cancellation affects billing.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use LangMighty for unlawful, abusive, or harmful purposes.</li>
        <li>Attempt to bypass rate limits, authentication, or payment gates.</li>
        <li>Scrape, resell, or redistribute LangMighty's content or generated output at scale.</li>
        <li>Upload malicious files or attempt to compromise the service's security.</li>
      </ul>

      <h2>Content accuracy</h2>
      <p>
        Translations, pronunciations, and AI-generated tutoring content are produced by third-party AI
        models and provided for learning purposes. While we aim for accuracy, we don't guarantee that
        every translation or response is error-free, and LangMighty should not be relied on for legal,
        medical, or other professional translation needs.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        LangMighty is provided "as is" without warranties of any kind. To the extent permitted by law,
        we are not liable for indirect, incidental, or consequential damages arising from your use of
        the service.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time; continued use of LangMighty after a change means
        you accept the revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or
        see our <a href="/contact-us">Contact Us</a> page.
      </p>
    </LegalPageShell>
  );
}
