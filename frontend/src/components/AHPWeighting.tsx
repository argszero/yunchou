import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Slider,
  Alert,
  Grid,
  Button,
  Chip,
  LinearProgress
} from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import type { Criterion } from '../types';
import { calculateAHPWeights } from '../utils/ahpCalculator';
import type { PairwiseComparison } from '../utils/ahpCalculator';

interface AHPWeightingProps {
  criteria: Criterion[];
  onWeightsCalculated: (weights: number[]) => void;
  onError: (error: string) => void;
}

export const AHPWeighting: React.FC<AHPWeightingProps> = ({
  criteria,
  onWeightsCalculated,
  onError
}) => {
  const [comparisons, setComparisons] = useState<PairwiseComparison[]>([]);
  const [currentComparison, setCurrentComparison] = useState<{ row: number; col: number } | null>(null);
  const [weights, setWeights] = useState<number[]>([]);
  const [consistencyRatio, setConsistencyRatio] = useState<number>(0);
  const [isConsistent, setIsConsistent] = useState<boolean>(false);

  // 初始化比较对
  useEffect(() => {
    const initialComparisons: { row: number; col: number }[] = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        initialComparisons.push({ row: i, col: j });
      }
    }
    if (initialComparisons.length > 0) {
      setCurrentComparison(initialComparisons[0]);
    }
  }, [criteria]);

  const getComparisonValue = (row: number, col: number): number => {
    const comparison = comparisons.find(c => c.row === row && c.col === col);
    return comparison ? comparison.value : 1;
  };

  const handleComparisonChange = (value: number) => {
    if (!currentComparison) return;

    const newComparison: PairwiseComparison = {
      row: currentComparison.row,
      col: currentComparison.col,
      value
    };

    const existingIndex = comparisons.findIndex(
      c => c.row === currentComparison.row && c.col === currentComparison.col
    );

    let newComparisons: PairwiseComparison[];
    if (existingIndex >= 0) {
      newComparisons = [...comparisons];
      newComparisons[existingIndex] = newComparison;
    } else {
      newComparisons = [...comparisons, newComparison];
    }

    setComparisons(newComparisons);

    // 计算权重
    try {
      const result = calculateAHPWeights(criteria.length, newComparisons);
      setWeights(result.weights);
      setConsistencyRatio(result.consistencyRatio);
      setIsConsistent(result.isConsistent);
    } catch (error) {
      onError(error instanceof Error ? error.message : '计算权重时发生错误');
    }
  };

  const getNextComparison = () => {
    if (!currentComparison) return null;

    const allComparisons: { row: number; col: number }[] = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        allComparisons.push({ row: i, col: j });
      }
    }

    const currentIndex = allComparisons.findIndex(
      c => c.row === currentComparison.row && c.col === currentComparison.col
    );

    if (currentIndex < allComparisons.length - 1) {
      return allComparisons[currentIndex + 1];
    }
    return null;
  };

  const handleNextComparison = () => {
    const next = getNextComparison();
    if (next) {
      setCurrentComparison(next);
    } else {
      // 所有比较完成，提交权重
      onWeightsCalculated(weights);
    }
  };

  const getProgress = () => {
    const totalComparisons = (criteria.length * (criteria.length - 1)) / 2;
    const completedComparisons = comparisons.length;
    return (completedComparisons / totalComparisons) * 100;
  };

  const getComparisonText = (value: number) => {
    if (value === 1) return '同等重要';
    if (value > 1 && value <= 3) return '稍微重要';
    if (value > 3 && value <= 5) return '明显重要';
    if (value > 5 && value <= 7) return '强烈重要';
    if (value > 7 && value <= 9) return '极端重要';
    if (value < 1 && value >= 1/3) return '稍微不重要';
    if (value < 1/3 && value >= 1/5) return '明显不重要';
    if (value < 1/5 && value >= 1/7) return '强烈不重要';
    if (value < 1/7 && value >= 1/9) return '极端不重要';
    return '';
  };

  if (!currentComparison) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">
          正在准备权重分配...
        </Typography>
      </Box>
    );
  }

  const currentValue = getComparisonValue(currentComparison.row, currentComparison.col);
  const criterion1 = criteria[currentComparison.row];
  const criterion2 = criteria[currentComparison.col];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        准则权重分配 (AHP方法)
      </Typography>

      {/* 进度指示器 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              比较进度
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(getProgress())}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      {/* 当前比较 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom align="center">
            请比较以下两个准则的重要性
          </Typography>

          <Grid container spacing={4} alignItems="center" sx={{ mb: 3 }}>
            <Grid component="div" sx={{ width: { xs: '100%', md: '40%' } }}>
              <Card
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                }}
              >
                <Typography variant="h6">
                  {criterion1.name}
                </Typography>
                <Typography variant="body2">
                  {criterion1.description}
                </Typography>
              </Card>
            </Grid>

            <Grid component="div" sx={{ width: { xs: '100%', md: '20%' }, textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main'
                }}
              >
                VS
              </Typography>
            </Grid>

            <Grid component="div" sx={{ width: { xs: '100%', md: '40%' } }}>
              <Card
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'secondary.light',
                  color: 'secondary.contrastText'
                }}
              >
                <Typography variant="h6">
                  {criterion2.name}
                </Typography>
                <Typography variant="body2">
                  {criterion2.description}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* 重要性滑动条 */}
          <Box sx={{ px: 2 }}>
            <Typography gutterBottom align="center">
              <strong>{getComparisonText(currentValue)}</strong>
            </Typography>
            <Slider
              value={currentValue}
              onChange={(_, value) => handleComparisonChange(value as number)}
              min={1/9}
              max={9}
              step={0.1}
              marks={[
                { value: 1/9, label: '1/9' },
                { value: 1/3, label: '1/3' },
                { value: 1, label: '1' },
                { value: 3, label: '3' },
                { value: 9, label: '9' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => value.toFixed(1)}
              sx={{
                '& .MuiSlider-markLabel': {
                  fontSize: '0.75rem'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {criterion2.name} 更重要
              </Typography>
              <Typography variant="body2" color="text.secondary">
                同等重要
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {criterion1.name} 更重要
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 权重结果 */}
      {weights.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                当前权重分配
              </Typography>
              <Chip
                icon={isConsistent ? <CheckCircle /> : <Warning />}
                label={`一致性比率: ${(consistencyRatio * 100).toFixed(1)}%`}
                color={isConsistent ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>

            <Grid container spacing={2}>
              {criteria.map((criterion, index) => (
                <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '33.333%' } }} key={criterion.id}>
                  <Card
                    variant="outlined"
                    sx={{ p: 2, textAlign: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {criterion.name}
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {(weights[index] * 100).toFixed(1)}%
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {!isConsistent && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                当前权重分配的一致性比率较高 ({consistencyRatio.toFixed(3)})，建议重新调整比较值以获得更一致的结果。
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 导航按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleNextComparison}
          disabled={comparisons.length === 0}
        >
          {getNextComparison() ? '继续下一个比较' : '确认权重并继续'}
        </Button>
      </Box>
    </Box>
  );
};