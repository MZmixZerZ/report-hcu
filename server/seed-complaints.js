/**
 * seed-complaints.js
 * เพิ่ม complaintTypes และ complaintIssues เข้า Firestore
 * วิธีรัน: node seed-complaints.js
 */

const { db } = require('./config/firebase');

const U = {
  emergency: { urgencyLabel: 'ฉุกเฉิน', urgencyLevel: 4 },
  high:      { urgencyLabel: 'สูง',      urgencyLevel: 3 },
  medium:    { urgencyLabel: 'ปานกลาง', urgencyLevel: 2 },
  low:       { urgencyLabel: 'ต่ำ',      urgencyLevel: 1 },
};

// 6 หัวข้อหลัก ครอบคลุมทุกหน่วยงาน
const COMPLAINT_DATA = [
  {
    label: 'การเงินและการชำระเงิน',
    urgency: 'high',
    issues: [
      { label: 'ค่าเทอม/ค่าธรรมเนียมคำนวณผิดพลาด',      urgency: 'high'   },
      { label: 'ระบบชำระเงินออนไลน์ขัดข้อง',             urgency: 'medium' },
      { label: 'ทุนการศึกษา/กยศ/กรอ ไม่ได้รับหรือผิดพลาด', urgency: 'high' },
      { label: 'เงินเดือน/ค่าตอบแทนบุคลากรผิดพลาด',      urgency: 'high'   },
      { label: 'ไม่ได้รับใบเสร็จหรือเอกสารทางการเงิน',   urgency: 'medium' },
      { label: 'ขอผ่อนชำระ/ผ่อนผันค่าเทอม',              urgency: 'medium' },
    ],
  },
  {
    label: 'การเรียนและทะเบียน',
    urgency: 'high',
    issues: [
      { label: 'ลงทะเบียน/เพิ่ม-ถอนวิชาไม่ได้',          urgency: 'high'   },
      { label: 'ผลการเรียน/เกรดผิดพลาด',                  urgency: 'high'   },
      { label: 'เอกสารการศึกษาล่าช้า (transcript/ใบรับรอง)', urgency: 'medium' },
      { label: 'การสอนไม่ได้มาตรฐาน/หลักสูตรมีปัญหา',    urgency: 'high'   },
      { label: 'การสำเร็จการศึกษา/ขอจบมีปัญหา',           urgency: 'high'   },
      { label: 'สหกิจศึกษา/ฝึกงานมีปัญหา',                urgency: 'medium' },
      { label: 'ตารางเรียน/ตารางสอบผิดพลาด',              urgency: 'medium' },
    ],
  },
  {
    label: 'อาคาร สถานที่ และสาธารณูปโภค',
    urgency: 'medium',
    issues: [
      { label: 'ไฟฟ้า/น้ำประปา/เครื่องปรับอากาศขัดข้อง',  urgency: 'medium' },
      { label: 'ห้องเรียน/ห้องน้ำ/ลิฟต์ชำรุดหรือไม่พร้อม', urgency: 'medium' },
      { label: 'ความสะอาดและสุขอนามัยไม่ได้มาตรฐาน',      urgency: 'medium' },
      { label: 'ความปลอดภัยหรือทรัพย์สินสูญหาย',          urgency: 'high'   },
      { label: 'ที่จอดรถไม่เพียงพอหรือการจราจรติดขัด',    urgency: 'low'    },
      { label: 'การก่อสร้าง/ปรับปรุงรบกวนการเรียนหรือทำงาน', urgency: 'medium' },
    ],
  },
  {
    label: 'เทคโนโลยีและระบบดิจิทัล',
    urgency: 'medium',
    issues: [
      { label: 'อินเทอร์เน็ต/WiFi ช้าหรือใช้งานไม่ได้',   urgency: 'medium' },
      { label: 'ระบบ MIS/เว็บไซต์/แอปขัดข้อง',            urgency: 'medium' },
      { label: 'E-Learning/การเรียนออนไลน์มีปัญหา',        urgency: 'medium' },
      { label: 'บัญชีผู้ใช้/รหัสผ่าน/อีเมลมีปัญหา',       urgency: 'medium' },
      { label: 'คอมพิวเตอร์/อุปกรณ์ IT เสียหายหรือไม่เพียงพอ', urgency: 'medium' },
      { label: 'ข้อมูลในระบบผิดพลาดหรือสูญหาย',           urgency: 'high'   },
    ],
  },
  {
    label: 'การให้บริการและพฤติกรรมบุคลากร',
    urgency: 'high',
    issues: [
      { label: 'เจ้าหน้าที่/อาจารย์ให้บริการล่าช้าหรือไม่มีประสิทธิภาพ', urgency: 'medium' },
      { label: 'เจ้าหน้าที่/อาจารย์ปฏิบัติตัวไม่เหมาะสม', urgency: 'high'   },
      { label: 'การคุกคาม/ล่วงละเมิด/บูลลี่',             urgency: 'emergency' },
      { label: 'เอกสาร/คำร้องล่าช้าหรือสูญหาย',           urgency: 'medium' },
      { label: 'ไม่ได้รับข่าวสาร/ประกาศสำคัญ',            urgency: 'low'    },
      { label: 'กระบวนการจัดซื้อ/จัดจ้างไม่โปร่งใส',      urgency: 'medium' },
    ],
  },
  {
    label: 'กิจกรรม สวัสดิการ และที่พักนักศึกษา',
    urgency: 'medium',
    issues: [
      { label: 'หอพักนักศึกษาชำรุดหรือมีปัญหาความปลอดภัย', urgency: 'high'   },
      { label: 'กิจกรรม/ชมรมนักศึกษาไม่ได้รับการสนับสนุน', urgency: 'low'    },
      { label: 'ปัญหาวินัย/พฤติกรรมนักศึกษา',              urgency: 'high'   },
      { label: 'บริการแนะแนว/จัดหางานไม่เพียงพอ',          urgency: 'medium' },
      { label: 'ห้องสมุด/ทรัพยากรการเรียนรู้มีปัญหา',      urgency: 'medium' },
      { label: 'สนามกีฬา/พื้นที่นันทนาการไม่พร้อมใช้งาน',  urgency: 'low'    },
      { label: 'ครุภัณฑ์/วัสดุในหน่วยงานไม่เพียงพอหรือเสียหาย', urgency: 'medium' },
    ],
  },
];

