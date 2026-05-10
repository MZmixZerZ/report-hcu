// ─────────────────────────────────────────────────────────────────────────────
// AuthContext.js — จัดการสถานะการ login และข้อมูล user ผ่าน React Context
//
// Context นี้เก็บ:
//   user        — Firebase User object (มีซัก = login อยู่)
//   userRole    — 'user' | 'officer' | 'admin' | 'faculty' | 'executive'
//   userFaculty — ชื่อคณะ (student)
//   userDept    — ชื่อหน่วยงาน
//   userMajor   — สาขาวิชา / หน่วยย่อย
//   userType    — 'student' | 'staff'
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// ── Session timeout constants (เฉพาะ role='user') ──────────────────────────
const SESSION_DURATION_MS = 90 * 60 * 1000; // 90 นาที
const WARN_BEFORE_MS      =  2 * 60 * 1000; // เตือน 2 นาทีก่อนหมดอายุ
const SESSION_KEY         = 'hcu_session_start';

const AuthContext = createContext();

// useAuth — hook สำหรับ component ที่ต้องการเข้าถึงข้อมูล auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);           // Firebase User object
  const [userRole, setUserRole] = useState(null);   // role จาก Firestore
  const [userFaculty, setUserFaculty] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [userMajor, setUserMajor] = useState('');
  const [userType, setUserType] = useState('');     // 'student' | 'staff'
  const [loading, setLoading] = useState(true);     // true = กำลังตรวจสอบ auth state
  const [error, setError] = useState(null);
  const [sessionExpiring, setSessionExpiring] = useState(false); // เตือนก่อน session หมดอายุ
  const timerRef = useRef(null); // setTimeout สำหรับ auto-logout
  const warnRef  = useRef(null); // setTimeout สำหรับการเตือน

  // ติดตาม auth state อัตโนมัติ — ทำงานตลอดช่วงชีวิต App
  // เมื่อ Firebase auth state เปลี่ยน (login/logout) จะดึง role จาก Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get user role from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserRole((data.role || '').trim());
          setUserFaculty((data.faculty || '').trim());
          setUserDepartment(data.department || '');
          setUserMajor(data.major || '');
          setUserType(data.userType || '');
        } else {
          setUserRole('user');
          setUserFaculty('');
          setUserDepartment('');
          setUserMajor('');
          setUserType('');
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserFaculty('');
        setUserDepartment('');
        setUserMajor('');
        setUserType('');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ── Session timeout effect (เฉพาะ role='user') ───────────────────────────
  useEffect(() => {
    clearTimeout(timerRef.current);
    clearTimeout(warnRef.current);

    if (user && userRole === 'user') {
      let start = parseInt(localStorage.getItem(SESSION_KEY) || '0', 10);
      if (!start) {
        start = Date.now();
        localStorage.setItem(SESSION_KEY, String(start));
      }

      const elapsed   = Date.now() - start;
      const remaining = SESSION_DURATION_MS - elapsed;

      if (remaining <= 0) {
        // session หมดอายุแล้ว — sign out ทันที
        localStorage.removeItem(SESSION_KEY);
        signOut(auth);
        return;
      }

      const warnIn = remaining - WARN_BEFORE_MS;
      if (warnIn > 0) {
        warnRef.current = setTimeout(() => setSessionExpiring(true), warnIn);
      } else {
        setSessionExpiring(true);
      }

      timerRef.current = setTimeout(() => {
        localStorage.removeItem(SESSION_KEY);
        setSessionExpiring(false);
        signOut(auth);
      }, remaining);
    } else {
      setSessionExpiring(false);
    }

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(warnRef.current);
    };
  }, [user, userRole]);

  // ลงทะเบียนผู้ใช้ใหม่: สร้าง Firebase Auth account + Firestore document
  // userTypeParam: 'student' | 'staff'
  // สำหรับ student: department = ชื่อคณะ (faculty), major = สาขาวิชา
  // สำหรับ staff: department = หน่วยงานหลัก, major = หน่วยงานย่อย
  const register = async (email, password, displayName, role = 'user', faculty = '', userTypeParam = 'student', departmentParam = '', majorParam = '') => {
    try {
      setError(null);
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(newUser, { displayName });
      
      // Determine stored fields based on userType
      const department = userTypeParam === 'student' ? (faculty || departmentParam) : departmentParam;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: displayName,
        role,
        faculty: userTypeParam === 'student' ? (faculty || departmentParam) : '',
        department,
        major: majorParam,
        userType: userTypeParam,
        createdAt: new Date(),
        photoURL: null,
      });

      setUser(newUser);
      setUserRole(role);
      setUserFaculty(userTypeParam === 'student' ? department : '');
      setUserDepartment(department);
      setUserMajor(majorParam);
      setUserType(userTypeParam);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // เข้าสู่ระบบด้วย email/password
  // expectedRole: ตรวจว่า account นี้มี role ตรงกับที่คาดหวังหรือไม่ (ถ้าไม่ตรง จะ logout ทันที)
  const login = async (email, password, expectedRole = null) => {
    try {
      setError(null);
      const { user: loggedInUser } = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user role and department from Firestore
      const userRef = doc(db, 'users', loggedInUser.uid);
      const userSnap = await getDoc(userRef);
      let role = null;
      if (userSnap.exists()) {
        const data = userSnap.data();
        role = data.role;
        setUserRole(role);
        setUserDepartment(data.department || '');
        setUserFaculty(data.faculty || '');
        setUserMajor(data.major || '');
        setUserType(data.userType || '');
      }

      setUser(loggedInUser);

      // บันทึกเวลาเริ่ม session (เฉพาะ user ทั่วไป)
      if (role === 'user') {
        localStorage.setItem(SESSION_KEY, String(Date.now()));
      }

      if (expectedRole && role !== expectedRole) {
        // not the right type of account; log out and throw
        await signOut(auth);
        setUser(null);
        setUserRole(null);
        throw new Error('บัญชีนี้ไม่ได้รับอนุญาตให้เข้าสู่ระบบในส่วนนี้');
      }

      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // เข้าสู่ระบบด้วย Google Account
  const loginWithGoogle = async (expectedRole = null) => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const { user: googleUser } = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', googleUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create user document
        await setDoc(userRef, {
          uid: googleUser.uid,
          email: googleUser.email,
          displayName: googleUser.displayName,
          role: expectedRole || 'user',
          createdAt: new Date(),
          photoURL: googleUser.photoURL,
          provider: 'google',
        });
        setUserRole(expectedRole || 'user');
      } else {
        setUserRole(userSnap.data().role);
      }
      
      setUser(googleUser);
      const resolvedRole = userSnap.exists() ? userSnap.data().role : (expectedRole || 'user');
      if (resolvedRole === 'user') {
        localStorage.setItem(SESSION_KEY, String(Date.now()));
      }
      return googleUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      clearTimeout(timerRef.current);
      clearTimeout(warnRef.current);
      localStorage.removeItem(SESSION_KEY);
      setSessionExpiring(false);
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ต่ออายุ session (รีเซ็ตนับใหม่ 90 นาที)
  const extendSession = () => {
    localStorage.setItem(SESSION_KEY, String(Date.now()));
    setSessionExpiring(false);
    clearTimeout(timerRef.current);
    clearTimeout(warnRef.current);
    warnRef.current = setTimeout(
      () => setSessionExpiring(true),
      SESSION_DURATION_MS - WARN_BEFORE_MS
    );
    timerRef.current = setTimeout(() => {
      localStorage.removeItem(SESSION_KEY);
      setSessionExpiring(false);
      signOut(auth);
    }, SESSION_DURATION_MS);
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Self-service: อัปเดต department/major/userType ของตัวเอง
  const updateUserProfile = async (department, major, userTypeParam) => {
    try {
      setError(null);
      const token = await auth.currentUser.getIdToken();
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ department, major, userType: userTypeParam }),
      });
      setUserDepartment(department || '');
      setUserMajor(major || '');
      setUserType(userTypeParam || '');
      if (userTypeParam === 'student') setUserFaculty(department || '');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ค่าที่ส่งออกไปยังทุก component ที่ใช้ useAuth()
  const value = {
    user,
    userRole,
    userFaculty,
    userDepartment,
    userMajor,
    userType,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    isAdmin: userRole === 'admin',
    isOfficer: userRole === 'officer',
    isAuthenticated: !!user,
    sessionExpiring,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
