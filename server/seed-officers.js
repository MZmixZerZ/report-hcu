/**
 * seed-officers.js
 * สร้างบัญชีเจ้าหน้าที่ประจำหน่วยงานใน Firebase Auth + Firestore
 *
 * วิธีรัน: node seed-officers.js
 * หมายเหตุ: script นี้ใช้สำหรับ setup ครั้งแรกหรือ reset accounts
 *           ถ้าบัญชีมีอยู่แล้วจะ skip (ไม่ overwrite)
 */

const { admin, db, auth } = require('./config/firebase');
const OFFICERS = require('./data/officers');

async function seedOfficers() {
  console.log('🚀 เริ่ม seed เจ้าหน้าที่ประจำหน่วยงาน...\n');

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const officer of OFFICERS) {
    const { email, displayName, department, departmentId, role, password } = officer;

    try {
      // ตรวจสอบว่ามี Firebase Auth account อยู่แล้วหรือไม่
      let uid;
      let alreadyExists = false;

      try {
        const existingUser = await auth.getUserByEmail(email);
        uid = existingUser.uid;
        alreadyExists = true;
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err;
      }

      if (alreadyExists) {
        // Auth มีอยู่แล้ว — อัปเดต password และ displayName ด้วย
        await auth.updateUser(uid, { password, displayName, emailVerified: true });
      } else {
        // สร้าง Firebase Auth account ใหม่
        const userRecord = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        });
        uid = userRecord.uid;
      }

      // สร้าง / อัปเดต Firestore user document
      await db.collection('users').doc(uid).set({
        uid,
        email,
        displayName,
        role,
        department,
        departmentId,
        faculty: '',
        major: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isOfficer: true,
      });

      console.log(`✅ ${alreadyExists ? 'อัปเดต' : 'สร้างสำเร็จ'}: ${displayName} [${department}] — ${email}`);
      created++;

    } catch (err) {
      console.error(`❌ ล้มเหลว: ${displayName} [${department}] — ${err.message}`);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log(`✅ สร้างใหม่ : ${created} บัญชี`);
  console.log(`⏭️  ข้าม      : ${skipped} บัญชี`);
  console.log(`❌ ล้มเหลว   : ${failed} บัญชี`);
  console.log('========================================');

  if (created > 0) {
    console.log('\n📋 รายการรหัสผ่าน default (ควรเปลี่ยนหลัง login ครั้งแรก):');
    OFFICERS.forEach(o => {
      console.log(`   ${o.username.padEnd(28)} ${o.password}`);
    });
  }

  process.exit(0);
}

seedOfficers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
