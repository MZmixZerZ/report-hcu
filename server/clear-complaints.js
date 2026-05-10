/**
 * clear-complaints.js
 * ลบ complaintTypes และ complaintIssues ทั้งหมดออกจาก Firestore
 *
 * วิธีรัน: node clear-complaints.js
 */

const { db } = require('./config/firebase');

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`⚠️  ${collectionName}: ไม่มีข้อมูล`);
    return 0;
  }
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🗑️  ลบ ${collectionName} ทั้งหมด ${snapshot.size} รายการ`);
  return snapshot.size;
}

async function clearComplaints() {
  console.log('🚀 เริ่มลบข้อมูล...\n');
  const types = await deleteCollection('complaintTypes');
  const issues = await deleteCollection('complaintIssues');
  console.log(`\n✅ เสร็จสิ้น — ลบ types: ${types}, issues: ${issues}`);
  process.exit(0);
}

clearComplaints().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
