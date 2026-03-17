import express from 'express';
import db from '../db.js';

const router = express.Router();

// Verify code - check if valid
router.post('/verify', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: '验证码不能为空' });
  }

  const stmt = db.prepare('SELECT * FROM codes WHERE code = ?');
  const row = stmt.get(code);

  if (!row) {
    return res.json({ valid: false, error: '验证码不存在' });
  }

  if (row.used) {
    return res.json({ valid: false, error: '验证码已使用' });
  }

  res.json({ valid: true });
});

// Consume code - mark as used and save result
router.post('/consume', (req, res) => {
  const { code, result } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: '验证码不能为空' });
  }

  const stmt = db.prepare('SELECT * FROM codes WHERE code = ?');
  const row = stmt.get(code);

  if (!row) {
    return res.json({ success: false, error: '验证码不存在' });
  }

  if (row.used) {
    return res.json({ success: false, error: '验证码已使用' });
  }

  // Mark as used
  const updateStmt = db.prepare(`
    UPDATE codes
    SET used = 1, used_at = datetime('now', 'localtime'), result = ?
    WHERE code = ?
  `);
  updateStmt.run(JSON.stringify(result), code);

  // Update stats
  const today = new Date().toISOString().split('T')[0];
  const resultType = result?.type || 'unknown';

  const statsStmt = db.prepare(`
    INSERT INTO stats (date, total_tests, results_json)
    VALUES (?, 1, ?)
    ON CONFLICT(date) DO UPDATE SET
      total_tests = total_tests + 1,
      results_json = (
        SELECT json_set(results_json, '$.' || ?, coalesce(json_extract(results_json, '$.' || ?), 0) + 1)
        FROM stats WHERE date = ?
      )
  `);

  try {
    const existingStats = db.prepare('SELECT * FROM stats WHERE date = ?').get(today);
    let resultsJson = {};

    if (existingStats && existingStats.results_json) {
      try {
        resultsJson = JSON.parse(existingStats.results_json);
      } catch (e) {
        resultsJson = {};
      }
    }

    resultsJson[resultType] = (resultsJson[resultType] || 0) + 1;

    if (existingStats) {
      db.prepare(`
        UPDATE stats
        SET total_tests = total_tests + 1, results_json = ?
        WHERE date = ?
      `).run(JSON.stringify(resultsJson), today);
    } else {
      db.prepare(`
        INSERT INTO stats (date, total_tests, results_json)
        VALUES (?, 1, ?)
      `).run(today, JSON.stringify(resultsJson));
    }
  } catch (e) {
    console.error('Stats update error:', e);
  }

  res.json({ success: true });
});

export default router;
