import { useEffect, useState } from "react";
import { SOCIAL_LINKS } from "./socialLinks.jsx";

// Stays off-screen for the first 5s so it doesn't compete for attention while
// the hero is still loading/settling, then slides in from the right edge.
const REVEAL_DELAY_MS = 5000;

export default function FloatingSocial() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed right-0 top-1/2 z-40 flex flex-col gap-2 transition-transform duration-500 ease-out"
      style={{ transform: `translate(${visible ? "0%" : "100%"}, -50%)` }}
    >
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.href}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          title={social.label}
          className="w-11 h-11 flex items-center justify-center rounded-l-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:-translate-x-1 transition-all"
        >
          <span className="w-5 h-5">{social.icon}</span>
        </a>
      ))}
    </div>
  );
}
