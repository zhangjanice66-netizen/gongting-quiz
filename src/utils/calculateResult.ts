import type { Dimension, ResultType } from '../types';

export function calculateResult(scores: Record<Dimension, number>): ResultType {
  // 1. Sort dimensions by score descending
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a) as [Dimension, number][];
  
  const top1 = sorted[0][0];
  const top2 = sorted[1][0];
  const bottom1 = sorted[4][0];
  const bottom2 = sorted[3][0];

  const isHigh = (dim: Dimension) => dim === top1 || dim === top2;
  const isLow = (dim: Dimension) => dim === bottom1 || dim === bottom2;

  // 御苑灵鹤型 | E高+A低+B低
  if (isHigh('E') && isLow('A') && isLow('B')) {
    return '御苑灵鹤型';
  }

  // 灼灼牡丹型 | E高+A低
  if (isHigh('E') && isLow('A')) {
    return '灼灼牡丹型';
  }

  // 凌云飞燕型 | A+E高
  if (isHigh('A') && isHigh('E')) {
    return '凌云飞燕型';
  }

  // 傲雪霜梅型 | C+B高
  if (isHigh('C') && isHigh('B')) {
    return '傲雪霜梅型';
  }

  // 织锦春蚕型 | B高+D低
  if (isHigh('B') && isLow('D')) {
    return '织锦春蚕型';
  }

  // 弈棋圣手型 | A+D高
  if (isHigh('A') && isHigh('D')) {
    return '弈棋圣手型';
  }

  // 长信古灯型 | 平衡+B高 (If B is high but other specific combos didn't match, or as a fallback for high B)
  if (isHigh('B')) {
    return '长信古灯型';
  }

  // Fallbacks if no specific type matched perfectly based on top1
  switch (top1) {
    case 'A': return '弈棋圣手型';
    case 'B': return '长信古灯型';
    case 'C': return '傲雪霜梅型';
    case 'D': return '弈棋圣手型';
    case 'E': return '灼灼牡丹型';
    default: return '长信古灯型';
  }
}
