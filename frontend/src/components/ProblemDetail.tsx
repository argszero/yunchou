import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  TextField,
  Slider,
  Chip,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import { ArrowBack, Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import type { DecisionProblem } from '../types';
import { apiClient } from '../utils/api';

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
        <Box sx={{ p: 3 }}>
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

  useEffect(() => {
    if (id) {
      loadProblem(id);
    }
  }, [id]);

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 权重分配处理
  const handleWeightChange = (criterionId: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [criterionId]: value
    }));
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

  // AHP相关函数
  const handleAhpComparisonChange = (criterion1Id: string, criterion2Id: string, value: number) => {
    setAhpMatrix(prev => ({
      ...prev,
      [criterion1Id]: {
        ...prev[criterion1Id],
        [criterion2Id]: value
      }
    }));

    // 自动设置对称值
    if (criterion1Id !== criterion2Id) {
      setAhpMatrix(prev => ({
        ...prev,
        [criterion2Id]: {
          ...prev[criterion2Id],
          [criterion1Id]: 1 / value
        }
      }));
    }
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
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 返回按钮 */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{ alignSelf: 'flex-start', mb: 3 }}
      >
        返回
      </Button>

      {/* 问题标题 */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        {problem.title}
      </Typography>

      {/* 标签页 */}
      <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Tab label="评价准则" />
          <Tab label="备选方案" />
          <Tab label="权重分配" />
          <Tab label="方案评分" />
          <Tab label="结果分析" />
        </Tabs>

        {/* 评价准则面板 */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            评价准则
          </Typography>
          {problem.criteria && problem.criteria.length > 0 ? (
            <Box>
              {problem.criteria.map((criterion) => (
                <Paper
                  key={criterion.id}
                  elevation={1}
                  sx={{ p: 2, mb: 1, borderRadius: 1 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {criterion.name}
                  </Typography>
                  {criterion.description && (
                    <Typography variant="body2" color="text.secondary">
                      {criterion.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              暂无评价准则
            </Typography>
          )}
        </TabPanel>

        {/* 备选方案面板 */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            备选方案
          </Typography>
          {problem.alternatives && problem.alternatives.length > 0 ? (
            <Box>
              {problem.alternatives.map((alternative) => (
                <Paper
                  key={alternative.id}
                  elevation={1}
                  sx={{ p: 2, mb: 1, borderRadius: 1 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {alternative.name}
                  </Typography>
                  {alternative.description && (
                    <Typography variant="body2" color="text.secondary">
                      {alternative.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              暂无备选方案
            </Typography>
          )}
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
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary">
                              {criterion.description}
                            </Typography>
                          )}
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
                // AHP模式
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    使用1-9标度法进行两两比较，回答类似问题："准则A和准则B相比，哪个更重要？重要多少？"
                  </Typography>

                  <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                      两两比较矩阵
                    </Typography>

                    {/* AHP比较表格 */}
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}></th>
                            {problem.criteria.map((criterion) => (
                              <th key={criterion.id} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
                                {criterion.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {problem.criteria.map((criterion1, i) => (
                            <tr key={criterion1.id}>
                              <td style={{ padding: '8px', fontWeight: 500, borderBottom: '1px solid #e0e0e0' }}>
                                {criterion1.name}
                              </td>
                              {problem.criteria.map((criterion2, j) => (
                                <td key={criterion2.id} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
                                  {i === j ? (
                                    <Typography variant="body2" color="text.secondary">
                                      1
                                    </Typography>
                                  ) : (
                                    <Select
                                      size="small"
                                      value={ahpMatrix[criterion1.id]?.[criterion2.id] || 1}
                                      onChange={(e) => handleAhpComparisonChange(criterion1.id, criterion2.id, Number(e.target.value))}
                                      sx={{ minWidth: 80 }}
                                    >
                                      <MenuItem value={9}>9 (极重要)</MenuItem>
                                      <MenuItem value={8}>8</MenuItem>
                                      <MenuItem value={7}>7 (很重要)</MenuItem>
                                      <MenuItem value={6}>6</MenuItem>
                                      <MenuItem value={5}>5 (重要)</MenuItem>
                                      <MenuItem value={4}>4</MenuItem>
                                      <MenuItem value={3}>3 (稍重要)</MenuItem>
                                      <MenuItem value={2}>2</MenuItem>
                                      <MenuItem value={1}>1 (同等重要)</MenuItem>
                                      <MenuItem value={1/2}>1/2</MenuItem>
                                      <MenuItem value={1/3}>1/3 (稍不重要)</MenuItem>
                                      <MenuItem value={1/4}>1/4</MenuItem>
                                      <MenuItem value={1/5}>1/5 (不重要)</MenuItem>
                                      <MenuItem value={1/6}>1/6</MenuItem>
                                      <MenuItem value={1/7}>1/7 (很不重要)</MenuItem>
                                      <MenuItem value={1/8}>1/8</MenuItem>
                                      <MenuItem value={1/9}>1/9 (极不重要)</MenuItem>
                                    </Select>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={calculateAhpWeights}
                        size="large"
                      >
                        计算AHP权重
                      </Button>
                    </Box>
                  </Paper>

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
                <Typography variant="body2" color={getTotalWeight() === 100 ? 'success.contrastText' : 'warning.contrastText'}>
                  总权重: {getTotalWeight()}%
                  {getTotalWeight() === 100 ? ' ✓ 权重分配完成' : ' ⚠ 请调整权重使总和为100%'}
                </Typography>
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
                          {alternative.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {alternative.description}
                            </Typography>
                          )}

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
                          {problem.alternatives[currentAlternativeIndex].description && (
                            <Typography variant="h6" color="text.secondary">
                              {problem.alternatives[currentAlternativeIndex].description}
                            </Typography>
                          )}

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

        {/* 结果分析面板 */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            结果分析
          </Typography>

          {getTotalWeight() === 100 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                基于您设置的权重和评分，以下是各方案的加权得分排名
              </Typography>

              {calculateWeightedScores().length > 0 ? (
                <Box>
                  {calculateWeightedScores().map((result, index) => (
                    <Paper
                      key={result.alternative.id}
                      elevation={1}
                      sx={{
                        p: 3,
                        mb: 2,
                        borderRadius: 1,
                        borderLeft: index === 0 ? 4 : 0,
                        borderColor: index === 0 ? 'success.main' : 'transparent'
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Box sx={{ flex: 'none' }}>
                          <Chip
                            label={`第${index + 1}名`}
                            color={index === 0 ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                        <Box sx={{ flex: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {result.alternative.name}
                          </Typography>
                          {result.alternative.description && (
                            <Typography variant="body2" color="text.secondary">
                              {result.alternative.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' } }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            {result.totalScore.toFixed(2)} 分
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 'none' }}>
                          {index === 0 && (
                            <Chip
                              label="推荐方案"
                              color="success"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}

                  {/* 详细得分分析 */}
                  <Paper elevation={1} sx={{ p: 3, mt: 3, borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      详细得分分析
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {problem.criteria.map((criterion) => (
                        <Box
                          key={criterion.id}
                          sx={{
                            flex: '1 1 calc(33.333% - 16px)',
                            minWidth: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 16px)' }
                          }}
                        >
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 1 }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {criterion.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              权重: {weights[criterion.id] || 0}%
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  请先完成方案评分
                </Typography>
              )}
            </Box>
          ) : (
            <Alert severity="warning">
              请先完成权重分配（总权重应为100%）
            </Alert>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};