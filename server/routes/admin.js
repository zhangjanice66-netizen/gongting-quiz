import express from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = express.Router();

// Generate admin key (one-time setup)
router.post('/setup-admin', (req, res) => {
  const { key } = req.body;

  if (!key || key.length < 16) {
    return res.status(400).json({ error: '管理员密钥长度至少16位' });
  }

  const existing = db.prepare('SELECT * FROM admin_keys').all();
  if (existing.length > 0) {
    return res.status(400).json({ error: '管理员已设置' });
  }

  db.prepare('INSERT INTO admin_keys (key) VALUES (?)').run(key);
  res.json({ success: true, message: '管理员设置成功' });
});

// Generate verification codes
router.post('/generate', (req, res) => {
  const { adminKey, count = 10, prefix = '' } = req.body;

  if (!adminKey) {
    return res.status(401).json({ error: '需要管理员密钥' });
  }

  const keyRow = db.prepare('SELECT * FROM admin_keys WHERE key = ?').get(adminKey);
  if (!keyRow) {
    return res.status(403).json({ error: '无效的管理员密钥' });
  }

  const codes = [];
  const usedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let i = 0; i < count; i++) {
    let code = prefix;
    for (let j = 0; j < 6; j++) {
      code += usedChars.charAt(Math.floor(Math.random() * usedChars.length));
    }

    try {
      db.prepare('INSERT INTO codes (code) VALUES (?)').run(code);
      codes.push(code);
    } catch (e) {
      // Duplicate, try again
      i--;
    }
  }

  res.json({ success: true, codes });
});

// Check admin status
router.get('/status', (req, res) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey) {
    return res.json({ isAdmin: false });
  }

  const keyRow = db.prepare('SELECT * FROM admin_keys WHERE key = ?').get(adminKey);
  res.json({ isAdmin: !!keyRow });
});

export default router;
