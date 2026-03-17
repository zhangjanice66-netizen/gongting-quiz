import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { questions } from '../data/questions';
import type { Dimension, Option } from '../types';

interface QuizProps {
  onComplete: (scores: Record<Dimension, number>) => void;
}

// 记录每一步的答题快照，用于回退
interface AnswerSnapshot {
  questionIndex: number;
  selectedOption: Option;
  scoresBefore: Record<Dimension, number>;
}

export const Quiz: React.FC<QuizProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<Dimension, number>>({
    A: 0, B: 0, C: 0, D: 0, E: 0
  });
  const [history, setHistory] = useState<AnswerSnapshot[]>([]);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const question = questions[currentIndex];

  const handleOptionClick = (option: Option) => {
    // 保存当前快照（用于回退）
    const snapshot: AnswerSnapshot = {
      questionIndex: currentIndex,
      selectedOption: option,
      scoresBefore: { ...scores }
    };

    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([key, val]) => {
      newScores[key as Dimension] += val as number;
    });
    setScores(newScores);
    setDirection('forward');

    setTimeout(() => {
      setHistory([...history, snapshot]);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete(newScores);
      }
    }, 400);
  };

  const handleGoBack = () => {
    if (history.length === 0) return;

    const lastSnapshot = history[history.length - 1];
    setScores(lastSnapshot.scoresBefore);
    setDirection('back');
    setCurrentIndex(lastSnapshot.questionIndex);
    setHistory(history.slice(0, -1));
  };

  return (
    <div className="quiz-container">
      {/* 方块进度条 */}
      <div className="progress-header">
        <div className="progress-label">
          职场进阶中 · 第 {currentIndex + 1} / {questions.length} 题
        </div>
        <div className="progress-blocks">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`progress-block${i <= currentIndex ? ' filled' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 磨砂玻璃答题卡 */}
      <div className="question-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: direction === 'forward' ? 24 : -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'forward' ? -16 : 16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card"
          >
            {/* 宫廷角落装饰 */}
            <div className="border-decoration"></div>

            {/* 卡片顶部标题 */}
            <div className="card-header-box">
              <span className="card-title-mini">【段位测试】</span>
              <h1 className="card-main-title">深宫职场生存录</h1>
            </div>

            {/* 题目正文 */}
            <h2 className="question-title">{question.title}</h2>

            {/* 选项列表 */}
            <div className="options-group">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="option-row"
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="option-circle"></div>
                  <span className="option-text">{option.text}</span>
                </div>
              ))}
            </div>

            {/* 回退按钮 */}
            {history.length > 0 && (
              <motion.button
                className="back-btn"
                onClick={handleGoBack}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ← 回到上一题
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
