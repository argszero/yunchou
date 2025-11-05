import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  Grid,
  Alert
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { DecisionProblem, Criterion, Alternative } from '../types';

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

  const handleSubmit = () => {
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

    // 创建决策问题
    const problem: DecisionProblem = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      criteria: criteria.map(c => ({
        ...c,
        name: c.name.trim(),
        description: c.description?.trim() || ''
      })),
      alternatives: alternatives.map(a => ({
        ...a,
        name: a.name.trim(),
        description: a.description?.trim() || '',
        scores: new Array(criteria.length).fill(0)
      })),
      weights: new Array(criteria.length).fill(0),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onProblemDefined(problem);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        定义决策问题
      </Typography>

      {/* 问题基本信息 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            问题基本信息
          </Typography>
          <TextField
            fullWidth
            label="决策问题标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：选择最优的运筹学作业课题"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="问题描述（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细描述您的决策问题..."
            multiline
            rows={3}
          />
        </CardContent>
      </Card>

      {/* 评价准则 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              评价准则 ({criteria.length}/8)
            </Typography>
            <Button
              startIcon={<Add />}
              onClick={addCriterion}
              variant="outlined"
              size="small"
              disabled={criteria.length >= 8}
            >
              添加准则
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            请定义用于评价备选方案的准则。例如：数据可得性、模型复杂度、成果惊艳度等。
          </Alert>

          {criteria.map((criterion, index) => (
            <Box key={criterion.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid component="div" sx={{ width: { xs: '100%', sm: '40%' } }}>
                  <TextField
                    fullWidth
                    label={`准则 ${index + 1} 名称`}
                    value={criterion.name}
                    onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                    placeholder="例如：数据可得性"
                    required
                  />
                </Grid>
                <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <TextField
                    fullWidth
                    label="描述（可选）"
                    value={criterion.description}
                    onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                    placeholder="详细描述此准则..."
                  />
                </Grid>
                <Grid component="div" sx={{ width: { xs: '100%', sm: '10%' } }}>
                  <IconButton
                    onClick={() => removeCriterion(criterion.id)}
                    color="error"
                    disabled={criteria.length <= 1}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* 备选方案 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              备选方案 ({alternatives.length}/20)
            </Typography>
            <Button
              startIcon={<Add />}
              onClick={addAlternative}
              variant="outlined"
              size="small"
              disabled={alternatives.length >= 20}
            >
              添加方案
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            请列出所有可供选择的方案。例如：共享单车调度优化、地铁时刻表优化等。
          </Alert>

          {alternatives.map((alternative, index) => (
            <Box key={alternative.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid component="div" sx={{ width: { xs: '100%', sm: '40%' } }}>
                  <TextField
                    fullWidth
                    label={`方案 ${index + 1} 名称`}
                    value={alternative.name}
                    onChange={(e) => updateAlternative(alternative.id, 'name', e.target.value)}
                    placeholder="例如：共享单车调度优化"
                    required
                  />
                </Grid>
                <Grid component="div" sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <TextField
                    fullWidth
                    label="描述（可选）"
                    value={alternative.description}
                    onChange={(e) => updateAlternative(alternative.id, 'description', e.target.value)}
                    placeholder="详细描述此方案..."
                  />
                </Grid>
                <Grid component="div" sx={{ width: { xs: '100%', sm: '10%' } }}>
                  <IconButton
                    onClick={() => removeAlternative(alternative.id)}
                    color="error"
                    disabled={alternatives.length <= 1}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!title.trim() || criteria.some(c => !c.name.trim()) || alternatives.some(a => !a.name.trim())}
        >
          确认并继续
        </Button>
      </Box>
    </Box>
  );
};