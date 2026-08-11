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

export async function playTranslation(text, voice) {
  const url = await fetchTtsAudioUrl(text, voice);

  if (currentAudio) {
    currentAudio.pause();
  }

  currentAudio = new Audio(url);
  await currentAudio.play();
}
