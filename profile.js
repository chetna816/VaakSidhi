/**
 * VaakSiddhi - profile.js
 * Personalized Learner Profile Module.
 * Manages multilingual skill profiles, performance history, improvement calculations, and bonus XP awards.
 */

const DEFAULT_LANGUAGES = ["Marathi", "Hindi", "Kannada", "English"];

const DEFAULT_SKILLS = {
  vocabulary: 0,
  pronunciation: 0,
  fluency: 0,
  speaking: 0,
  quiz: 0,
  fillerScore: 100,
  overall: 0,
  bestSpeakingScore: 0,
  weeklyOverall: {
    current: 0,
    previous: 0,
    improvement: 0
  },
  history: []
};

/**
 * Ensures the profile object exists in localStorage with multilingual structure.
 */
function initializeProfile() {
  let raw = window.VaakSiddhiStorage.getProfileRaw();
  const user = window.VaakSiddhiStorage.getUserData();

  if (!raw) {
    raw = {
      name: user.name || "Learner",
      selectedLanguage: user.selectedLanguage || "Marathi",
      xp: user.xp || 0,
      level: user.level || 1,
      streak: user.streak || 0,
      languages: {}
    };
  }

  // Ensure all standard languages exist in profile
  DEFAULT_LANGUAGES.forEach((lang) => {
    if (!raw.languages[lang]) {
      raw.languages[lang] = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
    }
  });

  window.VaakSiddhiStorage.saveProfileRaw(raw);
  return raw;
}

/**
 * Gets entire learner profile object.
 */
function getProfile() {
  let profile = window.VaakSiddhiStorage.getProfileRaw();
  if (!profile) {
    profile = initializeProfile();
  }
  const user = window.VaakSiddhiStorage.getUserData();
  profile.xp = user.xp || 0;
  profile.level = user.level || 1;
  profile.streak = user.streak || 0;
  profile.name = user.name || "Learner";
  profile.selectedLanguage = user.selectedLanguage || "Marathi";
  return profile;
}

/**
 * Updates profile top-level properties.
 */
function updateProfile(data) {
  const profile = getProfile();
  Object.assign(profile, data);
  window.VaakSiddhiStorage.saveProfileRaw(profile);
  return profile;
}

/**
 * Gets skill profile for a specific language.
 */
function getLanguageProfile(language = "Marathi") {
  const profile = getProfile();
  const targetLang = language || profile.selectedLanguage || "Marathi";
  if (!profile.languages[targetLang]) {
    profile.languages[targetLang] = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
    window.VaakSiddhiStorage.saveProfileRaw(profile);
  }
  return profile.languages[targetLang];
}

/**
 * Updates specific language profile fields.
 */
function updateLanguageProfile(language = "Marathi", data = {}) {
  const profile = getProfile();
  const targetLang = language || profile.selectedLanguage || "Marathi";

  if (!profile.languages[targetLang]) {
    profile.languages[targetLang] = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
  }

  Object.assign(profile.languages[targetLang], data);
  
  // Recalculate overall score whenever language profile is updated
  profile.languages[targetLang].overall = calculateOverallScore(profile.languages[targetLang]);

  window.VaakSiddhiStorage.saveProfileRaw(profile);
  return profile.languages[targetLang];
}

/**
 * Internal helper to calculate weighted overall score.
 * Formula: Vocab 20%, Quiz 20%, Pronunciation 20%, Fluency 20%, Speaking 20%
 */
function calculateOverallScore(langObj) {
  const vocab = langObj.vocabulary || 0;
  const quiz = langObj.quiz || 0;
  const pron = langObj.pronunciation || 0;
  const fluency = langObj.fluency || 0;
  const speaking = langObj.speaking || 0;

  const weighted = Math.round(
    (vocab * 0.20) +
    (quiz * 0.20) +
    (pron * 0.20) +
    (fluency * 0.20) +
    (speaking * 0.20)
  );

  return Math.min(100, Math.max(0, weighted));
}

/**
 * Updates a single skill score for a language.
 */
