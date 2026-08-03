import { useEffect, useState } from "react";

export function useSpeechVoices() {
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();

    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  return voices;
}

export function findVoiceForLang(voices, langCode) {
  const prefix = langCode.split("-")[0].toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  );
}

// Kept outside the function so Chrome can't garbage-collect the utterance
// mid-flight, which otherwise silently drops speech with no error.
let activeUtterance = null;

export function speakText(text, langCode, voices) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  const voice = findVoiceForLang(voices, langCode);
  if (voice) utterance.voice = voice;

  activeUtterance = utterance;

  window.speechSynthesis.cancel();
  // Calling speak() in the same tick as cancel() can silently no-op in Chrome.
  setTimeout(() => window.speechSynthesis.speak(utterance), 50);
}
