import useDocumentMeta from "../../hooks/useDocumentMeta.js";
import SeoPageShell from "../seo/SeoPageShell.jsx";

// Shared layout for the static legal/business pages Razorpay's website
// verification checks for (Privacy Policy, Terms, Refund Policy, Contact) —
// reuses SeoPageShell so they get the same header/footer as the SEO
// landing pages instead of a one-off layout.
export default function LegalPageShell({ path, title, updated, children }) {
  useDocumentMeta({
    title: `${title} | LangMighty`,
    description: `${title} for LangMighty.`,
    path,
  });

  return (
    <SeoPageShell ctaTo="/" ctaLabel="Go to LangMighty →">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{title}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: {updated}</p>
      <div className="mt-8 space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 dark:[&_h2]:text-gray-100 [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:underline">
        {children}
      </div>
    </SeoPageShell>
  );
}
