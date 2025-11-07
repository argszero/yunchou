import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Slider,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import { ExpandMore, ExpandLess, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import type { Criterion, Alternative } from '../types';

interface AlternativeScoringProps {
  criteria: Criterion[];
  alternatives: Alternative[];
  onScoresUpdated: (alternatives: Alternative[]) => void;
  onError: (error: string) => void;
}

export const AlternativeScoring: React.FC<AlternativeScoringProps> = ({
  criteria,
  alternatives,
  onScoresUpdated,
  onError
}) => {
  const [scores, setScores] = useState<number[][]>(
    alternatives.map(alt => [...alt.scores])
  );
  const [expandedAlternative, setExpandedAlternative] = useState<number | null>(null);

  const handleScoreChange = (alternativeIndex: number, criterionIndex: number, value: number) => {
    const newScores = [...scores];
    newScores[alternativeIndex] = [...newScores[alternativeIndex]];
    newScores[alternativeIndex][criterionIndex] = value;
    setScores(newScores);
  };

  const handleAlternativeClick = (index: number) => {
    setExpandedAlternative(expandedAlternative === index ? null : index);
  };

  const handleSubmit = () => {
    // 检查是否所有评分都已填写
    const isComplete = scores.every(row =>
      row.every(score => score >= 1 && score <= 5)
    );

    if (!isComplete) {
      onError('请为所有方案和准则填写评分（1-5分）');
      return;
    }

    // 更新备选方案的评分
    const updatedAlternatives = alternatives.map((alt, index) => ({
      ...alt,
      scores: scores[index]
    }));

    onScoresUpdated(updatedAlternatives);
  };

  const getScoreDescription = (score: number): string => {
    switch (score) {
      case 1: return '很差';
      case 2: return '较差';
      case 3: return '一般';
      case 4: return '良好';
      case 5: return '优秀';
      default: return '未评分';
    }
  };

  const getScoreColor = (score: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (score) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      case 4: return 'primary';
      case 5: return 'success';
      default: return 'default';
    }
  };

  const isComplete = scores.every(row =>
    row.every(score => score >= 1 && score <= 5)
  );

  return (
    <Box sx={{ pb: { xs: 2, sm: 0 } }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
        方案评分1
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        点击方案名称展开评分，使用进度条为每个评价准则评分（1-5分）。
        1分表示最差，5分表示最优。
      </Alert>

      {/* 评分说明 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            评分标准说明
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 1
          }}>
            <Chip label="1分: 很差" color="error" variant="outlined" size="small" />
            <Chip label="2分: 较差" color="warning" variant="outlined" size="small" />
            <Chip label="3分: 一般" color="info" variant="outlined" size="small" />
            <Chip label="4分: 良好" color="primary" variant="outlined" size="small" />
            <Chip label="5分: 优秀" color="success" variant="outlined" size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* 方案列表 - 点击展开评分 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {alternatives.map((alternative, altIndex) => {
          const isExpanded = expandedAlternative === altIndex;
          const completedCount = scores[altIndex].filter(score => score >= 1 && score <= 5).length;
          const isFullyScored = completedCount === criteria.length;

          return (
            <Card key={alternative.id} sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: { xs: 2, sm: 3 },
              bgcolor: isExpanded ? 'action.hover' : 'background.paper'
            }}>
              {/* 方案标题 - 可点击区域 */}
              <Box
                sx={{
                  p: { xs: 2, sm: 3 },
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleAlternativeClick(altIndex)}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {isFullyScored ? (
                      <CheckCircle color="success" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    ) : (
                      <RadioButtonUnchecked color="disabled" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    )}
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        fontWeight: 'bold',
                        color: isFullyScored ? 'success.main' : 'text.primary'
                      }}
                    >
                      {alternative.name}
                    </Typography>
                  </Box>
                  {alternative.description && (
                    <Typography variant="body2" color="text.secondary">
                      {alternative.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    已完成: {completedCount}/{criteria.length}
                  </Typography>
                </Box>
                <IconButton size="small">
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              {/* 评分区域 - 展开后显示 */}
              <Collapse in={isExpanded}>
                <Divider />
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    为"{alternative.name}"评分
                  </Typography>

                  {/* 评价准则评分列表 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {criteria.map((criterion, critIndex) => {
                      const currentScore = scores[altIndex][critIndex];
                      const isScored = currentScore >= 1 && currentScore <= 5;

                      return (
                        <Box
                          key={criterion.id}
                          sx={{
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: isScored ? 'success.light' : 'background.paper'
                          }}
                        >
                          {/* 准则信息 */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body1" fontWeight="bold" gutterBottom>
                              {criterion.name}
                            </Typography>
                            {criterion.description && (
                              <Typography variant="body2" color="text.secondary">
                                {criterion.description}
                              </Typography>
                            )}
                          </Box>

                          {/* 进度条评分 */}
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                当前评分:
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="h6"
                                  color={isScored ? 'primary.main' : 'text.secondary'}
                                  fontWeight="bold"
                                >
                                  {isScored ? currentScore : '未评分'}
                                </Typography>
                                {isScored && (
                                  <Chip
                                    label={getScoreDescription(currentScore)}
                                    color={getScoreColor(currentScore)}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>

                            <Slider
                              value={isScored ? currentScore : 0}
                              onChange={(_, value) => handleScoreChange(altIndex, critIndex, value as number)}
                              min={1}
                              max={5}
                              step={1}
                              marks={[
                                { value: 1, label: '1' },
                                { value: 2, label: '2' },
                                { value: 3, label: '3' },
                                { value: 4, label: '4' },
                                { value: 5, label: '5' }
                              ]}
                              valueLabelDisplay="auto"
                              sx={{
                                '& .MuiSlider-markLabel': {
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Collapse>
            </Card>
          );
        })}
      </Box>

      {/* 完成状态提示 */}
      {isComplete ? (
        <Alert severity="success" sx={{ mt: 3, mb: 2 }}>
          所有评分已完成！请点击下方按钮继续。
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mt: 3, mb: 2 }}>
          请完成所有评分（1-5分）后再继续。
        </Alert>
      )}

      {/* 提交按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!isComplete}
          sx={{
            minWidth: { xs: '100%', sm: 'auto' },
            minHeight: { xs: '48px', sm: '56px' }
          }}
        >
          确认评分并计算排名
        </Button>
      </Box>

      {/* 评分统计 */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            评分统计
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto' },
            gap: 2,
            justifyContent: { xs: 'stretch', sm: 'flex-start' }
          }}>
            <Chip
              label={`已完成: ${scores.flat().filter(score => score >= 1 && score <= 5).length}/${scores.flat().length}`}
              color={isComplete ? 'success' : 'default'}
              variant={isComplete ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip
              label={`待完成: ${scores.flat().filter(score => score < 1 || score > 5).length}`}
              color="warning"
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};