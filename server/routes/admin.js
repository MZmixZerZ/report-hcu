// ─────────────────────────────────────────────────────────────────────────────
// routes/admin.js — จัดการ API สำหรับผู้ดูแลระบบ (Admin)
// แบ่งเป็น 2 กลุ่ม:
//   1. Public endpoints — ทุก user ที่ login แล้วเข้าได้ (เช่น ดึงประเภทร้องเรียน)
//   2. Admin-only endpoints — ต้องเป็น role='admin' เท่านั้น
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const { db, auth } = require('../config/firebase');
const router = express.Router();

// ─── Middleware: ตรวจสอบ Firebase Auth Token ──────────────────────────────────
// ดึง token จาก header "Authorization: Bearer <token>" แล้ว verify
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid; // เก็บ uid ไว้ใช้ใน route ถัดไป
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Middleware: ตรวจสอบว่า user เป็น Admin ──────────────────────────────────
// ดึงข้อมูล user จาก Firestore และตรวจสอบ role
const checkAdmin = async (req, res, next) => {
  try {
    const userRef = db.collection('users').doc(req.userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(403).json({ error: 'User not found or not an admin' });
    }
    
    if (userSnap.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    next();
  } catch (error) {
    console.error('Error in checkAdmin:', error);
    return res.status(500).json({ error: 'Authentication check failed' });
  }
};

// ─── PUBLIC ENDPOINTS (ทุก user ที่ login แล้วเข้าได้) ────────────────────────

// ดึงประเภทร้องเรียนทั้งหมด — เรียงจากความเร่งด่วนมากไปน้อย
router.get('/complaint-types', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('complaintTypes').get();
    const types = [];
    snapshot.forEach((d) => {
      types.push({ id: d.id, ...d.data() });
    });
    // Sort by urgencyLevel descending (most urgent first)
    types.sort((a, b) => (b.urgencyLevel || 0) - (a.urgencyLevel || 0));
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaint types' });
  }
});

