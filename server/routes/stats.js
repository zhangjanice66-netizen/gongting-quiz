import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get stats - requires admin key
router.get('/', (req, res) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey) {
    return res.status(401).json({ error: '需要管理员密钥' });
  }

  const keyRow = db.prepare('SELECT * FROM admin_keys WHERE key = ?').get(adminKey);
  if (!keyRow) {
    return res.status(403).json({ error: '无效的管理员密钥' });
  }

  // Get total stats
  const totalStats = db.prepare(`
    SELECT
      SUM(total_tests) as total_tests,
      COUNT(*) as days
    FROM stats
  `).get();

  // Get recent stats (last 30 days)
  const recentStats = db.prepare(`
    SELECT * FROM stats
    ORDER BY date DESC
    LIMIT 30
  `).all();

  // Get all codes
  const codes = db.prepare(`
    SELECT code, used, used_at, result, created_at
    FROM codes
    ORDER BY created_at DESC
    LIMIT 100
  `).all();

  res.json({
    total: totalStats.total_tests || 0,
    days: totalStats.days || 0,
    recent: recentStats,
    codes
  });
});

export default router;
