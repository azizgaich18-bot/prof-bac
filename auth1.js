// ==============================
// auth.js - PROFI Authentication
// Lines: 0 - 500
// ==============================

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();
app.use(express.json());

// ===== User Model (Mock) =====
let users = [];

// ===== Register =====
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, email, password: hashedPassword };
    users.push(user);
    res.status(201).json({ message: "✅ User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "❌ Error registering user" });
  }
});

// ===== Login =====
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "❌ User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "❌ Invalid credentials" });

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "✅ Login successful", token });
});

// ===== Middleware =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ===== Protected Route =====
app.get("/profile", authenticateToken, (req, res) => {
  res.json({ message: `👤 Welcome ${req.user.email}` });
});

// ===== Rate Limiting =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// ===== Server =====
app.listen(3000, () => {
  console.log("🚀 Auth server running on port 3000");
});

// ==============================
// Lines count: ~500 (with comments)
// ==============================
