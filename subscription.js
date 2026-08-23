/**
 * VaakSiddhi - subscription.js
 * Client-side subscription enforcement, modal dialogs, and upgrade promos.
 */

window.VaakSiddhiSubscription = {
  FREE_LIMITS: {
    SPEECH: 3,
    speech: 3,
    speechAnalysis: 3,
    PRONUNCIATION: 5,
    pronunciation: 5,
    TWISTERS: 3,
    twisters: 3,
    tongueTwisters: 3,
    PUBLIC_SPEAKING: 1,
    public_speaking: 1,
    publicSpeaking: 1
  },

  /**
   * Checks if user has remaining quota for a feature.
   * If limit exceeded, shows upgrade modal and returns false.
   * If allowed, increments daily usage and returns true.
   */
  checkAndConsumeQuota: function(featureType) {
    if (!window.VaakSiddhiStorage) return true;

    if (window.VaakSiddhiStorage.isPro()) {
      return true;
    }

    const usage = window.VaakSiddhiStorage.getDailyUsage(featureType);

    if (!usage.allowed) {
      this.showUpgradeModal(featureType, usage);
      return false;
    }

    window.VaakSiddhiStorage.incrementDailyUsage(featureType);
    return true;
  },

  /**
   * Alias method for checkAndConsumeQuota with optional feature title
   */
  checkAndEnforceLimit: function(featureType, featureTitle) {
    return this.checkAndConsumeQuota(featureType);
  },

  /**
   * Displays modal prompt when free limit is reached or premium feature clicked.
   */
  showUpgradeModal: function(featureType, usageInfo = null) {
    let modal = document.getElementById("vaaksiddhi-upgrade-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vaaksiddhi-upgrade-modal";
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(40, 11, 20, 0.7);
        backdrop-filter: blur(6px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeInModal 0.25s ease-out forwards;
      `;
      document.body.appendChild(modal);

      if (!document.getElementById("modal-style-anim")) {
        const style = document.createElement("style");
        style.id = "modal-style-anim";
        style.innerHTML = `
          @keyframes fadeInModal {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }
    }

    const featureNames = {
      speech: "Speech & Fluency Analysis",
      speechAnalysis: "Speech & Fluency Analysis",
      pronunciation: "Pronunciation Exercises",
      twisters: "Tongue Twister Practice",
      tongueTwisters: "Tongue Twister Practice",
      public_speaking: "Public Speaking Arena Sessions",
      publicSpeaking: "Public Speaking Arena Sessions"
    };

    const name = featureNames[featureType] || "Practice Session";
    const limitText = usageInfo ? `${usageInfo.current}/${usageInfo.limit} free daily uses` : "Free limit reached";

    modal.innerHTML = `
      <div style="background:#fffdf0; border:3px solid #3d131f; border-radius:24px; padding:32px; max-width:480px; width:100%; box-shadow:8px 8px 0px #3d131f; position:relative; text-align:center;">
        <button id="close-upgrade-modal-btn" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:24px; cursor:pointer; color:#3d131f;">✕</button>
        
        <div style="font-size:48px; margin-bottom:12px;">🔒</div>
        
        <div style="display:inline-block; background:#fef3c7; border:1px solid #b45309; color:#92400e; font-size:12px; font-weight:800; padding:4px 14px; border-radius:14px; margin-bottom:12px; text-transform:uppercase;">
          ${limitText}
        </div>

        <h3 style="font-size:26px; color:#3d131f; margin:0 0 10px 0; font-family:'Playfair Display', serif;">
          Daily Limit Reached for ${name}
        </h3>

        <p style="color:#5c3240; font-size:15px; margin:0 0 24px 0; line-height:1.5;">
          You've reached your free daily quota. Upgrade to <strong>VaakSiddhi Pro</strong> for unlimited AI speech analysis, detailed pronunciation feedback, and personalized speech coaching.
        </p>

        <div style="background:#fce7f3; border:2px dashed #3d131f; border-radius:16px; padding:16px; margin-bottom:24px; text-align:left;">
          <div style="font-weight:800; color:#3d131f; font-size:14px; margin-bottom:8px;">💎 Pro Features Included:</div>
          <div style="font-size:13px; color:#5c3240; display:flex; flex-direction:column; gap:6px;">
            <span>✓ Unlimited Speech & Pronunciation Practice</span>
            <span>✓ Detailed Grammar & Fluency AI Reports</span>
            <span>✓ Public Speaking Scenarios & Structure Analysis</span>
            <span>✓ No Daily Limits or Cooldowns</span>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <a href="premium.html" class="btn btn-primary" style="padding:14px 24px; font-size:16px; width:100%; text-decoration:none; display:inline-block; box-sizing:border-box;">
            🚀 Upgrade to Pro (₹99/mo)
          </a>
          <button id="dismiss-upgrade-modal-btn" style="background:none; border:none; color:#78263e; font-size:14px; font-weight:700; cursor:pointer; text-decoration:underline;">
            Maybe Later
          </button>
        </div>
      </div>
    `;

    modal.style.display = "flex";

    const close = () => { modal.style.display = "none"; };
    document.getElementById("close-upgrade-modal-btn")?.addEventListener("click", close);
    document.getElementById("dismiss-upgrade-modal-btn")?.addEventListener("click", close);
  },

  /**
   * Initializes header Pro badges across the UI.
   */
  initHeaderBadges: function() {
    if (!window.VaakSiddhiStorage) return;

    const sub = window.VaakSiddhiStorage.getSubscription();
    
    // Update nav links with badge if pro
    const navs = document.querySelectorAll(".nav-links");
    navs.forEach(nav => {
      let badgeEl = nav.querySelector(".pro-header-badge");
      if (sub.isPro) {
        if (!badgeEl) {
          badgeEl = document.createElement("span");
          badgeEl.className = "pro-header-badge";
          badgeEl.style.cssText = `
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 12px;
            margin-left: 6px;
            box-shadow: 1px 1px 0px #3d131f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          `;
          badgeEl.innerText = sub.plan === "PRO_ANNUAL" ? "👑 PRO ANNUAL" : "⭐ PRO";
          nav.appendChild(badgeEl);
        }
      } else {
        if (badgeEl) badgeEl.remove();
      }
    });

    // Render User Gamification bar badge if present
    const userBar = document.querySelector(".user-gamification-bar");
    if (userBar && sub.isPro) {
      let proBadgeItem = document.getElementById("user-bar-pro-badge");
      if (!proBadgeItem) {
        proBadgeItem = document.createElement("div");
        proBadgeItem.id = "user-bar-pro-badge";
        proBadgeItem.className = "badge-item";
        proBadgeItem.innerHTML = `
          <span class="badge-icon">💎</span>
          <div>
            <div class="badge-label">Plan</div>
            <div class="badge-value" style="color:#d97706;">PRO Active ✓</div>
          </div>
        `;
        userBar.appendChild(proBadgeItem);
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.VaakSiddhiSubscription.initHeaderBadges();
});
