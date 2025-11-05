import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Alert,
  Paper,
  Chip
} from '@mui/material';
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

  const handleScoreChange = (alternativeIndex: number, criterionIndex: number, value: string) => {
    const numValue = parseInt(value, 10);

    if (isNaN(numValue) || numValue < 1 || numValue > 5) {
      onError('请输入1-5之间的整数');
      return;
    }

    const newScores = [...scores];
    newScores[alternativeIndex] = [...newScores[alternativeIndex]];
    newScores[alternativeIndex][criterionIndex] = numValue;

    setScores(newScores);
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
    <Box>
      <Typography variant="h6" gutterBottom>
        方案评分
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        请为每个备选方案在各个评价准则上进行评分（1-5分）。
        1分表示最差，5分表示最优。
      </Alert>

      {/* 评分说明 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            评分标准说明
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="1分: 很差" color="error" variant="outlined" />
            <Chip label="2分: 较差" color="warning" variant="outlined" />
            <Chip label="3分: 一般" color="info" variant="outlined" />
            <Chip label="4分: 良好" color="primary" variant="outlined" />
            <Chip label="5分: 优秀" color="success" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      {/* 评分表格 */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                备选方案
              </TableCell>
              {criteria.map((criterion) => (
                <TableCell
                  key={criterion.id}
                  sx={{ fontWeight: 'bold', minWidth: 150 }}
                  align="center"
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {criterion.name}
                    </Typography>
                    {criterion.description && (
                      <Typography variant="caption" color="text.secondary">
                        {criterion.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {alternatives.map((alternative, altIndex) => (
              <TableRow key={alternative.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {alternative.name}
                    </Typography>
                    {alternative.description && (
                      <Typography variant="caption" color="text.secondary">
                        {alternative.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                {criteria.map((criterion, critIndex) => {
                  const currentScore = scores[altIndex][critIndex];
                  const isScored = currentScore >= 1 && currentScore <= 5;

                  return (
                    <TableCell key={criterion.id} align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          value={isScored ? currentScore : ''}
                          onChange={(e) => handleScoreChange(altIndex, critIndex, e.target.value)}
                          inputProps={{
                            min: 1,
                            max: 5,
                            step: 1
                          }}
                          sx={{
                            width: 80,
                            '& .MuiInputBase-input': {
                              textAlign: 'center'
                            }
                          }}
                          placeholder="1-5"
                        />
                        {isScored && (
                          <Chip
                            label={getScoreDescription(currentScore)}
                            color={getScoreColor(currentScore)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 完成状态提示 */}
      {isComplete ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          所有评分已完成！请点击下方按钮继续。
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          请完成所有评分（1-5分）后再继续。
        </Alert>
      )}

      {/* 提交按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!isComplete}
        >
          确认评分并计算排名
        </Button>
      </Box>

      {/* 评分统计 */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            评分统计
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`已完成: ${scores.flat().filter(score => score >= 1 && score <= 5).length}/${scores.flat().length}`}
              color={isComplete ? 'success' : 'default'}
              variant={isComplete ? 'filled' : 'outlined'}
            />
            <Chip
              label={`待完成: ${scores.flat().filter(score => score < 1 || score > 5).length}`}
              color="warning"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};