import LegalPageShell from "./LegalPageShell.jsx";

const SUPPORT_EMAIL = "langmighty@gmail.com";

export default function RefundPolicyPage() {
  return (
    <LegalPageShell path="/refund-policy" title="Refund & Cancellation Policy" updated="6 September 2026">
      <h2>PDF Store purchases</h2>
      <p>
        Each PDF Store item is a one-time purchase for a digital download. Because the content is
        unlocked and made available to you immediately after payment, <strong>purchases are final and
        non-refundable once the download password has been issued</strong>, except where the download
        itself fails due to a technical error on our side (for example, a corrupted file or the
        password not working) — in that case we will fix the issue and re-issue your access, or refund
        you if we cannot.
      </p>
      <p>
        If a payment is deducted but you never receive access (e.g. a failed or duplicate transaction),
        contact us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your order details
        and we'll resolve it, including a refund where appropriate.
      </p>

      <h2>Subscriptions</h2>
      <p>
        Paid subscription plans renew automatically each billing period until cancelled. You can cancel
        at any time from the Plans page — cancelling stops future billing but keeps your plan active
        through the period you've already paid for. We do not provide partial refunds for the unused
        portion of a current billing cycle.
      </p>

      <h2>Payment failures</h2>
      <p>
        If a payment fails or is declined by Razorpay, no charge is made, or any amount deducted is
        automatically reversed by Razorpay to your original payment method, typically within 7 working
        days.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your registered email and
        order/payment ID. We aim to respond within 2–3 business days. Approved refunds are issued to
        the original payment method via Razorpay and may take 5–7 business days to reflect.
      </p>
    </LegalPageShell>
  );
}
