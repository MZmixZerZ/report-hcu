// ─────────────────────────────────────────────────────────────────────────────
// utils/embedder.js — ระบบแปลงข้อความเป็น Vector (Sentence Embedding)
//
// ใช้โมเดล: Xenova/paraphrase-multilingual-MiniLM-L12-v2
//   - รองรับภาษาไทยและหลายภาษา
//   - output: vector 384 มิติ (L2-normalised)
//   - โมเดล ONNX ขนาด ~120 MB (ดาวน์โหลดครั้งแรก, cache อยู่ใน .model-cache/)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const path = require('path');

let _model = null;           // เก็บโมเดลที่โหลดแล้ว (singleton)
const _cache = new Map();    // LRU cache เก็บ vector ที่คำนวณแล้ว
const MAX_CACHE = 2000;      // จำนวน entry สูงสุดใน cache

/**
 * โหลดโมเดล Embedding แบบ lazy (โหลดครั้งเดียว ใช้ซ้ำ)
 * - ดาวน์โหลดโมเดล ~120 MB ในครั้งแรก แล้ว cache ไว้ใน server/.model-cache/
 * - ครั้งถัดไปใช้ไฟล์ local ไม่ต้องอินเทอร์เน็ต
 */
async function _load() {
  if (_model) return _model; // ถ้าโหลดแล้ว return ทันที
  const { pipeline, env } = await import('@xenova/transformers');
  env.cacheDir = path.join(__dirname, '..', '.model-cache'); // กำหนด path เก็บโมเดล
  env.allowRemoteModels = true;
  console.log('[embedder] loading model paraphrase-multilingual-MiniLM-L12-v2 (first run downloads ~120 MB) ...');
  _model = await pipeline(
    'feature-extraction',
    'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
  );
  console.log('[embedder] model ready ✅');
  return _model;
}

/**
 * แปลงข้อความ (ภาษาไทยหรือผสม) เป็น vector 384 มิติ
 * - vector ถูก L2-normalise แล้ว → ใช้ dot product แทน cosine similarity ได้เลย
 * - มี LRU cache: ถ้าเคยแปลงข้อความนี้แล้ว return ผลจาก cache ทันที
 */
async function embed(text) {
  const key = text.trim().slice(0, 400); // ใช้ 400 ตัวแรกเป็น cache key
  if (_cache.has(key)) return _cache.get(key);
  const model = await _load();
  const out = await model(text, { pooling: 'mean', normalize: true });
  const vec = Array.from(out.data);
  // LRU eviction: ลบ entry เก่าสุดเมื่อ cache เต็ม
  if (_cache.size >= MAX_CACHE) {
    _cache.delete(_cache.keys().next().value);
  }
  _cache.set(key, vec);
  return vec;
}

/**
 * คำนวณ Cosine Similarity ระหว่าง vector สองชุด
 * เนื่องจาก vector ถูก normalize แล้ว → dot product = cosine similarity
 * ค่าอยู่ระหว่าง -1 (ตรงข้าม) ถึง 1 (เหมือนกันทุกประการ)
 */
function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/**
 * Pre-warm: โหลดโมเดลล่วงหน้าตอนเซิร์ฟเวอร์เริ่มทำงาน
 * เพื่อให้ request แรกของ user ไม่ต้องรอโหลดโมเดล
 */
function warmup() {
  embed('ระบบแจ้งปัญหา').catch(err =>
    console.warn('[embedder] warmup failed (offline?):', err.message)
  );
}

module.exports = { embed, cosine, warmup };
