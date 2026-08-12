function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionCtor() !== null;
}

// Wraps the browser's imperative, event-based SpeechRecognition API behind a
// simple callback so callers don't deal with the raw browser API. Listens for
// a single utterance and stops — there's no continuous/streaming need here.
export function listenOnce(langCode, { onResult, onError, onEnd }) {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    onError?.(new Error("Speech recognition isn't supported in this browser."));
    return { stop: () => {} };
  }

  const recognition = new Ctor();
  recognition.lang = langCode;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    onResult?.(transcript);
  };
  recognition.onerror = (event) => {
    onError?.(new Error(event.error || "Speech recognition failed."));
  };
  recognition.onend = () => {
    onEnd?.();
  };

  recognition.start();
  return { stop: () => recognition.stop() };
}
