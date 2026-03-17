import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import initSqlJs from 'sql.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'gongting.db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
const SQL = await initSqlJs();
let db;

if (fs.existsSync(dbPath)) {
  const fileBuffer = fs.readFileSync(dbPath);
  db = new SQL.Database(fileBuffer);
} else {
  db = new SQL.Database();
}

db.run(`
  CREATE TABLE IF NOT EXISTS codes (
    code TEXT PRIMARY KEY,
    used INTEGER DEFAULT 0,
    verified_at TEXT,
    used_at TEXT,
    result TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY,
    date TEXT UNIQUE,
    total_tests INTEGER DEFAULT 0,
    results_json TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS admin_keys (
    id INTEGER PRIMARY KEY,
    key TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Add verified_at column if it doesn't exist (migration)
try {
  db.run('ALTER TABLE codes ADD COLUMN verified_at TEXT');
} catch (e) {
  // Column already exists, ignore
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function dbGet(sql, ...params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function dbAll(sql, ...params) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function dbRun(sql, ...params) {
  db.run(sql, params);
  saveDb();
}

// API routes
app.post('/api/verify', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: '验证码不能为空' });
  }

  const row = dbGet('SELECT * FROM codes WHERE code = ?', code);

  if (!row) {
    return res.json({ valid: false, error: '验证码不存在' });
  }

  if (row.used) {
    return res.json({ valid: false, error: '验证码已使用' });
  }

  // Record verified_at if not already set
  if (!row.verified_at) {
    dbRun('UPDATE codes SET verified_at = datetime("now", "localtime") WHERE code = ?', code);
  }

  res.json({ valid: true });
});

app.post('/api/consume', (req, res) => {
  const { code, result } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: '验证码不能为空' });
  }

  const row = dbGet('SELECT * FROM codes WHERE code = ?', code);

  if (!row) {
    return res.json({ success: false, error: '验证码不存在' });
  }

  if (row.used) {
    return res.json({ success: false, error: '验证码已使用' });
  }

  // Mark as used
  dbRun(`
    UPDATE codes
    SET used = 1, used_at = datetime('now', 'localtime'), result = ?
    WHERE code = ?
  `, JSON.stringify(result), code);

  // Update stats
  const today = new Date().toISOString().split('T')[0];
  const resultType = result?.type || 'unknown';

  try {
    const existingStats = dbGet('SELECT * FROM stats WHERE date = ?', today);
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
      dbRun(`
        UPDATE stats
        SET total_tests = total_tests + 1, results_json = ?
        WHERE date = ?
      `, JSON.stringify(resultsJson), today);
    } else {
      dbRun(`
        INSERT INTO stats (date, total_tests, results_json)
        VALUES (?, 1, ?)
      `, today, JSON.stringify(resultsJson));
    }
  } catch (e) {
    console.error('Stats update error:', e);
  }

  res.json({ success: true });
});

// Stats route
app.get('/api/stats', (req, res) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey) {
    return res.status(401).json({ error: '需要管理员密钥' });
  }

  const keyRow = dbGet('SELECT * FROM admin_keys WHERE key = ?', adminKey);
  if (!keyRow) {
    return res.status(403).json({ error: '无效的管理员密钥' });
  }

  const totalStats = dbGet(`
    SELECT
      SUM(total_tests) as total_tests,
      COUNT(*) as days
    FROM stats
  `);

  const recentStats = dbAll(`
    SELECT * FROM stats
    ORDER BY date DESC
    LIMIT 30
  `);

  const codes = dbAll(`
    SELECT code, used, used_at, result, created_at
    FROM codes
    ORDER BY created_at DESC
    LIMIT 100
  `);

  res.json({
    total: totalStats.total_tests || 0,
    days: totalStats.days || 0,
    recent: recentStats,
    codes
  });
});

// Query specific code
app.get('/api/admin/code/:code', (req, res) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey) {
    return res.status(401).json({ error: '需要管理员密钥' });
  }

  const keyRow = dbGet('SELECT * FROM admin_keys WHERE key = ?', adminKey);
  if (!keyRow) {
    return res.status(403).json({ error: '无效的管理员密钥' });
  }

  const { code } = req.params;
  const codeData = dbGet('SELECT * FROM codes WHERE code = ?', code);

  if (!codeData) {
    return res.json({ error: '验证码不存在' });
  }

  res.json({ code: codeData });
});

// Admin routes
app.post('/api/admin/setup-admin', (req, res) => {
  const { key } = req.body;

  if (!key || key.length < 16) {
    return res.status(400).json({ error: '管理员密钥长度至少16位' });
  }

  const existing = dbAll('SELECT * FROM admin_keys');
  if (existing.length > 0) {
    return res.status(400).json({ error: '管理员已设置' });
  }

  dbRun('INSERT INTO admin_keys (key) VALUES (?)', key);
  res.json({ success: true, message: '管理员设置成功' });
});

app.post('/api/admin/generate', (req, res) => {
  const { adminKey, count = 10, prefix = '' } = req.body;

  if (!adminKey) {
    return res.status(401).json({ error: '需要管理员密钥' });
  }

  const keyRow = dbGet('SELECT * FROM admin_keys WHERE key = ?', adminKey);
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
      dbRun('INSERT INTO codes (code) VALUES (?)', code);
      codes.push(code);
    } catch (e) {
      i--;
    }
  }

  // Save codes to file
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
  const fileName = `code_${count}_${dateStr}${timeStr}.txt`;
  const filePath = join(__dirname, fileName);
  fs.writeFileSync(filePath, codes.join('\n'));

  res.json({ success: true, codes: [] });
});

app.get('/api/admin/status', (req, res) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey) {
    return res.json({ isAdmin: false });
  }

  const keyRow = dbGet('SELECT * FROM admin_keys WHERE key = ?', adminKey);
  res.json({ isAdmin: !!keyRow });
});

// 静态文件由 Nginx 处理，后端只返回 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
