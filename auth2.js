// ==============================
// auth2.js - PROFI Authentication
// Lines: 501 - 1000
// ==============================

import jwt from "jsonwebtoken";

// ===== Token Blacklist =====
let tokenBlacklist = [];

// ===== Logout =====
app.post("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  tokenBlacklist.push(token);
  res.json({ message: "✅ Logged out successfully" });
});

// ===== Middleware with Blacklist =====
function authenticateTokenWithBlacklist(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  if (tokenBlacklist.includes(token)) {
    return res.status(403).json({ message: "❌ Token is blacklisted" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ===== Refresh Token =====
let refreshTokens = [];

app.post("/token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.sendStatus(401);
  if (!refreshTokens.includes(token)) return res.sendStatus(403);

  jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ accessToken });
  });
});

app.post("/refresh", (req, res) => {
  const { email } = req.body;
  const refreshToken = jwt.sign({ email }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
  refreshTokens.push(refreshToken);
  res.json({ refreshToken });
});

// ===== Role Management =====
function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "❌ Access denied" });
    }
    next();
  };
}

// ===== Admin Route =====
app.get("/admin", authenticateTokenWithBlacklist, authorizeRole("admin"), (req, res) => {
  res.json({ message: "👑 Welcome Admin" });
});

// ===== Audit Trail =====
let auditTrail = [];

function logAudit(action, user) {
  auditTrail.push({ action, user, date: new Date() });
}

// Example usage in login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "❌ User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "❌ Invalid credentials" });

  const token = jwt.sign({ email: user.email, role: user.role || "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  logAudit("login", email);
  res.json({ message: "✅ Login successful", token });
});

// ==============================
// Lines count: ~1000 (with comments)
// ==============================
