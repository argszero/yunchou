// 决策问题类型定义

export interface Criterion {
  id: string;
  name: string;
  description?: string;
  weight?: number;
}

export interface Alternative {
  id: string;
  name: string;
  description?: string;
  scores: number[];
}

export interface DecisionProblem {
  id: string;
  title: string;
  description?: string;
  criteria: Criterion[];
  alternatives: Alternative[];
  createdAt: Date;
  updatedAt: Date;
  isOwner?: boolean;
}

// AHP相关类型
export interface PairwiseComparison {
  row: number;
  col: number;
  value: number;
}

export interface AHPState {
  pairwiseMatrix: number[][];
  comparisons: PairwiseComparison[];
  weights: number[];
  consistencyRatio: number;
  isConsistent: boolean;
}

// TOPSIS相关类型
export interface TOPSISState {
  normalizedMatrix: number[][];
  weightedMatrix: number[][];
  idealSolution: number[];
  negativeIdealSolution: number[];
  distancesToIdeal: number[];
  distancesToNegative: number[];
  closenessCoefficients: number[];
  rankings: number[];
}

// 应用状态类型
export interface AppState {
  currentStep: number;
  decisionProblem: DecisionProblem | null;
  ahpState: AHPState | null;
  topsisState: TOPSISState | null;
  isLoading: boolean;
  error: string | null;
}

// 导出相关类型
export interface ExportOptions {
  includeCharts: boolean;
  includeCalculations: boolean;
  includeRankings: boolean;
  format: 'pdf' | 'png' | 'json';
}

// 响应式断点
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 主题类型
export interface Theme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  text: string;
}