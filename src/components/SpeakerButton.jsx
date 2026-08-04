import { useState } from "react";
import { playTranslation } from "../utils/tts.js";

export default function SpeakerButton({ text, voice, label }) {
  const [status, setStatus] = useState("idle"); // idle | loading | error

  async function handleClick() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      await playTranslation(text, voice);
      setStatus("idle");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      title={status === "error" ? "Couldn't play audio — try again" : `Listen in ${label}`}
      aria-label={`Listen in ${label}`}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-lg transition-colors
        ${status === "error" ? "bg-red-100 dark:bg-red-900" : "bg-indigo-100 dark:bg-indigo-900"}
        ${status === "loading" ? "opacity-60 cursor-wait" : "hover:bg-indigo-200 dark:hover:bg-indigo-800 cursor-pointer"}
      `}
    >
      {status === "loading" ? (
        <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      ) : status === "error" ? (
        "⚠️"
      ) : (
        "🔊"
      )}
    </button>
  );
}
