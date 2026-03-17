import React from 'react';
import { motion } from 'framer-motion';

interface HomeProps {
  onStart: () => void;
  onAdminLogin?: (key: string) => void;
  isAdmin?: boolean;
}

export const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="home-container">
      <motion.div
        className="home-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="subtitle">互动心理测试</div>
        <h1 className="title">深宫职场<br/>生存录</h1>

        <div className="divider">
          <span className="diamond">◆</span>
        </div>

        <p className="description">
          一入宫门深似海，职场亦如修罗场。<br/>
          面对种种考验，你会是哪种生存段位？
        </p>

        <motion.button
          className="start-button"
          onClick={onStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          开始测试
        </motion.button>
      </motion.div>
    </div>
  );
};
