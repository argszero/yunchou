/**
 * TOPSIS (优劣解距离法) 排序算法
 * 基于加权标准化矩阵计算方案排序
 */

export interface Alternative {
  id: string;
  name: string;
  scores: number[];
}

export interface TOPSISResult {
  alternatives: Alternative[];
  normalizedMatrix: number[][];
  weightedMatrix: number[][];
  idealSolution: number[];
  negativeIdealSolution: number[];
  distancesToIdeal: number[];
  distancesToNegative: number[];
  closenessCoefficients: number[];
  rankings: number[];
}

/**
 * 数据标准化方法
 */
export const NormalizationMethod = {
  MIN_MAX: 'min_max',
  VECTOR: 'vector'
} as const;

export type NormalizationMethod = typeof NormalizationMethod[keyof typeof NormalizationMethod];

/**
 * Min-Max标准化
 */
function minMaxNormalize(matrix: number[][]): number[][] {
  const normalized: number[][] = [];
  const criteriaCount = matrix[0].length;

  for (let j = 0; j < criteriaCount; j++) {
    const column = matrix.map(row => row[j]);
    const min = Math.min(...column);
    const max = Math.max(...column);
    const range = max - min;

    for (let i = 0; i < matrix.length; i++) {
      if (!normalized[i]) normalized[i] = [];
      normalized[i][j] = range === 0 ? 0.5 : (matrix[i][j] - min) / range;
    }
  }

  return normalized;
}

/**
 * 向量标准化
 */
function vectorNormalize(matrix: number[][]): number[][] {
  const normalized: number[][] = [];
  const criteriaCount = matrix[0].length;

  for (let j = 0; j < criteriaCount; j++) {
    const column = matrix.map(row => row[j]);
    const sumOfSquares = Math.sqrt(column.reduce((sum, val) => sum + val * val, 0));

    for (let i = 0; i < matrix.length; i++) {
      if (!normalized[i]) normalized[i] = [];
      normalized[i][j] = sumOfSquares === 0 ? 0 : matrix[i][j] / sumOfSquares;
    }
  }

  return normalized;
}

/**
 * 标准化决策矩阵
 */
function normalizeMatrix(
  matrix: number[][],
  method: NormalizationMethod = NormalizationMethod.MIN_MAX
): number[][] {
  switch (method) {
    case NormalizationMethod.MIN_MAX:
      return minMaxNormalize(matrix);
    case NormalizationMethod.VECTOR:
      return vectorNormalize(matrix);
    default:
      return minMaxNormalize(matrix);
  }
}

/**
 * 构建加权标准化矩阵
 */
function buildWeightedMatrix(
  normalizedMatrix: number[][],
  weights: number[]
): number[][] {
  return normalizedMatrix.map(row =>
    row.map((value, index) => value * weights[index])
  );
}

/**
 * 确定理想解和负理想解
 */
function determineIdealSolutions(
  weightedMatrix: number[][]
): {
  idealSolution: number[];
  negativeIdealSolution: number[];
} {
  const criteriaCount = weightedMatrix[0].length;
  const idealSolution: number[] = [];
  const negativeIdealSolution: number[] = [];

  // 假设所有准则都是效益型（越大越好）
  // 在实际应用中，这里应该根据准则类型（效益型/成本型）进行调整
  for (let j = 0; j < criteriaCount; j++) {
    const column = weightedMatrix.map(row => row[j]);
    idealSolution[j] = Math.max(...column);
    negativeIdealSolution[j] = Math.min(...column);
  }

  return { idealSolution, negativeIdealSolution };
}

/**
 * 计算欧氏距离
 */
function calculateEuclideanDistances(
  weightedMatrix: number[][],
  referencePoint: number[]
): number[] {
  return weightedMatrix.map(row => {
    let sum = 0;
    for (let j = 0; j < row.length; j++) {
      sum += Math.pow(row[j] - referencePoint[j], 2);
    }
    return Math.sqrt(sum);
  });
}

/**
 * 计算相对贴近度
 */
function calculateClosenessCoefficients(
  distancesToIdeal: number[],
  distancesToNegative: number[]
): number[] {
  return distancesToIdeal.map((dPlus, index) => {
    const dMinus = distancesToNegative[index];
    return dMinus / (dPlus + dMinus);
  });
}

/**
 * 计算排名
 */
function calculateRankings(closenessCoefficients: number[]): number[] {
  const sorted = [...closenessCoefficients]
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);

  const rankings: number[] = new Array(closenessCoefficients.length);
  sorted.forEach((item, rank) => {
    rankings[item.index] = rank + 1;
  });

  return rankings;
}

/**
 * 主函数：执行TOPSIS分析
 */
export function performTOPSISAnalysis(
  alternatives: Alternative[],
  weights: number[],
  normalizationMethod: NormalizationMethod = NormalizationMethod.MIN_MAX
): TOPSISResult {
  // 提取评分矩阵
  const scoreMatrix = alternatives.map(alt => alt.scores);

  // 1. 标准化决策矩阵
  const normalizedMatrix = normalizeMatrix(scoreMatrix, normalizationMethod);

  // 2. 构建加权标准化矩阵
  const weightedMatrix = buildWeightedMatrix(normalizedMatrix, weights);

  // 3. 确定理想解和负理想解
  const { idealSolution, negativeIdealSolution } = determineIdealSolutions(weightedMatrix);

  // 4. 计算距离
  const distancesToIdeal = calculateEuclideanDistances(weightedMatrix, idealSolution);
  const distancesToNegative = calculateEuclideanDistances(weightedMatrix, negativeIdealSolution);

  // 5. 计算相对贴近度
  const closenessCoefficients = calculateClosenessCoefficients(
    distancesToIdeal,
    distancesToNegative
  );

  // 6. 计算排名
  const rankings = calculateRankings(closenessCoefficients);

  return {
    alternatives,
    normalizedMatrix,
    weightedMatrix,
    idealSolution,
    negativeIdealSolution,
    distancesToIdeal,
    distancesToNegative,
    closenessCoefficients,
    rankings
  };
}

/**
 * 获取排名描述
 */
export function getRankingDescription(rank: number, total: number): string {
  if (rank === 1) return '最佳选择';
  if (rank <= Math.ceil(total * 0.2)) return '优秀选择';
  if (rank <= Math.ceil(total * 0.5)) return '良好选择';
  if (rank <= Math.ceil(total * 0.8)) return '一般选择';
  return '较差选择';
}