import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VerifyProps {
  onVerified: () => void;
  onAdminLogin?: (key: string) => void;
  initialCode?: string;
}

export const Verify: React.FC<VerifyProps> = ({ onVerified, onAdminLogin, initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    if (newCount >= 5) {
      setShowAdminLogin(true);
      setClickCount(0);
    }
  };

  const handleVerify = async (verifyCode?: string) => {
    const codeToVerify = verifyCode || code;
    if (!codeToVerify.trim()) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/intrigue/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToVerify })
      });

      const data = await response.json();

      if (data.valid) {
        setVerified(true);
        localStorage.setItem('verified_code', codeToVerify);
        onVerified();
      } else {
        setError(data.error || '验证失败');
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminKey && onAdminLogin) {
      onAdminLogin(adminKey);
    }
  };

  const handleCancel = () => {
    setShowAdminLogin(false);
    setAdminKey('');
  };

  if (verified) {
    return null;
  }

  return (
    <div className="verify-container" onClick={handleCancel}>
      <motion.div
        className="verify-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="verify-title"
          onClick={handleTitleClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          宫门准入
        </h2>

        {!showAdminLogin ? (
          <>
            <p className="verify-desc">请输入验证码进入测试</p>

            <div className="verify-input-group">
              <input
                type="text"
                className="verify-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="输入验证码"
                maxLength={8}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <button
                className="verify-button"
                onClick={() => handleVerify()}
                disabled={loading}
              >
                {loading ? '验证中...' : '入宫'}
              </button>
            </div>

            {error && <div className="verify-error">{error}</div>}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <p className="verify-desc">管理员登录</p>
            <div className="verify-input-group" style={{ flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                placeholder="输入管理员密钥"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={handleCancel}
                  style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', background: '#fff' }}
                >
                  取消
                </button>
                <button
                  onClick={handleAdminLogin}
                  disabled={!adminKey}
                  style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#333', color: '#fff' }}
                >
                  登录
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
