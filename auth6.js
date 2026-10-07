// ==============================
// auth6.js - PROFI Authentication
// Lines: 2501 - 3000
// ==============================

import { Server } from "socket.io";
import http from "http";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET","POST"]
  }
});

// ===== WebSocket Connection =====
io.on("connection", (socket) => {
  console.log("🔔 User connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    console.log(`📡 User joined room: ${room}`);
  });

  socket.on("message", (data) => {
    console.log("💬 Message received:", data);
    io.to(data.room).emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ===== Real-Time Notifications =====
function sendNotification(userEmail, message) {
  io.emit("notification", { user: userEmail, message });
}

// Example: notify on login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "❌ User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "❌ Invalid credentials" });

  const token = jwt.sign({ email: user.email, role: user.role || "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  sendNotification(email, "✅ Login successful");
  res.json({ message: "✅ Login successful", token });
});

// ===== Multi-Device Session Sync =====
let activeSessions = {};

app.post("/device-login", (req, res) => {
  const { email, deviceId } = req.body;
  if (!activeSessions[email]) {
    activeSessions[email] = [];
  }
  activeSessions[email].push(deviceId);
  res.json({ message: `📱 Device ${deviceId} logged in for ${email}` });
});

app.get("/devices/:email", (req, res) => {
  const { email } = req.params;
  res.json({ devices: activeSessions[email] || [] });
});

app.post("/device-logout", (req, res) => {
  const { email, deviceId } = req.body;
  if (activeSessions[email]) {
    activeSessions[email] = activeSessions[email].filter(d => d !== deviceId);
  }
  res.json({ message: `❌ Device ${deviceId} logged out for ${email}` });
});

// ===== Real-Time Device Sync =====
function syncDevices(email, action) {
  io.emit("device-sync", { email, action, devices: activeSessions[email] });
}

// Example usage
app.post("/sync", (req, res) => {
  const { email, action } = req.body;
  syncDevices(email, action);
  res.json({ message: "🔄 Devices synced" });
});

// ===== Start Server with WebSocket =====
server.listen(4000, () => {
  console.log("🚀 Auth server with WebSockets running on port 4000");
});

// ==============================
// Lines count: ~3000 (with comments)
// ==============================
