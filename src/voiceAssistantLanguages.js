import { LANGUAGES } from "langmighty-shared";
import { LANGUAGE_TO_SPEECH_LOCALE } from "./readAloudData.js";

// LANGUAGES (from langmighty-shared) only covers the 5 regional translation
// targets — English is added locally since the voice assistant is the one
// feature where English is also a language the assistant speaks back in, not
// just an input language.
const ENGLISH = { key: "english", label: "English", ttsVoice: "en-US-AriaNeural" };

export const VOICE_ASSISTANT_LANGUAGES = [ENGLISH, ...LANGUAGES];

export const VOICE_ASSISTANT_SPEECH_LOCALE = { english: "en-US", ...LANGUAGE_TO_SPEECH_LOCALE };

export function voiceAssistantLanguageInfo(key) {
  return VOICE_ASSISTANT_LANGUAGES.find((l) => l.key === key) || ENGLISH;
}
