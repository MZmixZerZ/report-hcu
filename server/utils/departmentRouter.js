// ─────────────────────────────────────────────────────────────────────────────
// utils/departmentRouter.js — จัดเส้นทางเรื่องร้องเรียนไปยังหน่วยงานที่เหมาะสม
//
// ลำดับความสำคัญในการจัดเส้นทาง:
//   1. มี issueId → ดึง issue.departmentIds[]
//      - 1 หน่วยงาน  → ส่งตรงทันที
//      - 2+ หน่วยงาน → คำนวณ keyword score → เลือกคะแนนสูงสุด
//   2. ประเภทร้องเรียน (type) มี departmentId ตรง → ส่งตรง
//   3. Fallback: คำนวณ keyword score กับทุกหน่วยงาน
//
// การคำนวณ Keyword Score — 3 ระดับ (แรงบันดาลใจจากเทคนิค Thai NLP):
//   Tier 1 — ตรงทั้งหมด (text.includes)              : +3 (หัวข้อ) / +2 (รายละเอียด)
//   Tier 2 — Partial overlap ≥ 60% (LexTo+ style)   : คะแนนตามสัดส่วน
//             ใช้ character n-gram Set เพื่อ O(1) lookup (Longan-Tokenize style)
//   Tier 3 — คำในคำอธิบายหน่วยงาน overlap           : +1 (หัวข้อ) / +0.5 (รายละเอียด)
// ─────────────────────────────────────────────────────────────────────────────

// ความยาวขั้นต่ำของคำที่มีความหมาย (ตัวอักษร)
const MIN_WORD_LEN = 3;

// นำเข้าระบบความจำ — ใช้ boost คะแนนหน่วยงานที่เคยถูกต้องในอดีต
const { queryMemoryBoost } = require('./routingMemory');

// คำหยุด (Stop Words) ภาษาไทย — ข้ามคำเหล่านี้ตอน tokenize
const STOP_WORDS = new Set([
  'และ', 'หรือ', 'ของ', 'ใน', 'ที่', 'การ', 'ให้', 'ได้', 'มี', 'เป็น',
  'จาก', 'โดย', 'กับ', 'แต่', 'เพื่อ', 'ซึ่ง', 'ต้อง', 'ทุก', 'นั้น', 'นี้',
  'อยู่', 'แก่', 'ต่อ', 'ทาง', 'ตาม', 'ถึง', 'ด้วย', 'ว่า', 'ไม่', 'ได',
  'ให', 'ตั้ง', 'เมื่อ', 'ไว้', 'ไป', 'มา', 'ขึ้น', 'ลง', 'อีก', 'แล้ว',
]);

/**
 * tokenise — แยกข้อความภาษาไทย/ผสมเป็น token ที่มีความหมาย
 * กรองคำสั้นและ stop words ออก
 */
function tokenise(text) {
  return text
    .split(/[\s,，、。.\/\-\(\)\[\]]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= MIN_WORD_LEN && !STOP_WORDS.has(w));
}

/**
 * ngramSet — สร้าง Set ของ character substring ทุกขนาด (n-gram)
 * ความยาว [minLen, maxLen] จากข้อความที่กำหนด
 *
 * เหตุผล: แทนที่จะเรียก text.includes() ซ้ำต่อ keyword แต่ละตัว
 * เราคำนวณ n-gram ทั้งหมดของข้อความล่วงหน้าครั้งเดียว
 * แล้ว lookup O(1) ใน Set — วิธีเดียวกับ Longan-Tokenize (candidate segments)
 * และ LexTo+ (dictionary-based longest matching)
 */
function ngramSet(text, minLen = 3, maxLen = 16) {
  const set = new Set();
  for (let i = 0; i < text.length; i++) {
    for (let l = minLen; l <= Math.min(maxLen, text.length - i); l++) {
      set.add(text.substring(i, i + l));
    }
  }
  return set;
}

/**
 * scoreDepartment — คำนวณคะแนนความเหมาะสมของหน่วยงานกับเรื่องร้องเรียน
 *
 * Tier 1 — ตรงทั้งหมด (text.includes):              +3 (หัวข้อ) / +2 (รายละเอียด)
 * Tier 2 — Partial overlap ≥ 60% (Longest-match):   คะแนนตามสัดส่วน
 *   วน keyword substring จากยาวไปสั้น (LexTo+ strategy)
 *   ตรวจสอบ membership ใน n-gram Set (Longan style)
 *   หยุดเมื่อพบ match แรก — หัวข้อได้สูงสุด 2.4, รายละเอียด 1.6
 * Tier 3 — token ในคำอธิบายหน่วยงาน overlap:        +1 (หัวข้อ) / +0.5 (รายละเอียด)
 */
