/**
 * VaakSiddhi - adaptive.js
 * Main Adaptive-Learning Engine.
 * Identifies learner weaknesses, evaluates filler word frequency, assigns personalized difficulty levels,
 * and generates tailored practice recommendations.
 */

/**
 * Priority order for tie-breaking skill weaknesses.
 */
const SKILL_PRIORITY = ["pronunciation", "fluency", "speaking", "vocabulary", "quiz"];

/**
 * Recommended target vocabulary lists for language pronunciation practice.
 */
const TARGET_VOCAB_PRACTICE = {
  Marathi: ["नमस्कार", "धन्यवाद", "पाणी", "मित्र", "शाळा"],
  Hindi: ["नमस्ते", "धन्यवाद", "पानी", "मित्र", "विद्यालय"],
  Kannada: ["ನಮಸ್ಕಾರ", "ಧನ್ಯವಾದ", "ನೀರು", "ಸ್ನೇಹಿತ", "ಶಾಲೆ"],
  English: ["Greetings", "Thank You", "Water", "Friend", "School"]
};

/**
 * Detects the learner's weakest skill for a given language.
 * Tie-breaking priority: pronunciation > fluency > speaking > vocabulary > quiz.
 */
function getWeakestSkill(language = "Marathi") {
  const summary = window.VaakSiddhiProfile.getLearningSummary(language);
  const skills = summary.skills;

  let lowestSkill = "pronunciation";
  let lowestScore = 101;

  SKILL_PRIORITY.forEach((skillKey) => {
    const score = skills[skillKey] !== undefined ? skills[skillKey] : 0;
    // Tie-break rule: only replace if strictly lower, preserving priority order
    if (score < lowestScore) {
      lowestScore = score;
      lowestSkill = skillKey;
    }
  });

  return {
    skill: lowestSkill,
    score: lowestScore
  };
}

/**
 * Evaluates performance score to return personalized difficulty tier.
 */
function getPersonalizedDifficulty(score) {
  if (score >= 85) return "Advanced";
  if (score >= 60) return "Intermediate";
  return "Beginner";
}

/**
 * Generates personalized practice recommendation based on speech performance and skill profile.
 */
function getRecommendedPractice(language = "Marathi") {
  const langProf = window.VaakSiddhiProfile.getLanguageProfile(language);
  const history = langProf.history || [];
  const weakestInfo = getWeakestSkill(language);
  const skill = weakestInfo.skill;
  const score = weakestInfo.score;
  const difficulty = getPersonalizedDifficulty(score);

  // Check recent filler word usage
  let recentFillerCount = 0;
  if (history.length > 0) {
    const recentAttempt = history[history.length - 1];
    recentFillerCount = recentAttempt.fillerCount || 0;
  }

  // Filler Word Adaptation Trigger
  if (recentFillerCount >= 3 || (langProf.fillerScore && langProf.fillerScore < 65)) {
    return {
      skill: "filler_words",
      title: "⚠️ Filler Word Reduction Challenge",
      reason: `You used ${recentFillerCount} filler word(s) in your last speaking session.`,
      action: "Practice speaking for 60 seconds with steady pauses to reduce filler words.",
      difficulty: "Intermediate",
      targetUrl: "speech.html",
      buttonText: "Start Fluency Challenge →",
      icon: "🎙️",
      targetWords: []
    };
  }

  // Recommendation Mapping based on Weakest Skill
  switch (skill) {
    case "pronunciation":
      const vocabList = TARGET_VOCAB_PRACTICE[language] || TARGET_VOCAB_PRACTICE["Marathi"];
      return {
        skill: "pronunciation",
        title: "🔊 Pronunciation Challenge",
        reason: `Your pronunciation score in ${language} is currently ${score}%.`,
        action: `Practice pronunciation for 5 essential words in ${language}.`,
        difficulty: difficulty,
        targetUrl: "literacy.html",
        buttonText: "Start Pronunciation Practice →",
        icon: "🔊",
        targetWords: vocabList
      };

    case "fluency":
      return {
        skill: "fluency",
        title: "🗣️ Fluency & Rhythm Practice",
        reason: `Your speaking fluency score in ${language} is currently ${score}%.`,
        action: "Speak on a structured prompt to improve pace and natural flow.",
        difficulty: difficulty,
        targetUrl: "speech.html",
        buttonText: "Start Speaking Practice →",
        icon: "🗣️",
        targetWords: []
      };

    case "speaking":
      return {
        skill: "speaking",
        title: "🎙️ Speech Confidence Challenge",
        reason: `Your speaking score in ${language} is currently ${score}%.`,
        action: "Record a complete spoken response to earn bonus improvement XP.",
        difficulty: difficulty,
        targetUrl: "speech.html",
        buttonText: "Practice Speaking Topic →",
        icon: "🎙️",
        targetWords: []
      };

    case "vocabulary":
      return {
        skill: "vocabulary",
        title: "📚 Vocabulary Expansion Lesson",
        reason: `Your vocabulary mastery in ${language} is currently ${score}%.`,
        action: "Complete a new vocabulary lesson to expand your word bank.",
        difficulty: difficulty,
        targetUrl: "literacy.html",
        buttonText: "Start Vocabulary Lesson →",
        icon: "📚",
        targetWords: []
      };

    case "quiz":
      return {
        skill: "quiz",
        title: "🧠 Revision & Quiz Challenge",
        reason: `Your quiz accuracy in ${language} is currently ${score}%.`,
        action: "Take a interactive quiz to reinforce learned words and grammar.",
        difficulty: difficulty,
        targetUrl: "literacy.html",
        buttonText: "Take Practice Quiz →",
        icon: "🧠",
        targetWords: []
      };

    default:
      return {
        skill: "general",
        title: "🌟 Daily Language Goal",
        reason: "Maintain your daily streak and earn bonus XP!",
        action: "Complete today's learning module.",
        difficulty: "Beginner",
        targetUrl: "literacy.html",
        buttonText: "Continue Learning →",
        icon: "🎯",
        targetWords: []
      };
  }
}

