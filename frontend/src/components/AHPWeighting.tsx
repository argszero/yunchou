import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Slider,
  Alert,
  Button,
  Chip,
  LinearProgress,
  AppBar,
  Toolbar,
  IconButton,
  Fab
} from '@mui/material';
import { CheckCircle, Warning, Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
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
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);

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

  const openFullScreenComparison = () => {
    setFullScreenMode(true);
  };

  const closeFullScreenComparison = () => {
    setFullScreenMode(false);
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

  // 全屏比较模式
  if (fullScreenMode) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* 顶部导航栏 */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={closeFullScreenComparison}>
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
              准则重要性比较
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {comparisons.length + 1}/{(criteria.length * (criteria.length - 1)) / 2}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* 进度条 */}
        <Box sx={{ px: 2, py: 1 }}>
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* 比较卡片 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 3, gap: 3 }}>
          {/* 准则A卡片 */}
          <Card
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 3,
              boxShadow: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:active': {
                transform: 'scale(0.98)',
                bgcolor: 'primary.dark'
              }
            }}
            onClick={() => handleComparisonChange(Math.max(1, Math.min(9, currentValue + 0.5)))}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {criterion1.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {criterion1.description}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                点击选择此项更重要
              </Typography>
            </Box>
          </Card>

          {/* 比较指示器 */}
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'text.secondary',
                bgcolor: 'background.paper',
                py: 1,
                px: 3,
                borderRadius: 2,
                display: 'inline-block'
              }}
            >
              VS
            </Typography>
          </Box>

          {/* 准则B卡片 */}
          <Card
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              borderRadius: 3,
              boxShadow: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:active': {
                transform: 'scale(0.98)',
                bgcolor: 'secondary.dark'
              }
            }}
            onClick={() => handleComparisonChange(Math.max(1/9, Math.min(1, currentValue - 0.5)))}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {criterion2.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {criterion2.description}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                点击选择此项更重要
              </Typography>
            </Box>
          </Card>

          {/* 当前重要性显示 */}
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {getComparisonText(currentValue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              当前重要性: {currentValue.toFixed(1)}
            </Typography>
          </Box>

          {/* 精细调整滑块 */}
          <Box sx={{ px: 2, pb: 2 }}>
            <Slider
              value={currentValue}
              onChange={(_, value) => handleComparisonChange(value as number)}
              min={1/9}
              max={9}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => value.toFixed(1)}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 20,
                  height: 20
                }
              }}
            />
          </Box>
        </Box>

        {/* 底部导航 */}
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => handleComparisonChange(1)}
            startIcon={<NavigateBefore />}
          >
            重置为同等重要
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleNextComparison}
            disabled={comparisons.length === 0}
            endIcon={<NavigateNext />}
          >
            {getNextComparison() ? '继续比较' : '完成比较'}
          </Button>
        </Box>
      </Box>
    );
  }

  // 常规模式
  return (
    <Box>
      {/* 快速概览卡片 */}
      <Card sx={{ mb: 3, cursor: 'pointer' }} onClick={openFullScreenComparison}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                🎯 AHP权重分配
              </Typography>
              <Typography variant="body2" color="text.secondary">
                点击开始比较准则重要性
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {Math.round(getProgress())}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                完成进度
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            sx={{ mt: 2, height: 6, borderRadius: 3 }}
          />
        </CardContent>
      </Card>

      {/* 权重可视化预览 */}
      {weights.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                📊 当前权重分布
              </Typography>
              <Chip
                icon={isConsistent ? <CheckCircle /> : <Warning />}
                label={`一致性: ${(consistencyRatio * 100).toFixed(1)}%`}
                color={isConsistent ? 'success' : 'warning'}
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {criteria.map((criterion, index) => (
                <Box
                  key={criterion.id}
                  sx={{
                    flex: `0 0 calc(50% - 4px)`,
                    textAlign: 'center',
                    p: 1,
                    bgcolor: 'primary.50',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {criterion.name}
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {(weights[index] * 100).toFixed(0)}%
                  </Typography>
                </Box>
              ))}
            </Box>

            {!isConsistent && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                建议重新调整比较值以获得更一致的结果
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 开始比较按钮 */}
      <Fab
        variant="extended"
        color="primary"
        onClick={openFullScreenComparison}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <NavigateNext sx={{ mr: 1 }} />
        开始比较
      </Fab>
    </Box>
  );
};