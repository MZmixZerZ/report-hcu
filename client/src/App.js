// ─────────────────────────────────────────────────────────────────────────────
// App.js — จุดเริ่มต้นของ React Application
// ทำหน้าที่: จัดการ Routing และแยกหน้าตาม role ของ user
//
// โครงสร้าง Role → หน้า:
//   - ยังไม่ login   → LandingPage / LoginPage / RegisterPage
//   - role='user'    → ComplaintSystem (แจ้งเรื่องร้องเรียน)
//   - role='officer' → OfficerSystem (จัดการเรื่องร้องเรียนของหน่วยงาน)
//   - role='admin'   → AdminSystem (จัดการระบบทั้งหมด)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import { AuthProvider, useAuth } from './AuthContext';
import ComplaintSystem from './ComplaintSystem';
import OfficerSystem from './pages/officer/OfficerSystem';
import AdminSystem from './pages/admin/AdminSystem';
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading, user, userRole } = useAuth();
  const location = useLocation();

  // ใช้ top-level path segment เป็น key เพื่อให้ AnimatePresence animate เฉพาะตอนเปลี่ยน section
  // ไม่ใช่ตอน navigate ภายใน section เดียวกัน (เช่น /complaints → /complaints/dashboard)
  const sectionKey = location.pathname.split('/')[1] || 'root';

  // รอตรวจสอบ auth state จาก Firebase
  if (loading) {
    return (
      <div className="App loading-container">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  // ยังไม่ได้ login — แสดงหน้า auth ตาม URL path
  if (!isAuthenticated) {
    return (
      <div className="App">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            <Route path="/officer/login" element={<PageTransition><LoginPage role="officer" /></PageTransition>} />
            <Route path="/officer/register" element={<PageTransition><RegisterPage role="officer" /></PageTransition>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    );
  }

  // ─── Login แล้ว: แยก route ตาม role ───────────────────────────────────────
  if (userRole === 'officer') {
    return (
      <div className="App">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/officer/dashboard" element={<PageTransition><OfficerSystem initialMode="dashboard" /></PageTransition>} />
            <Route path="/officer/list" element={<PageTransition><OfficerSystem initialMode="list" /></PageTransition>} />
            <Route path="*" element={<Navigate to="/officer/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    );
  }

  if (userRole === 'admin') {
    return (
      <div className="App">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/admin/*" element={<PageTransition><AdminSystem /></PageTransition>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    );
  }

  // user / faculty / executive — ทุก role เข้าหน้าระบบร้องเรียน
  return (
    <div className="App">
      <AnimatePresence mode="wait">
        <Routes location={location} key={sectionKey}>
          <Route path="/complaints/*" element={<PageTransition><ComplaintSystem user={user} /></PageTransition>} />
          <Route path="*" element={<Navigate to="/complaints/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
