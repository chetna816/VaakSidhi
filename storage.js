/**
 * VaakSiddhi - storage.js
 * Central localStorage manager, user state, profile storage, and gamification handler.
 */

const STORAGE_KEY = "vaaksiddhi_user_data";
const PROFILE_KEY = "vaaksiddhi_learner_profile";

// Level definition array mapping levels to required XP thresholds and titles
const LEVEL_DEFINITIONS = [
  { level: 1, title: "Beginner", minXP: 0, maxXP: 99 },
  { level: 2, title: "Explorer", minXP: 100, maxXP: 199 },
  { level: 3, title: "Learner", minXP: 200, maxXP: 299 },
  { level: 4, title: "Speaker", minXP: 300, maxXP: 399 },
  { level: 5, title: "Communicator", minXP: 400, maxXP: 499 },
  { level: 6, title: "Fluent Starter", minXP: 500, maxXP: 599 },
  { level: 7, title: "Language Master", minXP: 600, maxXP: Infinity }
];

// Master list of system achievements including new adaptive speaking achievements
const SYSTEM_ACHIEVEMENTS = [
  { id: "first_step", title: "First Step", description: "Complete your first lesson.", icon: "🌱" },
  { id: "first_voice", title: "First Voice", description: "Complete your first speaking practice.", icon: "🎙️" },
  { id: "getting_better", title: "Getting Better", description: "Improve speech score by 10+ points.", icon: "📈" },
  { id: "personal_best", title: "Personal Best", description: "Beat your previous highest speech score.", icon: "🏆" },
  { id: "fluent_speaker", title: "Fluent Speaker", description: "Reach a speaking score of 80+.", icon: "🗣️" },
  { id: "pronunciation_pro", title: "Pronunciation Pro", description: "Reach a pronunciation score of 80+.", icon: "🔊" },
  { id: "vocab_50", title: "Vocabulary Builder", description: "Learn 50 words.", icon: "📚" },
  { id: "consistent_learner", title: "Consistent Learner", description: "Complete 5 learning sessions.", icon: "⚡" },
  { id: "lang_explorer", title: "Language Explorer", description: "Practice at least two different languages.", icon: "🌏" },
  { id: "improvement_master", title: "Improvement Master", description: "Improve overall language score by 10%.", icon: "👑" },
  { id: "quiz_master", title: "Quiz Master", description: "Score 100% in a quiz.", icon: "🧠" },
  { id: "streak_7", title: "7 Day Learner", description: "Maintain a 7-day streak.", icon: "🔥" },
  { id: "speaking_star", title: "Speaking Star", description: "Complete 10 speaking practices.", icon: "⭐" },
  { id: "xp_hunter", title: "XP Hunter", description: "Earn 500 XP.", icon: "🎯" },
  { id: "perfect_score", title: "Perfect Score", description: "Get a perfect quiz score.", icon: "🌟" }
];

// Default Initial User Data Object
const DEFAULT_USER = {
  name: "Learner",
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  lessonsCompleted: [],
  quizResults: [],
  speechResults: [],
  wordsLearned: [],
  achievements: [],
  selectedLanguage: "Marathi",
  dailyXP: 0,
  lastDailyXPDate: null,
  dailySpeakingCount: 0,
  dailySpeakingGoalCompleted: false,
  lastDailySpeakingDate: null,
  currentLessonId: "marathi-greetings-1",
  recentActivity: [],
  languagesPracticed: ["Marathi"],
  sessionCount: 0,
  subscription: {
    plan: "FREE",
    billing_cycle: "MONTHLY",
    status: "ACTIVE",
    startDate: null,
    expiryDate: null,
    paymentId: null,
    subscriptionId: null
  },
  dailyUsage: {
    date: null,
    speechAnalysis: 0,
    pronunciation: 0,
    tongueTwisters: 0,
    publicSpeaking: 0
  }
};

/**
 * Retrieves user data from localStorage with error fallback.
 * @returns {Object} User Data
 */