function updateSkillScore(language = "Marathi", skill = "vocabulary", score = 0) {
  const langProf = getLanguageProfile(language);
  const oldOverall = langProf.overall || 0;

  langProf[skill] = Math.min(100, Math.max(0, Math.round(score)));

  // Recalculate overall
  const newOverall = calculateOverallScore(langProf);
  
  // Check weekly overall improvement track
  if (!langProf.weeklyOverall) {
    langProf.weeklyOverall = { current: newOverall, previous: oldOverall, improvement: 0 };
  } else {
    langProf.weeklyOverall.previous = langProf.weeklyOverall.current || oldOverall;
    langProf.weeklyOverall.current = newOverall;
    langProf.weeklyOverall.improvement = newOverall - langProf.weeklyOverall.previous;
  }

  langProf.overall = newOverall;
  updateLanguageProfile(language, langProf);

  if (langProf.weeklyOverall.improvement >= 10) {
    window.VaakSiddhiStorage.unlockAchievement("improvement_master");
  }

  return newOverall;
}

/**
 * Calculates and returns overall score for language.
 */
function getOverallScore(language = "Marathi") {
  const langProf = getLanguageProfile(language);
  return langProf.overall || 0;
}

/**
 * Identifies weak skill areas (< 70%).
 */
function getWeakAreas(language = "Marathi") {
  const langProf = getLanguageProfile(language);
  const skills = [
    { name: "Pronunciation", score: langProf.pronunciation || 0 },
    { name: "Fluency", score: langProf.fluency || 0 },
    { name: "Speaking", score: langProf.speaking || 0 },
    { name: "Vocabulary", score: langProf.vocabulary || 0 },
    { name: "Quiz Performance", score: langProf.quiz || 0 }
  ];

  return skills.filter(s => s.score < 70).sort((a, b) => a.score - b.score);
}

/**
 * Identifies strong skill areas (>= 70%).
 */
function getStrongAreas(language = "Marathi") {
  const langProf = getLanguageProfile(language);
  const skills = [
    { name: "Vocabulary", score: langProf.vocabulary || 0 },
    { name: "Quiz Performance", score: langProf.quiz || 0 },
    { name: "Speaking", score: langProf.speaking || 0 },
    { name: "Fluency", score: langProf.fluency || 0 },
    { name: "Pronunciation", score: langProf.pronunciation || 0 }
  ];

  return skills.filter(s => s.score >= 70).sort((a, b) => b.score - a.score);
}

/**
 * Gets personal best speaking score for language.
 */
function getBestSpeakingScore(language = "Marathi") {
  const langProf = getLanguageProfile(language);
  return langProf.bestSpeakingScore || 0;
}

/**
 * Gets speaking attempt history for language.
 */
function getSpeakingHistory(language = "Marathi") {
  const langProf = getLanguageProfile(language);
  return langProf.history || [];
}

/**
 * Main Gamified Speaking Attempt Analyzer & Progress Evaluator.
 * Calculates improvement vs previous attempt, personal bests, and performance bonus XP.
 */
