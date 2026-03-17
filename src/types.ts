export type Dimension = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Option {
  id: string;
  text: string;
  scores: Partial<Record<Dimension, number>>;
}

export interface Question {
  id: number;
  title: string;
  options: Option[];
}

export type ResultType = 
  | '凌云飞燕型'
  | '傲雪霜梅型'
  | '灼灼牡丹型'
  | '织锦春蚕型'
  | '御苑灵鹤型'
  | '弈棋圣手型'
  | '长信古灯型';

export interface ResultProfile {
  type: ResultType;
  title: string;
  characteristics: string;
  guide: string;
  quote: string;
}