function getUserData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      saveUserData(DEFAULT_USER);
      return { ...DEFAULT_USER };
    }
    const parsed = JSON.parse(data);
    return { ...DEFAULT_USER, ...parsed };
  } catch (err) {
    console.error("VaakSiddhi Storage Error [getUserData]:", err);
    return { ...DEFAULT_USER };
  }
}

/**
 * Saves user data object safely to localStorage.
 * @param {Object} data 
 * @returns {boolean} Success state
 */
function saveUserData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("VaakSiddhi Storage Error [saveUserData]:", err);
    return false;
  }
}

/**
 * Helper to get today's date formatted as YYYY-MM-DD
 */
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns current total XP.
 */
function getXP() {
  const user = getUserData();
  return user.xp || 0;
}

/**
 * Calculates level definition object from raw XP.
 */
function getLevelFromXP(xp) {
  let currentDef = LEVEL_DEFINITIONS[0];
  for (let i = 0; i < LEVEL_DEFINITIONS.length; i++) {
    if (xp >= LEVEL_DEFINITIONS[i].minXP) {
      currentDef = LEVEL_DEFINITIONS[i];
    }
  }
  return currentDef;
}

/**
 * Get current level details based on current XP.
 */
function getLevel() {
  const xp = getXP();
  const currentDef = getLevelFromXP(xp);

  const levelNum = currentDef.level;
  const title = currentDef.title;
  const minXP = currentDef.minXP;
  const maxXP = currentDef.maxXP === Infinity ? minXP + 100 : currentDef.maxXP + 1;
  const xpInLevel = xp - minXP;
  const range = maxXP - minXP;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((xpInLevel / range) * 100)));

  return {
    level: levelNum,
    title: title,
    xp: xp,
    minXP: minXP,
    nextLevelXP: maxXP,
    xpRequired: maxXP - xp,
    progressPercent: progressPercent
  };
}

/**
 * Adds XP to the user account, checks level up, updates daily goal & activity log.
 * @param {number} amount 
 * @param {string} reason 
 */
