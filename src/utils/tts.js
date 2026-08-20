import { apiFetch } from "../lib/apiClient.js";

const audioCache = new Map();
let currentAudio = null;

async function fetchTtsAudioUrl(text, voice) {
  const cacheKey = `${voice}::${text}`;
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey);

  const res = await apiFetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });

  if (!res.ok) {
    let message = "Could not generate audio right now.";
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      // response wasn't JSON — keep the default message
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  audioCache.set(cacheKey, url);
  return url;
}

export async function playTranslation(text, voice, { onEnded } = {}) {
  const url = await fetchTtsAudioUrl(text, voice);

  if (currentAudio) {
    currentAudio.pause();
  }

  currentAudio = new Audio(url);
  if (onEnded) currentAudio.addEventListener("ended", onEnded, { once: true });
  await currentAudio.play();
}

// Lets a caller interrupt in-progress playback (e.g. the learner wants to
// speak again before the assistant finishes talking). Pausing doesn't fire
// the "ended" event, so a caller relying on onEnded to clear its own
// "speaking" state must also clear it directly when it calls this.
export function stopAudio() {
  currentAudio?.pause();
}
