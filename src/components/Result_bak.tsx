import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, RotateCcw } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { calculateResult } from '../utils/calculateResult';
import { results } from '../data/results';
import type { Dimension } from '../types';

interface ResultProps {
    scores: Record<Dimension, number>;
    onRestart: () => void;
}

export const Result: React.FC<ResultProps> = ({ scores, onRestart }) => {
    const [loading, setLoading] = useState(true);
    const cardRef = useRef<HTMLDivElement>(null);
    const resultType = calculateResult(scores);
    const profile = results[resultType];

    useEffect(() => {
        // Simulate "内务府册封" sealing animation
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleDownload = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#F2E8D5'
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `生存段位_${profile.type}.png`;
            link.click();
        } catch (err) {
            console.error('Save image failed', err);
            alert('生成图片失败，请重试');
        }
    };

    const getStampText = () => {
        if (['凌云飞燕型', '傲雪霜梅型', '弈棋圣手型'].includes(profile.type)) return '留宫\n重用';
        if (['长信古灯型', '织锦春蚕型'].includes(profile.type)) return '准予\n晋升';
        return '留职\n查看';
    };

    const radarOption = {
        radar: {
            indicator: [
                { name: '向上管理', max: 5 },
                { name: '内卷耐受', max: 5 },
                { name: '核心实力', max: 5 },
                { name: '博弈社交', max: 5 },
                { name: '降维决断', max: 5 }
            ],
            axisLine: { lineStyle: { color: '#D4AF37' } },
            splitArea: { areaStyle: { color: ['#F2E8D5', '#E6D9C1'] } },
            splitLine: { lineStyle: { color: 'rgba(212, 175, 55, 0.5)' } },
            axisName: { color: '#8C2727', fontFamily: 'SimSun, serif', fontSize: 12 }
        },
        series: [{
            type: 'radar',
            data: [{
                value: [scores.A || 0, scores.B || 0, scores.C || 0, scores.D || 0, scores.E || 0],
                areaStyle: { color: 'rgba(140, 39, 39, 0.4)' },
                lineStyle: { color: '#8C2727', width: 2 },
                itemStyle: { color: '#8C2727' }
            }]
        }]
    };

    return (
        <div className="result-container" style={{ background: 'transparent' }}>
            <AnimatePresence>
                {loading ? (
                    <motion.div
                        className="loading-ceremony"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            animate={{ rotateY: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            style={{ width: 80, height: 120, border: '2px solid #D4AF37', background: '#8C2727', margin: '0 auto' }}
                        />
                        <div className="loading-text">内务府正加急册封...</div>
                    </motion.div>
                ) : (
                    <motion.div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <motion.div
                            className="share-card palace-card"
                            ref={cardRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ padding: '0', position: 'relative' }}
                        >
                            <div className="border-decoration"></div>

                            {/* Stamp Badge */}
                            <div className="stamp-badge">
                                {getStampText()}
                            </div>

                            <div className="card-header">
                                <div className="card-subtitle">深宫位分卡</div>
                                <h1 className="card-type">{profile.type}</h1>
                                <div className="card-title-tag">「{profile.title}」</div>
                            </div>

                            <div className="card-content">
                                <div className="quote-box" style={{ fontSize: '1rem' }}>
                                    "{profile.quote}"
                                </div>

                                <div className="radar-box" style={{ width: '100%', height: '250px', marginLeft: '-5px' }}>
                                    <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
                                </div>

                                <div className="text-box">
                                    <h3>生存解析</h3>
                                    <p>{profile.characteristics}</p>
                                </div>

                                <div className="text-box highlight">
                                    <h3>生存指南</h3>
                                    <p>{profile.guide}</p>
                                </div>
                            </div>

                            <div className="card-footer" style={{ borderTop: 'none' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>在这宫里，做人可以不狠，但位分一定要...</div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="action-buttons"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{ width: '100%' }}
                        >
                            <button className="palace-btn" onClick={handleDownload} style={{ width: '48%', margin: '0' }}>
                                <Download size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                                领旨谢恩(保存)
                            </button>
                            <button className="palace-btn" onClick={onRestart} style={{ width: '48%', margin: '0', backgroundColor: 'transparent', color: '#D4AF37' }}>
                                <RotateCcw size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                                重新定夺
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
