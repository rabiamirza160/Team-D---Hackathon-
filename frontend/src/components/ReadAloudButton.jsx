import { useEffect, useState } from "react";

// Remove things that sound bad when spoken: [1] citations, markdown symbols, extra spaces
function cleanForSpeech(text) {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/[*#_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Pick the best installed voice for the language, preferring Canadian voices
function pickVoice(voices, language) {
  const prefix = language === "fr" ? "fr" : "en";
  return (
    voices.find((v) => v.lang === `${prefix}-CA`) ||
    voices.find((v) => v.lang.startsWith(prefix)) ||
    null
  );
}

function ReadAloudButton({ text, language }) {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  // Voices load asynchronously in most browsers, so listen for them
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel(); // stop speaking if this message disappears
    };
  }, []);

  if (!("speechSynthesis" in window)) return null; // browser doesn't support it

  const voice = pickVoice(voices, language);
  const noVoice = voices.length > 0 && !voice;

  const handleClick = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text));
    utterance.lang = language === "fr" ? "fr-CA" : "en-CA";
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95; // slightly slower, easier to follow
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel(); // stop anything already playing
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  if (noVoice) {
    return (
      <button
        className="read-aloud-btn"
        disabled
        title={
          language === "fr"
            ? "Aucune voix française installée sur cet appareil"
            : "No English voice installed on this device"
        }
      >
        {language === "fr" ? "🔇 Voix non disponible" : "🔇 Voice unavailable"}
      </button>
    );
  }

  return (
    <button
      className="read-aloud-btn"
      onClick={handleClick}
      aria-label={
        speaking
          ? language === "fr" ? "Arrêter la lecture" : "Stop reading"
          : language === "fr" ? "Lire à voix haute" : "Read aloud"
      }
    >
      {speaking
        ? language === "fr" ? "⏹ Arrêter" : "⏹ Stop"
        : language === "fr" ? "🔊 Écouter" : "🔊 Read aloud"}
    </button>
  );
}

export default ReadAloudButton;