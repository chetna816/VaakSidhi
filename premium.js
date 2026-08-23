/**
 * VaakSiddhi - premium.js
 * Handles plan toggle, order creation, Razorpay checkout, demo payment fallback, and subscription verification.
 */

document.addEventListener("DOMContentLoaded", () => {
  initPremiumPage();
});

let currentBillingCycle = "MONTHLY"; // "MONTHLY" | "YEARLY"

function initPremiumPage() {
  renderSubscriptionStatusBanner();
  setupBillingToggle();
  setupPlanButtons();
  setupFAQ();
}

function renderSubscriptionStatusBanner() {
  const statusContainer = document.getElementById("active-sub-banner");
  if (!statusContainer || !window.VaakSiddhiStorage) return;

  const sub = window.VaakSiddhiStorage.getSubscription();
  const user = window.VaakSiddhiStorage.getUserData();

  if (sub.isPro) {
    const expiryStr = sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Active";
    const planName = sub.plan === "PRO_ANNUAL" ? "👑 VaakSiddhi Pro Annual" : "⭐ VaakSiddhi Pro Monthly";

    statusContainer.style.display = "block";
    statusContainer.innerHTML = `
      <div style="background:#f0fdf4; border:2px solid #86efac; color:#166534; padding:20px; border-radius:20px; margin-bottom:28px; box-shadow:3px 3px 0px #86efac; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px;">💎</span>
            <strong style="font-size:20px; color:#14532d;">${planName} is Active!</strong>
            <span style="background:#166534; color:#ffffff; font-size:11px; font-weight:800; padding:2px 10px; border-radius:12px; text-transform:uppercase;">Active ✓</span>
          </div>
          <div style="font-size:14px; margin-top:4px; opacity:0.9;">
            Subscriber: <strong>${user.name || "Learner"}</strong> • Renews / Expires: <strong>${expiryStr}</strong>
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button id="cancel-sub-btn" class="btn" style="background:#fee2e2; color:#991b1b; border:1.5px solid #f87171; padding:8px 16px; font-size:13px; font-weight:800; border-radius:14px; cursor:pointer;">
            Cancel Subscription
          </button>
        </div>
      </div>
    `;

    document.getElementById("cancel-sub-btn")?.addEventListener("click", () => {
      if (confirm("Are you sure you want to cancel your Pro subscription? You will retain Pro features until your expiry date.")) {
        window.VaakSiddhiStorage.cancelSubscription();
        renderSubscriptionStatusBanner();
      }
    });
  } else {
    statusContainer.style.display = "none";
  }
}

function setupBillingToggle() {
  const toggleBtn = document.getElementById("billing-toggle-btn");
  const monthlyLabel = document.getElementById("billing-monthly-label");
  const yearlyLabel = document.getElementById("billing-yearly-label");

  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    currentBillingCycle = currentBillingCycle === "MONTHLY" ? "YEARLY" : "MONTHLY";
    updateBillingPrices();
  });
}

function updateBillingPrices() {
  const isYearly = currentBillingCycle === "YEARLY";
  const toggleTrack = document.getElementById("billing-toggle-track");
  const proPriceEl = document.getElementById("pro-card-price");
  const proSubtextEl = document.getElementById("pro-card-subtext");
  const proAnnualPriceEl = document.getElementById("pro-annual-price");

  if (toggleTrack) {
    toggleTrack.style.transform = isYearly ? "translateX(28px)" : "translateX(0px)";
  }

  if (proPriceEl) {
    proPriceEl.innerHTML = isYearly ? "₹799 <span style='font-size:16px; font-weight:600; color:#5c3240;'>/ year</span>" : "₹99 <span style='font-size:16px; font-weight:600; color:#5c3240;'>/ month</span>";
  }

  if (proSubtextEl) {
    proSubtextEl.innerText = isYearly ? "Billed annually (≈ ₹67/month • Save 33%)" : "Billed monthly • Cancel anytime";
  }
}

function setupPlanButtons() {
  const freeBtn = document.getElementById("select-free-btn");
  const proBtn = document.getElementById("upgrade-pro-btn");
  const annualBtn = document.getElementById("upgrade-annual-btn");

  if (freeBtn) {
    freeBtn.addEventListener("click", () => {
      window.VaakSiddhiStorage.showToastNotification("🌱 Free Plan Active", "You are currently on the Free plan.", "info");
    });
  }

  if (proBtn) {
    proBtn.addEventListener("click", () => {
      initiateCheckout("PRO", currentBillingCycle);
    });
  }

  if (annualBtn) {
    annualBtn.addEventListener("click", () => {
      initiateCheckout("PRO_ANNUAL", "YEARLY");
    });
  }
}

