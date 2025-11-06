import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import { Add, Delete, ExpandMore, ExpandLess } from '@mui/icons-material';
import type { DecisionProblem, Criterion, Alternative } from '../types';
import { apiClient } from '../utils/api';

interface ProblemDefinitionProps {
  onProblemDefined: (problem: DecisionProblem) => void;
  onError: (error: string) => void;
}

export const ProblemDefinition: React.FC<ProblemDefinitionProps> = ({
  onProblemDefined,
  onError
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', name: '', description: '' }
  ]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([
    { id: '1', name: '', description: '', scores: [] }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addCriterion = () => {
    if (criteria.length >= 8) {
      onError('最多只能添加8个评价准则');
      return;
    }
    setCriteria([
      ...criteria,
      { id: Date.now().toString(), name: '', description: '' }
    ]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) {
      onError('至少需要一个评价准则');
      return;
    }
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, field: keyof Criterion, value: string) => {
    setCriteria(criteria.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const addAlternative = () => {
    if (alternatives.length >= 20) {
      onError('最多只能添加20个备选方案');
      return;
    }
    setAlternatives([
      ...alternatives,
      {
        id: Date.now().toString(),
        name: '',
        description: '',
        scores: new Array(criteria.length).fill(0)
      }
    ]);
  };

  const removeAlternative = (id: string) => {
    if (alternatives.length <= 1) {
      onError('至少需要一个备选方案');
      return;
    }
    setAlternatives(alternatives.filter(a => a.id !== id));
  };

  const updateAlternative = (id: string, field: keyof Alternative, value: string) => {
    setAlternatives(alternatives.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleSubmit = async () => {
    // 验证输入
    if (!title.trim()) {
      onError('请输入决策问题标题');
      return;
    }

    const invalidCriteria = criteria.filter(c => !c.name.trim());
    if (invalidCriteria.length > 0) {
      onError('请填写所有评价准则的名称');
      return;
    }

    const invalidAlternatives = alternatives.filter(a => !a.name.trim());
    if (invalidAlternatives.length > 0) {
      onError('请填写所有备选方案的名称');
      return;
    }

    setIsLoading(true);

    try {
      // 准备数据
      const problemData = {
        title: title.trim(),
        description: description.trim(),
        criteria: criteria.map(c => ({
          name: c.name.trim(),
          description: c.description?.trim() || ''
        })),
        alternatives: alternatives.map(a => ({
          name: a.name.trim(),
          description: a.description?.trim() || '',
          scores: new Array(criteria.length).fill(0)
        }))
      };

      // 调用API保存到数据库
      const response = await apiClient.createDecisionProblem(problemData);

      if (response.success && response.data) {
        onProblemDefined(response.data);
      } else {
        onError(response.message || '创建决策问题失败');
      }
    } catch (error) {
      console.error('Error creating decision problem:', error);
      onError('创建决策问题失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* App页面标题 - 移除边框和左右内边距 */}
      <Box sx={{
        py: 2,
        px: 0,
        bgcolor: 'background.paper'
      }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'text.primary',
            px: 2
          }}
        >
          定义决策问题
        </Typography>
      </Box>

      {/* 滚动内容区域 - 移除边框和间隙 */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 问题基本信息 - 移除边框和标题，减少左右内边距 */}
        <Box sx={{ py: 1, px: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="决策问题标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：选择最优的运筹学作业课题"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
            <TextField
              fullWidth
              label="问题描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述您的决策问题..."
              multiline
              rows={2}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
          </Box>
        </Box>

        {/* 评价准则 - 移除边框和背景，减少左右内边距 */}
        <Box sx={{ py: 1, px: 2 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              评价准则 ({criteria.length}/8)
            </Typography>
            <Button
              startIcon={<Add />}
              onClick={addCriterion}
              variant="outlined"
              size="small"
              disabled={criteria.length >= 8}
              sx={{
                borderRadius: 1,
                minWidth: 'auto'
              }}
            >
              添加
            </Button>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            请定义用于评价备选方案的准则
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {criteria.map((criterion, index) => (
              <Box
                key={criterion.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <TextField
                    fullWidth
                    label={`准则 ${index + 1} 名称`}
                    value={criterion.name}
                    onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                    placeholder="例如：数据可得性"
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="描述（可选）"
                    value={criterion.description}
                    onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                    placeholder="详细描述此准则..."
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => removeCriterion(criterion.id)}
                  color="error"
                  disabled={criteria.length <= 1}
                  size="small"
                  sx={{
                    mt: 0.5,
                    flexShrink: 0
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>

        {/* 备选方案 - 移除边框和背景，减少左右内边距 */}
        <Box sx={{ py: 1, px: 2 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              备选方案 ({alternatives.length}/20)
            </Typography>
            <Button
              startIcon={<Add />}
              onClick={addAlternative}
              variant="outlined"
              size="small"
              disabled={alternatives.length >= 20}
              sx={{
                borderRadius: 1,
                minWidth: 'auto'
              }}
            >
              添加
            </Button>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            请列出所有可供选择的方案
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {alternatives.map((alternative, index) => (
              <Box
                key={alternative.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <TextField
                    fullWidth
                    label={`方案 ${index + 1} 名称`}
                    value={alternative.name}
                    onChange={(e) => updateAlternative(alternative.id, 'name', e.target.value)}
                    placeholder="例如：共享单车调度优化"
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="描述（可选）"
                    value={alternative.description}
                    onChange={(e) => updateAlternative(alternative.id, 'description', e.target.value)}
                    placeholder="详细描述此方案..."
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => removeAlternative(alternative.id)}
                  color="error"
                  disabled={alternatives.length <= 1}
                  size="small"
                  sx={{
                    mt: 0.5,
                    flexShrink: 0
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* App底部操作栏 - 移除边框和左右内边距 */}
      <Box sx={{
        py: 2,
        px: 0,
        bgcolor: 'background.paper'
      }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={isLoading || !title.trim() || criteria.some(c => !c.name.trim()) || alternatives.some(a => !a.name.trim())}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
          sx={{
            height: '48px',
            borderRadius: 1,
            fontSize: '1rem',
            fontWeight: 600,
            mx: 2
          }}
        >
          {isLoading ? '保存中...' : '确认并继续'}
        </Button>
      </Box>
    </Box>
  );
};