// ดึงปัญหา (issues) ทั้งหมดของประเภทร้องเรียนที่ระบุ — เรียงตามความเร่งด่วน
router.get('/complaint-types/:typeId/issues', verifyToken, async (req, res) => {
  try {
    const { typeId } = req.params;
    const snapshot = await db.collection('complaintIssues')
      .where('typeId', '==', typeId)
      .get();
    const issues = [];
    snapshot.forEach((d) => {
      issues.push({ id: d.id, ...d.data() });
    });
    // Sort by urgencyLevel descending (most urgent first), fallback to createdAt
    issues.sort((a, b) => {
      const urgencyDiff = (b.urgencyLevel || 0) - (a.urgencyLevel || 0);
      if (urgencyDiff !== 0) return urgencyDiff;
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return aDate - bDate;
    });
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// ดึงรายชื่อคณะ/ภาควิชาทั้งหมด — ไม่ต้อง auth (ใช้ในหน้าลงทะเบียน)
router.get('/faculties', async (req, res) => {
  try {
    const snapshot = await db.collection('faculties').orderBy('createdAt', 'asc').get();
    const faculties = [];
    snapshot.forEach(d => faculties.push({ id: d.id, ...d.data() }));
    res.json(faculties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch faculties' });
  }
});

// อัปเดตโปรไฟล์ของตนเอง (department, major, userType) — ทุก user ทำได้
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { department, major, userType } = req.body;
    const updates = {};
    if (department !== undefined) updates.department = department;
    if (major !== undefined) updates.major = major;
    if (userType !== undefined) updates.userType = userType;
    // For students, keep faculty in sync with department
    if (userType === 'student' && department !== undefined) updates.faculty = department;
    await db.collection('users').doc(req.userId).update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error('profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── ADMIN-ONLY ENDPOINTS (ต้องเป็น role='admin' เท่านั้น) ──────────────────
// middleware checkAdmin จะทำงานก่อนทุก route ด้านล่างนี้
router.use(verifyToken, checkAdmin);

// ดึงรายชื่อ user ทั้งหมดในระบบ
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const maskEmail = (e) => {
        if (!e) return '***';
        const [local, domain] = e.split('@');
        return local.slice(0, 2) + '***@' + (domain || '***');
      };
      const maskName = (n) => n ? n.slice(0, 1) + '***' : '***';
      users.push({ id: d.id, displayName: maskName(data.displayName), email: maskEmail(data.email), role: data.role, department: data.department || '', major: data.major || '' });
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { role, displayName, department, major, userType } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (displayName) updates.displayName = displayName;
    if (department !== undefined) updates.department = department;
    if (major !== undefined) updates.major = major;
    if (userType !== undefined) updates.userType = userType;
    // Keep faculty in sync for students
    if (userType === 'student' && department !== undefined) updates.faculty = department;
    await db.collection('users').doc(req.params.id).update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, displayName, role, department, major, userType } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and display name are required' });
    }

    // Create user in Firestore directly
    const userRef = db.collection('users').doc();
    await userRef.set({
      email,
      displayName,
      role: role || 'user',
      userType: userType || 'student',
      department: department || '',
      major: major || '',
      faculty: userType !== 'staff' ? (department || '') : '',
      createdAt: new Date(),
      uid: userRef.id,
    });

    res.json({ 
      id: userRef.id, 
      email, 
      displayName, 
      role: role || 'user', 
      userType: userType || 'student',
      department: department || '',
      major: major || '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Don't allow deleting the current admin
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user from Firestore
    await db.collection('users').doc(userId).delete();
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/complaint-types', async (req, res) => {
  try {
    const { label, departmentId, departmentName } = req.body;
    if (!label?.trim()) return res.status(400).json({ error: 'Label is required' });
    const docRef = await db.collection('complaintTypes').add({
      label: label.trim(),
      departmentId: departmentId?.trim() || '',
      departmentName: departmentName?.trim() || '',
      createdAt: new Date(),
    });
    res.json({ id: docRef.id, label: label.trim(), departmentId: departmentId || '', departmentName: departmentName || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create complaint type' });
  }
});

router.put('/complaint-types/:id', async (req, res) => {
  try {
    const { label, departmentId, departmentName } = req.body;
    if (!label?.trim()) return res.status(400).json({ error: 'Label is required' });
    const update = {
      label: label.trim(),
      departmentId: departmentId?.trim() || '',
      departmentName: departmentName?.trim() || '',
    };
    await db.collection('complaintTypes').doc(req.params.id).update(update);
    res.json({ success: true, ...update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update complaint type' });
  }
});

router.delete('/complaint-types/:id', async (req, res) => {
  try {
    await db.collection('complaintTypes').doc(req.params.id).delete();
    // Also delete associated issues
    const issuesSnapshot = await db.collection('complaintIssues').where('typeId', '==', req.params.id).get();
    issuesSnapshot.forEach(doc => doc.ref.delete());
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete complaint type' });
  }
});

router.post('/complaint-types/:typeId/issues', async (req, res) => {
  try {
    const { typeId } = req.params;
    const { label, urgencyLevel } = req.body;
    if (!label || !label.trim()) return res.status(400).json({ error: 'Issue label is required' });
    const URGENCY_LABELS = { 1: 'ต่ำ', 2: 'ปานกลาง', 3: 'สูง', 4: 'ฉุกเฉิน' };
    const level = [1,2,3,4].includes(Number(urgencyLevel)) ? Number(urgencyLevel) : 2;
    const docRef = await db.collection('complaintIssues').add({
      typeId, label: label.trim(),
      urgencyLabel: URGENCY_LABELS[level], urgencyLevel: level,
      createdAt: new Date(),
    });
    res.json({ id: docRef.id, typeId, label: label.trim(), urgencyLabel: URGENCY_LABELS[level], urgencyLevel: level });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

router.put('/complaint-types/:typeId/issues/:issueId', async (req, res) => {
  try {
    const { label, urgencyLevel } = req.body;
    if (!label || !label.trim()) return res.status(400).json({ error: 'Issue label is required' });
    const URGENCY_LABELS = { 1: 'ต่ำ', 2: 'ปานกลาง', 3: 'สูง', 4: 'ฉุกเฉิน' };
    const level = [1,2,3,4].includes(Number(urgencyLevel)) ? Number(urgencyLevel) : 2;
    await db.collection('complaintIssues').doc(req.params.issueId).update({
      label: label.trim(),
      urgencyLabel: URGENCY_LABELS[level], urgencyLevel: level,
    });
    res.json({ success: true, urgencyLabel: URGENCY_LABELS[level], urgencyLevel: level });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

router.delete('/complaint-types/:typeId/issues/:issueId', async (req, res) => {
  try {
    await db.collection('complaintIssues').doc(req.params.issueId).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

// Faculty CRUD
router.post('/faculties', async (req, res) => {
  try {
    const { label } = req.body;
    if (!label?.trim()) return res.status(400).json({ error: 'Faculty name is required' });
    const docRef = await db.collection('faculties').add({ label: label.trim(), createdAt: new Date() });
    res.json({ id: docRef.id, label: label.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

router.put('/faculties/:id', async (req, res) => {
  try {
    const { label } = req.body;
    if (!label?.trim()) return res.status(400).json({ error: 'Faculty name is required' });
    await db.collection('faculties').doc(req.params.id).update({ label: label.trim() });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update faculty' });
  }
});

router.delete('/faculties/:id', async (req, res) => {
  try {
    await db.collection('faculties').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

// ─── Department / Keyword Management ────────────────────────────────────────

// GET /api/admin/departments — list all departments from Firestore
router.get('/departments', async (req, res) => {
  try {
    const snapshot = await db.collection('departments').orderBy('name', 'asc').get();
    const departments = [];
    snapshot.forEach(d => departments.push({ id: d.id, ...d.data() }));
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/admin/departments — create new department
router.post('/departments', async (req, res) => {
  try {
    const { name, description, keywords } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'ต้องระบุชื่อหน่วยงาน' });
    const docRef = await db.collection('departments').add({
      name: name.trim(),
      description: description?.trim() || '',
      keywords: Array.isArray(keywords) ? keywords.map(k => k.trim()).filter(Boolean) : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const snap = await docRef.get();
    res.status(201).json({ id: docRef.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/admin/departments/:id — update name, description, keywords
router.put('/departments/:id', async (req, res) => {
  try {
    const { name, description, keywords } = req.body;
    const ref = db.collection('departments').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'ไม่พบหน่วยงาน' });
    const update = { updatedAt: new Date() };
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description.trim();
    if (keywords !== undefined) update.keywords = Array.isArray(keywords) ? keywords.map(k => k.trim()).filter(Boolean) : [];
    await ref.update(update);
    const updated = await ref.get();
    res.json({ id: req.params.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/admin/departments/:id
router.delete('/departments/:id', async (req, res) => {
  try {
    const ref = db.collection('departments').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'ไม่พบหน่วยงาน' });
    await ref.delete();
    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// ─── Custom Issue Requests (pending user-submitted issues) ──────────────────

// GET /api/admin/custom-issue-requests
router.get('/custom-issue-requests', async (req, res) => {
  try {
    const snap = await db.collection('customIssueRequests').orderBy('createdAt', 'desc').get();
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate().toISOString() : data.approvedAt,
        rejectedAt: data.rejectedAt?.toDate ? data.rejectedAt.toDate().toISOString() : data.rejectedAt,
      };
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch custom issue requests' });
  }
});

// POST /api/admin/custom-issue-requests/:id/approve
router.post('/custom-issue-requests/:id/approve', async (req, res) => {
  try {
    const { urgencyLevel, typeId } = req.body;
    const ref = db.collection('customIssueRequests').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'ไม่พบรายการ' });
    const data = snap.data();

    const URGENCY_LABELS = { 1: 'ต่ำ', 2: 'ปานกลาง', 3: 'สูง', 4: 'ฉุกเฉิน' };
    const level = [1, 2, 3, 4].includes(Number(urgencyLevel)) ? Number(urgencyLevel) : 2;
    const finalTypeId = typeId || data.typeId;
    if (!finalTypeId) return res.status(400).json({ error: 'ต้องระบุ typeId' });

    const issueRef = await db.collection('complaintIssues').add({
      typeId: finalTypeId,
      label: data.customIssueText,
      urgencyLabel: URGENCY_LABELS[level],
      urgencyLevel: level,
      keywords: [],
      departmentIds: [],
      createdAt: new Date(),
      approvedFrom: req.params.id,
    });

    await ref.update({ status: 'approved', approvedAt: new Date(), issueId: issueRef.id });
    res.json({ success: true, issueId: issueRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve custom issue' });
  }
});

// DELETE /api/admin/custom-issue-requests/:id (reject)
router.delete('/custom-issue-requests/:id', async (req, res) => {
  try {
    const ref = db.collection('customIssueRequests').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'ไม่พบรายการ' });
    await ref.update({ status: 'rejected', rejectedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject custom issue' });
  }
});

module.exports = router;
