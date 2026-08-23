/**
 * VaakSiddhi - index.js
 * Landing page controller with aesthetic scrapbook UI state and audio triggers.
 */

document.addEventListener("DOMContentLoaded", () => {
  renderHomeHub();
  bindHomeEvents();
});

function renderHomeHub() {
  const user = window.VaakSiddhiStorage.getUserData();
  const levelInfo = window.VaakSiddhiStorage.getLevel();

  // User details
  const nameEl = document.getElementById("user-name");
  if (nameEl) nameEl.innerText = user.name || "Learner";

  const xpEl = document.getElementById("user-xp");
  if (xpEl) xpEl.innerText = `${user.xp || 0} XP`;

  const levelEl = document.getElementById("user-level");
  if (levelEl) levelEl.innerText = `Level ${levelInfo.level} (${levelInfo.title})`;

  const xpBarEl = document.getElementById("xp-progress-bar");
  if (xpBarEl) xpBarEl.style.width = `${levelInfo.progressPercent}%`;

  const streakEl = document.getElementById("user-streak");
  if (streakEl) streakEl.innerText = `${user.streak || 0} Days`;

  // Daily Goal (100 XP)
  const dailyGoalText = document.getElementById("daily-goal-text");
  if (dailyGoalText) dailyGoalText.innerText = `${user.dailyXP || 0} / 100 XP`;

  const dailyGoalBar = document.getElementById("daily-goal-bar");
  if (dailyGoalBar) {
    const dailyPct = Math.min(100, Math.round(((user.dailyXP || 0) / 100) * 100));
    dailyGoalBar.style.width = `${dailyPct}%`;
  }

  // Continue Learning update
  const continueTitle = document.getElementById("continue-lesson-title");
  if (continueTitle) {
    continueTitle.innerText = `${user.selectedLanguage || 'Marathi'} → Essential Lessons`;
  }

  // Highlight selected language button
  const langBtns = document.querySelectorAll(".lang-card-btn");
  langBtns.forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    if (lang === user.selectedLanguage) {
      btn.classList.add("active-lang");
    } else {
      btn.classList.remove("active-lang");
    }
  });
}

function bindHomeEvents() {
  const langBtns = document.querySelectorAll(".lang-card-btn");
  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedLang = btn.getAttribute("data-lang");
      const user = window.VaakSiddhiStorage.getUserData();
      user.selectedLanguage = selectedLang;
      window.VaakSiddhiStorage.saveUserData(user);

      if (window.VaakSiddhiAudio) {
        window.VaakSiddhiAudio.playClick();
        const sampleTexts = {
          Marathi: "नमस्कार! वैयक्तिक मराठी भाषेत तुमचे स्वागत आहे.",
          Hindi: "नमस्ते! वैयक्तिक हिंदी भाषा में आपका स्वागत है।",
          Kannada: "ನಮಸ್ಕಾರ! ವೈಯಕ್ತಿಕ ಕನ್ನಡ ಭಾಷೆಗೆ ಸ್ವಾಗತ.",
          English: "Welcome to VaakSiddhi Language Practice Platform!"
        };
        window.VaakSiddhiAudio.speakText(sampleTexts[selectedLang] || "Hello!", selectedLang);
      }

      window.VaakSiddhiStorage.showToastNotification("🌐 Language Selected", `Language switched to ${selectedLang}`, "info");
      renderHomeHub();
    });
  });

  const previewBtn = document.getElementById("quick-audio-preview-btn");
  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      const user = window.VaakSiddhiStorage.getUserData();
      const lang = user.selectedLanguage || "Marathi";
      const sampleTexts = {
        Marathi: "नमस्कार! वैयक्तिक मराठी शिकण्यास प्रारंभ करा.",
        Hindi: "नमस्ते! हिंदी में बातचीत का अभ्यास करें।",
        Kannada: "ನಮಸ್ಕಾರ! ಕನ್ನಡದಲ್ಲಿ ಸಂಭಾಷಣೆ ಅಭ್ಯಾಸ ಮಾಡಿ.",
        English: "Welcome! Practice your speaking skills and earn XP."
      };
      if (window.VaakSiddhiAudio) {
        window.VaakSiddhiAudio.speakText(sampleTexts[lang], lang);
      }
    });
  }
}
