/**
 * AHP (层次分析法) 权重计算工具
 * 使用特征向量法计算权重，并进行一致性检验
 */

export interface PairwiseComparison {
  row: number;
  col: number;
  value: number;
}

export interface AHPResult {
  weights: number[];
  consistencyRatio: number;
  isConsistent: boolean;
  pairwiseMatrix: number[][];
}

/**
 * 创建初始成对比较矩阵
 */
function createInitialMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = 1; // 对角线元素为1
      } else {
        matrix[i][j] = 0; // 初始化为0，等待用户输入
      }
    }
  }
  return matrix;
}

/**
 * 更新成对比较矩阵
 */
export function updatePairwiseMatrix(
  matrix: number[][],
  comparison: PairwiseComparison
): number[][] {
  const newMatrix = matrix.map(row => [...row]);
  const { row, col, value } = comparison;

  // 设置比较值
  newMatrix[row][col] = value;
  newMatrix[col][row] = 1 / value;

  return newMatrix;
}

/**
 * 计算矩阵的特征向量（权重）
 */
function calculateEigenvector(matrix: number[][]): number[] {
  const size = matrix.length;

  // 计算每行的几何平均值
  const geometricMeans: number[] = [];
  for (let i = 0; i < size; i++) {
    let product = 1;
    for (let j = 0; j < size; j++) {
      product *= matrix[i][j];
    }
    geometricMeans[i] = Math.pow(product, 1 / size);
  }

  // 归一化得到权重
  const sum = geometricMeans.reduce((acc, val) => acc + val, 0);
  return geometricMeans.map(val => val / sum);
}

/**
 * 计算一致性比率
 */
function calculateConsistencyRatio(matrix: number[][], weights: number[]): number {
  const size = matrix.length;

  // 计算最大特征值
  let lambdaMax = 0;
  for (let i = 0; i < size; i++) {
    let sum = 0;
    for (let j = 0; j < size; j++) {
      sum += matrix[i][j] * weights[j];
    }
    lambdaMax += sum / weights[i];
  }
  lambdaMax /= size;

  // 计算一致性指标CI
  const CI = (lambdaMax - size) / (size - 1);

  // 随机一致性指标RI（根据矩阵大小）
  const RI = getRandomIndex(size);

  // 一致性比率CR
  return CI / RI;
}

/**
 * 获取随机一致性指标
 */
function getRandomIndex(size: number): number {
  const riTable: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49
  };
  return riTable[size] || 1.5;
}

/**
 * 主函数：计算AHP权重
 */
export function calculateAHPWeights(
  criteriaCount: number,
  comparisons: PairwiseComparison[]
): AHPResult {
  // 创建初始矩阵
  let matrix = createInitialMatrix(criteriaCount);

  // 应用所有成对比较
  comparisons.forEach(comparison => {
    matrix = updatePairwiseMatrix(matrix, comparison);
  });

  // 检查矩阵是否完整
  const isComplete = matrix.every(row =>
    row.every(cell => cell !== 0)
  );

  if (!isComplete) {
    throw new Error('成对比较矩阵不完整');
  }

  // 计算权重
  const weights = calculateEigenvector(matrix);

  // 计算一致性比率
  const consistencyRatio = calculateConsistencyRatio(matrix, weights);
  const isConsistent = consistencyRatio < 0.1;

  return {
    weights,
    consistencyRatio,
    isConsistent,
    pairwiseMatrix: matrix
  };
}

/**
 * 生成成对比较的描述
 */
export function getComparisonDescription(criterion1: string, criterion2: string, value: number): string {

  if (value === 1) return `${criterion1} 与 ${criterion2} 同等重要`;
  if (value > 1 && value <= 3) return `${criterion1} 比 ${criterion2} 稍微重要`;
  if (value > 3 && value <= 5) return `${criterion1} 比 ${criterion2} 明显重要`;
  if (value > 5 && value <= 7) return `${criterion1} 比 ${criterion2} 强烈重要`;
  if (value > 7 && value <= 9) return `${criterion1} 比 ${criterion2} 极端重要`;

  return '';
}