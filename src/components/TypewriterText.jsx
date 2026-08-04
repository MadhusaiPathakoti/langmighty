import { useEffect, useState } from "react";

const TYPE_SPEED = 45;
const DELETE_SPEED = 25;
const PAUSE_AFTER_TYPE = 1800;
const PAUSE_AFTER_DELETE = 300;

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function TypewriterText({ phrases, className }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState(prefersReducedMotion ? phrases[0] : "");
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    if (prefersReducedMotion) return;

    const currentPhrase = phrases[phraseIndex];

    if (phase === "typing") {
      if (text.length < currentPhrase.length) {
        const t = setTimeout(() => setText(currentPhrase.slice(0, text.length + 1)), TYPE_SPEED);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("deleting"), PAUSE_AFTER_TYPE);
      return () => clearTimeout(t);
    }

    // phase === "deleting"
    if (text.length > 0) {
      const t = setTimeout(() => setText(currentPhrase.slice(0, text.length - 1)), DELETE_SPEED);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
      setPhase("typing");
    }, PAUSE_AFTER_DELETE);
    return () => clearTimeout(t);
  }, [text, phase, phraseIndex, phrases]);

  return (
    <span className={className}>
      {text}
      {!prefersReducedMotion && (
        <span className="inline-block w-[2px] h-[1em] bg-indigo-500 dark:bg-indigo-400 ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
}
