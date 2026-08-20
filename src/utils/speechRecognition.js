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

// Keeps listening across natural pauses in speech instead of stopping at the
// first one — for callers where the user, not a silence gap, decides when an
// utterance is done. Browsers end the underlying recognition session on any
// pause long enough to register as silence even with continuous:true, so a
// pause is treated as "restart silently" rather than "done" — only the
// caller's explicit stop() actually ends the session. onResult fires
// repeatedly with the best transcript so far (confirmed speech plus the
// current in-progress guess) so the caller can show live progress.
export function listenContinuous(langCode, { onResult, onError, onEnd }) {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    onError?.(new Error("Speech recognition isn't supported in this browser."));
    return { stop: () => {} };
  }

  const recognition = new Ctor();
  recognition.lang = langCode;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = "";
  let stoppedByCaller = false;

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0]?.transcript ?? "";
      if (event.results[i].isFinal) {
        finalTranscript = `${finalTranscript} ${chunk}`.trim();
      } else {
        interim += chunk;
      }
    }
    onResult?.(`${finalTranscript} ${interim}`.trim());
  };
  recognition.onerror = (event) => {
    // "no-speech" is the routine pause case handled by the onend restart
    // below, not a real failure — don't surface it or block the restart.
    if (event.error === "no-speech") return;
    stoppedByCaller = true;
    onError?.(new Error(event.error || "Speech recognition failed."));
  };
  recognition.onend = () => {
    if (stoppedByCaller) {
      onEnd?.(finalTranscript.trim());
      return;
    }
    try {
      recognition.start();
    } catch {
      onEnd?.(finalTranscript.trim());
    }
  };

  recognition.start();
  return {
    stop: () => {
      stoppedByCaller = true;
      recognition.stop();
    },
  };
}
