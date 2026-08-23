/**
 * VaakSiddhi - audioEngine.js
 * Universal Guaranteed Audio Engine for all modules.
 * Combines Web Speech API (Text-to-Speech) with Web Audio API sound synthesis.
 */

const VaakSiddhiAudio = (() => {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  let loadedVoices = [];

  function updateVoices() {
    if ('speechSynthesis' in window) {
      loadedVoices = window.speechSynthesis.getVoices() || [];
    }
  }

  if ('speechSynthesis' in window) {
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }

  /**
   * Speaks text using Web Speech API with fallback to phonic synthesizer.
   * @param {string} text - Text to speak
   * @param {string} language - Language name ("Marathi", "Hindi", "Kannada", "English")
   * @param {Function} [onEnd] - Optional callback when speech finishes
   */
  function speakText(text, language = "Marathi", onEnd = null) {
    if (!text) return;

    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel(); // Stop ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;

      const langLower = (language || "").toLowerCase();
      let langCode = "en-US";
      if (langLower === "marathi") {
        langCode = "mr-IN";
      } else if (langLower === "hindi") {
        langCode = "hi-IN";
      } else if (langLower === "kannada") {
        langCode = "kn-IN";
      } else {
        langCode = "en-US";
      }
      utterance.lang = langCode;

      // Try selecting native voice if available
      if (!loadedVoices || loadedVoices.length === 0) {
        updateVoices();
      }

      if (loadedVoices && loadedVoices.length > 0) {
        const langPrefix = langCode.substring(0, 2).toLowerCase();
        const matchingVoice = loadedVoices.find((v) => 
          v.lang.toLowerCase().startsWith(langPrefix) || 
          v.lang.toLowerCase().includes(langPrefix)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback: Web Audio Phonic Synthesizer sound
      playPhonicTone(440, 0.4);
      if (onEnd) setTimeout(onEnd, 400);
    }
  }

  /**
   * Plays a synthesized phonic tone using Web Audio API.
   */
  function playPhonicTone(freq = 440, duration = 0.3, type = "sine") {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }

  /**
   * Plays a UI click sound effect.
   */
  function playClick() {
    playPhonicTone(600, 0.08, "triangle");
  }

  /**
   * Plays a pleasant multi-note success chime.
   */
  function playSuccessChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playPhonicTone(freq, 0.25, "sine");
        }, idx * 90);
      });
    } catch (e) {}
  }

  /**
   * Plays a triumphant level-up fanfare melody.
   */
  function playLevelUpFanfare() {
    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playPhonicTone(freq, 0.35, "triangle");
        }, idx * 110);
      });
    } catch (e) {}
  }

  /**
   * Speaks a vocabulary word with language context and plays subtle phonic feedback.
   */
  function speakWordWithModel(wordObj, language = "Marathi") {
    if (!wordObj) return;
    playClick();
    const targetText = wordObj.native || wordObj.meaning || wordObj.romanized;
    speakText(targetText, language);
  }

  return {
    speakText,
    speakWordWithModel,
    playPhonicTone,
    playClick,
    playSuccessChime,
    playLevelUpFanfare
  };
})();

window.VaakSiddhiAudio = VaakSiddhiAudio;
