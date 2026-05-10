// ─────────────────────────────────────────────────────────────────────────────
// utils/routingMemory.js — ระบบความจำสำหรับการจัดเส้นทางเรื่องร้องเรียน
//
// v2 Algorithm: Thai Character 4-gram + Type-Level Memory
//
// ปัญหาของ v1 (word-split):
//   ภาษาไทยไม่มีช่องว่างระหว่างคำ → ทั้งประโยคกลายเป็น 1 token
//   ผล: memory จำได้เฉพาะข้อความที่เหมือนกันทุกตัวอักษร ไม่ generalise
//
// v2 แก้ด้วย Character 4-gram Tokenization:
//   "อาจารย์ปฏิบัติ" → ["อาจา", "าจาร", "จารย", "ารย์", "รย์ป", "ย์ปฏ", "์ปฏิ", "ปฏิบ"]
//   "อาจารย์ด่านัก" → ["อาจา", "าจาร", "จารย", "ารย์", ...]  ← 4 gram แรกตรงกัน!
//   ดังนั้น: ข้อความที่ "อาจารย์..." จะ match memory ของ "อาจารย์..." ทุกรูปแบบ
//
// v2 เพิ่ม Type-Level Memory (นอกจาก Dept-Level):
//   - เก็บ types.{typeLabel}.{score, count} ใน Firestore
//   - boost เฉพาะ type ที่เคยถูกเลือก ไม่ใช่ทุก type ในกรมเดิม
//   - ป้องกัน false boost ในกรมเดียวกันที่มีหลาย type
//
// Firestore collection: routingTokenMemory
//   Document ID: <4gram>  เช่น "อาจา", "ปฏิบ", "แอร์ห"
//   Fields:
//     token: string
//     depts: { deptName: { score, count } }   ← dept-level (backward compat)
//     types: { typeLabel: { score, count } }  ← type-level (v2 new)
//     updatedAt: timestamp
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const BOOST_WEIGHT = 3;    // คะแนน boost สูงสุดต่อ gram ที่ confidence = 1.0
const MAX_TOKENS   = 10;   // จำนวน gram สูงสุดต่อ complaint (Firestore reads)
const GRAM_LEN     = 4;    // ความยาว n-gram (ภาษาไทย 4 ตัวอักษร = ~2 พยางค์)

// Thai Unicode block U+0E00–U+0E7F — keep only Thai characters
const THAI_ONLY_RE = /[^\u0E00-\u0E7F]/g;

/**
 * tokenizeForMemory — สร้าง Thai 4-gram tokens จากข้อความ
 *
 * วิธี:
 *   1. กรองเฉพาะอักษรไทย ตัดตัวเลข/อังกฤษ/ช่องว่างทิ้ง
 *   2. สร้าง sliding 4-gram ทุกตำแหน่ง
 *   3. deduplicate แล้ว sample MAX_TOKENS ตัวแบบ evenly-spaced
 *
 * ข้อดี: "อาจารย์ปฏิบัติ" กับ "อาจารย์ดุด่า" มี gram ซ้ำกัน 4 ตัวแรก
 *         → memory จากประโยคหนึ่ง ช่วย boost อีกประโยคที่คล้ายกันได้
 */
function tokenizeForMemory(text) {
  const thai = text.replace(THAI_ONLY_RE, '');
  if (thai.length < GRAM_LEN) return [];

  const gramSet = new Set();
  for (let i = 0; i <= thai.length - GRAM_LEN; i++) {
    gramSet.add(thai.substring(i, i + GRAM_LEN));
  }

  const grams = [...gramSet];
  if (grams.length <= MAX_TOKENS) return grams;

  // Sample evenly for diversity (กระจายทั่วข้อความ)
  const step = grams.length / MAX_TOKENS;
  return Array.from({ length: MAX_TOKENS }, (_, i) => grams[Math.floor(i * step)]);
}

