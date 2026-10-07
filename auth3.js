// ==============================
// auth3.js - PROFI Authentication
// Lines: 1001 - 1500
// ==============================

import crypto from "crypto";
import nodemailer from "nodemailer";

// ===== Password Reset =====
let resetTokens = [];

app.post("/reset-request", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "❌ User not found" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  resetTokens.push({ email, token: resetToken });

  // Send email (mock)
  console.log(`📧 Reset token for ${email}: ${resetToken}`);
  res.json({ message: "✅ Reset link sent to email" });
});

app.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;
  const validToken = resetTokens.find(rt => rt.email === email && rt.token === token);
  if (!validToken) return res.status(403).json({ message: "❌ Invalid reset token" });

  const user = users.find(u => u.email === email);
  user.password = await bcrypt.hash(newPassword, 10);
  res.json({ message: "✅ Password reset successful" });
});

// ===== Two-Factor Authentication =====
let otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/2fa-request", (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  otpStore[email] = otp;

  // Send OTP (mock)
  console.log(`📲 OTP for ${email}: ${otp}`);
  res.json({ message: "✅ OTP sent to user" });
});

app.post("/2fa-verify", (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] === otp) {
    delete otpStore[email];
    res.json({ message: "✅ 2FA verified" });
  } else {
    res.status(403).json({ message: "❌ Invalid OTP" });
  }
});

// ===== Rate Limiting per User =====
let userRequests = {};

function rateLimitPerUser(req, res, next) {
  const email = req.body.email || "guest";
  const now = Date.now();

  if (!userRequests[email]) {
    userRequests[email] = [];
  }

  userRequests[email] = userRequests[email].filter(ts => now - ts < 60000);
  userRequests[email].push(now);

  if (userRequests[email].length > 10) {
    return res.status(429).json({ message: "❌ Too many requests, slow down" });
  }

  next();
}

app.use(rateLimitPerUser);

// ===== Secure Admin Audit =====
app.get("/audit", authenticateTokenWithBlacklist, authorizeRole("admin"), (req, res) => {
  res.json({ auditTrail });
});

// ==============================
// Lines count: ~1500 (with comments)
// ==============================