function addXP(amount, reason = "Activity Completed") {
  if (!amount || amount <= 0) return;

  const user = getUserData();
  const oldXP = user.xp || 0;
  const newXP = oldXP + amount;
  user.xp = newXP;

  // Daily XP goal management (100 XP goal)
  const today = getTodayString();
  if (user.lastDailyXPDate !== today) {
    user.dailyXP = 0;
    user.lastDailyXPDate = today;
  }
  const oldDailyXP = user.dailyXP || 0;
  user.dailyXP = oldDailyXP + amount;

  // Increment total learning session count
  user.sessionCount = (user.sessionCount || 0) + 1;
  if (user.sessionCount >= 5) {
    unlockAchievement("consistent_learner");
  }

  // Level check
  const oldLevelInfo = getLevelFromXP(oldXP);
  const newLevelInfo = getLevelFromXP(newXP);

  user.level = newLevelInfo.level;

  // Log recent activity
  if (!user.recentActivity) user.recentActivity = [];
  user.recentActivity.unshift({
    title: `${reason} (+${amount} XP)`,
    amount: amount,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  if (user.recentActivity.length > 25) {
    user.recentActivity = user.recentActivity.slice(0, 25);
  }

  saveUserData(user);

  // Floating notification for XP
  showToastNotification(`+${amount} XP ⭐`, reason, "xp");

  // Check Daily Goal threshold
  if (oldDailyXP < 100 && user.dailyXP >= 100) {
    showToastNotification("🎯 Daily Goal Complete!", "You earned 100+ XP today!", "goal");
  }

  // Check Level Up
  if (newLevelInfo.level > oldLevelInfo.level) {
    showToastNotification(`🎉 LEVEL UP! Level ${newLevelInfo.level}`, `You are now a ${newLevelInfo.title}!`, "levelup");
  }

  // Check XP Hunter achievement
  if (newXP >= 500) {
    unlockAchievement("xp_hunter");
  }
}

/**
 * Updates daily streak according to activity date.
 */
function updateStreak() {
  const user = getUserData();
  const today = getTodayString();

  if (!user.lastActiveDate) {
    user.streak = 1;
    user.lastActiveDate = today;
  } else if (user.lastActiveDate === today) {
    // Already active today
  } else {
    const last = new Date(user.lastActiveDate);
    const curr = new Date(today);
    const diffTime = Math.abs(curr - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1; // Reset streak
    }
    user.lastActiveDate = today;
  }

  saveUserData(user);

  if (user.streak >= 7) {
    unlockAchievement("streak_7");
  }

  return user.streak;
}

/**
 * Gets streak count.
 */
function getStreak() {
  const user = getUserData();
  return user.streak || 0;
}

/**
 * Handles Daily Speaking Goal progress (1 speaking practice / day).
 */
function updateDailySpeakingGoal() {
  const user = getUserData();
  const today = getTodayString();

  if (user.lastDailySpeakingDate !== today) {
    user.dailySpeakingCount = 0;
    user.dailySpeakingGoalCompleted = false;
    user.lastDailySpeakingDate = today;
  }

  user.dailySpeakingCount = (user.dailySpeakingCount || 0) + 1;

  if (!user.dailySpeakingGoalCompleted && user.dailySpeakingCount >= 1) {
    user.dailySpeakingGoalCompleted = true;
    saveUserData(user);
    addXP(15, "🎯 Daily Speaking Goal Completed!");
  } else {
    saveUserData(user);
  }
}

/**
 * Gets daily speaking goal status.
 */
function getDailySpeakingGoal() {
  const user = getUserData();
  const today = getTodayString();
  if (user.lastDailySpeakingDate !== today) {
    return { count: 0, completed: false, goal: 1 };
  }
  return {
    count: user.dailySpeakingCount || 0,
    completed: !!user.dailySpeakingGoalCompleted,
    goal: 1
  };
}

/**
 * Saves lesson progress, marks completed, adds learned words.
 */
function saveLessonProgress(lessonId, wordList = [], language = "Marathi") {
  const user = getUserData();
  if (!user.lessonsCompleted.includes(lessonId)) {
    user.lessonsCompleted.push(lessonId);
  }

  if (!user.wordsLearned) user.wordsLearned = [];
  wordList.forEach((word) => {
    const wordKey = typeof word === "string" ? word : word.native || word.romanized;
    if (wordKey && !user.wordsLearned.includes(wordKey)) {
      user.wordsLearned.push(wordKey);
    }
  });

  if (!user.languagesPracticed) user.languagesPracticed = [];
  if (!user.languagesPracticed.includes(language)) {
    user.languagesPracticed.push(language);
  }
  if (user.languagesPracticed.length >= 2) {
    unlockAchievement("lang_explorer");
  }

  saveUserData(user);

  unlockAchievement("first_step");
  if (user.wordsLearned.length >= 50) {
    unlockAchievement("vocab_50");
  }
}

/**
 * Gets array of completed lesson IDs.
 */
function getLessonProgress() {
  const user = getUserData();
  return user.lessonsCompleted || [];
}

/**
 * Saves quiz result object.
 */
function saveQuizResult(quizId, score, totalQuestions, accuracy, language = "Marathi") {
  const user = getUserData();
  if (!user.quizResults) user.quizResults = [];

  const resultEntry = {
    quizId,
    score,
    totalQuestions,
    accuracy,
    language,
    date: new Date().toISOString()
  };

  user.quizResults.push(resultEntry);
  saveUserData(user);

  if (accuracy === 100 || score === totalQuestions) {
    unlockAchievement("quiz_master");
    unlockAchievement("perfect_score");
  }
}

/**
 * Gets quiz results.
 */
function getQuizResults() {
  const user = getUserData();
  return user.quizResults || [];
}

/**
 * Saves speech evaluation result and updates achievements.
 */
function saveSpeechResult(topicId, score, wordCount, fillerCount, transcript, language = "Marathi") {
  const user = getUserData();
  if (!user.speechResults) user.speechResults = [];

  const entry = {
    topicId,
    score,
    wordCount,
    fillerCount,
    transcript,
    language,
    date: new Date().toISOString()
  };

  user.speechResults.push(entry);
  
  if (!user.languagesPracticed) user.languagesPracticed = [];
  if (!user.languagesPracticed.includes(language)) {
    user.languagesPracticed.push(language);
  }

  saveUserData(user);

  unlockAchievement("first_voice");
  if (user.speechResults.length >= 10) {
    unlockAchievement("speaking_star");
  }
  if (user.languagesPracticed.length >= 2) {
    unlockAchievement("lang_explorer");
  }
}

/**
 * Gets speech history.
 */
function getSpeechResults() {
  const user = getUserData();
  return user.speechResults || [];
}

/**
 * Unlocks an achievement if not unlocked.
 */
function unlockAchievement(achievementId) {
  const user = getUserData();
  if (!user.achievements) user.achievements = [];

  if (!user.achievements.includes(achievementId)) {
    user.achievements.push(achievementId);
    saveUserData(user);

    const achObj = SYSTEM_ACHIEVEMENTS.find((a) => a.id === achievementId);
    const title = achObj ? achObj.title : achievementId;
    showToastNotification("🏆 Achievement Unlocked!", title, "achievement");
  }
}

/**
 * Returns array of unlocked achievement IDs.
 */
function getAchievements() {
  const user = getUserData();
  return user.achievements || [];
}

/**
 * Direct Profile localStorage helpers.
 */
function getProfileRaw() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveProfileRaw(profileObj) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileObj));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Resets all user progress and profile data.
 */
