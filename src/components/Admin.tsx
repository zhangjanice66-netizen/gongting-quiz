import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CodeData {
  code: string;
  used: number;
  verified_at: string | null;
  used_at: string | null;
  result: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  days: number;
  recent: { date: string; total_tests: number; results_json: string }[];
  codes: CodeData[];
}

interface AdminProps {
  adminKey: string;
  onClose: () => void;
}

export const Admin: React.FC<AdminProps> = ({ adminKey, onClose }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(10);
  const [prefix, setPrefix] = useState('');
    const [error, setError] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<CodeData | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [adminKey]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/intrigue/api/stats', {
        headers: { 'X-Admin-Key': adminKey }
      });
      const data = await response.json();
      setStats(data);
    } catch (e) {
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/intrigue/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, count, prefix })
      });
      const data = await response.json();
      if (data.success) {
        setError(''); // Clear any previous error
        alert(`已生成 ${count} 个验证码，保存为 code_${count}_日期时间.txt`);
        fetchStats();
      } else {
        setError(data.error || '生成失败');
      }
    } catch (e) {
      setError('生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const response = await fetch(`/intrigue/api/admin/code/${searchCode.toUpperCase()}`, {
        headers: { 'X-Admin-Key': adminKey }
      });
      const data = await response.json();
      if (data.code) {
        setSearchResult(data.code);
      } else {
        setError(data.error || '查询失败');
      }
    } catch (e) {
      setError('查询失败');
    } finally {
      setSearching(false);
    }
  };

  const parseResults = (json: string) => {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <motion.div
        className="admin-panel"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="admin-header">
          <h2>管理后台</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchStats}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', background: '#fff' }}
            >
              刷新
            </button>
            <button className="admin-close" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="admin-loading">加载中...</div>
          ) : stats ? (
            <>
              <div className="admin-stats">
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">总测试次数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.days}</div>
                  <div className="stat-label">活跃天数</div>
                </div>
              </div>

              <div className="admin-section">
                <h3>查询验证码</h3>
                <div className="generate-form">
                  <input
                    type="text"
                    placeholder="输入验证码查询"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ padding: '8px', flex: 1 }}
                  />
                  <button
                    className="admin-btn primary"
                    onClick={handleSearch}
                    disabled={searching || !searchCode.trim()}
                  >
                    {searching ? '查询中...' : '查询'}
                  </button>
                </div>

                {searchResult && (
                  <div style={{ marginTop: '15px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '14px' }}>
                      <strong>验证码:</strong><span><code>{searchResult.code}</code></span>
                      <strong>状态:</strong><span className={`status ${searchResult.used ? 'used' : (searchResult.verified_at ? 'unused' : '')}`}>{searchResult.used ? '已提交' : (searchResult.verified_at ? '未提交' : '未使用')}</span>
                      <strong>创建时间:</strong><span>{searchResult.created_at || '-'}</span>
                      <strong>输入时间:</strong><span>{searchResult.verified_at || '-'}</span>
                      <strong>提交时间:</strong><span>{searchResult.used_at || '-'}</span>
                      <strong>测试结果:</strong>
                      <span>
                        {searchResult.result ? (
                          (() => {
                            try {
                              const r = JSON.parse(searchResult.result);
                              const scores = r.scores ? Object.entries(r.scores).map(([k, v]) => `${k}:${v}`).join(', ') : '';
                              return <div><div>{r.type || '-'}</div><div style={{ fontSize: '12px', color: '#666' }}>{scores}</div></div>;
                            } catch {
                              return '-';
                            }
                          })()
                        ) : '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-section">
                <h3>生成验证码</h3>
                <div className="generate-form">
                  <div className="form-row">
                    <label>数量:</label>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="form-row">
                    <label>前缀:</label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                      placeholder="可选"
                      maxLength={2}
                    />
                  </div>
                  <button
                    className="admin-btn primary"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? '生成中...' : '生成'}
                  </button>
                </div>

                              </div>

              <div className="admin-section">
                <h3>最近数据</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>测试数</th>
                      <th>结果分布</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>{r.total_tests}</td>
                        <td>
                          {Object.entries(parseResults(r.results_json)).map(([k, v]) => (
                            <span key={k} className="result-tag">{k}: {v as number}</span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-section">
                <h3>验证码列表</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>验证码</th>
                      <th>状态</th>
                      <th>创建时间</th>
                      <th>输入时间</th>
                      <th>提交时间</th>
                      <th>结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.codes.map((c) => (
                      <tr key={c.code}>
                        <td><code>{c.code}</code></td>
                        <td>
                          <span className={`status ${c.used ? 'used' : (c.verified_at ? 'unused' : '')}`}>
                            {c.used ? '已提交' : (c.verified_at ? '未提交' : '未使用')}
                          </span>
                        </td>
                        <td>{c.created_at ? c.created_at.slice(0, 19) : '-'}</td>
                        <td>{c.verified_at ? c.verified_at.slice(0, 19) : '-'}</td>
                        <td>{c.used_at ? c.used_at.slice(0, 19) : '-'}</td>
                        <td>
                          {c.result ? (
                            (() => {
                              try {
                                const r = JSON.parse(c.result);
                                const scores = r.scores ? Object.entries(r.scores).map(([k, v]) => `${k}:${v}`).join(', ') : '';
                                return <div><div>{r.type || '-'}</div><div style={{ fontSize: '10px', color: '#666' }}>{scores}</div></div>;
                              } catch {
                                return '-';
                              }
                            })()
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="admin-error">{error || '加载失败'}</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