/**
 * Renders recommendation UI card into DOM element.
 */
function renderRecommendationCard(containerId, language = "Marathi") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const rec = getRecommendedPractice(language);

  let targetWordsHTML = "";
  if (rec.targetWords && rec.targetWords.length > 0) {
    targetWordsHTML = `
      <div style="margin-top:12px; background:#f8fafc; padding:10px 14px; border-radius:10px; border:1px solid #cbd5e1;">
        <span style="font-size:12px; font-weight:700; color:#475569; display:block; margin-bottom:6px;">Recommended Words to Practice:</span>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${rec.targetWords.map(w => `<span style="background:#eff6ff; color:#2563eb; font-weight:700; padding:4px 10px; border-radius:8px; font-size:13px; border:1px solid #bfdbfe;">${w}</span>`).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="card" style="border:2px solid #3b82f6; background:linear-gradient(135deg, #ffffff, #f0f7ff); position:relative; overflow:hidden;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:32px;">${rec.icon}</span>
          <div>
            <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#2563eb;">🎯 Recommended Practice</span>
            <h3 style="margin:2px 0 0 0; font-size:19px; color:#0f172a;">${rec.title}</h3>
          </div>
        </div>
        <span style="background:#dbeafe; color:#1e40af; font-size:12px; font-weight:800; padding:4px 12px; border-radius:12px; border:1px solid #bfdbfe;">
          ${rec.difficulty} Level
        </span>
      </div>

      <p style="margin:0 0 10px 0; font-size:14px; color:#334155;">
        ${rec.reason}
      </p>

      <div style="background:#ffffff; border-left:4px solid #2563eb; padding:10px 14px; border-radius:6px; margin-bottom:14px; font-size:13px; font-weight:600; color:#1e293b;">
        💡 <strong>Action Goal:</strong> ${rec.action}
      </div>

      ${targetWordsHTML}

      <div style="margin-top:16px;">
        <a href="${rec.targetUrl}" class="btn btn-primary" style="display:inline-block; text-decoration:none; width:auto; text-align:center;">
          ${rec.buttonText}
        </a>
      </div>
    </div>
  `;
}

// Global Export
window.VaakSiddhiAdaptive = {
  getWeakestSkill,
  getPersonalizedDifficulty,
  getRecommendedPractice,
  renderRecommendationCard
};
