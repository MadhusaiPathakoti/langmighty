import LegalPageShell from "./LegalPageShell.jsx";

const SUPPORT_EMAIL = "langmighty@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell path="/privacy-policy" title="Privacy Policy" updated="6 September 2026">
      <p>
        This Privacy Policy explains how LangMighty ("we", "us"), operated by Madhusai Pathakoti
        (Hyderabad, Telangana, India), collects, uses, and protects your information when you use
        langmighty.in and its features (Translate, AI Chat, Playground, Roadmap, and the PDF Store).
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> your email address and, if you sign in with Google,
          your name and profile photo, via Supabase Authentication.
        </li>
        <li>
          <strong>Content you provide:</strong> text you translate or chat with the AI tutor about, so
          we can generate and return a response.
        </li>
        <li>
          <strong>Purchase information:</strong> for PDF Store purchases, payment is processed entirely
          by Razorpay — we never see or store your card, UPI, or bank details. We store only the order
          status and which item you purchased.
        </li>
        <li>
          <strong>Support tickets:</strong> if you contact us via the in-app "Contact Admin" form, we
          store your message, optional email, and any attachments you choose to upload.
        </li>
        <li>
          <strong>Local device storage:</strong> your conversation history, language preferences, and
          theme are saved in your browser's local storage and are not transmitted to us unless you
          explicitly export or share them.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To provide translation, AI chat, and learning features you request.</li>
        <li>To verify your account and enforce fair usage of Translate/AI Chat.</li>
        <li>To process PDF Store purchases and deliver your download and password.</li>
        <li>To respond to support requests.</li>
        <li>
          To send you product or promotional emails, only if you opted in to marketing communications.
        </li>
      </ul>

      <h2>Third-party services</h2>
      <p>We rely on the following third parties to operate LangMighty:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication and database storage.
        </li>
        <li>
          <strong>Google Gemini</strong> and <strong>Groq</strong> — process the text you submit to
          generate translations, chat replies, and pronunciation.
        </li>
        <li>
          <strong>Razorpay</strong> — payment processing for the PDF Store and subscriptions.
        </li>
        <li>
          <strong>Resend</strong> — delivers admin email notifications for support tickets.
        </li>
        <li>
          <strong>Upstash Redis</strong> — caches translation results and enforces rate limits.
        </li>
      </ul>
      <p>Each of these providers processes data under their own privacy policy and security practices.</p>

      <h2>Data retention</h2>
      <p>
        We retain account and purchase records for as long as your account is active, and support
        tickets for as long as needed to resolve and audit them. You may request deletion of your
        account and associated data at any time by contacting us.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by emailing{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Continued use of LangMighty after a change means
        you accept the revised policy.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or
        see our <a href="/contact-us">Contact Us</a> page.
      </p>
    </LegalPageShell>
  );
}