function scoreDepartment(dept, titleLower, detailLower) {
  const keywords = dept.keywords || [];
  const descTokens = tokenise(dept.description || '');

  // สร้าง n-gram Set ล่วงหน้าครั้งเดียว — lookup O(1) แทนการเรียก text.includes() ซ้ำ
  const titleNgrams  = ngramSet(titleLower);
  const detailNgrams = ngramSet(detailLower);

  let score = 0;
  for (const kw of keywords) {
    const kl    = kw.toLowerCase();
    const kwLen = kl.length;

    // Tier 1: ตรงทั้งหมด
    if (titleLower.includes(kl)) {
      score += 3;
    } else if (detailLower.includes(kl)) {
      score += 2;
    } else {
      // Tier 2: Sliding longest-match บน substring ของ keyword
      // เงื่อนไข: substring ต้องครอบคลุม ≥ 60% ของ keyword (อย่างน้อย 3 ตัวอักษร)
      const minOverlap = Math.max(3, Math.floor(kwLen * 0.6));
      let partialScore = 0;
      outer: for (let len = kwLen - 1; len >= minOverlap; len--) {
        for (let start = 0; start <= kwLen - len; start++) {
          const sub = kl.substring(start, start + len);
          if (titleNgrams.has(sub)) {
            const cand = (len / kwLen) * 2.4;
            if (cand > partialScore) partialScore = cand; // เก็บคะแนนสูงสุด
            break outer;                                  // พบ longest match — หยุด
          }
          if (detailNgrams.has(sub)) {
            const cand = (len / kwLen) * 1.6;
            if (cand > partialScore) partialScore = cand;
          }
        }
      }
      score += partialScore;
    }
  }

  // Tier 3: token ในคำอธิบายหน่วยงาน
  for (const token of descTokens) {
    if (titleLower.includes(token))       score += 1;
    else if (detailLower.includes(token)) score += 0.5;
  }

  const maxScore = (keywords.length * 3) + (descTokens.length * 1);
  return { score, maxScore };
}

/**
 * routeComplaintFromDB — หาหน่วยงานที่เหมาะสมสำหรับเรื่องร้องเรียน
 * โดยอ้างอิงข้อมูล department + complaintType keywords จาก Firestore
 *
 * @param {FirebaseFirestore} db
 * @param {Object} fields - { topic, issue, issueId, description, location }
 * @returns {{ best, rankings, directMatch? }}
 */
