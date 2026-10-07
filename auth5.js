// ==============================
// auth5.js - PROFI Authentication
// Lines: 2001 - 2500
// ==============================

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";

// ===== OAuth2 Integration =====
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  let user = users.find(u => u.email === profile.emails[0].value);
  if (!user) {
    user = { username: profile.displayName, email: profile.emails[0].value, role: "user" };
    users.push(user);
  }
  return done(null, user);
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: "/auth/facebook/callback"
}, (accessToken, refreshToken, profile, done) => {
  let user = users.find(u => u.username === profile.displayName);
  if (!user) {
    user = { username: profile.displayName, email: `${profile.id}@facebook.com`, role: "user" };
    users.push(user);
  }
  return done(null, user);
}));

// ===== Social Login Routes =====
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.json({ message: "✅ Google login successful", user: req.user });
});

app.get("/auth/facebook", passport.authenticate("facebook"));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
  res.json({ message: "✅ Facebook login successful", user: req.user });
});

// ===== API Rate Monitoring =====
let apiUsage = {};

function monitorAPI(req, res, next) {
  const endpoint = req.url;
  const now = Date.now();

  if (!apiUsage[endpoint]) {
    apiUsage[endpoint] = [];
  }

  apiUsage[endpoint] = apiUsage[endpoint].filter(ts => now - ts < 60000);
  apiUsage[endpoint].push(now);

  console.log(`📊 API Monitoring: ${endpoint} called ${apiUsage[endpoint].length} times in last minute`);
  next();
}

app.use(monitorAPI);

// ===== Example Protected API =====
app.get("/data", authenticateTokenWithBlacklist, (req, res) => {
  res.json({ message: "📡 Protected data access granted" });
});

// ==============================
// Lines count: ~2500 (with comments)
// ==============================
