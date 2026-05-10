const { db } = require('./config/firebase');

const FACULTIES = [
  'คณะกายภาพบำบัด',
  'คณะการแพทย์แผนจีน',
  'คณะเทคนิคการแพทย์',
  'คณะนิติศาสตร์',
  'คณะนิเทศศาสตร์',
  'คณะบริหารธุรกิจ',
  'คณะพยาบาลศาสตร์',
  'คณะเภสัชศาสตร์',
  'คณะวิทยาศาสตร์และเทคโนโลยี',
  'คณะศิลปศาสตร์',
  'คณะสังคมสงเคราะห์ศาสตร์และสวัสดิการสังคม',
  'คณะสาธารณสุขศาสตร์ และสิ่งแวดล้อม',
  'วิทยาลัยจีนศึกษา',
];

async function seed() {
  // Check existing
  const snapshot = await db.collection('faculties').get();
  const existing = new Set();
  snapshot.forEach(d => existing.add(d.data().label));

  let added = 0;
  for (const label of FACULTIES) {
    if (!existing.has(label)) {
      await db.collection('faculties').add({ label, createdAt: new Date() });
      console.log(`Added: ${label}`);
      added++;
    } else {
      console.log(`Already exists: ${label}`);
    }
  }
  console.log(`\nDone. Added ${added} faculties.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