function resetProgress() {
  saveUserData({ ...DEFAULT_USER });
  localStorage.removeItem(PROFILE_KEY);
  if (window.VaakSiddhiProfile && window.VaakSiddhiProfile.initializeProfile) {
    window.VaakSiddhiProfile.initializeProfile();
  }
  showToastNotification("🔄 Progress Reset", "All learning data has been reset.", "info");
}

/**
 * Toast Notification system.
 */
function showToastNotification(title, message, type = "info") {
  let container = document.getElementById("vaaksiddhi-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "vaaksiddhi-toast-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `vaaksiddhi-toast toast-${type}`;
  toast.style.cssText = `
    background: #1e293b;
    color: #ffffff;
    padding: 12px 18px;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    border-left: 5px solid ${type === 'xp' ? '#eab308' : type === 'levelup' ? '#a855f7' : type === 'achievement' ? '#3b82f6' : '#22c55e'};
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 230px;
    animation: toastIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    pointer-events: auto;
  `;

  if (!document.getElementById("toast-keyframes")) {
    const style = document.createElement("style");
    style.id = "toast-keyframes";
    style.innerHTML = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(-20px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-20px) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }

  const titleEl = document.createElement("strong");
  titleEl.style.fontSize = "15px";
  titleEl.innerText = title;

  const msgEl = document.createElement("span");
  msgEl.style.fontSize = "13px";
  msgEl.style.opacity = "0.85";
  msgEl.innerText = message || "";

  toast.appendChild(titleEl);
  if (message) toast.appendChild(msgEl);

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s forwards";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

const ACCOUNTS_KEY = "vaaksiddhi_accounts_list";

/**
 * Gets array of all registered accounts.
 */
function getAccountsList() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      // Default initial account from current user
      const currentUser = getUserData();
      const defaultAcc = [{
        id: "acc_default",
        name: currentUser.name || "Learner",
        avatar: currentUser.avatar || "🦊",
        nativeLang: currentUser.nativeLang || "English",
        selectedLanguage: currentUser.selectedLanguage || "Marathi",
        dailyGoalXP: currentUser.dailyGoalXP || 100,
        xp: currentUser.xp || 0,
        level: currentUser.level || 1,
        streak: currentUser.streak || 0,
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaultAcc));
      return defaultAcc;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Saves entire list of accounts.
 */
function saveAccountsList(list) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Creates a new user profile and switches to it.
 */
function createNewAccount(profileObj) {
  const accounts = getAccountsList();
  const id = "acc_" + Date.now();
  const newAccount = {
    id: id,
    name: profileObj.name || "Learner",
    avatar: profileObj.avatar || "🦊",
    nativeLang: profileObj.nativeLang || "English",
    selectedLanguage: profileObj.selectedLanguage || "Marathi",
    dailyGoalXP: profileObj.dailyGoalXP || 100,
    xp: 0,
    level: 1,
    streak: 1,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  saveAccountsList(accounts);

  // Initialize new user data object
  const newUserData = {
    ...DEFAULT_USER,
    id: id,
    name: newAccount.name,
    avatar: newAccount.avatar,
    nativeLang: newAccount.nativeLang,
    selectedLanguage: newAccount.selectedLanguage,
    dailyGoalXP: newAccount.dailyGoalXP,
    streak: 1,
    lastActiveDate: getTodayString()
  };

  saveUserData(newUserData);

  // Initialize learner profile in VaakSiddhiProfile
  if (window.VaakSiddhiProfile && window.VaakSiddhiProfile.initializeProfile) {
    window.VaakSiddhiProfile.initializeProfile();
  }

  showToastNotification(`🎉 Welcome ${newAccount.name}!`, `Account created with avatar ${newAccount.avatar}`, "levelup");
  return newUserData;
}

/**
 * Switches active logged-in user profile.
 */
function switchAccount(accountId) {
  const accounts = getAccountsList();
  const targetAcc = accounts.find(a => a.id === accountId);
  if (!targetAcc) return false;

  // Save current active user progress back into account list
  const current = getUserData();
  const currIndex = accounts.findIndex(a => a.id === (current.id || "acc_default"));
  if (currIndex !== -1) {
    accounts[currIndex].xp = current.xp;
    accounts[currIndex].level = current.level;
    accounts[currIndex].streak = current.streak;
    accounts[currIndex].selectedLanguage = current.selectedLanguage;
    saveAccountsList(accounts);
  }

  // Set selected account as active in STORAGE_KEY
  current.id = targetAcc.id;
  current.name = targetAcc.name;
  current.avatar = targetAcc.avatar || "🦊";
  current.nativeLang = targetAcc.nativeLang || "English";
  current.selectedLanguage = targetAcc.selectedLanguage || "Marathi";
  current.dailyGoalXP = targetAcc.dailyGoalXP || 100;
  saveUserData(current);

  if (window.VaakSiddhiProfile && window.VaakSiddhiProfile.initializeProfile) {
    window.VaakSiddhiProfile.initializeProfile();
  }

  showToastNotification(`👤 Switched Profile`, `Active learner: ${targetAcc.name}`, "info");
  return true;
}

/**
 * Subscription Management Helpers
 */
function getSubscription() {
  const user = getUserData();
  const sub = user.subscription || {
    plan: "FREE",
    billing_cycle: "MONTHLY",
    status: "ACTIVE",
    startDate: null,
    expiryDate: null,
    paymentId: null,
    subscriptionId: null
  };

  if (sub.expiryDate && new Date(sub.expiryDate) < new Date()) {
    sub.status = "EXPIRED";
    user.subscription = sub;
    saveUserData(user);
  }

  const isPro = (sub.plan === "PRO" || sub.plan === "PRO_ANNUAL") && sub.status === "ACTIVE";

  return { ...sub, isPro };
}

function isPro() {
  return getSubscription().isPro;
}

const FEATURE_DAILY_LIMITS = {
  speechAnalysis: 3,
  speech: 3,
  pronunciation: 5,
  tongueTwisters: 3,
  twisters: 3,
  publicSpeaking: 1,
  public_speaking: 1
};

function normalizeFeatureKey(key) {
  if (key === "speech" || key === "speechAnalysis") return "speechAnalysis";
  if (key === "twisters" || key === "tongueTwisters") return "tongueTwisters";
  if (key === "public_speaking" || key === "publicSpeaking") return "publicSpeaking";
  if (key === "pronunciation") return "pronunciation";
  return key || "speechAnalysis";
}

function getDailyUsage(featureType) {
  const user = getUserData();
  const today = getTodayString();

  if (!user.dailyUsage || user.dailyUsage.date !== today) {
    user.dailyUsage = {
      date: today,
      speechAnalysis: 0,
      pronunciation: 0,
      tongueTwisters: 0,
      publicSpeaking: 0
    };
    saveUserData(user);
  }

  if (!featureType) {
    const raw = user.dailyUsage;
    return {
      speech: raw.speechAnalysis || 0,
      speechAnalysis: raw.speechAnalysis || 0,
      pronunciation: raw.pronunciation || 0,
      twisters: raw.tongueTwisters || 0,
      tongueTwisters: raw.tongueTwisters || 0,
      public_speaking: raw.publicSpeaking || 0,
      publicSpeaking: raw.publicSpeaking || 0,
      date: raw.date
    };
  }

  const normKey = normalizeFeatureKey(featureType);

  if (isPro()) {
    return {
      current: user.dailyUsage[normKey] || 0,
      limit: Infinity,
      remaining: Infinity,
      allowed: true
    };
  }

  const limit = FEATURE_DAILY_LIMITS[normKey] || 3;
  const current = user.dailyUsage[normKey] || 0;
  const remaining = Math.max(0, limit - current);

  return {
    current,
    limit,
    remaining,
    allowed: current < limit
  };
}

function incrementDailyUsage(featureType) {
  if (isPro()) return true;

  const user = getUserData();
  const today = getTodayString();

  if (!user.dailyUsage || user.dailyUsage.date !== today) {
    user.dailyUsage = {
      date: today,
      speechAnalysis: 0,
      pronunciation: 0,
      tongueTwisters: 0,
      publicSpeaking: 0
    };
  }

  const normKey = normalizeFeatureKey(featureType);
  user.dailyUsage[normKey] = (user.dailyUsage[normKey] || 0) + 1;
  saveUserData(user);
  return true;
}

function updateSubscription(subDetails) {
  const user = getUserData();
  user.subscription = {
    ...user.subscription,
    ...subDetails
  };
  saveUserData(user);

  const accounts = getAccountsList();
  const currIndex = accounts.findIndex(a => a.id === (user.id || "acc_default"));
  if (currIndex !== -1) {
    accounts[currIndex].plan = subDetails.plan;
    accounts[currIndex].status = subDetails.status;
    saveAccountsList(accounts);
  }

  showToastNotification("💎 Subscription Updated", `Active plan: ${subDetails.plan}`, "levelup");
  return user.subscription;
}

function cancelSubscription() {
  const user = getUserData();
  if (user.subscription) {
    user.subscription.status = "CANCELLED";
    saveUserData(user);
  }
  showToastNotification("ℹ️ Subscription Cancelled", "Your Pro access will remain active until the end of your billing cycle.", "info");
  return true;
}

// Global Export
window.VaakSiddhiStorage = {
  getUserData,
  saveUserData,
  getXP,
  addXP,
  getLevel,
  updateStreak,
  getStreak,
  updateDailySpeakingGoal,
  getDailySpeakingGoal,
  saveLessonProgress,
  getLessonProgress,
  saveQuizResult,
  getQuizResults,
  unlockAchievement,
  getAchievements,
  saveSpeechResult,
  getSpeechResults,
  getProfileRaw,
  saveProfileRaw,
  resetProgress,
  showToastNotification,
  getAccountsList,
  createNewAccount,
  switchAccount,
  getSubscription,
  isPro,
  getDailyUsage,
  incrementDailyUsage,
  updateSubscription,
  cancelSubscription,
  SYSTEM_ACHIEVEMENTS,
  LEVEL_DEFINITIONS
};