// ─── Internal helper: read one field map from token docs ─────────────────────
async function _queryBoostFromField(db, tokens, field) {
  const boosts = {};
  try {
    const docs = await Promise.all(
      tokens.map(t => db.collection('routingTokenMemory').doc(t).get())
    );
    for (const doc of docs) {
      if (!doc.exists) continue;
      const map = doc.data()[field] || {};
      for (const [key, info] of Object.entries(map)) {
        if (!info || info.count <= 0) continue;
        const confidence = Math.min(1.0, Math.max(0, info.score / info.count));
        boosts[key] = (boosts[key] || 0) + confidence * BOOST_WEIGHT;
      }
    }
  } catch (err) {
    console.warn(`[routingMemory] _queryBoostFromField(${field}) failed:`, err.message);
  }
  return boosts;
}

/**
 * queryMemoryBoost — dept-level boost (backward compat)
 * Returns: { deptName: totalBoost }
 */
async function queryMemoryBoost(db, tokens) {
  return _queryBoostFromField(db, tokens, 'depts');
}

/**
 * queryMemoryBoostByType — type-level boost (v2, more precise)
 * Returns: { typeLabel: totalBoost }
 *
 * ต่างจาก dept-level: boost เฉพาะ type label ที่เคยถูกเลือก
 * ไม่ boost ทุก type ในกรมเดียวกัน → ลด false positive
 */
async function queryMemoryBoostByType(db, tokens) {
  return _queryBoostFromField(db, tokens, 'types');
}

/**
 * recordMemoryHit — บันทึกผลการจัดเส้นทางเพื่อให้ระบบเรียนรู้
 *
 * @param {FirebaseFirestore} db
 * @param {string} complaintText — ข้อความรวม (topic + issue + description + location)
 * @param {string} deptName     — ชื่อหน่วยงานที่ถูกจัดให้
 * @param {boolean} isCorrect   — true = ถูกต้อง (+1.0), false = ผิด (-0.5)
 * @param {string} [typeLabel]  — label ของ type/topic (สำหรับ type-level memory)
 */
async function recordMemoryHit(db, complaintText, deptName, isCorrect = true, typeLabel = '') {
  if (!complaintText || !deptName) return;

  const tokens = tokenizeForMemory(complaintText);
  if (tokens.length === 0) return;

  const delta = isCorrect ? 1.0 : -0.5;

  console.log(`[routingMemory] saving ${tokens.length} grams → dept="${deptName}"${typeLabel ? ` type="${typeLabel}"` : ''} (${isCorrect ? '+1.0' : '-0.5'})`);

  try {
    await Promise.all(tokens.map(async (gram) => {
      const ref = db.collection('routingTokenMemory').doc(gram);
      const snap = await ref.get();
      const data = snap.exists ? snap.data() : null;

      // Build field-path update object
      const updateObj = { updatedAt: new Date() };

      // Dept-level
      const deptInfo = data?.depts?.[deptName] || { score: 0, count: 0 };
      updateObj[`depts.${deptName}`] = {
        score: Math.max(0, deptInfo.score + delta),
        count: deptInfo.count + 1,
      };

      // Type-level (if typeLabel provided)
      if (typeLabel) {
        const typeInfo = data?.types?.[typeLabel] || { score: 0, count: 0 };
        updateObj[`types.${typeLabel}`] = {
          score: Math.max(0, typeInfo.score + delta),
          count: typeInfo.count + 1,
        };
      }

      if (snap.exists) {
        await ref.update(updateObj);
      } else {
        await ref.set({
          token: gram,
          depts: { [deptName]: { score: Math.max(0, delta), count: 1 } },
          types: typeLabel ? { [typeLabel]: { score: Math.max(0, delta), count: 1 } } : {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }));

    console.log(`[routingMemory] ✓ saved memory for dept="${deptName}"${typeLabel ? ` type="${typeLabel}"` : ''}`);
  } catch (err) {
    console.error('[routingMemory] recordMemoryHit failed:', err.message, err.code || '');
  }
}

module.exports = { queryMemoryBoost, queryMemoryBoostByType, recordMemoryHit, tokenizeForMemory };
