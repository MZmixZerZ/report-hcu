// ─────────────────────────────────────────────────────────────────────────────
// api.js — Axios instance สำหรับเรียก Backend API
// ทุก request จะแนบ Firebase Auth Token (Bearer) ไปใน header อัตโนมัติ
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { auth } from './firebase';

// baseURL: ใช้ REACT_APP_API_URL จาก .env ถ้ากำหนด, ไม่งั้นใช้ /api (same-origin)
const BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
});

// Interceptor: แนบ Firebase ID Token ไปกับทุก request อัตโนมัติ
// Backend จะใช้ token นี้ตรวจสอบตัวตนผ่าน Firebase Admin SDK
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(); // รับ token ใหม่ถ้าหมดอายุ
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
