/**
 * VaakSiddhi - login.js
 * Account Management & Personalized Login Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  initAvatarSelection();
  renderSavedAccounts();
  bindLoginForm();
  bindAudioWelcome();
});

function initAvatarSelection() {
  const avatarBtns = document.querySelectorAll(".avatar-option-btn");
  const avatarInput = document.getElementById("selected-avatar-input");

  avatarBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      avatarBtns.forEach((b) => b.classList.remove("active-avatar"));
      btn.classList.add("active-avatar");
      const chosen = btn.getAttribute("data-avatar");
      if (avatarInput) avatarInput.value = chosen;
      if (window.VaakSiddhiAudio) {
        window.VaakSiddhiAudio.playClick();
      }
    });
  });
}

function renderSavedAccounts() {
  const container = document.getElementById("saved-accounts-list");
  if (!container) return;

  const accounts = window.VaakSiddhiStorage.getAccountsList();
  const currentUser = window.VaakSiddhiStorage.getUserData();

  if (!accounts || accounts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:20px; color:#6b4c55; font-size:14px; font-weight:600;">
        No saved accounts found. Create your profile on the left!
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  accounts.forEach((acc) => {
    const isActive = (currentUser.id === acc.id) || (!currentUser.id && acc.id === "acc_default");
    const item = document.createElement("div");
    item.className = "polaroid-frame";
    item.style.cssText = `
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 2px dashed ${isActive ? '#dc2626' : '#3d131f'};
      background: ${isActive ? '#fffdf0' : '#ffffff'};
      cursor: pointer;
      box-shadow: ${isActive ? '4px 4px 0px #3d131f' : '2px 2px 0px #3d131f'};
      transition: all 0.25s ease;
    `;

    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:32px;">${acc.avatar || '🦊'}</span>
        <div>
          <div style="font-size:16px; font-weight:800; color:#3d131f; font-family:'Playfair Display', serif;">
            ${acc.name} ${isActive ? '<span style="font-size:11px; background:#fce7f3; color:#78263e; padding:2px 8px; border-radius:10px; border:1px solid #3d131f; margin-left:6px;">ACTIVE</span>' : ''}
          </div>
          <div style="font-size:12px; color:#6b4c55; font-weight:600;">
            Target: ${acc.selectedLanguage || 'Marathi'} • Level ${acc.level || 1} • ${acc.xp || 0} XP
          </div>
        </div>
      </div>
      <button class="btn btn-secondary switch-btn" style="padding:6px 14px; font-size:12px;">
        ${isActive ? 'Selected' : 'Switch'}
      </button>
    `;

    item.addEventListener("click", () => {
      if (isActive) return;
      window.VaakSiddhiStorage.switchAccount(acc.id);
      renderSavedAccounts();
      if (window.VaakSiddhiAudio) {
        window.VaakSiddhiAudio.playSuccessChime();
        const sampleTexts = {
          Marathi: `नमस्कार ${acc.name}! वैयक्तिक खात्यात आपले स्वागत आहे.`,
          Hindi: `नमस्ते ${acc.name}! आपके व्यक्तिगत खाते में आपका स्वागत है।`,
          Kannada: `ನಮಸ್ಕಾರ ${acc.name}! ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಖಾತೆಗೆ ಸ್ವಾಗತ.`,
          English: `Welcome back to your language path, ${acc.name}!`
        };
        const targetLang = acc.selectedLanguage || "Marathi";
        window.VaakSiddhiAudio.speakText(sampleTexts[targetLang] || `Welcome back ${acc.name}!`, targetLang);
      }
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
    });

    container.appendChild(item);
  });
}

function bindLoginForm() {
  const form = document.getElementById("profile-login-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("learner-name-input").value.trim();
    const avatar = document.getElementById("selected-avatar-input").value || "🦊";
    const nativeLang = document.getElementById("native-lang-select").value || "English";
    const targetLang = document.getElementById("target-lang-select").value || "Marathi";
    
    const goalRadios = document.getElementsByName("dailyGoal");
    let dailyGoalXP = 100;
    goalRadios.forEach((r) => {
      if (r.checked) dailyGoalXP = parseInt(r.value, 10);
    });

    if (!name) return;

    const newAcc = window.VaakSiddhiStorage.createNewAccount({
      name,
      avatar,
      nativeLang,
      selectedLanguage: targetLang,
      dailyGoalXP
    });

    if (window.VaakSiddhiAudio) {
      window.VaakSiddhiAudio.playLevelUpFanfare();
      const sampleTexts = {
        Marathi: `नमस्कार ${name}! वैयक्तिक मराठी भाषेत तुमचे स्वागत आहे.`,
        Hindi: `नमस्ते ${name}! हिंदी भाषा सीखने की यात्रा में आपका स्वागत है।`,
        Kannada: `ನಮಸ್ಕಾರ ${name}! ಕನ್ನಡ ಭಾಷಾ ಕಲಿಕೆಗೆ ಸ್ವಾಗತ.`,
        English: `Welcome to your language journey, ${name}!`
      };
      window.VaakSiddhiAudio.speakText(sampleTexts[targetLang] || `Welcome ${name}!`, targetLang);
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  });
}

function bindAudioWelcome() {
  const btn = document.getElementById("login-audio-welcome-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const targetLang = document.getElementById("target-lang-select").value || "Marathi";
    const name = document.getElementById("learner-name-input").value.trim() || "Learner";
    if (window.VaakSiddhiAudio) {
      window.VaakSiddhiAudio.speakText(`Hello ${name}! Welcome to VaakSiddhi ${targetLang} speech practice.`, targetLang);
    }
  });
}
