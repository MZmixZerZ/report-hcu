// ─────────────────────────────────────────────────────────────────────────────
// server.js — จุดเริ่มต้นของ Express Backend
// ทำหน้าที่: ตั้งค่า middleware, เชื่อมต่อ Firebase, ลงทะเบียน route ทั้งหมด
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config(); // โหลดค่าจาก .env (port, Firebase key path ฯลฯ)

// เริ่มต้น Firebase Admin SDK (Firestore + Auth)
const { db, auth } = require('./config/firebase');

// โหลด NLP embedding model ล่วงหน้าตอนเซิร์ฟเวอร์เริ่ม
// ครั้งแรกจะดาวน์โหลดโมเดล ~120 MB, ครั้งถัดไปใช้ cache ใน .model-cache/
const { warmup } = require('./utils/embedder');
warmup();

// ─── นำเข้า Route handlers ───────────────────────────────────────────────────
const complaintsRouter = require('./routes/complaints'); // เส้นทางเรื่องร้องเรียน
const adminRouter = require('./routes/admin');           // เส้นทางสำหรับแอดมิน
const departmentsRouter = require('./routes/departments'); // เส้นทางสำหรับหน่วยงาน

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5000',
      'https://report-hcu.com',
      'https://www.report-hcu.com',
    ],
    credentials: true,
  },
});

// ─── Socket.IO — real-time events ────────────────────────────────────────────
io.on('connection', (socket) => {
  // Client joins a room for their own userId to receive personal updates
  socket.on('join', (userId) => {
    if (userId && typeof userId === 'string') socket.join(userId);
  });
  // Clients join a role-based room: 'role:officer', 'role:admin' etc.
  // Client sends: socket.emit('join_department', 'role:officer')
  // We join the room as-is (no prefix) so it matches what complaints.js emits to
  socket.on('join_department', (room) => {
    if (room && typeof room === 'string') socket.join(room);
  });
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5000',
  'https://report-hcu.com',
  'https://www.report-hcu.com',
];
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, Postman, internal)
    if (!origin) return callback(null, true);
    // normalize trailing slash before comparing
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
// เพิ่ม body size เป็น 50 MB เพื่อรองรับการอัปโหลดรูปภาพแบบ base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Health Check Endpoints ───────────────────────────────────────────────────
// ใช้ตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่หรือไม่
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js backend!' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running with Firebase connected' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/complaints', complaintsRouter); // /api/complaints/*
app.use('/api/admin', adminRouter);           // /api/admin/*
app.use('/api/departments', departmentsRouter); // /api/departments/*

// ─── Serve React build (production) ──────────────────────────────────────────
const buildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(buildPath));
// React Router catch-all — ทุก path ที่ไม่ใช่ /api ส่งกลับ index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// ดักจับ error ที่ไม่ได้ handle ใน route ใดๆ
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Firestore connected`);
  console.log(`🔌 Socket.IO ready`);
});
