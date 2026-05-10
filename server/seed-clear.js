/**
 * seed-clear.js
 * ลบข้อมูลทั้งหมดใน collections:
 *   - departments
 *   - complaintTypes
 *   - complaintIssues
 *
 * วิธีใช้: node seed-clear.js
 */

const { db } = require('./config/firebase');

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`  [${collectionName}] ว่างเปล่าอยู่แล้ว`);
    return 0;
  }

  // Firestore batch รับได้สูงสุด 500 ops ต่อครั้ง
  const chunks = [];
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 500) {
    chunks.push(docs.slice(i, i + 500));
  }

  let total = 0;
  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    total += chunk.length;
  }

  console.log(`  [${collectionName}] ลบแล้ว ${total} รายการ`);
  return total;
}

async function main() {
  console.log('🗑️  เริ่มต้นลบข้อมูล...\n');

  try {
    await clearCollection('departments');
    await clearCollection('complaintTypes');
    await clearCollection('complaintIssues');

    console.log('\n✅ ลบข้อมูลทั้งหมดเรียบร้อย');
  } catch (err) {
    console.error('\n❌ เกิดข้อผิดพลาด:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
