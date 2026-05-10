/**
 * สร้างบัญชี executive 1 บัญชี
 * รัน: node create-executive.js
 */
const { admin, db, auth } = require('./config/firebase');

const EXECUTIVE_EMAIL = 'executive@hcu.ac.th';
const EXECUTIVE_PASSWORD = 'Hcu@Exec2025';
const EXECUTIVE_NAME = 'ผู้บริหาร HCU';

async function createExecutive() {
  try {
    // Create Firebase Auth account
    const userRecord = await auth.createUser({
      email: EXECUTIVE_EMAIL,
      password: EXECUTIVE_PASSWORD,
      displayName: EXECUTIVE_NAME,
    });

    console.log('✅ Firebase Auth account created:', userRecord.uid);

    // Create Firestore document (no faculty — executive has university-wide view)
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: EXECUTIVE_EMAIL,
      displayName: EXECUTIVE_NAME,
      role: 'executive',
      faculty: '',
      department: '',
      major: '',
      userType: 'staff',
      createdAt: new Date(),
      photoURL: null,
    });

    console.log('✅ Firestore document created');
    console.log('─────────────────────────────────');
    console.log('📧 Email   :', EXECUTIVE_EMAIL);
    console.log('🔑 Password:', EXECUTIVE_PASSWORD);
    console.log('👤 Role    : executive');
    console.log('─────────────────────────────────');
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      console.log('⚠️  อีเมลนี้มีอยู่แล้ว กำลังอัปเดต role ใน Firestore...');
      const existing = await auth.getUserByEmail(EXECUTIVE_EMAIL);
      await db.collection('users').doc(existing.uid).set({
        uid: existing.uid,
        email: EXECUTIVE_EMAIL,
        displayName: EXECUTIVE_NAME,
        role: 'executive',
        faculty: '',
        department: '',
        major: '',
        userType: 'staff',
        createdAt: new Date(),
        photoURL: null,
      }, { merge: true });
      console.log('✅ อัปเดตเรียบร้อย uid:', existing.uid);
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

createExecutive();
