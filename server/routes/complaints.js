// ─────────────────────────────────────────────────────────────────────────────
// routes/complaints.js — จัดการ API เรื่องร้องเรียนทั้งหมด
//
// สาม API หลัก:
//   POST /autofill     — NLP แนะนำประเภทและปัญหาจากข้อความอิสระ
//   POST /             — สร้างเรื่องร้องเรียนใหม่ + ส่ง notification หาเจ้าหน้าที่
//   POST /custom-issue — ส่งปัญหาใหม่ที่ไม่มีในระบบรอ admin อนุมัติ
//
// NLP Architecture (สำหรับ autofill):
//   Hybrid Scoring = Keyword Layer + Semantic Layer
//   • typeScore  = kwScore + semScore × 12
//   • issueScore = semScore × 0.65 + (kwScore/maxKw) × 0.35
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const { db, auth, admin } = require('../config/firebase');
const { routeComplaintFromDB } = require('../utils/departmentRouter');
const { createNotification } = require('../utils/notificationHelper');
const { embed, cosine } = require('../utils/embedder');
const { recordMemoryHit, queryMemoryBoost, queryMemoryBoostByType, tokenizeForMemory } = require('../utils/routingMemory'); // ระบบความจำ v2
const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaints/autofill — NLP: แนะนำประเภทร้องเรียนและปัญหา
// รับ: { description: string }
// ส่งคืน: { suggestions: [{ topic, topicId, issues: [...] }] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/autofill', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length < 3) {
      return res.status(400).json({ error: 'Description too short' });
    }
    const text = description.toLowerCase().trim();

    // ─── Stop Words ───────────────────────────────────────────────────────────────────
    // คำที่คัดออกก่อน tokenize เพราะไม่มีความหมายในการจัดประเภท
    // หมายเหตุพิเศษ: 'นักศึกษา' (9 ตัวอักษร) ถ้าไม่คัดออกจะให้ kw boost +9
    // แก่สำนักพัฒนานักศึกษา ทุก complaint ที่มีคำนี้ ซึ่งไม่ถูกต้อง
    const STOP = new Set([
      'และ', 'หรือ', 'ของ', 'ใน', 'ที่', 'การ', 'ให้', 'ได้', 'มี', 'เป็น',
      'จาก', 'โดย', 'กับ', 'แต่', 'เพื่อ', 'ซึ่ง', 'ต้อง', 'ทุก', 'นั้น', 'นี้',
      'อยู่', 'แก่', 'ต่อ', 'ทาง', 'ตาม', 'ถึง', 'ด้วย', 'ว่า', 'ไม่', 'ได',
      'ให', 'ตั้ง', 'เมื่อ', 'ไว้', 'ไป', 'มา', 'ขึ้น', 'ลง', 'อีก', 'แล้ว',
      'นักศึกษา',
    ]);

    // tokenize: แบ่งข้อความเป็น token
    // - ภาษาไทย: ≥3 ตัวอักษร + ไม่อยู่ใน STOP
    // - Latin/ตัวเลข: ≥2 ตัวอักษร
    const tokenize = (str) => str.toLowerCase()
      .split(/[^a-z0-9\u0e00-\u0e7f]+/)
      .filter(w => /^[a-z0-9]+$/.test(w) ? w.length >= 2 : (w.length >= 3 && !STOP.has(w)));

    // โหลด types, issues, departments พร้อมกัน (parallel) ลดเวลารอ
    const [typesSnap, issuesSnap, deptsSnap] = await Promise.all([
      db.collection('complaintTypes').get(),
      db.collection('complaintIssues').get(),
      db.collection('departments').get(),
    ]);
    const types = [];
    typesSnap.forEach(d => types.push({ id: d.id, ...d.data() }));
    const issues = [];
    issuesSnap.forEach(d => issues.push({ id: d.id, ...d.data() }));
    // Map departmentId → keywords[] and departmentName → keywords[] for corpus enrichment
    const deptKeywordsMap = {};
    const deptNameMap = {};
    const deptIdToName = {}; // deptId → ชื่อหน่วยงาน (ใช้สำหรับ memory boost lookup)
    deptsSnap.forEach(d => {
      const data = d.data();
      const kws = Array.isArray(data.keywords) ? data.keywords : [];
      deptKeywordsMap[d.id] = kws;
      if (data.name) {
        deptNameMap[data.name] = kws;
        deptIdToName[d.id] = data.name;
      }
    });

    // แบ่งข้อความเป็น segment ตาม space เพื่อป้องกัน token ภาษาไทย
    // ข้ามขอบเขตคำ เช่น 'เรียน' จาก 'ห้องเรียนดับ' ไม่ควร match 'ผลการเรียน'
    const descSegments = text.split(/\s+/).filter(s => s.length >= 2);

    /**
     * scoreCorpus — คำนวณ keyword score ของ corpus เทียบกับ description
     *
     * Dir1 (corpus → description):
     *   - Full match: +len
     *   - Partial (≥60% และ ≥3 ตัวอักษร) ภายใน segment เดียว: +matchLen × 0.7
     *
     * ผลลัพธ์: { score, count } — count ใช้สำหรับ normalize
     *
     * หมายเหตุ: full-text check ใช้เฉพาะ token ยาว ≥ 5 ตัวอักษร
     * เพื่อป้องกัน "วิชา" (4 ตัว) match ใน "สอนวิชา" โดยไม่ตรงหัวข้อจริง
     */
    const scoreCorpus = (corpus) => {
      const tokens = tokenize(corpus.toLowerCase());
      if (tokens.length === 0) return { score: 0, count: 0 };
      let score = 0;
      for (const t of tokens) {
        // Full-text exact match: ต้องยาว ≥ 5 ตัวอักษรเพื่อป้องกัน false positive
        // จากคำสั้น เช่น "วิชา" ที่ปรากฏเป็นส่วนหนึ่งของคำอื่น
        if (t.length >= 5 && text.includes(t)) {
          score += t.length;
          continue;
        }
        // Segment-level matching — prevents cross-word n-gram false positives
        const minLen = Math.max(3, Math.ceil(t.length * 0.6));
        let best = 0;
        segLoop: for (const seg of descSegments) {
          if (seg.includes(t)) {
            best = t.length;
            break;
          }
          // Partial: longest substring of corpus token that fits within this segment
          outer: for (let len = t.length - 1; len >= minLen; len--) {
            for (let s = 0; s <= t.length - len; s++) {
              if (seg.includes(t.substring(s, s + len))) {
                if (len > best) best = len;
                break outer;
              }
            }
          }
          if (best === t.length) break segLoop; // already full match
        }
        if (best > 0) score += best < t.length ? best * 0.7 : best;
      }
      return { score, count: tokens.length };
    };

    console.log('[autofill] text:', text);
    console.log('[autofill] segments:', descSegments);
    console.log('[autofill] departments fetched:', deptsSnap.size, '| deptNameMap keys:', Object.keys(deptNameMap));
    console.log('[autofill] types fetched:', types.length);

    // Compute description embedding once (shared across all type/issue scoring)
    const descVec = await embed(text);

    // ── TYPE SCORING ──────────────────────────────────────────────────────────
    // Blend keyword score (captures exact/partial matches) with semantic cosine
    // similarity (captures synonyms & paraphrases in Thai).
    // formula: finalScore = kwScore + semScore * 12
    //   → semantic adds up to ~12 on top of keyword; can rescue missed types (A3)
    //     but won't override a strong keyword match.
    const typeScoresRaw = await Promise.all(types.map(async type => {
      const typeIssues = issues.filter(i => i.typeId === type.id);
      const deptKws = type.departmentId
        ? (deptKeywordsMap[type.departmentId] || [])
        : (deptNameMap[type.departmentName] || []);
      const corpus = [
        ...deptKws,
        type.label,
        ...typeIssues.map(i => i.label),
      ].filter(Boolean).join(' ');
      const { score: kwScore } = scoreCorpus(corpus);

      // Semantic: embed type label + issue labels (less noisy than full corpus)
      const typeText = [type.label, ...typeIssues.map(i => i.label)].join(' ');
      const typeVec = await embed(typeText);
      const semScore = Math.max(0, cosine(descVec, typeVec));

      const finalScore = kwScore + semScore * 12;
      console.log(`  [type] "${type.label}" | deptId=${type.departmentId} | kws=${deptKws.length} | kw=${kwScore} | sem=${semScore.toFixed(3)} | final=${finalScore.toFixed(2)}`);
      return { type, score: finalScore, kwScore, semScore, issues: typeIssues };
    }));

    // Keep types with score > 1.5 (pure-semantic threshold ≈ 0.125 × 12 = 1.5)
    const typeScores = typeScoresRaw
      .filter(t => t.score > 1.5)
      .sort((a, b) => b.score - a.score);

    if (typeScores.length === 0) {
      return res.json({ suggestions: [] });
    }

    // ── ผสาน Memory Boost เข้า type score (v2: gram tokens + type-level) ────────
    // ใช้ 4-gram ของภาษาไทยแทนการ split ด้วย whitespace
    // ทำให้ "อาจารย์ด่า" match memory ของ "อาจารย์ปฏิบัติ" ได้ (gram ซ้ำกัน)
    const memTokensAF = tokenizeForMemory(text);
    const [memBoostsDept, memBoostsType] = await Promise.all([
      queryMemoryBoost(db, memTokensAF),           // dept-level (broad, ×0.4)
      queryMemoryBoostByType(db, memTokensAF),     // type-level (precise, ×1.0)
    ]);

    const hasMem = Object.keys(memBoostsDept).length > 0 || Object.keys(memBoostsType).length > 0;
    if (hasMem) {
      typeScores.forEach(t => {
        const deptName = deptIdToName[t.type.departmentId] || t.type.departmentName || '';
        // Dept-level: กว้าง — ลด weight เพื่อป้องกัน false boost type อื่นในกรมเดียวกัน
        const deptBoost = (deptName && memBoostsDept[deptName]) ? memBoostsDept[deptName] * 0.4 : 0;
        // Type-level: เจาะจง — full weight เฉพาะ type ที่เคยถูกเลือกจริงๆ
        const typeBoost = memBoostsType[t.type.label] || 0;
        const totalBoost = deptBoost + typeBoost;
        if (totalBoost > 0) {
          t.score += totalBoost;
          t.memoryBoost = totalBoost;
          console.log(`  [memory] "${t.type.label}" dept="${deptName}" boost=+${totalBoost.toFixed(2)} (dept:${deptBoost.toFixed(2)} type:${typeBoost.toFixed(2)})`);
        }
      });
      // เรียงใหม่หลังผสาน memory boost
      typeScores.sort((a, b) => b.score - a.score);
    }
    // ────────────────────────────────────────────────────────────────────────

    // ── ISSUE SCORING ─────────────────────────────────────────────────────────
    // For each top-3 type, score its issues using:
    //   1. Keyword score (Dir1 + Dir2) — exact/partial substring match
    //   2. Semantic cosine similarity — handles synonyms (ไมค์↔ไมโครโฟน, แอร์↔แอร์)
    //
    // Blend: issueScore = semScore * 0.65 + normalizedKw * 0.35
    //   normalizedKw = kwScore / max(kwScores in this type)
    //
    // This means semantic leads but keyword reinforces clear matches.

    const scoreIssueKw = (issueLabel) => {
      const labelLower = issueLabel.toLowerCase();
      const labelTokens = tokenize(labelLower);
      let score = 0;

      // Dir 1: label tokens → description
      for (const t of labelTokens) {
        if (text.includes(t)) { score += t.length; continue; }
        const minLen = Math.max(3, Math.ceil(t.length * 0.6));
        let best = 0;
        segLoop: for (const seg of descSegments) {
          if (seg.includes(t)) { best = t.length; break; }
          outer: for (let len = t.length - 1; len >= minLen; len--) {
            for (let s = 0; s <= t.length - len; s++) {
              if (seg.includes(t.substring(s, s + len))) {
                if (len > best) best = len;
                break outer;
              }
            }
          }
          if (best === t.length) break segLoop;
        }
        if (best > 0) score += best < t.length ? best * 0.7 : best;
      }

      // Dir 2: description segments → label (reverse, guards Thai combining diacritics)
      const isThaiCombining = (ch) => {
        const cp = ch.charCodeAt(0);
        return cp === 0x0E31 || (cp >= 0x0E34 && cp <= 0x0E3A) || (cp >= 0x0E47 && cp <= 0x0E4E);
      };
      for (const seg of descSegments) {
        const cap = Math.min(seg.length, 10);
        let foundLen = 0, foundAtStart = false;
        outer2: for (let len = cap; len >= 4; len--) {
          for (let s = 0; s <= seg.length - len; s++) {
            if (isThaiCombining(seg[s])) continue;
            if (labelLower.includes(seg.substring(s, s + len))) {
              foundLen = len; foundAtStart = (s === 0);
              break outer2;
            }
          }
        }
        if (foundLen > 0) score += foundLen * (foundAtStart ? 0.7 : 0.5);
      }
      return score;
    };

    const suggestions = await Promise.all(typeScores.slice(0, 3).map(async ({ type, issues: typeIssues }) => {
      // Pre-compute keyword scores and semantic vectors for all issues in this type
      const kwScores = typeIssues.map(i => scoreIssueKw(i.label));
      const maxKw = Math.max(...kwScores, 0.001);
      const issueVecs = await Promise.all(typeIssues.map(i => embed(i.label)));

      const scoredIssues = typeIssues.map((issue, idx) => {
        const semScore = Math.max(0, cosine(descVec, issueVecs[idx]));
        const normalizedKw = kwScores[idx] / maxKw;
        const issueScore = semScore * 0.65 + normalizedKw * 0.35;
        return { ...issue, issueScore, semScore, kwScore: kwScores[idx] };
      }).sort((a, b) => {
        if (Math.abs(b.issueScore - a.issueScore) > 0.001) return b.issueScore - a.issueScore;
        return (b.urgencyLevel || 2) - (a.urgencyLevel || 2);
      });

      console.log(`  [issues for "${type.label}"]`);
      scoredIssues.forEach(i =>
        console.log(`    "${i.label}" → sem=${i.semScore.toFixed(3)} kw=${i.kwScore.toFixed(2)} final=${i.issueScore.toFixed(3)}`)
      );

      return {
        topic: type.label,
        topicId: type.id,
        issues: scoredIssues.slice(0, 3).map(i => ({
          id: i.id,
          label: i.label,
          urgencyLabel: i.urgencyLabel,
          urgencyLevel: i.urgencyLevel,
        })),
      };
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Autofill error:', error);
    res.status(500).json({ error: 'Autofill failed' });
  }
});

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get public complaints (all complaints from all users)
router.get('/public', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('complaints')
      .orderBy('createdAt', 'desc')
      .get();

    const complaints = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data) return;
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt;
      const feedback = data.feedback?.map(fb => ({
        ...fb,
        createdAt: fb.createdAt?.toDate ? fb.createdAt.toDate().toISOString() : fb.createdAt,
      })) || [];
      const payload = { id: doc.id, ...data, feedback, createdAt, updatedAt };
      delete payload.userId;
      complaints.push(payload);
    });

    res.json(complaints);
  } catch (error) {
    console.error('Error fetching public complaints:', error.message);
    res.status(500).json({ error: 'Failed to fetch public complaints', details: error.message });
  }
});

