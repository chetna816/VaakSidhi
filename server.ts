import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Razorpay client if secrets are present
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret && !razorpayInstance) {
    try {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    } catch (e) {
      console.warn("Razorpay init failed, falling back to Demo Payment Mode:", e);
    }
  }
  return razorpayInstance;
}

// In-Memory store for verified subscriptions in backend
const userSubscriptions: Record<string, any> = {};

// API: Create Razorpay Order
app.post("/api/create-order", async (req, res) => {
  try {
    const { plan, billingCycle } = req.body;
    let amount = 9900; // default ₹99 in paise

    if (plan === "PRO_ANNUAL" || billingCycle === "YEARLY") {
      amount = 79900; // ₹799 in paise
    } else if (plan === "PRO") {
      amount = 9900; // ₹99 in paise
    }

    const rzp = getRazorpay();
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_demo_vaaksiddhi";

    if (rzp && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const options = {
        amount: amount,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: { plan, billingCycle }
      };
      const order = await rzp.orders.create(options);
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: keyId,
        isDemo: false
      });
    } else {
      // Fallback Demo Payment Mode when API keys are not supplied in .env
      const demoOrderId = "order_demo_" + Math.random().toString(36).substring(2, 11);
      return res.json({
        success: true,
        orderId: demoOrderId,
        amount: amount,
        currency: "INR",
        key: "rzp_test_demo_vaaksiddhi",
        isDemo: true,
        message: "Razorpay keys not configured. Running in Demo Payment Mode."
      });
    }
  } catch (error: any) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create order" });
  }
});

// API: Verify Razorpay Payment (Backend verification)
app.post("/api/verify-payment", async (req, res) => {
  try {
    const { orderId, paymentId, signature, plan, billingCycle, userId } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let isVerified = false;

    if (keySecret && signature && orderId && paymentId && !orderId.startsWith("order_demo_")) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      isVerified = generatedSignature === signature;
    } else {
      // Demo Payment verification fallback
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature. Verification failed."
      });
    }

    // Calculate expiry date (+30 days or +365 days)
    const startDate = new Date();
    const expiryDate = new Date();
    if (plan === "PRO_ANNUAL" || billingCycle === "YEARLY") {
      expiryDate.setDate(startDate.getDate() + 365);
    } else {
      expiryDate.setDate(startDate.getDate() + 30);
    }

    const subRecord = {
      plan: plan || "PRO",
      billing_cycle: billingCycle || "MONTHLY",
      status: "ACTIVE",
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      paymentId: paymentId || `pay_demo_${Date.now()}`,
      orderId: orderId,
      subscriptionId: `sub_vks_${Date.now()}`,
      verifiedAt: new Date().toISOString()
    };

    if (userId) {
      userSubscriptions[userId] = subRecord;
    }

    return res.json({
      success: true,
      subscription: subRecord
    });
  } catch (error: any) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to verify payment" });
  }
});

// API: Fetch User Subscription Status
app.get("/api/subscription/:userId", (req, res) => {
  const { userId } = req.params;
  const sub = userSubscriptions[userId] || {
    plan: "FREE",
    billing_cycle: "MONTHLY",
    status: "ACTIVE"
  };
  res.json({ success: true, subscription: sub });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VaakSiddhi Express + Vite server listening on port ${PORT}`);
  });
}

startServer();