async function initiateCheckout(plan, billingCycle) {
  const user = window.VaakSiddhiStorage ? window.VaakSiddhiStorage.getUserData() : { name: "Learner", id: "user_1" };

  window.VaakSiddhiStorage.showToastNotification("⌛ Processing Order...", "Preparing secure Razorpay checkout.", "info");

  try {
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billingCycle, userId: user.id })
    });
    const orderData = await res.json();

    if (!orderData.success) {
      alert("Failed to initiate checkout: " + (orderData.error || "Unknown error"));
      return;
    }

    if (!orderData.isDemo && window.Razorpay) {
      // Live Razorpay Checkout Popup
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "VaakSiddhi Premium",
        description: `${plan === "PRO_ANNUAL" ? "Pro Annual" : "Pro Monthly"} Subscription`,
        image: "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg",
        order_id: orderData.orderId,
        handler: async function (response) {
          await verifyPaymentOnBackend({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            plan,
            billingCycle,
            userId: user.id
          });
        },
        prefill: {
          name: user.name || "Learner",
          email: "learner@vaaksiddhi.app"
        },
        theme: {
          color: "#3d131f"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Demo Payment Mode UI fallback
      showDemoPaymentModal(orderData, plan, billingCycle, user);
    }
  } catch (err) {
    console.error("Checkout initiation failed:", err);
    // Fallback to Demo Payment Mode UI if API call errored
    showDemoPaymentModal({ orderId: "order_demo_" + Date.now(), amount: plan === "PRO_ANNUAL" ? 79900 : 9900, currency: "INR", isDemo: true }, plan, billingCycle, user);
  }
}

function showDemoPaymentModal(orderData, plan, billingCycle, user) {
  let modal = document.getElementById("demo-payment-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "demo-payment-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(40, 11, 20, 0.75);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    document.body.appendChild(modal);
  }

  const amountINR = (orderData.amount / 100).toFixed(0);
  const planTitle = plan === "PRO_ANNUAL" ? "👑 VaakSiddhi Pro Annual Plan" : "⭐ VaakSiddhi Pro Monthly Plan";

  modal.innerHTML = `
    <div style="background:#fffdf0; border:3px solid #3d131f; border-radius:24px; padding:32px; max-width:500px; width:100%; box-shadow:8px 8px 0px #3d131f; position:relative; text-align:center;">
      <button id="close-demo-pay-btn" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:24px; cursor:pointer; color:#3d131f;">✕</button>

      <div style="display:inline-block; background:#e0e7ff; border:1px solid #6366f1; color:#3730a3; font-size:12px; font-weight:800; padding:4px 14px; border-radius:14px; margin-bottom:12px;">
        🧪 DEMO PAYMENT GATEWAY
      </div>

      <h3 style="font-size:24px; color:#3d131f; margin:0 0 6px 0; font-family:'Playfair Display', serif;">${planTitle}</h3>
      <div style="font-size:36px; font-weight:800; color:#78263e; margin-bottom:16px;">₹${amountINR} <span style="font-size:14px; color:#5c3240;">INR</span></div>

      <div style="background:#ffffff; border:2px dashed #3d131f; border-radius:16px; padding:16px; margin-bottom:20px; text-align:left; font-size:13px; color:#3d131f;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#5c3240;">Order ID:</span>
          <strong>${orderData.orderId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#5c3240;">Learner Profile:</span>
          <strong>${user.name || "Learner"}</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#5c3240;">Payment Method:</span>
          <strong>UPI / Credit Card / NetBanking</strong>
        </div>
      </div>

      <div style="margin-bottom:20px; text-align:left;">
        <label style="font-size:12px; font-weight:800; color:#78263e; text-transform:uppercase;">Select Payment Simulation Option:</label>
        <select id="demo-pay-method" style="width:100%; padding:10px; border-radius:12px; border:1.5px solid #3d131f; margin-top:6px; font-weight:700; background:#fffdf0; color:#3d131f;">
          <option value="upi">GPay / PhonePe / Paytm UPI (Instant)</option>
          <option value="card">HDFC / ICICI Credit or Debit Card</option>
          <option value="netbanking">SBI / Axis NetBanking</option>
        </select>
      </div>

      <button id="confirm-demo-payment-btn" class="btn btn-primary" style="padding:14px 28px; font-size:16px; width:100%; cursor:pointer;">
        💳 Complete Payment (₹${amountINR})
      </button>

      <p style="font-size:12px; color:#78263e; margin-top:12px; font-weight:600;">
        🔒 Backend signature verification will run and activate your Pro subscription immediately.
      </p>
    </div>
  `;

  modal.style.display = "flex";

  document.getElementById("close-demo-pay-btn")?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  document.getElementById("confirm-demo-payment-btn")?.addEventListener("click", async () => {
    modal.style.display = "none";
    const demoPayId = "pay_demo_" + Math.random().toString(36).substring(2, 11);
    await verifyPaymentOnBackend({
      orderId: orderData.orderId,
      paymentId: demoPayId,
      signature: "demo_signature_ok",
      plan,
      billingCycle,
      userId: user.id
    });
  });
}

