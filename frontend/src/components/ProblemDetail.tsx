import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Slider,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  LinearProgress,
  Fab,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  ArrowBack,
  Close,
  NavigateBefore,
  NavigateNext,
  Add,
  Delete,
  DragIndicator
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import type { DecisionProblem, Criterion, Alternative } from '../types';
import { apiClient } from '../utils/api';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer
} from 'recharts';

// CSS动画定义
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.9;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// 注入CSS样式
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`problem-tabpanel-${index}`}
      aria-labelledby={`problem-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{
          p: 2,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<DecisionProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [ahpMatrix, setAhpMatrix] = useState<Record<string, Record<string, number>>>({});
  const [ahpMode, setAhpMode] = useState(false);
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false);
  const [currentAlternativeIndex, setCurrentAlternativeIndex] = useState(0);
  const [ahpFullScreenMode, setAhpFullScreenMode] = useState(false);
  const [currentAhpComparison, setCurrentAhpComparison] = useState<{ criterion1: string; criterion2: string } | null>(null);
  const [autoNavigateTimer, setAutoNavigateTimer] = useState<number | null>(null);

  // 编辑相关状态
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [editingAlternative, setEditingAlternative] = useState<Alternative | null>(null);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newAlternativeName, setNewAlternativeName] = useState('');
  const [showAddCriterion, setShowAddCriterion] = useState(false);
  const [showAddAlternative, setShowAddAlternative] = useState(false);
  const [deletingCriterion, setDeletingCriterion] = useState<Criterion | null>(null);
  const [deletingAlternative, setDeletingAlternative] = useState<Alternative | null>(null);

  useEffect(() => {
    if (id) {
      loadProblem(id);
    }
  }, [id]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoNavigateTimer) {
        clearTimeout(autoNavigateTimer);
      }
    };
  }, [autoNavigateTimer]);

  // 当比较对变化时清理定时器
  useEffect(() => {
    if (autoNavigateTimer) {
      clearTimeout(autoNavigateTimer);
      setAutoNavigateTimer(null);
    }
  }, [currentAhpComparison]);

  // 初始化默认权重
  useEffect(() => {
    if (problem && problem.criteria && problem.criteria.length > 0) {
      // 使用后端返回的默认权重，如果没有则使用均等权重
      const initialWeights: Record<string, number> = {};
      problem.criteria.forEach((criterion, index) => {
        const defaultWeight = problem.weights && problem.weights[index] !== undefined
          ? problem.weights[index]
          : Math.floor(100 / problem.criteria.length);
        initialWeights[criterion.id] = defaultWeight;
      });
      setWeights(initialWeights);

      // 初始化默认评分
      const initialScores: Record<string, Record<string, number>> = {};
      problem.criteria.forEach((criterion, criterionIndex) => {
        initialScores[criterion.id] = {};
        problem.alternatives.forEach((alternative) => {
          // 使用后端返回的默认评分，如果没有则使用50分
          const defaultScore = alternative.scores && alternative.scores[criterionIndex] !== undefined
            ? alternative.scores[criterionIndex]
            : 50;
          initialScores[criterion.id][alternative.id] = defaultScore;
        });
      });
      setScores(initialScores);

      // 初始化AHP矩阵
      const initialMatrix: Record<string, Record<string, number>> = {};
      problem.criteria.forEach(criterion1 => {
        initialMatrix[criterion1.id] = {};
        problem.criteria.forEach(criterion2 => {
          if (criterion1.id === criterion2.id) {
            initialMatrix[criterion1.id][criterion2.id] = 1;
          } else {
            initialMatrix[criterion1.id][criterion2.id] = 1;
          }
        });
      });
      setAhpMatrix(initialMatrix);
    }
  }, [problem]);

  const loadProblem = async (problemId: string) => {
    try {
      setIsLoading(true);
      const problem = await apiClient.get(`/problems/${problemId}`);
      setProblem(problem);
    } catch (err) {
      setError('加载问题详情失败');
      console.error('Failed to load problem:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleTabChange = (_event: React.MouseEvent<HTMLElement>, newValue: number) => {
    setActiveTab(newValue);
  };

  // 权重分配处理 - 带自动保存
  const handleWeightChange = (criterionId: string, value: number) => {
    setWeights(prev => {
      const newWeights = {
        ...prev,
        [criterionId]: value
      };

      // 更新问题对象的weights数组
      if (problem) {
        const updatedWeights = problem.criteria.map((criterion) => {
          return newWeights[criterion.id] || 0;
        });

        const updatedProblem = {
          ...problem,
          weights: updatedWeights
        };

        setProblem(updatedProblem);
        // 异步保存到后端
        saveProblem(updatedProblem);
      }

      return newWeights;
    });
  };

  // 权重归一化处理 - 带自动保存
  const normalizeWeights = () => {
    const currentTotal = getTotalWeight();

    if (currentTotal === 0) return; // 防止除以零

    const normalizedWeights: Record<string, number> = {};

    // 计算归一化权重
    Object.keys(weights).forEach(key => {
      normalizedWeights[key] = Math.round((weights[key] / currentTotal) * 100);
    });

    // 确保归一化后总权重为100%（处理四舍五入误差）
    const normalizedTotal = Object.values(normalizedWeights).reduce((sum, weight) => sum + weight, 0);
    if (normalizedTotal !== 100) {
      // 找到最大的权重项进行调整
      const maxKey = Object.keys(normalizedWeights).reduce((a, b) =>
        normalizedWeights[a] > normalizedWeights[b] ? a : b
      );
      normalizedWeights[maxKey] += (100 - normalizedTotal);
    }

    setWeights(normalizedWeights);

    // 更新问题对象的weights数组并保存
    if (problem) {
      const updatedWeights = problem.criteria.map((criterion) => {
        return normalizedWeights[criterion.id] || 0;
      });

      const updatedProblem = {
        ...problem,
        weights: updatedWeights
      };

      setProblem(updatedProblem);
      // 异步保存到后端
      saveProblem(updatedProblem);
    }
  };

  // 保存问题到后端
  const saveProblem = async (updatedProblem: DecisionProblem) => {
    try {
      // 使用 PUT 方法更新问题
      await apiClient.put(`/problems/${id}`, updatedProblem);
    } catch (err) {
      console.error('Failed to save problem:', err);
      // 可以在这里添加错误提示，但为了用户体验，我们不中断操作
    }
  };

  // 方案评分处理
  const handleScoreChange = (criterionId: string, alternativeId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [alternativeId]: value
      }
    }));
  };

  // 全屏评分卡片相关函数
  const openScoringDialog = (index: number) => {
    setCurrentAlternativeIndex(index);
    setScoringDialogOpen(true);
  };

  const closeScoringDialog = () => {
    setScoringDialogOpen(false);
  };

  const goToNextAlternative = () => {
    if (problem && currentAlternativeIndex < problem.alternatives.length - 1) {
      setCurrentAlternativeIndex(currentAlternativeIndex + 1);
    }
  };

  const goToPrevAlternative = () => {
    if (currentAlternativeIndex > 0) {
      setCurrentAlternativeIndex(currentAlternativeIndex - 1);
    }
  };

  // 计算当前方案的完成进度
  const getCurrentAlternativeProgress = () => {
    if (!problem) return 0;
    const currentAlternative = problem.alternatives[currentAlternativeIndex];
    if (!currentAlternative) return 0;

    const scoredCriteria = problem.criteria.filter(criterion => {
      const score = scores[criterion.id]?.[currentAlternative.id];
      return score !== undefined && score >= 0 && score <= 100;
    }).length;

    return Math.round((scoredCriteria / problem.criteria.length) * 100);
  };

  // 计算总权重
  const getTotalWeight = () => {
    return Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  };

  // 计算AHP进度
  const getAhpProgress = () => {
    if (!problem || !problem.criteria) return 0;

    const totalComparisons = (problem.criteria.length * (problem.criteria.length - 1)) / 2;
    let completedComparisons = 0;

    for (let i = 0; i < problem.criteria.length; i++) {
      for (let j = i + 1; j < problem.criteria.length; j++) {
        const criterion1 = problem.criteria[i];
        const criterion2 = problem.criteria[j];
        if (ahpMatrix[criterion1.id]?.[criterion2.id] !== undefined) {
          completedComparisons++;
        }
      }
    }

    return (completedComparisons / totalComparisons) * 100;
  };

  // 初始化AHP比较
  const initializeAhpComparison = () => {
    if (!problem || !problem.criteria) return;

    // 找到第一个未完成的比较
    for (let i = 0; i < problem.criteria.length; i++) {
      for (let j = i + 1; j < problem.criteria.length; j++) {
        const criterion1 = problem.criteria[i];
        const criterion2 = problem.criteria[j];
        if (ahpMatrix[criterion1.id]?.[criterion2.id] === undefined) {
          setCurrentAhpComparison({ criterion1: criterion1.id, criterion2: criterion2.id });
          setAhpFullScreenMode(true);
          return;
        }
      }
    }

    // 如果所有比较都已完成，显示第一个比较
    if (problem.criteria.length >= 2) {
      setCurrentAhpComparison({
        criterion1: problem.criteria[0].id,
        criterion2: problem.criteria[1].id
      });
      setAhpFullScreenMode(true);
    }
  };

  // 获取下一个AHP比较
  const getNextAhpComparison = () => {
    if (!problem || !problem.criteria || !currentAhpComparison) return null;

    const allComparisons: { criterion1: string; criterion2: string }[] = [];
    for (let i = 0; i < problem.criteria.length; i++) {
      for (let j = i + 1; j < problem.criteria.length; j++) {
        allComparisons.push({
          criterion1: problem.criteria[i].id,
          criterion2: problem.criteria[j].id
        });
      }
    }

    const currentIndex = allComparisons.findIndex(
      c => c.criterion1 === currentAhpComparison.criterion1 &&
           c.criterion2 === currentAhpComparison.criterion2
    );

    if (currentIndex < allComparisons.length - 1) {
      return allComparisons[currentIndex + 1];
    }
    return null;
  };

  // 处理AHP比较值变化（全屏模式）
  const handleAhpComparisonChange = (value: number) => {
    if (!currentAhpComparison) return;

    const { criterion1, criterion2 } = currentAhpComparison;
    setAhpMatrix(prev => ({
      ...prev,
      [criterion1]: {
        ...prev[criterion1],
        [criterion2]: value
      }
    }));

    // 自动设置对称值
    setAhpMatrix(prev => ({
      ...prev,
      [criterion2]: {
        ...prev[criterion2],
        [criterion1]: 1 / value
      }
    }));
  };

  // 处理下一个AHP比较
  const handleNextAhpComparison = () => {
    const next = getNextAhpComparison();
    if (next) {
      setCurrentAhpComparison(next);
    } else {
      // 所有比较完成，计算权重
      calculateAhpWeights();
      setAhpFullScreenMode(false);
    }
  };

  // 滑动值到AHP重要性值的转换函数
  const sliderValueToAhpValue = (sliderValue: number): number => {
    // 滑动值范围: -100 到 100
    // 映射到AHP重要性值: 1/9 到 9

    if (sliderValue === 0) return 1; // 中间位置，同等重要

    if (sliderValue > 0) {
      // 向右滑动，上方准则更重要
      const normalizedValue = sliderValue / 100;
      if (normalizedValue <= 0.2) return 2;      // 稍微重要
      if (normalizedValue <= 0.4) return 3;      // 明显重要
      if (normalizedValue <= 0.6) return 5;      // 强烈重要
      if (normalizedValue <= 0.8) return 7;      // 非常重要
      return 9;                                  // 极端重要
    } else {
      // 向左滑动，下方准则更重要
      const normalizedValue = Math.abs(sliderValue) / 100;
      if (normalizedValue <= 0.2) return 1/2;    // 稍微重要
      if (normalizedValue <= 0.4) return 1/3;    // 明显重要
      if (normalizedValue <= 0.6) return 1/5;    // 强烈重要
      if (normalizedValue <= 0.8) return 1/7;    // 非常重要
      return 1/9;                                // 极端重要
    }
  };

  // AHP重要性值到滑动值的转换函数
  const ahpValueToSliderValue = (ahpValue: number): number => {
    if (ahpValue === 1) return 0; // 同等重要

    if (ahpValue > 1) {
      // 上方准则更重要
      switch (ahpValue) {
        case 2: return 20;   // 稍微重要
        case 3: return 40;   // 明显重要
        case 5: return 60;   // 强烈重要
        case 7: return 80;   // 非常重要
        case 9: return 100;  // 极端重要
        default: return Math.min(100, (ahpValue - 1) * 12.5);
      }
    } else {
      // 下方准则更重要
      const reciprocal = 1 / ahpValue;
      switch (reciprocal) {
        case 2: return -20;   // 稍微重要
        case 3: return -40;   // 明显重要
        case 5: return -60;   // 强烈重要
        case 7: return -80;   // 非常重要
        case 9: return -100;  // 极端重要
        default: return Math.max(-100, -(reciprocal - 1) * 12.5);
      }
    }
  };

  // 滑动处理函数
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    if (currentAhpComparison) {
      const sliderValue = Array.isArray(newValue) ? newValue[0] : newValue;
      const ahpValue = sliderValueToAhpValue(sliderValue);

      // 更新AHP矩阵
      setAhpMatrix(prev => ({
        ...prev,
        [currentAhpComparison.criterion1]: {
          ...prev[currentAhpComparison.criterion1],
          [currentAhpComparison.criterion2]: ahpValue
        },
        [currentAhpComparison.criterion2]: {
          ...prev[currentAhpComparison.criterion2],
          [currentAhpComparison.criterion1]: 1 / ahpValue
        }
      }));


      // 清除之前的定时器
      if (autoNavigateTimer) {
        clearTimeout(autoNavigateTimer);
      }

      // 设置1秒后自动跳转的定时器
      const timer = setTimeout(() => {
        handleNextAhpComparison();
      }, 1000);

      setAutoNavigateTimer(timer);
    }
  };

  // AHP重要性级别辅助函数
  const getImportanceText = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue === 1) return '同等重要';
    if (absValue === 2) return '稍微重要';
    if (absValue === 3) return '明显重要';
    if (absValue === 5) return '强烈重要';
    if (absValue === 7) return '非常重要';
    if (absValue === 9) return '极端重要';
    return '同等重要';
  };





  // 获取准则大小缩放比例
  const getCardScale = (value: number, side: 'left' | 'right'): number => {
    if (value === 1) return 1; // 同等重要

    if (side === 'left' && value > 1) {
      // 上方准则更重要
      switch (value) {
        case 2: return 1.05;  // 稍微重要
        case 3: return 1.1;   // 明显重要
        case 5: return 1.15;  // 强烈重要
        case 7: return 1.2;   // 非常重要
        case 9: return 1.25;  // 极端重要
        default: return 1 + (value - 1) * 0.03;
      }
    } else if (side === 'right' && value < 1) {
      // 下方准则更重要
      const reciprocal = 1 / value;
      switch (reciprocal) {
        case 2: return 1.05;  // 稍微重要
        case 3: return 1.1;   // 明显重要
        case 5: return 1.15;  // 强烈重要
        case 7: return 1.2;   // 非常重要
        case 9: return 1.25;  // 极端重要
        default: return 1 + (reciprocal - 1) * 0.03;
      }
    } else {
      // 当前准则不重要
      if (value > 1) {
        // 上方准则更重要，下方准则不重要
        switch (value) {
          case 2: return 0.95;  // 稍微不重要
          case 3: return 0.9;   // 明显不重要
          case 5: return 0.85;  // 强烈不重要
          case 7: return 0.8;   // 非常不重要
          case 9: return 0.75;  // 极端不重要
          default: return 1 - (value - 1) * 0.03;
        }
      } else {
        // 下方准则更重要，上方准则不重要
        const reciprocal = 1 / value;
        switch (reciprocal) {
          case 2: return 0.95;  // 稍微不重要
          case 3: return 0.9;   // 明显不重要
          case 5: return 0.85;  // 强烈不重要
          case 7: return 0.8;   // 非常不重要
          case 9: return 0.75;  // 极端不重要
          default: return 1 - (reciprocal - 1) * 0.03;
        }
      }
    }
  };

  const getCurrentSelectionText = (value: number): string => {
    if (value === 1) return '当前选择：同等重要';
    if (value > 1) return '当前选择：上方准则更重要';
    return '当前选择：下方准则更重要';
  };



  // 计算AHP权重
  const calculateAhpWeights = () => {
    if (!problem || !problem.criteria) return;

    const n = problem.criteria.length;
    const matrix: number[][] = [];

    // 构建判断矩阵
    problem.criteria.forEach((criterion1, i) => {
      matrix[i] = [];
      problem.criteria.forEach((criterion2, j) => {
        matrix[i][j] = ahpMatrix[criterion1.id]?.[criterion2.id] || 1;
      });
    });

    // 计算每列的和
    const columnSums: number[] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += matrix[i][j];
      }
      columnSums[j] = sum;
    }

    // 归一化矩阵
    const normalizedMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      normalizedMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        normalizedMatrix[i][j] = matrix[i][j] / columnSums[j];
      }
    }

    // 计算权重向量
    const weightsVector: number[] = [];
    for (let i = 0; i < n; i++) {
      const rowSum = normalizedMatrix[i].reduce((sum, val) => sum + val, 0);
      weightsVector[i] = rowSum / n;
    }

    // 转换为百分比并更新权重
    const newWeights: Record<string, number> = {};
    problem.criteria.forEach((criterion, index) => {
      newWeights[criterion.id] = Math.round(weightsVector[index] * 100);
    });

    setWeights(newWeights);
    setAhpMode(false);
  };

  // 计算加权得分
  const calculateWeightedScores = () => {
    if (!problem) return [];

    return problem.alternatives.map(alternative => {
      let totalScore = 0;

      problem.criteria.forEach(criterion => {
        const weight = weights[criterion.id] || 0;
        const score = scores[criterion.id]?.[alternative.id] || 0;
        totalScore += weight * score;
      });

      return {
        alternative,
        totalScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  };

  // 生成雷达图数据
  const generateRadarChartData = () => {
    if (!problem) return [];

    // 取前3个方案进行对比
    const topAlternatives = calculateWeightedScores().slice(0, 3);

    return problem.criteria.map(criterion => {
      const dataPoint: Record<string, any> = {
        criterion: criterion.name
      };

      topAlternatives.forEach((result, index) => {
        const score = scores[criterion.id]?.[result.alternative.id] || 0;
        dataPoint[`方案${index + 1}`] = score;
        dataPoint[`fullMark`] = 100; // 用于设置雷达图的最大值
      });

      return dataPoint;
    });
  };

  // 编辑相关函数
  const handleAddCriterion = () => {
    if (!problem || !newCriterionName.trim()) return;

    const newCriterion: Criterion = {
      id: `criterion-${Date.now()}`,
      name: newCriterionName.trim(),
      description: ''
    };

    const updatedProblem = {
      ...problem,
      criteria: [...problem.criteria, newCriterion]
    };

    setProblem(updatedProblem);
    setNewCriterionName('');
    setShowAddCriterion(false);
  };

  const handleAddAlternative = () => {
    if (!problem || !newAlternativeName.trim()) return;

    const newAlternative: Alternative = {
      id: `alternative-${Date.now()}`,
      name: newAlternativeName.trim(),
      description: '',
      scores: []
    };

    const updatedProblem = {
      ...problem,
      alternatives: [...problem.alternatives, newAlternative]
    };

    setProblem(updatedProblem);
    setNewAlternativeName('');
    setShowAddAlternative(false);
  };

  const handleEditCriterion = (criterion: Criterion) => {
    setEditingCriterion(criterion);
  };

  const handleEditAlternative = (alternative: Alternative) => {
    setEditingAlternative(alternative);
  };

  const handleSaveCriterion = () => {
    if (!problem || !editingCriterion || !editingCriterion.name.trim()) return;

    const updatedCriteria = problem.criteria.map(criterion =>
      criterion.id === editingCriterion.id ? editingCriterion : criterion
    );

    const updatedProblem = {
      ...problem,
      criteria: updatedCriteria
    };

    setProblem(updatedProblem);
    setEditingCriterion(null);
  };

  const handleSaveAlternative = () => {
    if (!problem || !editingAlternative || !editingAlternative.name.trim()) return;

    const updatedAlternatives = problem.alternatives.map(alternative =>
      alternative.id === editingAlternative.id ? editingAlternative : alternative
    );

    const updatedProblem = {
      ...problem,
      alternatives: updatedAlternatives
    };

    setProblem(updatedProblem);
    setEditingAlternative(null);
  };

  const handleDeleteCriterion = (criterionId: string) => {
    if (!problem) return;

    const updatedCriteria = problem.criteria.filter(criterion => criterion.id !== criterionId);
    const updatedProblem = {
      ...problem,
      criteria: updatedCriteria
    };

    setProblem(updatedProblem);
  };

  const handleDeleteAlternative = (alternativeId: string) => {
    if (!problem) return;

    const updatedAlternatives = problem.alternatives.filter(alternative => alternative.id !== alternativeId);
    const updatedProblem = {
      ...problem,
      alternatives: updatedAlternatives
    };

    setProblem(updatedProblem);
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !problem) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ alignSelf: 'flex-start', mb: 3 }}
        >
          返回
        </Button>
        <Alert severity="error">
          {error || '问题不存在'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      {/* 返回按钮 */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{ alignSelf: 'flex-start', mb: 3, ml: 2 }}
      >
        返回
      </Button>

      {/* 问题标题 */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, px: 2 }}>
        {problem.title}
      </Typography>

      {/* 标签页 */}
      <Paper elevation={0} sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        {/* 移动端友好的导航 - 使用分段控制 */}
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={handleTabChange}
          aria-label="导航菜单"
          sx={{
            width: '100%',
            mb: 2,
            '& .MuiToggleButton-root': {
              flex: 1,
              py: 1.5,
              fontSize: '0.875rem',
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }
            }
          }}
        >
          <ToggleButton value={0} aria-label="评价准则">
            准则
          </ToggleButton>
          <ToggleButton value={1} aria-label="备选方案">
            方案
          </ToggleButton>
          <ToggleButton value={2} aria-label="权重分配">
            权重
          </ToggleButton>
          <ToggleButton value={3} aria-label="方案评分">
            评分
          </ToggleButton>
          <ToggleButton value={4} aria-label="结果分析">
            结果
          </ToggleButton>
        </ToggleButtonGroup>

        {/* 评价准则面板 - 支持编辑 */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              评价准则
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowAddCriterion(true)}
              size="small"
            >
              添加准则
            </Button>
          </Box>

          {problem.criteria && problem.criteria.length > 0 ? (
            <Box>
              {problem.criteria.map((criterion) => (
                <Paper
                  key={criterion.id}
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-1px)'
                    }
                  }}
                  onClick={() => handleEditCriterion(criterion)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <DragIndicator
                        sx={{
                          color: 'text.secondary',
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' }
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {criterion.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCriterion(criterion);
                      }}
                      sx={{
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.light' }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderRadius: 2
              }}
            >
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                暂无评价准则
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setShowAddCriterion(true)}
              >
                添加第一个准则
              </Button>
            </Paper>
          )}

          {/* 添加准则弹窗 */}
          <Dialog
            open={showAddCriterion}
            onClose={() => setShowAddCriterion(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                添加评价准则
              </Typography>
              <TextField
                fullWidth
                label="准则名称"
                value={newCriterionName}
                onChange={(e) => setNewCriterionName(e.target.value)}
                placeholder="请输入评价准则名称"
                autoFocus
                sx={{ mb: 3 }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowAddCriterion(false)}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAddCriterion}
                  disabled={!newCriterionName.trim()}
                >
                  添加
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* 编辑准则弹窗 */}
          <Dialog
            open={!!editingCriterion}
            onClose={() => setEditingCriterion(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                编辑评价准则
              </Typography>
              <TextField
                fullWidth
                label="准则名称"
                value={editingCriterion?.name || ''}
                onChange={(e) => setEditingCriterion(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="请输入评价准则名称"
                autoFocus
                sx={{ mb: 3 }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setEditingCriterion(null)}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveCriterion}
                  disabled={!editingCriterion?.name?.trim()}
                >
                  保存
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* 删除准则确认对话框 */}
          <Dialog
            open={!!deletingCriterion}
            onClose={() => setDeletingCriterion(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                ⚠️ 确认删除
              </Typography>
              <Typography sx={{ mb: 3 }}>
                确定要删除评价准则 "{deletingCriterion?.name}" 吗？此操作不可撤销。
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setDeletingCriterion(null)}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    if (deletingCriterion) {
                      handleDeleteCriterion(deletingCriterion.id);
                      setDeletingCriterion(null);
                    }
                  }}
                >
                  确认删除
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </TabPanel>

        {/* 备选方案面板 - 支持编辑 */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              备选方案
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowAddAlternative(true)}
              size="small"
            >
              添加方案
            </Button>
          </Box>

          {problem.alternatives && problem.alternatives.length > 0 ? (
            <Box>
              {problem.alternatives.map((alternative) => (
                <Paper
                  key={alternative.id}
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-1px)'
                    }
                  }}
                  onClick={() => handleEditAlternative(alternative)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <DragIndicator
                        sx={{
                          color: 'text.secondary',
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' }
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {alternative.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingAlternative(alternative);
                      }}
                      sx={{
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.light' }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderRadius: 2
              }}
            >
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                暂无备选方案
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setShowAddAlternative(true)}
              >
                添加第一个方案
              </Button>
            </Paper>
          )}

          {/* 添加方案弹窗 */}
          <Dialog
            open={showAddAlternative}
            onClose={() => setShowAddAlternative(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                添加备选方案
              </Typography>
              <TextField
                fullWidth
                label="方案名称"
                value={newAlternativeName}
                onChange={(e) => setNewAlternativeName(e.target.value)}
                placeholder="请输入备选方案名称"
                autoFocus
                sx={{ mb: 3 }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowAddAlternative(false)}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAddAlternative}
                  disabled={!newAlternativeName.trim()}
                >
                  添加
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* 编辑方案弹窗 */}
          <Dialog
            open={!!editingAlternative}
            onClose={() => setEditingAlternative(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                编辑备选方案
              </Typography>
              <TextField
                fullWidth
                label="方案名称"
                value={editingAlternative?.name || ''}
                onChange={(e) => setEditingAlternative(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="请输入备选方案名称"
                autoFocus
                sx={{ mb: 3 }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setEditingAlternative(null)}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveAlternative}
                  disabled={!editingAlternative?.name?.trim()}
                >
                  保存
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* 删除方案确认对话框 */}
          <Dialog
            open={!!deletingAlternative}
            onClose={() => setDeletingAlternative(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                ⚠️ 确认删除
              </Typography>
              <Typography sx={{ mb: 3 }}>
                确定要删除备选方案 "{deletingAlternative?.name}" 吗？此操作不可撤销。
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setDeletingAlternative(null)}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    if (deletingAlternative) {
                      handleDeleteAlternative(deletingAlternative.id);
                      setDeletingAlternative(null);
                    }
                  }}
                >
                  确认删除
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </TabPanel>

        {/* 权重分配面板 */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            准则权重分配
          </Typography>

          {problem.criteria && problem.criteria.length > 0 ? (
            <Box>
              {/* 权重分配模式切换 */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant={!ahpMode ? "contained" : "outlined"}
                  onClick={() => setAhpMode(false)}
                  size="small"
                >
                  直接分配权重
                </Button>
                <Button
                  variant={ahpMode ? "contained" : "outlined"}
                  onClick={() => setAhpMode(true)}
                  size="small"
                >
                  AHP层次分析法
                </Button>
              </Box>

              {!ahpMode ? (
                // 直接权重分配模式
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    请为每个评价准则分配权重（0-100），总权重应为100
                  </Typography>

                  {problem.criteria.map((criterion) => (
                    <Paper
                      key={criterion.id}
                      elevation={1}
                      sx={{ p: 2, mb: 2, borderRadius: 1 }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {criterion.name}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 2 }}>
                          <Slider
                            value={weights[criterion.id] || 0}
                            onChange={(_e, newValue) => handleWeightChange(criterion.id, newValue as number)}
                            min={0}
                            max={100}
                            step={1}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                          />
                        </Box>
                        <Box sx={{ flex: 'none' }}>
                          <TextField
                            size="small"
                            value={weights[criterion.id] || 0}
                            onChange={(e) => handleWeightChange(criterion.id, Number(e.target.value))}
                            inputProps={{
                              min: 0,
                              max: 100,
                              type: 'number'
                            }}
                            sx={{ width: 80 }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                // AHP模式 - 全屏卡片式设计
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    使用1-9标度法进行两两比较，回答类似问题："准则A和准则B相比，哪个更重要？重要多少？"
                  </Typography>

                  {/* 全屏AHP比较卡片 */}
                  <Card sx={{ mb: 3, cursor: 'pointer' }} onClick={() => setAhpFullScreenMode(true)}>
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
                            {Math.round(getAhpProgress())}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            完成进度
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getAhpProgress()}
                        sx={{ mt: 2, height: 6, borderRadius: 3 }}
                      />
                    </CardContent>
                  </Card>

                  {/* 权重可视化预览 */}
                  {Object.keys(weights).length > 0 && (
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          📊 当前权重分布
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {problem.criteria.map((criterion) => (
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
                                {Math.round(weights[criterion.id] * 100)}%
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* 开始比较按钮 */}
                  <Fab
                    variant="extended"
                    color="primary"
                    onClick={initializeAhpComparison}
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

                  {/* AHP说明 */}
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                      <strong>AHP层次分析法说明：</strong> 使用1-9标度法进行两两比较，回答类似问题：
                      "{problem.criteria[0]?.name}和{problem.criteria[1]?.name}相比，哪个对我们成功更重要？重要多少？"
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* 权重状态显示 */}
              <Box sx={{ mt: 3, p: 2, bgcolor: getTotalWeight() === 100 ? 'success.light' : 'warning.light', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color={getTotalWeight() === 100 ? 'success.contrastText' : 'warning.contrastText'}>
                    总权重: {getTotalWeight()}%
                    {getTotalWeight() === 100 ? ' ✓ 权重分配完成' : ' ⚠ 请调整权重使总和为100%'}
                  </Typography>
                  {getTotalWeight() !== 100 && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={normalizeWeights}
                      sx={{
                        bgcolor: 'white',
                        color: 'warning.main',
                        '&:hover': {
                          bgcolor: 'grey.100'
                        }
                      }}
                    >
                      自动归一化
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">
              暂无评价准则，无法进行权重分配
            </Typography>
          )}
        </TabPanel>

        {/* 方案评分面板 */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            方案评分
          </Typography>

          {problem.criteria && problem.criteria.length > 0 && problem.alternatives && problem.alternatives.length > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                点击方案卡片开始评分，使用全屏界面为每个方案在各个准则下进行评分（0-100分）
              </Typography>

              {/* 方案卡片列表 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {problem.alternatives.map((alternative, index) => {
                  // 计算当前方案的完成进度
                  const scoredCriteria = problem.criteria.filter(criterion => {
                    const score = scores[criterion.id]?.[alternative.id];
                    return score !== undefined && score >= 0 && score <= 100;
                  }).length;
                  const progress = Math.round((scoredCriteria / problem.criteria.length) * 100);

                  return (
                    <Paper
                      key={alternative.id}
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: 1,
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease'
                        }
                      }}
                      onClick={() => openScoringDialog(index)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {alternative.name}
                          </Typography>

                          {/* 进度条 */}
                          <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                            <Box
                              sx={{
                                height: 8,
                                bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                                width: `${progress}%`,
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </Box>

                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            已完成: {scoredCriteria}/{problem.criteria.length} ({progress}%)
                          </Typography>
                        </Box>

                        <Box sx={{ ml: 2, textAlign: 'center' }}>
                          <Chip
                            label={progress === 100 ? '已完成' : '进行中'}
                            color={progress === 100 ? 'success' : 'primary'}
                            variant={progress === 100 ? 'filled' : 'outlined'}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              {/* 全屏评分对话框 */}
              <Dialog
                fullScreen
                open={scoringDialogOpen}
                onClose={closeScoringDialog}
                sx={{ '& .MuiDialog-paper': { bgcolor: 'background.default' } }}
              >
                {problem && problem.alternatives[currentAlternativeIndex] && (
                  <>
                    {/* 顶部工具栏 */}
                    <AppBar position="sticky" elevation={1}>
                      <Toolbar>
                        <IconButton
                          edge="start"
                          color="inherit"
                          onClick={closeScoringDialog}
                          sx={{ mr: 2 }}
                        >
                          <Close />
                        </IconButton>
                        <Typography variant="h6" sx={{ flex: 1 }}>
                          方案评分
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            color="inherit"
                            onClick={goToPrevAlternative}
                            disabled={currentAlternativeIndex === 0}
                          >
                            <NavigateBefore />
                          </IconButton>
                          <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center' }}>
                            {currentAlternativeIndex + 1}/{problem.alternatives.length}
                          </Typography>
                          <IconButton
                            color="inherit"
                            onClick={goToNextAlternative}
                            disabled={currentAlternativeIndex === problem.alternatives.length - 1}
                          >
                            <NavigateNext />
                          </IconButton>
                        </Box>
                      </Toolbar>
                    </AppBar>

                    {/* 评分内容 */}
                    <DialogContent sx={{ p: 0 }}>
                      <Box sx={{ p: 3 }}>
                        {/* 当前方案信息 */}
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {problem.alternatives[currentAlternativeIndex].name}
                          </Typography>

                          {/* 总体进度 */}
                          <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                完成进度
                              </Typography>
                              <Typography variant="body2" color="primary.main" fontWeight={600}>
                                {getCurrentAlternativeProgress()}%
                              </Typography>
                            </Box>
                            <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  height: 12,
                                  bgcolor: getCurrentAlternativeProgress() === 100 ? 'success.main' : 'primary.main',
                                  width: `${getCurrentAlternativeProgress()}%`,
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        {/* 评价准则评分 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {problem.criteria.map((criterion) => {
                            const currentAlternative = problem.alternatives[currentAlternativeIndex];
                            const currentScore = scores[criterion.id]?.[currentAlternative.id] || 0;

                            return (
                              <Paper
                                key={criterion.id}
                                elevation={2}
                                sx={{
                                  p: 3,
                                  borderRadius: 2,
                                  border: 1,
                                  borderColor: 'divider'
                                }}
                              >
                                {/* 准则信息 */}
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    {criterion.name}
                                  </Typography>
                                  {criterion.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {criterion.description}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                    <Chip
                                      label={`权重: ${weights[criterion.id] || 0}%`}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={`当前评分: ${currentScore}分`}
                                      color={currentScore > 0 ? 'primary' : 'default'}
                                      size="small"
                                      variant={currentScore > 0 ? 'filled' : 'outlined'}
                                    />
                                  </Box>
                                </Box>

                                {/* 评分进度条 */}
                                <Box>
                                  <Slider
                                    value={currentScore}
                                    onChange={(_, value) => handleScoreChange(criterion.id, currentAlternative.id, value as number)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    marks={[
                                      { value: 0, label: '0' },
                                      { value: 25, label: '25' },
                                      { value: 50, label: '50' },
                                      { value: 75, label: '75' },
                                      { value: 100, label: '100' }
                                    ]}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `${value}分`}
                                    sx={{
                                      '& .MuiSlider-markLabel': {
                                        fontSize: '0.875rem'
                                      }
                                    }}
                                  />
                                </Box>
                              </Paper>
                            );
                          })}
                        </Box>

                        {/* 底部操作按钮 */}
                        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <Button
                            variant="outlined"
                            startIcon={<NavigateBefore />}
                            onClick={goToPrevAlternative}
                            disabled={currentAlternativeIndex === 0}
                            size="large"
                          >
                            上一个方案
                          </Button>
                          <Button
                            variant="contained"
                            endIcon={<NavigateNext />}
                            onClick={goToNextAlternative}
                            disabled={currentAlternativeIndex === problem.alternatives.length - 1}
                            size="large"
                          >
                            下一个方案
                          </Button>
                        </Box>
                      </Box>
                    </DialogContent>
                  </>
                )}
              </Dialog>
            </Box>
          ) : (
            <Typography color="text.secondary">
              需要先设置评价准则和备选方案才能进行评分
            </Typography>
          )}
        </TabPanel>

        {/* 结果分析面板 - 惊艳版 */}
        <TabPanel value={activeTab} index={4}>
          {getTotalWeight() === 100 ? (
            <Box>
              {calculateWeightedScores().length > 0 ? (
                <Box>
                  {/* Hero推荐区域 */}
                  <Box
                    sx={{
                      position: 'relative',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 3,
                      p: 4,
                      mb: 4,
                      color: 'white',
                      overflow: 'hidden',
                      animation: 'fadeInUp 0.8s ease-out',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                        borderRadius: '50%',
                        animation: 'pulse 3s ease-in-out infinite'
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 150,
                        height: 150,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)',
                        borderRadius: '50%'
                      }
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      🏆 推荐方案
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                      {calculateWeightedScores()[0]?.alternative.name}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
                      综合得分：{calculateWeightedScores()[0]?.totalScore.toFixed(2)} 分
                    </Typography>

                    {/* 优势分析 */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {problem.criteria.slice(0, 3).map((criterion) => {
                        const score = scores[criterion.id]?.[calculateWeightedScores()[0]?.alternative.id] || 0;
                        const weight = weights[criterion.id] || 0;
                        const contribution = (score * weight / 100).toFixed(1);
                        return (
                          <Box
                            key={criterion.id}
                            sx={{
                              background: 'rgba(255,255,255,0.2)',
                              borderRadius: 2,
                              p: 2,
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {criterion.name}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              +{contribution}分
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* 雷达图 - 多维度对比 */}
                  {problem.criteria.length >= 3 && (
                    <Card
                      sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 3,
                        animation: 'fadeInUp 0.8s ease-out 0.2s both',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: '#2c3e50' }}>
                        🎯 多维度对比雷达图
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={generateRadarChartData()}>
                            <PolarGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                            <PolarAngleAxis
                              dataKey="criterion"
                              tick={{ fontSize: 12, fontWeight: 600, fill: '#2c3e50' }}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 100]}
                              tick={{ fontSize: 10, fill: '#6c757d' }}
                            />
                            <Radar
                              name="🥇 第一名"
                              dataKey="方案1"
                              stroke="#ff6b6b"
                              fill="#ff6b6b"
                              fillOpacity={0.7}
                              strokeWidth={2}
                            />
                            <Radar
                              name="🥈 第二名"
                              dataKey="方案2"
                              stroke="#4ecdc4"
                              fill="#4ecdc4"
                              fillOpacity={0.7}
                              strokeWidth={2}
                            />
                            <Radar
                              name="🥉 第三名"
                              dataKey="方案3"
                              stroke="#45b7d1"
                              fill="#45b7d1"
                              fillOpacity={0.7}
                              strokeWidth={2}
                            />
                            <Legend
                              wrapperStyle={{
                                paddingTop: 20,
                                fontSize: '14px',
                                fontWeight: 600
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                        展示前3名方案在各评价准则下的表现对比
                      </Typography>
                    </Card>
                  )}

                  {/* 动态排名卡片 */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
                      📊 方案排名
                    </Typography>
                    {calculateWeightedScores().map((result, index) => (
                      <Card
                        key={result.alternative.id}
                        sx={{
                          p: 3,
                          mb: 2,
                          borderRadius: 3,
                          background: index === 0
                            ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                            : index === 1
                            ? 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)'
                            : index === 2
                            ? 'linear-gradient(135deg, #cd7f32 0%, #e9a66c 100%)'
                            : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                          border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                          transform: index === 0 ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {/* 排名徽章 */}
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: '50%',
                              background: index === 0
                                ? 'radial-gradient(circle, #ffd700 0%, #ffa500 100%)'
                                : index === 1
                                ? 'radial-gradient(circle, #c0c0c0 0%, #a0a0a0 100%)'
                                : index === 2
                                ? 'radial-gradient(circle, #cd7f32 0%, #a56a2a 100%)'
                                : 'radial-gradient(circle, #6c757d 0%, #495057 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 900,
                              fontSize: '1.5rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          >
                            {index + 1}
                          </Box>

                          {/* 方案信息 */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                              {result.alternative.name}
                            </Typography>
                            <Typography variant="h4" sx={{
                              fontWeight: 800,
                              color: index === 0 ? '#d4af37' : 'primary.main',
                              textShadow: index === 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                            }}>
                              {result.totalScore.toFixed(2)} 分
                            </Typography>
                          </Box>

                          {/* 排名标签 */}
                          <Box>
                            {index === 0 && (
                              <Chip
                                label="🥇 最佳方案"
                                sx={{
                                  background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.9rem'
                                }}
                              />
                            )}
                            {index === 1 && (
                              <Chip
                                label="🥈 次优方案"
                                sx={{
                                  background: 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)',
                                  color: 'white',
                                  fontWeight: 700
                                }}
                              />
                            )}
                            {index === 2 && (
                              <Chip
                                label="🥉 第三方案"
                                sx={{
                                  background: 'linear-gradient(135deg, #cd7f32 0%, #a56a2a 100%)',
                                  color: 'white',
                                  fontWeight: 700
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>

                  {/* 权重分布热力图 */}
                  <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
                      🔥 权重分布热力图
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                      {problem.criteria.map((criterion) => {
                        const weight = weights[criterion.id] || 0;
                        const intensity = Math.min(100, weight * 2); // 增强视觉效果
                        return (
                          <Box
                            key={criterion.id}
                            sx={{
                              flex: '1 1 calc(25% - 16px)',
                              minWidth: 120,
                              textAlign: 'center',
                              p: 2,
                              borderRadius: 2,
                              background: `linear-gradient(135deg,
                                hsl(210, 100%, ${70 - intensity/3}%) 0%,
                                hsl(210, 100%, ${50 - intensity/4}%) 100%)`,
                              color: 'white',
                              fontWeight: 600,
                              boxShadow: `0 4px 15px hsla(210, 100%, ${intensity/4}%, 0.3)`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: `0 6px 20px hsla(210, 100%, ${intensity/4}%, 0.4)`
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                              {criterion.name}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                              {weight}%
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Card>

                  {/* 得分分布气泡图 */}
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
                      💫 得分分布气泡图
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                      {calculateWeightedScores().map((result, index) => {
                        const size = Math.max(80, 120 - index * 15); // 根据排名调整大小
                        return (
                          <Box
                            key={result.alternative.id}
                            sx={{
                              position: 'relative',
                              width: size,
                              height: size,
                              borderRadius: '50%',
                              background: `radial-gradient(circle at 30% 30%,
                                ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#6c757d'} 0%,
                                ${index === 0 ? '#ffa500' : index === 1 ? '#a0a0a0' : index === 2 ? '#a56a2a' : '#495057'} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: Math.max(12, 16 - index * 2),
                              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: '0 12px 35px rgba(0,0,0,0.3)'
                              }
                            }}
                          >
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800 }}>
                                {result.alternative.name}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                                {result.totalScore.toFixed(1)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Card>
                </Box>
              ) : (
                <Alert severity="info">
                  请先完成方案评分
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="warning">
              请先完成权重分配（总权重应为100%）
            </Alert>
          )}
        </TabPanel>
      </Paper>

      {/* 全屏AHP比较对话框 */}
      <Dialog
        fullScreen
        open={ahpFullScreenMode}
        onClose={() => setAhpFullScreenMode(false)}
      >
        <AppBar position="sticky">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setAhpFullScreenMode(false)}>
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
              准则重要性比较
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {Math.round(getAhpProgress())}%
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {currentAhpComparison && (
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* 进度条 */}
            <Box sx={{ px: 2, py: 1 }}>
              <LinearProgress
                variant="determinate"
                value={getAhpProgress()}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            {/* 当前选择状态 */}
            <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body1" align="center" color="primary.main" fontWeight="bold">
                {getCurrentSelectionText(ahpMatrix[currentAhpComparison.criterion1]?.[currentAhpComparison.criterion2] || 1)}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                {getImportanceText(ahpMatrix[currentAhpComparison.criterion1]?.[currentAhpComparison.criterion2] || 1)}
              </Typography>
            </Box>

            {/* 比较界面 */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 2 }}>
              {/* 上方准则 */}
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'primary.light',
                  color: 'white',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  transform: `scale(${getCardScale(ahpMatrix[currentAhpComparison.criterion1]?.[currentAhpComparison.criterion2] || 1, 'left')})`,
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {problem?.criteria.find(c => c.id === currentAhpComparison.criterion1)?.name}
                </Typography>
              </Box>

              {/* 滑动条区域 */}
              <Box sx={{ px: 2, py: 3 }}>
                {/* 双色滑动条 */}
                <Slider
                  value={ahpValueToSliderValue(ahpMatrix[currentAhpComparison.criterion1]?.[currentAhpComparison.criterion2] || 1)}
                  onChange={handleSliderChange}
                  min={-100}
                  max={100}
                  step={1}
                  sx={{
                    color: 'transparent',
                    height: 8,
                    // '& .MuiSlider-track': {
                    //   background: 'linear-gradient(90deg, #4CAF50 0%, #4CAF50 50%, #2196F3 50%, #2196F3 100%)',
                    //   border: 'none',
                    // },
                    '& .MuiSlider-rail': {
                      background: 'linear-gradient(90deg, #4CAF50 0%, #4CAF50 50%, #2196F3 50%, #2196F3 100%)',
                      opacity: 0.9,
                    },
                    '& .MuiSlider-thumb': {
                      height: 24,
                      width: 24,
                      backgroundColor: '#fff',
                      border: '2px solid currentColor',
                      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                        boxShadow: 'inherit',
                      },
                    },
                  }}
                />

                {/* 滑动条标签 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    {problem?.criteria.find(c => c.id === currentAhpComparison.criterion2)?.name}更重要
                  </Typography>
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    {problem?.criteria.find(c => c.id === currentAhpComparison.criterion1)?.name}更重要
                  </Typography>
                </Box>
              </Box>

              {/* 下方准则 */}
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'secondary.light',
                  color: 'white',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  transform: `scale(${getCardScale(ahpMatrix[currentAhpComparison.criterion1]?.[currentAhpComparison.criterion2] || 1, 'right')})`,
                  mt: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {problem?.criteria.find(c => c.id === currentAhpComparison.criterion2)?.name}
                </Typography>
              </Box>
            </Box>

            {/* 底部导航 */}
            <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
              <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleAhpComparisonChange(1)}
                  startIcon={<NavigateBefore />}
                >
                  重置为同等重要
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleNextAhpComparison}
                  endIcon={<NavigateNext />}
                >
                  {getNextAhpComparison() ? '继续比较' : '完成比较'}
                </Button>
            </Box>
          </Box>
          )}
        </Dialog>
      </Box>
    );
  };