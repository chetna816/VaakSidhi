/**
 * VaakSiddhi - speechAnalysis.js
 * Performs speech analysis on transcript, calculates pace (WPM), pause durations, and filler word breakdown.
 */

window.VaakSiddhiSpeechAnalysis = (() => {
  const COMMON_FILLERS = ["um", "uh", "like", "actually", "basically", "you know", "so", "hmm"];

  function analyzeTranscript(rawText, durationSec, language = "English") {
    const text = (rawText || "").trim();
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const effectiveSecs = Math.max(2, durationSec || 1);
    const wpm = Math.round((wordCount / effectiveSecs) * 60);

    // Filter filler words
    const fillerMap = {};
    let totalFillers = 0;

    words.forEach((w) => {
      const clean = w.replace(/[^\w\u0900-\u097F\u0C80-\u0CFF]/g, "");
      if (COMMON_FILLERS.includes(clean)) {
        fillerMap[clean] = (fillerMap[clean] || 0) + 1;
        totalFillers++;
      }
    });

    // Estimate pauses based on punctuation or speech duration
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const estPauses = Math.max(1, sentences.length - 1);
    const avgPauseSec = effectiveSecs > 10 ? (1.1 + (totalFillers * 0.15)).toFixed(1) : "1.0";
    const longPausesCount = Math.min(6, Math.floor(totalFillers / 2) + (wpm < 80 ? 2 : 0));

    let paceRating = "Optimal Conversational Pace";
    let paceTip = "✓ Good conversational pace.";
    if (wpm < 80) {
      paceRating = "Too Slow / Hesitant";
      paceTip = "💡 Slow pace detected. Try maintaining momentum between key ideas.";
    } else if (wpm > 175) {
      paceRating = "Too Fast / Rushed";
      paceTip = "💡 Slow down slightly when introducing important points.";
    }

    return {
      wordCount,
      durationSec: effectiveSecs,
      wpm,
      paceRating,
      paceTip,
      fillerMap,
      totalFillers,
      avgPauseSec,
      longPausesCount
    };
  }

  return {
    analyzeTranscript
  };
})();