// Get all complaints (admin only or user's own complaints)
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('\n=== GET /api/complaints ===');
    console.log('userId:', req.userId);
    
    const userRef = db.collection('users').doc(req.userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const userRole = userData?.role?.trim();

    console.log('[GET /complaints] uid:', req.userId, '| role:', userRole, '| dept:', userData?.department || userData?.faculty || '(none)');

    // Default-deny: unknown user doc or unknown role → return empty
    if (!userData) {
      console.warn('[GET /complaints] No Firestore doc for uid:', req.userId, '→ returning empty');
      return res.json([]);
    }
    if (!['user', 'officer', 'admin', 'faculty', 'executive'].includes(userRole)) {
      console.warn('[GET /complaints] Unknown role:', userRole, '→ returning empty');
      return res.json([]);
    }

    let query = db.collection('complaints').orderBy('createdAt', 'desc');

    // If regular user (not admin/officer), we'll filter in code to avoid composite index requirement
    // This is temporary until the composite index is built
    console.log('Executing query (filtering in code)...');
    const snapshot = await query.get();
    console.log('Query returned', snapshot.size, 'documents');
    
    const complaints = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      if (!data) {
        console.warn('Skipping malformed document:', doc.id);
        return;
      }
      
      // Apply role-based filtering
      // Regular users: only see their own complaints
      if (userRole === 'user' && data.userId !== req.userId) {
        return;
      }

      // Faculty staff: only see complaints from their own faculty/department
      if (userRole === 'faculty') {
        const userFaculty = userData.faculty || userData.department || '';
        if (!userFaculty) return;
        if (data.faculty !== userFaculty) return;
      }

      // Executive: see all complaints university-wide (no filter)
      // (no additional filtering needed for executive)

      // Officers: only see complaints assigned to their department
      if (userRole === 'officer') {
        const officerDept = userData.department || '';
        if (!officerDept) {
          console.warn('[GET /complaints] Officer has no department set, uid:', req.userId);
          return; // skip — officer with no dept sees nothing
        }
        if (data.assignedDepartment !== officerDept) return;
      }
      
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt;
      
      // Convert feedback timestamps
      const feedback = data.feedback?.map(fb => ({
        ...fb,
        createdAt: fb.createdAt?.toDate ? fb.createdAt.toDate().toISOString() : fb.createdAt,
      })) || [];

      // Convert activityLog timestamps
      const activityLog = data.activityLog?.map(entry => ({
        ...entry,
        at: entry.at?.toDate ? entry.at.toDate().toISOString() : entry.at,
      })) || [];

      const complaintPayload = {
        id: doc.id,
        ...data,
        feedback,
        activityLog,
        createdAt,
        updatedAt,
      };
      // never expose requester identity
      delete complaintPayload.userId;
      complaints.push(complaintPayload);
    });

    console.log(`✓ Returning ${complaints.length} complaints for role: ${userRole}`);
    res.json(complaints);
  } catch (error) {
    console.error('✗ Error fetching complaints:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints', details: error.message });
  }
});

