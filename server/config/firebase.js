// ─────────────────────────────────────────────────────────────────────────────
// config/firebase.js — ตั้งค่า Firebase Admin SDK สำหรับ Backend
// ใช้ Service Account Key เพื่อเข้าถึง Firestore และ Auth โดยไม่ต้องใช้ browser
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// รองรับ 3 วิธี (ลำดับความสำคัญจากบนลงล่าง):
// 1. FIREBASE_SERVICE_ACCOUNT_BASE64 — base64 ของ JSON ทั้งไฟล์ (แนะนำสำหรับ Railway/cloud)
// 2. FIREBASE_SERVICE_ACCOUNT_JSON  — JSON string โดยตรง
// 3. FIREBASE_SERVICE_ACCOUNT_KEY_PATH — path ไปยังไฟล์ .json (ใช้ใน local)
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
  } catch (e) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 decode error:', e.message);
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON parse error:', e.message);
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
  try {
    serviceAccount = require(path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH));
  } catch (e) {
    console.error('❌ Cannot load service account file:', e.message);
    process.exit(1);
  }
} else {
  console.error('❌ ต้องกำหนด FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_JSON หรือ FIREBASE_SERVICE_ACCOUNT_KEY_PATH');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  process.exit(1);
}

// ส่งออก Firestore และ Auth เพื่อใช้ใน routes ต่างๆ
const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