async function seedComplaints() {
  console.log('🚀 เริ่ม seed หัวข้อ (complaintTypes) และปัญหา (complaintIssues)...\n');

  const existingTypesSnap = await db.collection('complaintTypes').get();
  const existingTypeLabels = new Map();
  existingTypesSnap.forEach(doc => existingTypeLabels.set(doc.data().label, doc.id));

  const existingIssuesSnap = await db.collection('complaintIssues').get();
  const existingIssueKeys = new Set();
  existingIssuesSnap.forEach(doc => {
    const d = doc.data();
    existingIssueKeys.add(`${d.typeId}::${d.label}`);
  });

  let typesCreated = 0, typesSkipped = 0, issuesCreated = 0, issuesSkipped = 0;
  const now = new Date();

  for (const entry of COMPLAINT_DATA) {
    const typeUrgency = U[entry.urgency];
    let typeId;

    if (existingTypeLabels.has(entry.label)) {
      typeId = existingTypeLabels.get(entry.label);
      typesSkipped++;
      console.log(`⏭️  [type] ข้าม: ${entry.label}`);
    } else {
      const docRef = await db.collection('complaintTypes').add({
        label: entry.label,
        urgencyLabel: typeUrgency.urgencyLabel,
        urgencyLevel: typeUrgency.urgencyLevel,
        createdAt: now,
      });
      typeId = docRef.id;
      existingTypeLabels.set(entry.label, typeId);
      typesCreated++;
      console.log(`✅ [type] สร้าง: ${entry.label}`);
    }

    for (const issue of (entry.issues || [])) {
      const key = `${typeId}::${issue.label}`;
      if (existingIssueKeys.has(key)) { issuesSkipped++; continue; }
      const iu = U[issue.urgency];
      await db.collection('complaintIssues').add({
        typeId,
        label: issue.label,
        urgencyLabel: iu.urgencyLabel,
        urgencyLevel: iu.urgencyLevel,
        createdAt: now,
      });
      existingIssueKeys.add(key);
      issuesCreated++;
      console.log(`   ✅ [issue] ${issue.label} [${iu.urgencyLabel}]`);
    }
  }

  console.log('\n========================================');
  console.log(`📂 complaintTypes  สร้าง: ${typesCreated}  ข้าม: ${typesSkipped}`);
  console.log(`📋 complaintIssues สร้าง: ${issuesCreated}  ข้าม: ${issuesSkipped}`);
  console.log('========================================');
  process.exit(0);
}

seedComplaints().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
