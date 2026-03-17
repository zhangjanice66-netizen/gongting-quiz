import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Quiz } from './components/Quiz';
import { Result } from './components/Result';
import { Verify } from './components/Verify';
import { Admin } from './components/Admin';
import type { Dimension } from './types';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState<'verify' | 'home' | 'quiz' | 'result'>('verify');
  const [finalScores, setFinalScores] = useState<Record<Dimension, number> | null>(null);
  const [initialCode, setInitialCode] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  useEffect(() => {
    // Check URL for code parameter
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setInitialCode(code);
    }

    // Check if already verified
    const verified = localStorage.getItem('verified_code');
    if (verified) {
      setCurrentStep('home');
    }

    // Check for admin mode
    const storedAdminKey = localStorage.getItem('admin_key');
    if (storedAdminKey) {
      setAdminKey(storedAdminKey);
    }
  }, []);

  const handleVerified = () => {
    setCurrentStep('home');
  };

  const startQuiz = () => {
    setCurrentStep('quiz');
  };

  const finishQuiz = async (scores: Record<Dimension, number>) => {
    setFinalScores(scores);

    // Consume the code
    const code = localStorage.getItem('verified_code');
    if (code) {
      try {
        await fetch('/intrigue/api/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            result: {
              type: calculateResultType(scores),
              scores
            }
          })
        });
        // Clear the code after use
        localStorage.removeItem('verified_code');
      } catch (e) {
        console.error('Failed to consume code:', e);
      }
    }

    setCurrentStep('result');
  };

  const calculateResultType = (scores: Record<Dimension, number>): string => {
    // Find the max score dimension
    const maxDim = (Object.entries(scores) as [Dimension, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    // Map dimension to result type
    const typeMap: Record<Dimension, string> = {
      A: '权倾朝野型',
      B: '内卷达人型',
      C: '实力超群型',
      D: '社交高手型',
      E: '降维打击型'
    };

    return typeMap[maxDim] || '平庸度日型';
  };

  const restartQuiz = () => {
    setFinalScores(null);
    setCurrentStep('verify');
  };

  const handleAdminLogin = (key: string) => {
    localStorage.setItem('admin_key', key);
    setAdminKey(key);
    setShowAdmin(true);
  };

  return (
    <main className="app-main">
      {currentStep === 'verify' && (
        <Verify onVerified={handleVerified} onAdminLogin={handleAdminLogin} initialCode={initialCode} />
      )}
      {currentStep === 'home' && (
        <Home
          onStart={startQuiz}
          onAdminLogin={handleAdminLogin}
          isAdmin={!!adminKey}
        />
      )}
      {currentStep === 'quiz' && <Quiz onComplete={finishQuiz} />}
      {currentStep === 'result' && finalScores && (
        <Result scores={finalScores} onRestart={restartQuiz} />
      )}
      {showAdmin && adminKey && (
        <Admin adminKey={adminKey} onClose={() => setShowAdmin(false)} />
      )}
    </main>
  );
}

export default App;
