import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { DecisionProblem } from '../types';
import { apiClient } from '../utils/api';

export const ProblemCreation: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('请输入决策问题标题');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 调用API创建问题并自动生成准则和方案
      const problem: DecisionProblem = await apiClient.post('/problems', {
        title: title.trim()
      });

      // 跳转到问题详情页
      navigate(`/problem/${problem.id}`);
    } catch (err) {
      setError('创建问题失败，请稍后重试');
      console.error('Failed to create problem:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* 创建表单 */}
      <Box sx={{ maxWidth: 500, mx: 'auto', width: '100%' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          创建决策问题
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          输入您的决策问题，系统将自动生成评价准则和备选方案
        </Typography>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 问题输入 */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: 'background.default',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            mb: 3
          }}
        >
          <TextField
            fullWidth
            label="决策问题标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：选择最优的运筹学作业课题"
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
            inputProps={{
              maxLength: 100
            }}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {title.length}/100
          </Typography>
        </Paper>

        {/* 创建按钮 */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleCreate}
          disabled={isLoading || !title.trim()}
          size="large"
          sx={{
            borderRadius: 2,
            height: '48px',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              正在创建...
            </>
          ) : (
            '创建并自动生成内容'
          )}
        </Button>

        {/* 提示信息 */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
          <Typography variant="body2" color="secondary.contrastText">
            💡 系统将自动调用AI为您生成：
          </Typography>
          <Typography variant="body2" color="secondary.contrastText" sx={{ mt: 1 }}>
            • 3-5个相关评价准则
          </Typography>
          <Typography variant="body2" color="secondary.contrastText">
            • 5-8个备选方案
          </Typography>
          <Typography variant="body2" color="secondary.contrastText" sx={{ mt: 1, fontSize: '0.75rem' }}>
            创建后您可以随时调整生成的内容
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};