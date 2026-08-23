/**
 * VaakSiddhi - dashboard.js
 * Dashboard module displaying Personalized Learner Profile, Multilingual Skill Progress,
 * Speaking Improvement & Personal Best Tracking, Adaptive Practice Recommendations,
 * Achievements, and Visual Canvas Charts.
 */

document.addEventListener("DOMContentLoaded", () => {
  DashboardModule.init();
});

const DashboardModule = (() => {
  const elements = {};
  let selectedDashboardLang = "Marathi";

  function init() {
    cacheDOMElements();
    bindEvents();
    
    // Set initial selected language from user profile
    const user = window.VaakSiddhiStorage.getUserData();
    selectedDashboardLang = user.selectedLanguage || "Marathi";
    if (elements.dashLangSelect) {
      elements.dashLangSelect.value = selectedDashboardLang;
    }

    renderDashboard();
  }

  function cacheDOMElements() {
    elements.dashLangSelect = document.getElementById("dash-language-select");
    elements.totalXP = document.getElementById("dash-total-xp");
    elements.currentLevel = document.getElementById("dash-current-level");
    elements.levelTitle = document.getElementById("dash-level-title");
    elements.streakCount = document.getElementById("dash-streak-count");
    elements.wordsCount = document.getElementById("dash-words-count");
    elements.speakingGoalText = document.getElementById("dash-speaking-goal-text");
    
    // Skill & Recommended Practice Containers
    elements.languageSkillProfileContainer = document.getElementById("languageSkillProfile");
    elements.speakingImprovementContainer = document.getElementById("speakingImprovement");
    elements.recommendedPracticeContainer = document.getElementById("recommendedPractice");

    // Standard Stats & Containers
    elements.quizzesCount = document.getElementById("dash-quizzes-count");
    elements.avgQuizScore = document.getElementById("dash-avg-quiz-score");
    elements.speechCount = document.getElementById("dash-speech-count");
    elements.avgSpeechScore = document.getElementById("dash-avg-speech-score");
    elements.achievementsContainer = document.getElementById("dash-achievements-container");
    elements.activityFeed = document.getElementById("dash-activity-feed");
    elements.resetBtn = document.getElementById("reset-progress-btn");

    // Canvas Charts
    elements.xpChartCanvas = document.getElementById("xp-chart-canvas");
    elements.quizChartCanvas = document.getElementById("quiz-chart-canvas");
    elements.speechChartCanvas = document.getElementById("speech-chart-canvas");
    elements.activityChartCanvas = document.getElementById("activity-chart-canvas");
  }

  function bindEvents() {
    if (elements.dashLangSelect) {
      elements.dashLangSelect.addEventListener("change", (e) => {
        selectedDashboardLang = e.target.value;
        const user = window.VaakSiddhiStorage.getUserData();
        user.selectedLanguage = selectedDashboardLang;
        window.VaakSiddhiStorage.saveUserData(user);
        renderDashboard();
      });
    }

    if (elements.resetBtn) {
      elements.resetBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all your progress and start fresh? This action cannot be undone.")) {
          window.VaakSiddhiStorage.resetProgress();
          renderDashboard();
        }
      });
    }
  }

  function renderDashboard() {
    const user = window.VaakSiddhiStorage.getUserData();
    const levelInfo = window.VaakSiddhiStorage.getLevel();
    const langProf = window.VaakSiddhiProfile ? window.VaakSiddhiProfile.getLanguageProfile(selectedDashboardLang) : {};
    const summary = window.VaakSiddhiProfile ? window.VaakSiddhiProfile.getLearningSummary(selectedDashboardLang) : {};

    // 1. Top Quick Stats
    if (elements.totalXP) elements.totalXP.innerText = `${user.xp || 0} XP`;
    if (elements.currentLevel) elements.currentLevel.innerText = `Level ${levelInfo.level}`;
    if (elements.levelTitle) elements.levelTitle.innerText = levelInfo.title;
    if (elements.streakCount) elements.streakCount.innerText = `${user.streak || 0} Days`;
    if (elements.wordsCount) elements.wordsCount.innerText = `${(user.wordsLearned || []).length}`;

    // Daily Speaking Goal Stat
    const speakGoal = window.VaakSiddhiStorage.getDailySpeakingGoal();
    if (elements.speakingGoalText) {
      elements.speakingGoalText.innerHTML = speakGoal.completed 
        ? `<span style="color:#166534; font-weight:800;">✓ Completed (1/1)</span>` 
        : `<span style="color:#b45309; font-weight:700;">${speakGoal.count}/1 Speaking Practice</span>`;
    }

    // Render Subscription Status Card
    renderSubscriptionCard();

    // 2. Render Cultural Passport & Stamps
    renderCulturalPassport(selectedDashboardLang, levelInfo);

    // 3. Render Language Skill Progress Profile
    renderLanguageSkillProfile(selectedDashboardLang, langProf);

    // 3. Render Speaking Improvement & Personal Best Section
    renderSpeakingImprovement(selectedDashboardLang, langProf);

    // 4. Render Recommended Practice Card
    if (window.VaakSiddhiAdaptive && elements.recommendedPracticeContainer) {
      window.VaakSiddhiAdaptive.renderRecommendationCard("recommendedPractice", selectedDashboardLang);
    }

    // Quiz Stats
    const quizResults = (user.quizResults || []).filter(q => !q.language || q.language === selectedDashboardLang);
    if (elements.quizzesCount) elements.quizzesCount.innerText = `${quizResults.length}`;
    const avgQuiz = quizResults.length > 0
      ? Math.round(quizResults.reduce((acc, q) => acc + (q.accuracy || 0), 0) / quizResults.length)
      : (langProf.quiz || 0);
    if (elements.avgQuizScore) elements.avgQuizScore.innerText = `${avgQuiz}%`;

    // Speech Stats
    const speechResults = (langProf.history || []);
    if (elements.speechCount) elements.speechCount.innerText = `${speechResults.length}`;
    const avgSpeech = speechResults.length > 0
      ? Math.round(speechResults.reduce((acc, s) => acc + (s.score || 0), 0) / speechResults.length)
      : (langProf.speaking || 0);
    if (elements.avgSpeechScore) elements.avgSpeechScore.innerText = `${avgSpeech}/100`;

    // Render Achievements
    renderAchievementsList(user.achievements || []);

    // Render Recent Activity Feed
    renderActivityFeed(user.recentActivity || []);

    // Render Canvas Charts
    renderXPChart(user);
    renderQuizChart(quizResults);
    renderSpeechChart(speechResults);
    renderActivityChart(user);
  }

  function renderSubscriptionCard() {
    const container = document.getElementById("subscriptionStatusCard");
    if (!container || !window.VaakSiddhiStorage) return;

    const sub = window.VaakSiddhiStorage.getSubscription();
    const usage = window.VaakSiddhiStorage.getDailyUsage();

    if (sub.isPro) {
      const planTitle = sub.plan === "PRO_ANNUAL" ? "👑 VaakSiddhi Pro Annual" : "⭐ VaakSiddhi Pro Monthly";
      const expiryStr = sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Active";

      container.innerHTML = `
        <div class="card card-cream" style="margin-bottom:28px; border-top:4px solid #166534;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <span style="font-size:12px; font-weight:800; text-transform:uppercase; color:#166534; letter-spacing:0.5px;">YOUR SUBSCRIPTION STATUS</span>
              <h3 style="margin:2px 0 0 0; font-size:22px; color:#3d131f;">${planTitle}</h3>
              <p style="margin:4px 0 0 0; font-size:13px; color:#5c3240;">
                ✓ Unlimited Speech, Pronunciation & Public Speaking Arena Access (Renews/Expires: ${expiryStr})
              </p>
            </div>

            <a href="premium.html" class="btn btn-outline-dashed" style="padding:10px 20px; font-size:14px; text-decoration:none;">
              Manage Subscription →
            </a>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card card-pink" style="margin-bottom:28px; border-top:4px solid #78263e; position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:12px; font-weight:800; text-transform:uppercase; color:#78263e; letter-spacing:0.5px;">FREE PLAN DAILY USAGE</span>
                <span style="background:#fef3c7; color:#92400e; border:1px solid #b45309; font-size:10px; font-weight:800; padding:2px 8px; border-radius:10px;">FREE PLAN</span>
              </div>
              <h3 style="margin:4px 0 0 0; font-size:22px; color:#3d131f;">Upgrade to VaakSiddhi Pro for Unlimited Practice</h3>

              <!-- Daily usage indicators -->
              <div style="display:flex; gap:16px; margin-top:10px; flex-wrap:wrap; font-size:13px; font-weight:700; color:#3d131f;">
                <span>🎙️ Speech-to-Text: ${usage.speech}/${window.VaakSiddhiSubscription ? window.VaakSiddhiSubscription.FREE_LIMITS.SPEECH : 3}</span>
                <span>🔊 Pronunciation: ${usage.pronunciation}/${window.VaakSiddhiSubscription ? window.VaakSiddhiSubscription.FREE_LIMITS.PRONUNCIATION : 5}</span>
                <span>👅 Tongue Twisters: ${usage.twisters}/${window.VaakSiddhiSubscription ? window.VaakSiddhiSubscription.FREE_LIMITS.TWISTERS : 3}</span>
                <span>🎤 Public Speaking: ${usage.public_speaking}/${window.VaakSiddhiSubscription ? window.VaakSiddhiSubscription.FREE_LIMITS.PUBLIC_SPEAKING : 1}</span>
              </div>
            </div>

            <a href="premium.html" class="btn btn-primary" style="padding:12px 24px; font-size:15px; text-decoration:none;">
              ⭐ Upgrade to Pro (₹99/mo) →
            </a>
          </div>
        </div>
      `;
    }
  }

  /**
   * Feature 3: Render Language Skill Progress Profile (Vocab, Pron, Fluency, Speaking, Quiz, Overall)
   */
  function renderLanguageSkillProfile(language, langProf) {
    if (!elements.languageSkillProfileContainer) return;

    const overallScore = langProf.overall || 0;
    const weekly = langProf.weeklyOverall || { current: overallScore, previous: 0, improvement: 0 };
    const vocabScore = langProf.vocabulary || 0;
    const pronScore = langProf.pronunciation || 0;
    const fluencyScore = langProf.fluency || 0;
    const speakingScore = langProf.speaking || 0;
    const quizScore = langProf.quiz || 0;

    let weeklyNoticeHTML = "";
    if (weekly.improvement > 0) {
      weeklyNoticeHTML = `<div style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:10px 14px; border-radius:10px; font-size:14px; font-weight:700; margin-top:12px;">📈 You improved by +${weekly.improvement}% in ${language}!</div>`;
    } else if (weekly.improvement < 0) {
      weeklyNoticeHTML = `<div style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; padding:10px 14px; border-radius:10px; font-size:14px; font-weight:700; margin-top:12px;">📚 Keep practicing. Your next goal is ${Math.min(100, overallScore + 10)}%!</div>`;
    } else {
      weeklyNoticeHTML = `<div style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; padding:10px 14px; border-radius:10px; font-size:14px; font-weight:700; margin-top:12px;">🎯 Maintain practice to boost your overall ${language} score above 80%!</div>`;
    }

    elements.languageSkillProfileContainer.innerHTML = `
      <div class="card" style="margin-bottom:24px; border-top:4px solid #2563eb;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <span style="font-size:12px; font-weight:800; text-transform:uppercase; color:#2563eb; letter-spacing:0.5px;">Language Skill Profile</span>
            <h3 style="margin:2px 0 0 0; font-size:22px; color:#0f172a;">${language} Performance Breakdown</h3>
          </div>
          
          <div style="background:#f8fafc; border:2px solid #2563eb; padding:10px 18px; border-radius:16px; text-align:center;">
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#64748b;">Overall Language Score</div>
            <div style="font-size:28px; font-weight:800; color:#2563eb; line-height:1.2;">${overallScore}%</div>
          </div>
        </div>

        <div class="grid-2" style="gap:16px; margin-bottom:12px;">
          <!-- Left Column: Skills Progress Bars -->
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px; color:#334155;">
                <span>📚 Vocabulary (20%)</span>
                <span>${vocabScore}%</span>
              </div>
              <div style="background:#e2e8f0; height:10px; border-radius:10px; overflow:hidden;">
                <div style="background:#2563eb; width:${vocabScore}%; height:100%; border-radius:10px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px; color:#334155;">
                <span>🔊 Pronunciation (20%)</span>
                <span>${pronScore}%</span>
              </div>
              <div style="background:#e2e8f0; height:10px; border-radius:10px; overflow:hidden;">
                <div style="background:#a855f7; width:${pronScore}%; height:100%; border-radius:10px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px; color:#334155;">
                <span>🗣️ Fluency (20%)</span>
                <span>${fluencyScore}%</span>
              </div>
              <div style="background:#e2e8f0; height:10px; border-radius:10px; overflow:hidden;">
                <div style="background:#10b981; width:${fluencyScore}%; height:100%; border-radius:10px;"></div>
              </div>
            </div>
          </div>

          <!-- Right Column: Speaking & Quiz -->
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px; color:#334155;">
                <span>🎙️ Speaking Accuracy (20%)</span>
                <span>${speakingScore}%</span>
              </div>
              <div style="background:#e2e8f0; height:10px; border-radius:10px; overflow:hidden;">
                <div style="background:#f59e0b; width:${speakingScore}%; height:100%; border-radius:10px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px; color:#334155;">
                <span>🧠 Quiz Performance (20%)</span>
                <span>${quizScore}%</span>
              </div>
              <div style="background:#e2e8f0; height:10px; border-radius:10px; overflow:hidden;">
                <div style="background:#06b6d4; width:${quizScore}%; height:100%; border-radius:10px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px; color:#334155;">
                <span>🛡️ Filler Word Control</span>
                <span>${langProf.fillerScore || 100}%</span>
              </div>
              <div style="background:#e2e8f0; height:10px; border-radius:10px; overflow:hidden;">
                <div style="background:#ec4899; width:${langProf.fillerScore || 100}%; height:100%; border-radius:10px;"></div>
              </div>
            </div>
          </div>
        </div>

        ${weeklyNoticeHTML}
      </div>
    `;
  }

  /**
   * Feature 2: Render Speaking Improvement & Personal Best Section
   */
  function renderSpeakingImprovement(language, langProf) {
    if (!elements.speakingImprovementContainer) return;

    const history = langProf.history || [];
    const bestScore = langProf.bestSpeakingScore || 0;

    let previousScore = 0;
    let currentScore = 0;
    let improvement = 0;

    if (history.length >= 2) {
      previousScore = history[history.length - 2].score || 0;
      currentScore = history[history.length - 1].score || 0;
      improvement = currentScore - previousScore;
    } else if (history.length === 1) {
      currentScore = history[0].score || 0;
      previousScore = currentScore;
      improvement = 0;
    }

    let historyTableRowsHTML = "";
    if (history.length === 0) {
      historyTableRowsHTML = `<tr><td colspan="5" style="padding:14px; text-align:center; color:#94a3b8;">No speaking attempts recorded yet for ${language}. Complete a speaking practice module!</td></tr>`;
    } else {
      historyTableRowsHTML = history.slice(-5).reverse().map((attempt) => {
        return `
          <tr style="border-bottom:1px solid #f1f5f9; font-size:13px;">
            <td style="padding:10px; font-weight:600; color:#0f172a;">${attempt.date}</td>
            <td style="padding:10px; font-weight:700; color:#2563eb;">${attempt.topic}</td>
            <td style="padding:10px; font-weight:800; color:${attempt.score >= 70 ? '#166534' : '#b91c1c'};">${attempt.score}/100</td>
            <td style="padding:10px; color:#475569;">${attempt.fluency || attempt.score}%</td>
            <td style="padding:10px; color:${attempt.fillerCount > 0 ? '#ef4444' : '#22c55e'}; font-weight:700;">${attempt.fillerCount || 0} fillers</td>
          </tr>
        `;
      }).join("");
    }

    elements.speakingImprovementContainer.innerHTML = `
      <div class="card" style="margin-bottom:24px;">
        <h3 style="font-size:20px; margin-bottom:16px; color:#0f172a;">📈 Speaking Improvement & History (${language})</h3>
        
        <!-- Score Highlights -->
        <div class="grid-3" style="gap:14px; margin-bottom:20px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:14px; border-radius:14px; text-align:center;">
            <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">Previous Score</div>
            <div style="font-size:24px; font-weight:800; color:#475569; margin-top:2px;">${previousScore}</div>
          </div>

          <div style="background:#eff6ff; border:2px solid #2563eb; padding:14px; border-radius:14px; text-align:center;">
            <div style="font-size:11px; font-weight:800; color:#1e40af; text-transform:uppercase;">Current Score</div>
            <div style="font-size:24px; font-weight:800; color:#2563eb; margin-top:2px;">${currentScore}</div>
            ${improvement > 0 ? `<div style="font-size:12px; font-weight:800; color:#166534;">+${improvement} Improvement</div>` : ''}
          </div>

          <div style="background:#fef9c3; border:2px solid #eab308; padding:14px; border-radius:14px; text-align:center;">
            <div style="font-size:11px; font-weight:800; color:#854d0e; text-transform:uppercase;">🏆 Personal Best</div>
            <div style="font-size:24px; font-weight:800; color:#854d0e; margin-top:2px;">${bestScore}/100</div>
          </div>
        </div>

        <!-- History Table -->
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; font-size:12px; text-transform:uppercase; color:#64748b;">
                <th style="padding:10px;">Date</th>
                <th style="padding:10px;">Topic Prompt</th>
                <th style="padding:10px;">Speech Score</th>
                <th style="padding:10px;">Fluency</th>
                <th style="padding:10px;">Filler Count</th>
              </tr>
            </thead>
            <tbody>
              ${historyTableRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAchievementsList(unlockedIds) {
    if (!elements.achievementsContainer) return;

    const allAchievements = window.VaakSiddhiStorage.SYSTEM_ACHIEVEMENTS;
    elements.achievementsContainer.innerHTML = "";

    allAchievements.forEach((ach) => {
      const isUnlocked = unlockedIds.includes(ach.id);
      const card = document.createElement("div");
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.style.cssText = `
        background: ${isUnlocked ? '#ffffff' : '#f8fafc'};
        border: 2px solid ${isUnlocked ? '#eab308' : '#e2e8f0'};
        border-radius: 16px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: ${isUnlocked ? '1' : '0.6'};
        box-shadow: ${isUnlocked ? '0 4px 12px rgba(234,179,8,0.15)' : 'none'};
      `;

      card.innerHTML = `
        <div style="font-size:32px; background:${isUnlocked ? '#fef9c3' : '#f1f5f9'}; padding:10px; border-radius:12px;">
          ${ach.icon}
        </div>
        <div>
          <h4 style="margin:0 0 2px 0; font-size:15px; color:#0f172a;">${ach.title}</h4>
          <p style="margin:0; font-size:12px; color:#64748b;">${ach.description}</p>
          <span style="font-size:11px; font-weight:700; color:${isUnlocked ? '#15803d' : '#94a3b8'}; display:inline-block; margin-top:4px;">
            ${isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
          </span>
        </div>
      `;

      elements.achievementsContainer.appendChild(card);
    });
  }

  function renderActivityFeed(activities) {
    if (!elements.activityFeed) return;

    if (!activities || activities.length === 0) {
      elements.activityFeed.innerHTML = `<p style="color:#64748b; font-size:14px; margin:0;">No recent activity logged yet. Complete lessons or quizzes to see updates!</p>`;
      return;
    }

    elements.activityFeed.innerHTML = "";
    activities.slice(0, 10).forEach((act) => {
      const item = document.createElement("div");
      item.style.cssText = `
        padding: 10px 0;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      `;
      item.innerHTML = `
        <div>
          <strong style="color:#0f172a;">${act.title}</strong>
          <div style="font-size:12px; color:#94a3b8;">${act.timestamp}</div>
        </div>
        <span style="color:#2563eb; font-weight:700;">+${act.amount} XP</span>
      `;
      elements.activityFeed.appendChild(item);
    });
  }

  // Canvas Chart 1: Level & XP Chart
  function renderXPChart(user) {
    const canvas = elements.xpChartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const levelInfo = window.VaakSiddhiStorage.getLevel();
    const pct = levelInfo.progressPercent / 100;

    ctx.fillStyle = "#e2e8f0";
    ctx.roundRect(10, 40, canvas.width - 20, 24, 12);
    ctx.fill();

    if (pct > 0) {
      ctx.fillStyle = "#2563eb";
      ctx.roundRect(10, 40, (canvas.width - 20) * pct, 24, 12);
      ctx.fill();
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(`Current Level: ${levelInfo.level} (${levelInfo.title})`, 10, 25);
    ctx.fillText(`${user.xp || 0} XP`, canvas.width - 70, 25);
  }

  // Canvas Chart 2: Quiz Accuracy Bar Chart
  function renderQuizChart(quizResults) {
    const canvas = elements.quizChartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (quizResults.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText("No quiz attempts recorded yet.", 20, 50);
      return;
    }

    const recent = quizResults.slice(-5);
    const barWidth = 35;
    const gap = 20;
    const startX = 20;

    recent.forEach((q, idx) => {
      const acc = q.accuracy || 0;
      const h = Math.max(10, (acc / 100) * 80);
      const x = startX + idx * (barWidth + gap);
      const y = canvas.height - 30 - h;

      ctx.fillStyle = "#3b82f6";
      ctx.roundRect(x, y, barWidth, h, 6);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText(`${acc}%`, x + 4, y - 5);

      ctx.fillStyle = "#64748b";
      ctx.fillText(`Q${idx + 1}`, x + 10, canvas.height - 10);
    });
  }

  // Canvas Chart 3: Speech Scores Chart
  function renderSpeechChart(speechResults) {
    const canvas = elements.speechChartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (speechResults.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText("No speaking attempts recorded yet.", 20, 50);
      return;
    }

    const recent = speechResults.slice(-5);
    const barWidth = 35;
    const gap = 20;
    const startX = 20;

    recent.forEach((s, idx) => {
      const score = s.score || 0;
      const h = Math.max(10, (score / 100) * 80);
      const x = startX + idx * (barWidth + gap);
      const y = canvas.height - 30 - h;

      ctx.fillStyle = "#10b981";
      ctx.roundRect(x, y, barWidth, h, 6);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText(`${score}`, x + 8, y - 5);

      ctx.fillStyle = "#64748b";
      ctx.fillText(`S${idx + 1}`, x + 10, canvas.height - 10);
    });
  }

  // Canvas Chart 4: Learning Activity Line Chart
  function renderActivityChart(user) {
    const canvas = elements.activityChartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText(`🔥 Daily Learning Streak: ${user.streak || 0} Days`, 15, 30);
    ctx.fillText(`📚 Total Words Learned: ${(user.wordsLearned || []).length}`, 15, 55);
    ctx.fillText(`🎯 Daily Goal Progress: ${user.dailyXP || 0}/100 XP`, 15, 80);
  }

  /**
   * Render Cultural Passport & Regional Stamps
   */
  function renderCulturalPassport(language, levelInfo) {
    const container = document.getElementById("culturalPassport");
    if (!container) return;

    const user = window.VaakSiddhiStorage.getUserData();
    const level = levelInfo.level || 1;

    const stampsData = {
      Marathi: [
        { title: "🚩 Raigad Swarajya", loc: "Maharashtra", minLv: 1, icon: "🚩", desc: "First Steps in Native Marathi Script" },
        { title: "🌊 Gateway Stamp", loc: "Mumbai", minLv: 2, icon: "🌊", desc: "Conversational Marathi Fluency" },
        { title: "🪔 Shaniwar Wada", loc: "Pune", minLv: 3, icon: "🪔", desc: "Regional Master Orator" }
      ],
      Hindi: [
        { title: "🏰 Red Fort Stamp", loc: "Delhi", minLv: 1, icon: "🏰", desc: "Hindi Devanagari Literacy" },
        { title: "🪔 Taj Heritage", loc: "Agra", minLv: 2, icon: "🪔", desc: "Intermediate Speech Practice" },
        { title: "📜 Sarnath Pillar", loc: "Varanasi", minLv: 3, icon: "📜", desc: "Master Hindi Communicator" }
      ],
      Kannada: [
        { title: "🐘 Hampi Monolith", loc: "Ballari", minLv: 1, icon: "🐘", desc: "Kannada Script Mastery" },
        { title: "🏰 Mysuru Palace", loc: "Mysuru", minLv: 2, icon: "🏰", desc: "Kannada Conversation Pro" },
        { title: "🏛️ Vidhana Soudha", loc: "Bengaluru", minLv: 3, icon: "🏛️", desc: "Native Kannada Scholar" }
      ],
      English: [
        { title: "🌐 Globe Explorer", loc: "Global", minLv: 1, icon: "🌐", desc: "English Vocabulary Builder" },
        { title: "🎓 Language Scholar", loc: "Academic", minLv: 2, icon: "🎓", desc: "Fluent Public Speaking" },
        { title: "👑 Orator Champion", loc: "Excellence", minLv: 3, icon: "👑", desc: "Master English Communicator" }
      ]
    };

    const currentStamps = stampsData[language] || stampsData.Marathi;

    container.innerHTML = `
      <div class="card card-cream" style="margin-bottom:28px; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <span class="cursive-font" style="font-size:20px;">regional passport stamps</span>
            <h3 style="font-size:24px; color:#3d131f; margin:0;">🗺️ ${language} Cultural Passport</h3>
          </div>
          <span style="font-size:13px; font-weight:800; background:#fce7f3; color:#78263e; padding:6px 16px; border-radius:20px; border:1px solid #3d131f;">
            Learner: ${user.name || 'Learner'} ${user.avatar || '🦊'}
          </span>
        </div>

        <div class="grid-3" style="gap:16px;">
          ${currentStamps.map((stamp) => {
            const isUnlocked = level >= stamp.minLv;
            return `
              <div class="passport-stamp-badge" style="background:${isUnlocked ? '#fffdf0' : '#f1f5f9'}; opacity:${isUnlocked ? 1 : 0.65};">
                <div style="font-size:36px; margin-bottom:6px;">${isUnlocked ? stamp.icon : '🔒'}</div>
                <div style="font-size:16px; font-weight:800; color:#3d131f; font-family:'Playfair Display', serif;">${stamp.title}</div>
                <div style="font-size:12px; font-weight:700; color:#78263e;">${stamp.loc}</div>
                <div style="font-size:11px; color:#6b4c55; margin-top:4px;">${isUnlocked ? '✓ UNLOCKED' : `Requires Level ${stamp.minLv}`}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return {
    init,
    renderDashboard
  };
})();