async function routeComplaintFromDB(db, fields) {
  const { topic = '', issue = '', issueId = '', description = '', location = '' } = fields;
  const titleLower = `${topic} ${issue}`.toLowerCase().trim();
  const detailLower = `${description} ${location}`.toLowerCase().trim();

  // ── ขั้นที่ 1: มี issueId → ดึง departmentIds[] จาก issue document ────────────
  if (issueId) {
    try {
      const issueDoc = await db.collection('complaintIssues').doc(issueId).get();
      if (issueDoc.exists) {
        const issueData = issueDoc.data();
        const candidateDeptIds = Array.isArray(issueData.departmentIds) ? issueData.departmentIds : [];

        if (candidateDeptIds.length === 1) {
          // หน่วยงานเดียว → ส่งตรงทันที ไม่ต้องคำนวณ score
          const deptDoc = await db.collection('departments').doc(candidateDeptIds[0]).get();
          const deptName = deptDoc.exists ? (deptDoc.data().name || candidateDeptIds[0]) : candidateDeptIds[0];
          return {
            best: { id: candidateDeptIds[0], name: deptName, score: 100, confidence: 100 },
            rankings: [],
            directMatch: true,
          };
        }

        if (candidateDeptIds.length > 1) {
          // หลายหน่วยงาน → คำนวณ keyword score เพื่อเลือกที่เหมาะสมที่สุด
          // เสริม title ด้วย issue keywords เพื่อให้ได้สัญญาณชัดขึ้น (+3 ต่อ keyword)
          const issueKeywords = Array.isArray(issueData.keywords) ? issueData.keywords : [];
          const enrichedTitle = [titleLower, ...issueKeywords.map(k => k.toLowerCase())].join(' ');

          const deptDocs = await Promise.all(
            candidateDeptIds.map(id => db.collection('departments').doc(id).get())
          );

          const rankList = deptDocs.map(d => {
            const data = d.exists ? d.data() : {};
            const dept = {
              id: d.id,
              name: data.name || d.id,
              description: data.description || '',
              keywords: Array.isArray(data.keywords) ? data.keywords : [],
            };
            const { score, maxScore } = scoreDepartment(dept, enrichedTitle, detailLower);
            return { id: dept.id, name: dept.name, score, maxScore };
          });

          rankList.sort((a, b) => b.score - a.score);

          // ── ผสาน Memory Boost — เพิ่มคะแนนจากประวัติการจัดเส้นทางในอดีต ──
          const memTokens1 = [...new Set(`${enrichedTitle} ${detailLower}`.split(/\s+/).filter(w => w.length >= 3))];
          const memBoosts1 = await queryMemoryBoost(db, memTokens1);
          rankList.forEach(r => {
            if (memBoosts1[r.name]) {
              r.score += memBoosts1[r.name];
              r.memoryBoost = memBoosts1[r.name];
            }
          });
          rankList.sort((a, b) => b.score - a.score);
          // ─────────────────────────────────────────────────

          const totalScore = rankList.reduce((sum, r) => sum + r.score, 0);
          const rankings = rankList.map(r => ({
            ...r,
            confidence: totalScore > 0 ? Math.round((r.score / totalScore) * 100) : 0,
          }));

          const best = rankings[0] && rankings[0].score > 0 ? rankings[0] : null;
          return { best, rankings };
        }
      }
    } catch (err) {
      console.warn('[routeComplaintFromDB] issueId lookup failed:', err.message);
    }
  }

  // ── ขั้นที่ 2: ตรวจสอบว่าประเภทร้องเรียนมี departmentId ตรง ──────────────────
  try {
    const typesSnap = await db.collection('complaintTypes').get();
    for (const doc of typesSnap.docs) {
      const data = doc.data();
      if (data.label === topic && data.departmentId) {
        // พบการ mapping ตรง → ส่งทันทีโดยไม่ต้องคำนวณ keyword
        return {
          best: { id: data.departmentId, name: data.departmentName || data.departmentId, score: 100, confidence: 100 },
          rankings: [],
          directMatch: true,
        };
      }
    }
  } catch (_) { /* ไม่ใช่ข้อผิดพลาดร้ายแรง — ดำเนินต่อไปยัง keyword matching */ }

  // ── ขั้นที่ 3: Fallback — คำนวณ keyword score กับทุกหน่วยงาน ─────────────────
  let departments = [];
  try {
    const snapshot = await db.collection('departments').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      departments.push({
        id: doc.id,
        name: data.name || doc.id,
        description: data.description || '',
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
      });
    });
  } catch (err) {
    console.warn('[routeComplaintFromDB] Firestore read failed:', err.message);
  }

  if (departments.length === 0) {
    return { best: null, rankings: [] }; // ไม่มีหน่วยงานใน Firestore
  }

  const results = departments.map(dept => {
    const { score, maxScore } = scoreDepartment(dept, titleLower, detailLower);
    const coverage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return { id: dept.id, name: dept.name, score, maxScore, coverage };
  });

  // เรียงตาม raw score — คะแนน keyword สัมบูรณ์เป็นสัญญาณที่ดีที่สุด
  results.sort((a, b) => b.score - a.score);

  // ── ผสาน Memory Boost — เพิ่มคะแนนจากประวัติการเรียนรู้ ───────────────────
  // จาก routingTokenMemory: token ใดที่เคยถูกส่งหาหน่วยงานไหนแล้วถูก
  const memTokens = [...new Set(`${titleLower} ${detailLower}`.split(/\s+/).filter(w => w.length >= 3))];
  const memBoosts = await queryMemoryBoost(db, memTokens);
  if (Object.keys(memBoosts).length > 0) {
    results.forEach(r => {
      if (memBoosts[r.name]) {
        r.score += memBoosts[r.name];
        r.memoryBoost = memBoosts[r.name];
      }
    });
    // เรียงใหม่หลังผสาน memory boost
    results.sort((a, b) => b.score - a.score);
  }
  // ─────────────────────────────────────────────────────────────────

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const rankings = results.map(r => ({
    ...r,
    confidence: totalScore > 0 ? Math.round((r.score / totalScore) * 100) : 0,
  }));

  const best = rankings[0];
  const bestDept = best && best.score > 0 ? best : null;

  return { best: bestDept, rankings };
}

module.exports = { routeComplaintFromDB };