function addSpeakingAttempt(language = "Marathi", attemptResult = {}) {
  const langProf = getLanguageProfile(language);
  const history = langProf.history || [];
  const currentScore = Math.round(attemptResult.score || 0);
  const pronunciationScore = Math.round(attemptResult.pronunciation || currentScore);
  const fluencyScore = Math.round(attemptResult.fluency || currentScore);
  const fillerScore = Math.round(attemptResult.fillerScore || 100);
  const topicTitle = attemptResult.topic || "Speaking Practice";

  // Determine previous score to compare improvement
  let previousScore = 0;
  if (history.length > 0) {
    // Look for previous attempt on same topic or most recent attempt score
    const sameTopic = history.filter(h => h.topic === topicTitle);
    if (sameTopic.length > 0) {
      previousScore = sameTopic[sameTopic.length - 1].score || 0;
    } else {
      previousScore = history[history.length - 1].score || 0;
    }
  }

  const improvement = currentScore - previousScore;

  // Improvement XP rules
  let baseXP = 30; // Standard speaking practice XP
  let bonusXP = 0;
  let messages = [];

  if (history.length === 0) {
    messages.push(`🎙️ First Speaking Practice Attempt!`);
  } else if (improvement > 0) {
    if (improvement >= 15) {
      bonusXP += 30;
      messages.push(`🎉 Massive Improvement! (+15 pts) ⭐ +30 Bonus XP`);
    } else if (improvement >= 10) {
      bonusXP += 20;
      messages.push(`🎉 Great Improvement! (+${improvement} pts) ⭐ +20 Bonus XP`);
    } else if (improvement >= 5) {
      bonusXP += 10;
      messages.push(`📈 Good Progress! (+${improvement} pts) ⭐ +10 Bonus XP`);
    } else if (improvement >= 1) {
      bonusXP += 5;
      messages.push(`👍 Slight Improvement (+${improvement} pts) ⭐ +5 Bonus XP`);
    }
  } else {
    messages.push(`Keep practicing! Regular attempts build long-term fluency.`);
  }

  // Personal Best Check
  let isPersonalBest = false;
  const currentBest = langProf.bestSpeakingScore || 0;
  if (currentScore > currentBest) {
    isPersonalBest = true;
    langProf.bestSpeakingScore = currentScore;
    bonusXP += 20;
    messages.push(`🏆 NEW PERSONAL BEST! (${currentScore}/100) ⭐ +20 Bonus XP`);
  }

  // Perfect Score Bonus (90+)
  if (currentScore >= 90) {
    bonusXP += 25;
    messages.push(`🌟 Perfect Fluency Score (90+)! ⭐ +25 Bonus XP`);
  }

  const totalXPAwarded = baseXP + bonusXP;

  // Create attempt entry
  const attemptRecord = {
    id: "attempt_" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    topic: topicTitle,
    score: currentScore,
    pronunciation: pronunciationScore,
    fluency: fluencyScore,
    fillerScore: fillerScore,
    wordCount: attemptResult.wordCount || 0,
    fillerCount: attemptResult.fillerCount || 0,
    improvement: improvement,
    bonusXP: bonusXP
  };

  history.push(attemptRecord);
  langProf.history = history;

  // Update Skill Scores in profile
  langProf.speaking = Math.round(
    history.reduce((acc, h) => acc + h.score, 0) / history.length
  );
  langProf.fluency = Math.round(
    history.reduce((acc, h) => acc + h.fluency, 0) / history.length
  );
  langProf.pronunciation = Math.round(
    (langProf.pronunciation + pronunciationScore) / (langProf.pronunciation ? 2 : 1)
  );
  langProf.fillerScore = fillerScore;

  // Recalculate Overall Score
  langProf.overall = calculateOverallScore(langProf);

  updateLanguageProfile(language, langProf);

  // Award total calculated XP into storage
  window.VaakSiddhiStorage.addXP(totalXPAwarded, `Speech Practice: ${topicTitle}`);
  window.VaakSiddhiStorage.updateDailySpeakingGoal();

  // Unlock relevant achievements
  window.VaakSiddhiStorage.unlockAchievement("first_voice");
  if (improvement >= 10) window.VaakSiddhiStorage.unlockAchievement("getting_better");
  if (isPersonalBest) window.VaakSiddhiStorage.unlockAchievement("personal_best");
  if (currentScore >= 80) window.VaakSiddhiStorage.unlockAchievement("fluent_speaker");
  if (pronunciationScore >= 80) window.VaakSiddhiStorage.unlockAchievement("pronunciation_pro");

  return {
    baseXP,
    bonusXP,
    totalXP: totalXPAwarded,
    improvement,
    isPersonalBest,
    previousScore,
    currentScore,
    messages
  };
}

/**
 * Returns learning summary object for language.
 */
function getLearningSummary(language = "Marathi") {
  const langProf = getLanguageProfile(language);
  return {
    language: language,
    overallScore: langProf.overall || 0,
    skills: {
      vocabulary: langProf.vocabulary || 0,
      pronunciation: langProf.pronunciation || 0,
      fluency: langProf.fluency || 0,
      speaking: langProf.speaking || 0,
      quiz: langProf.quiz || 0
    },
    weakAreas: getWeakAreas(language),
    strongAreas: getStrongAreas(language),
    bestSpeakingScore: langProf.bestSpeakingScore || 0,
    weeklyOverall: langProf.weeklyOverall || { current: 0, previous: 0, improvement: 0 },
    attemptsCount: (langProf.history || []).length
  };
}

// Global Export
window.VaakSiddhiProfile = {
  initializeProfile,
  getProfile,
  updateProfile,
  getLanguageProfile,
  updateLanguageProfile,
  updateSkillScore,
  getOverallScore,
  getWeakAreas,
  getStrongAreas,
  getBestSpeakingScore,
  getSpeakingHistory,
  addSpeakingAttempt,
  getLearningSummary
};

// Initialize profile on script load
document.addEventListener("DOMContentLoaded", () => {
  initializeProfile();
});
