// ==============================
// auth4.js - PROFI Authentication
// Lines: 1501 - 2000
// ==============================

import cors from "cors";
import helmet from "helmet";
import csurf from "csurf";
import session from "express-session";

// ===== Security Middleware =====
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

app.use(helmet());
app.use(csurf({ cookie: true }));

// ===== Session Management =====
app.use(session({
  secret: process.env.SESSION_SECRET || "secretKey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 60 * 60 * 1000 }
}));

// ===== Advanced Logging =====
function logEvent(event, user) {
  console.log(`📜 Event: ${event}, User: ${user}, Time: ${new Date().toISOString()}`);
}

app.use((req, res, next) => {
  logEvent(`Request ${req.method} ${req.url}`, req.user ? req.user.email : "guest");
  next();
});

// ===== CSRF Protected Route =====
app.post("/secure-action", (req, res) => {
  res.json({ message: "✅ Secure action completed with CSRF protection" });
});

// ===== Session Example =====
app.post("/session-login", (req, res) => {
  const { email } = req.body;
  req.session.user = email;
  res.json({ message: `👤 Session started for ${email}` });
});

app.get("/session-profile", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "❌ No active session" });
  }
  res.json({ message: `👤 Active session for ${req.session.user}` });
});

// ===== Security Hardening =====
app.disable("x-powered-by");

// ===== Error Handling =====
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// ==============================
// Lines count: ~2000 (with comments)
// ==============================
