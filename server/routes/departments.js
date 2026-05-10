const express = require('express');
const { auth, db } = require('../config/firebase');
const router = express.Router();

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/departments/public — no auth required, for registration form
router.get('/public', async (req, res) => {
  try {
    const snapshot = await db.collection('departments').orderBy('name', 'asc').get();
    const departments = [];
    snapshot.forEach(doc => departments.push({ id: doc.id, ...doc.data() }));
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET /api/departments — returns all departments (any authenticated user)
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('departments').orderBy('name', 'asc').get();
    const departments = [];
    snapshot.forEach(doc => departments.push({ id: doc.id, ...doc.data() }));
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

module.exports = router;