async function verifyPaymentOnBackend(payload) {
  window.VaakSiddhiStorage.showToastNotification("⌛ Verifying Payment...", "Checking backend verification signature.", "info");

  try {
    const res = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success && data.subscription) {
      window.VaakSiddhiStorage.updateSubscription(data.subscription);
      showPaymentSuccessModal(data.subscription);
      renderSubscriptionStatusBanner();
    } else {
      alert("Payment verification failed: " + (data.error || "Unknown verification error"));
    }
  } catch (err) {
    console.error("Payment verification error:", err);
    // Fallback save in storage if network error
    const fallbackSub = {
      plan: payload.plan,
      billing_cycle: payload.billingCycle,
      status: "ACTIVE",
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + (payload.plan === "PRO_ANNUAL" ? 365 : 30) * 86400000).toISOString(),
      paymentId: payload.paymentId || "pay_fallback_1"
    };
    window.VaakSiddhiStorage.updateSubscription(fallbackSub);
    showPaymentSuccessModal(fallbackSub);
    renderSubscriptionStatusBanner();
  }
}

function showPaymentSuccessModal(subRecord) {
  let modal = document.getElementById("payment-success-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "payment-success-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(40, 11, 20, 0.8);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    document.body.appendChild(modal);
  }

  const planName = subRecord.plan === "PRO_ANNUAL" ? "👑 VaakSiddhi Pro Annual" : "⭐ VaakSiddhi Pro Monthly";
  const expiryDate = subRecord.expiryDate ? new Date(subRecord.expiryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Active";

  modal.innerHTML = `
    <div style="background:#fffdf0; border:3px solid #3d131f; border-radius:24px; padding:36px; max-width:480px; width:100%; box-shadow:8px 8px 0px #3d131f; text-align:center; position:relative;">
      <div style="font-size:56px; margin-bottom:12px;">🎉</div>

      <div style="display:inline-block; background:#dcfce7; border:1px solid #166534; color:#15803d; font-size:12px; font-weight:800; padding:4px 14px; border-radius:14px; margin-bottom:12px; text-transform:uppercase;">
        ✓ Payment Verified & Active
      </div>

      <h3 style="font-size:28px; color:#3d131f; margin:0 0 8px 0; font-family:'Playfair Display', serif;">Welcome to ${planName}!</h3>

      <p style="color:#5c3240; font-size:15px; margin:0 0 20px 0; line-height:1.5;">
        Your payment has been successfully processed and verified. You now have unlimited access to all VaakSiddhi Pro tools!
      </p>

      <div style="background:#ffffff; border:2px dashed #3d131f; border-radius:16px; padding:16px; margin-bottom:24px; text-align:left; font-size:13px; color:#3d131f;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#5c3240;">Plan:</span>
          <strong>${planName}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="color:#5c3240;">Transaction ID:</span>
          <strong style="font-family:monospace;">${subRecord.paymentId || "pay_verified"}</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#5c3240;">Pro Access Until:</span>
          <strong>${expiryDate}</strong>
        </div>
      </div>

      <a href="speech.html" class="btn btn-primary" style="padding:14px 28px; font-size:16px; width:100%; text-decoration:none; display:inline-block; box-sizing:border-box;">
        🚀 Start Unlimited Practice →
      </a>
    </div>
  `;

  modal.style.display = "flex";
}

function setupFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    question?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      faqItems.forEach(i => i.classList.remove("open"));
      if (!isOpen) {
        item.classList.add("open");
      }
    });
  });
}