// Get single complaint by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const complaintRef = db.collection('complaints').doc(req.params.id);
    const complaintSnap = await complaintRef.get();

    if (!complaintSnap.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintSnap.data();

    // Check if user is authorized to view this complaint
    const userRef = db.collection('users').doc(req.userId);
    const userSnap = await userRef.get();
    const userRole = userSnap.data()?.role;

    // Officers can only view complaints assigned to their department
    if (userRole === 'officer') {
      const officerDept = userSnap.data()?.department || '';
      if (!officerDept || complaint.assignedDepartment !== officerDept) {
        return res.status(403).json({ error: 'Unauthorized: complaint not in your department' });
      }
    } else if (complaint.userId !== req.userId && userRole !== 'admin' && userRole !== 'executive') {
      if (userRole === 'faculty') {
        // Faculty can only view complaints from their own faculty
        const userFaculty = userSnap.data()?.faculty || userSnap.data()?.department || '';
        if (!userFaculty || complaint.faculty !== userFaculty) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      } else {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    const createdAt = complaint.createdAt?.toDate ? complaint.createdAt.toDate().toISOString() : complaint.createdAt;
    const updatedAt = complaint.updatedAt?.toDate ? complaint.updatedAt.toDate().toISOString() : complaint.updatedAt;

    // Convert feedback timestamps
    const feedback = complaint.feedback?.map(fb => ({
      ...fb,
      createdAt: fb.createdAt?.toDate ? fb.createdAt.toDate().toISOString() : fb.createdAt,
    })) || [];

    // Convert activityLog timestamps
    const activityLog = complaint.activityLog?.map(entry => ({
      ...entry,
      at: entry.at?.toDate ? entry.at.toDate().toISOString() : entry.at,
    })) || [];

    const responsePayload = {
      id: req.params.id,
      ...complaint,
      feedback,
      activityLog,
      createdAt,
      updatedAt,
    };

    if (userRole !== 'admin' && complaint.userId !== req.userId) {
      delete responsePayload.userId;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Create new complaint
router.post('/', verifyToken, async (req, res) => {
  try {
    // include all form fields coming from client
    const {
      topic,
      issue,
      issueId,
      urgency,
      description,
      date,
      location,
      faculty,
      isPublic,
      imageBase64,
    } = req.body;

    // Validation
    if (!topic?.trim() || !issue || !urgency?.trim() || !description?.trim() || !date || !location?.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const routingResult = await routeComplaintFromDB(db, { topic, issue, issueId, description, location });
    const autoAssignedDepartment = routingResult.best ? routingResult.best.name : '';

    const newComplaint = {
      userId: req.userId,
      topic: topic.trim(),
      issue,
      urgency: urgency.trim(),
      description: description.trim(),
      date,
      location: location.trim(),
      faculty: faculty?.trim() || '',
      assignedDepartment: autoAssignedDepartment,
      isPublic: isPublic === true || isPublic === 'true',
      imageBase64: imageBase64 || null,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('complaints').add(newComplaint);

    // Send notifications — fire-and-forget, does not block response
    (async () => {
      try {
        const notifBody = `${topic.trim()} — ${issue}`;
        // Notify officers in the assigned department
        if (autoAssignedDepartment) {
          const officersSnap = await db.collection('users').where('role', '==', 'officer').get();
          for (const officerDoc of officersSnap.docs) {
            if (officerDoc.data().department === autoAssignedDepartment) {
              await createNotification(db, {
                recipientId: officerDoc.id,
                type: 'new_complaint',
                title: 'มีเรื่องร้องเรียนใหม่',
                body: notifBody,
                complaintId: docRef.id,
              });
            }
          }
        }
        // Admin does NOT receive new_complaint notifications.
        // Admins are notified only for custom_issue_request (via POST /custom-issue).

        // ── บันทึกความจำ: เก็บว่า token เหล่านี้ถูกส่งไปหน่วยงานนี้ ──────────────
        // ระบบจะ "จำ" และให้ bonus score แก่หน่วยงานนี้ใน complaint ครั้งต่อไป
        // ที่มี token คล้ายกัน (ถ้าการส่งนี้ถูกต้อง score จะสะสม)
        if (autoAssignedDepartment) {
          const memText = `${topic.trim()} ${issue} ${description.trim()} ${location.trim()}`;
          // v2: pass topic as typeLabel → type-level memory learns from each submission
          recordMemoryHit(db, memText, autoAssignedDepartment, true, topic.trim()).catch((err) => {
            console.error('[routingMemory] recordMemoryHit (POST) failed:', err.message);
          });
        } else {
          console.warn('[routingMemory] skip save — no autoAssignedDepartment');
        }
        // ─────────────────────────────────────────────────────────────────────────
      } catch (err) {
        console.warn('[notifications] send failed:', err.message);
      }
    })();

    res.status(201).json({
      id: docRef.id,
      ...newComplaint,
      routingResult: {
        best: routingResult.best,
        topRankings: routingResult.rankings.slice(0, 5),
      },
    });

    // ─── Socket.IO — broadcast new complaint to officers ─────────────────
    try {
      const io = req.app.get('io');
      if (io) io.to('role:officer').emit('complaint:new', { id: docRef.id });
    } catch (_) {}
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaints/custom-issue — ส่งปัญหาใหม่ที่ไม่มีในระบบ เพื่อให้ admin อนุมัติ
// admin จะได้รับ notification 'มีปัญหาใหม่รอพิจารณา'
// ─────────────────────────────────────────────────────────────────────────────
router.post('/custom-issue', verifyToken, async (req, res) => {
  try {
    const { topicId, topicLabel, customIssueText } = req.body;
    if (!customIssueText?.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุรายละเอียดปัญหา' });
    }
    const docRef = await db.collection('customIssueRequests').add({
      submittedBy: req.userId,
      typeId: topicId || '',
      topicLabel: topicLabel || '',
      customIssueText: customIssueText.trim(),
      status: 'pending',
      createdAt: new Date(),
    });
    // Notify all admins
    await createNotification(db, {
      recipientRole: 'admin',
      type: 'custom_issue_request',
      title: 'มีปัญหาใหม่รอพิจารณา',
      body: `"${customIssueText.trim()}" (${topicLabel || 'ไม่ระบุหัวข้อ'})`,
      customIssueId: docRef.id,
    });
    res.status(201).json({ id: docRef.id, status: 'pending' });
  } catch (err) {
    console.error('Custom issue error:', err);
    res.status(500).json({ error: 'Failed to submit custom issue' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id — อัปเดตสถานะ/ข้อมูลเรื่องร้องเรียน
// • user — แก้ไขเรื่องตัวเองแต่ไม่สามารถเปลี่ยน status
// • officer — เปลี่ยน status ได้เฉพาะ complaint ในหน่วยงานตน
// • admin  — เปลี่ยนได้ทุกอย่าง
// ─────────────────────────────────────────────────────────────────────────────
// Update complaint (admin only or user's own)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { status, assignedDepartment, feedbackMessage, proofImageURL, note, officerName } = req.body;
    const complaintRef = db.collection('complaints').doc(req.params.id);
    const complaintSnap = await complaintRef.get();

    if (!complaintSnap.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintSnap.data();

    // Check authorization
    const userRef = db.collection('users').doc(req.userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const userRole = userData?.role;

    // If user doc doesn't exist, deny access
    if (!userData) {
      return res.status(403).json({ error: 'User not found in system' });
    }

    if (complaint.userId !== req.userId && userRole !== 'admin' && userRole !== 'officer') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Officers can only update complaints assigned to their department
    if (userRole === 'officer') {
      const officerDept = userData?.department || '';
      if (!officerDept || complaint.assignedDepartment !== officerDept) {
        return res.status(403).json({ error: 'Unauthorized: complaint not in your department' });
      }
    }

    const updateData = {
      updatedAt: new Date(),
    };

    // Define valid status workflow progression (submitted removed — complaints start as pending)
    const statusWorkflow = ['pending', 'in_progress', 'completed'];
    
    // Only officers/admins can update status
    if (status) {
      if (userRole !== 'admin' && userRole !== 'officer') {
        return res.status(403).json({ error: 'Only admin/officer can update complaint status' });
      }
      
      // Validate status progression
      const currentStatus = complaint.status;
      const currentIndex = statusWorkflow.indexOf(currentStatus);
      const newIndex = statusWorkflow.indexOf(status);
      
      if (newIndex === -1) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      // Status can only move forward or stay the same, not backward
      if (newIndex < currentIndex) {
        return res.status(400).json({ error: 'Status cannot move backward in workflow' });
      }
      
      updateData.status = status;

      // Append to activityLog
      const currentLog = complaint.activityLog || [];
      updateData.activityLog = [...currentLog, {
        fromStatus: complaint.status,
        toStatus: status,
        officerName: officerName || 'เจ้าหน้าที่',
        officerId: req.userId,
        at: new Date(),
      }];

      // Record first handler when taking a pending complaint
      if (complaint.status === 'pending' && !complaint.handledById) {
        updateData.handledById = req.userId;
        updateData.handledByName = officerName || 'เจ้าหน้าที่';
      }
    }

    // Only officers/admins can assign department
    if (assignedDepartment && (userRole === 'admin' || userRole === 'officer')) {
      updateData.assignedDepartment = assignedDepartment;

      // ── อัปเดตความจำ: ถ้าเปลี่ยนหน่วยงาน = การจัดเส้นทางเดิมผิด ──────────────
      // บันทึกการแก้ไข: หน่วยงานเก่า (-0.5), หน่วยงานใหม่ (+1.0)
      // ระบบจะ "เรียนรู้" ว่า token เหล่านี้ควรไปหน่วยงานใหม่แทน
      if (complaint.assignedDepartment && assignedDepartment !== complaint.assignedDepartment) {
        const memText = `${complaint.topic || ''} ${complaint.issue || ''} ${complaint.description || ''} ${complaint.location || ''}`;
        recordMemoryHit(db, memText, complaint.assignedDepartment, false, '').catch((err) => {
          console.error('[routingMemory] recordMemoryHit (penalize) failed:', err.message);
        });
        recordMemoryHit(db, memText, assignedDepartment, true, complaint.topic || '').catch((err) => {
          console.error('[routingMemory] recordMemoryHit (reinforce) failed:', err.message);
        });
        console.log(`[routingMemory] correction: "${complaint.assignedDepartment}" → "${assignedDepartment}"`);
      }
      // ─────────────────────────────────────────────────────────────────────────
    }

    // Allow note updates for officers/admins
    if (note && (userRole === 'admin' || userRole === 'officer')) {
      updateData.note = note;
    }

    // Update feedback message if provided
    if (feedbackMessage && (userRole === 'admin' || userRole === 'officer')) {
      const currentFeedback = complaint.feedback || [];
      const feedbackObj = {
        from: userRole,
        message: feedbackMessage,
        createdAt: new Date(),
      };
      // Include proof image if provided
      if (proofImageURL) {
        feedbackObj.proofImage = proofImageURL;
      }
      updateData.feedback = [
        ...currentFeedback,
        feedbackObj
      ];
    }

    await complaintRef.update(updateData);

    // ─── Socket.IO — real-time complaint update ───────────────────────────
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = { id: req.params.id, status: status || complaint.status };
        if (complaint.userId) io.to(complaint.userId).emit('complaint:updated', payload);
        io.to('role:officer').emit('complaint:updated', payload);
      }
    } catch (_) {}

    // Notify the complaint owner — fire-and-forget
    (async () => {
      try {
        const ownerId = complaint.userId;
        if (!ownerId) return;

        const statusLabels = { pending: 'รับเรื่องแล้ว', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น' };
        const parts = [];
        if (status && status !== complaint.status) {
          parts.push(`สถานะเปลี่ยนเป็น "${statusLabels[status] || status}"`);
        }
        if (feedbackMessage) {
          parts.push(`ข้อความ: ${feedbackMessage.slice(0, 60)}${feedbackMessage.length > 60 ? '…' : ''}`);
        }
        if (parts.length === 0) return; // nothing user-visible changed

        await createNotification(db, {
          recipientId: ownerId,
          type: 'complaint_update',
          title: `อัพเดตคำร้อง — ${complaint.topic || ''}`,
          body: parts.join(' · '),
          complaintId: req.params.id,
        });
      } catch (err) {
        console.warn('[notifications] officer-update notify failed:', err.message);
      }
    })();

    // Return updated complaint with proper type conversion
    const updatedSnap = await complaintRef.get();
    const updatedData = updatedSnap.data();

    // Convert feedback timestamps to ISO format
    const feedback = updatedData.feedback?.map(fb => ({
      ...fb,
      createdAt: fb.createdAt?.toDate ? fb.createdAt.toDate().toISOString() : fb.createdAt,
    })) || [];

    // Build clean response with proper date conversion
    const responseData = {
      id: req.params.id,
      userId: updatedData.userId,
      topic: updatedData.topic,
      issue: updatedData.issue,
      urgency: updatedData.urgency,
      description: updatedData.description,
      date: updatedData.date,
      location: updatedData.location,
      status: updatedData.status,
      feedback,
      createdAt: updatedData.createdAt?.toDate ? updatedData.createdAt.toDate().toISOString() : updatedData.createdAt,
      updatedAt: updatedData.updatedAt?.toDate ? updatedData.updatedAt.toDate().toISOString() : updatedData.updatedAt,
    };

    // Add optional fields if they exist
    if (updatedData.assignedDepartment) responseData.assignedDepartment = updatedData.assignedDepartment;
    if (updatedData.note) responseData.note = updatedData.note;
    if (updatedData.handledByName) responseData.handledByName = updatedData.handledByName;
    if (updatedData.handledById) responseData.handledById = updatedData.handledById;
    if (updatedData.activityLog) {
      responseData.activityLog = updatedData.activityLog.map(entry => ({
        ...entry,
        at: entry.at?.toDate ? entry.at.toDate().toISOString() : entry.at,
      }));
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: 'Failed to update complaint: ' + error.message });
  }
});

// Delete complaint (admin only or user's own)
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaints/:id/review — ผู้แจ้งส่งรีวิวการทำงานหน่วยงาน
// รับ: { rating: 1-5, comment: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/review', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be 1–5' });
    }

    const complaintRef = db.collection('complaints').doc(req.params.id);
    const snap = await complaintRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Complaint not found' });

    const complaint = snap.data();

    if (complaint.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (complaint.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed complaints' });
    }
    if (complaint.review) {
      return res.status(409).json({ error: 'Review already submitted' });
    }

    const review = {
      rating: Number(rating),
      comment: (comment || '').trim(),
      submittedAt: new Date().toISOString(),
      reviewerUid: req.userId,
    };

    await complaintRef.update({ review });

    // Notify the handling officer
    if (complaint.handledById) {
      try {
        await createNotification(db, {
          recipientId: complaint.handledById,
          type: 'new_review',
          title: `ได้รับการรีวิว — ${complaint.topic || ''}`,
          body: `คะแนน ${rating} ดาว${comment ? ': ' + comment.slice(0, 60) : ''}`,
          complaintId: req.params.id,
        });
      } catch (notifErr) {
        console.warn('[review] notify failed:', notifErr.message);
      }
    }

    res.json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const complaintRef = db.collection('complaints').doc(req.params.id);
    const complaintSnap = await complaintRef.get();

    if (!complaintSnap.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintSnap.data();

    // Check authorization
    const userRef = db.collection('users').doc(req.userId);
    const userSnap = await userRef.get();
    const userRole = userSnap.data()?.role;

    if (complaint.userId !== req.userId && userRole !== 'admin' && userRole !== 'officer') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Officers can only delete complaints assigned to their department
    if (userRole === 'officer') {
      const officerDept = userSnap.data()?.department || '';
      if (!officerDept || complaint.assignedDepartment !== officerDept) {
        return res.status(403).json({ error: 'Unauthorized: complaint not in your department' });
      }
    }

    await complaintRef.delete();

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

module.exports = router;
