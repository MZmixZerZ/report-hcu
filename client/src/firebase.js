// ─────────────────────────────────────────────────────────────────────────────
// firebase.js — ตั้งค่า Firebase Client SDK สำหรับ React Frontend
// เปิดใช้: Authentication และ Firestore (real-time listener)
// หมายเหตุ: key เหล่านี้ปลอดภัยที่จะ expose ใน frontend
//   เพราะถูก restrict ด้วย Firebase Security Rules และ App Check
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase Config — ค่าเหล่านี้อ่านได้จาก Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBsMkyyAygRZ-x11E6kzsBQPi5awpugtl8",
  authDomain: "report-manager-b69ed.firebaseapp.com",
  projectId: "report-manager-b69ed",
  storageBucket: "report-manager-b69ed.firebasestorage.app",
  messagingSenderId: "994089098239",
  appId: "1:994089098239:web:58de5b728d20b453a2e5ca",
};

// เริ่มต้น Firebase App
const app = initializeApp(firebaseConfig);

// เริ่มต้น Firebase Authentication (ใช้ login/register/logout)
export const auth = getAuth(app);

// เริ่มต้น Firestore (ใช้ real-time listener ใน NotificationBell)
export const db = getFirestore(app);

// เชื่อม Firebase Emulator สำหรับ local development
// เปิดใช้ด้วย: REACT_APP_USE_FIREBASE_EMULATOR=true ใน .env
if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (e) {
    // Emulator already connected or failed to connect
  }
}

export default app;
