import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Fab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { Add, Edit, Visibility, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { DecisionProblem } from '../types';
import { apiClient } from '../utils/api';

interface HomePageProps {
  onCreateProblem?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onCreateProblem }) => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<DecisionProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<DecisionProblem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setIsLoading(true);
      const problems = await apiClient.getProblems();
      setProblems(problems);
    } catch (err) {
      setError('加载问题列表失败');
      console.error('Failed to load problems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProblem = () => {
    if (onCreateProblem) {
      onCreateProblem();
    } else {
      navigate('/create');
    }
  };

  const handleViewProblem = (problemId: string) => {
    navigate(`/problem/${problemId}`);
  };

  const handleEditProblem = (problemId: string) => {
    navigate(`/problem/${problemId}/edit`);
  };

  const handleDeleteClick = (problem: DecisionProblem) => {
    setProblemToDelete(problem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!problemToDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/problems/${problemToDelete.id}`);

      // 从列表中移除已删除的问题
      setProblems(problems.filter(p => p.id !== problemToDelete.id));
      setDeleteDialogOpen(false);
      setProblemToDelete(null);
    } catch (err) {
      console.error('Failed to delete problem:', err);
      setError('删除决策问题失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProblemToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      default:
        return '草稿';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 顶部标题和创建按钮 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            我的决策问题
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateProblem}
            sx={{ borderRadius: 2 }}
          >
            创建问题
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          管理您的决策问题和参与的分析
        </Typography>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 问题列表 */}
      {problems.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            py: 8
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            还没有决策问题
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            创建一个新的决策问题开始分析
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateProblem}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            创建第一个问题
          </Button>
        </Box>
      ) : (
        <List sx={{ flex: 1 }}>
          {problems.map((problem) => (
            <ListItem
              key={problem.id}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {problem.title}
                    </Typography>
                    <Chip
                      label={getStatusText((problem as any).status || 'draft')}
                      color={getStatusColor((problem as any).status || 'draft') as any}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      创建时间: {new Date(problem.createdAt).toLocaleDateString()}
                    </Typography>
                    {problem.criteria && (
                      <Typography variant="body2" color="text.secondary">
                        评价准则: {problem.criteria.length} 个
                      </Typography>
                    )}
                    {problem.alternatives && (
                      <Typography variant="body2" color="text.secondary">
                        备选方案: {problem.alternatives.length} 个
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => handleViewProblem(problem.id)}
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    onClick={() => handleEditProblem(problem.id)}
                    size="small"
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'secondary.dark'
                      }
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(problem)}
                    size="small"
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'error.dark'
                      }
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* 浮动创建按钮（移动端） */}
      <Fab
        color="primary"
        aria-label="创建问题"
        onClick={handleCreateProblem}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <Add />
      </Fab>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          确认删除
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除决策问题 "{problemToDelete?.title}" 吗？此操作无法撤销，相关的所有准则和方案也将被删除。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : null}
          >
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};