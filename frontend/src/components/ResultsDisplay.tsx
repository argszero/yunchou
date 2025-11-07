import React, { useState, useEffect } from 'react';
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
  Paper,
  Chip,
  Button,
  Alert,
  LinearProgress
} from '@mui/material';
import { Download, Share, QrCode } from '@mui/icons-material';
import type { DecisionProblem } from '../types';
import { performTOPSISAnalysis, getRankingDescription } from '../utils/topsisCalculator';
import {
  WeightDistributionChart,
  RankingBarChart,
  CriteriaRadarChart,
  ScoreComparisonChart
} from './Charts';

interface ResultsDisplayProps {
  decisionProblem: DecisionProblem;
  onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  decisionProblem,
  onReset
}) => {
  const [topsisResult, setTopsisResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // 执行TOPSIS计算
    const calculateResults = async () => {
      setIsCalculating(true);
      try {
        const result = performTOPSISAnalysis(
          decisionProblem.alternatives,
          decisionProblem.weights
        );
        setTopsisResult(result);
      } catch (error) {
        console.error('TOPSIS计算错误:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateResults();
  }, [decisionProblem]);

  const handleExportPDF = () => {
    // TODO: 实现PDF导出功能
    alert('PDF导出功能开发中...');
  };

  const handleShare = () => {
    // TODO: 实现分享功能
    alert('分享功能开发中...');
  };

  const handleGenerateQR = () => {
    // TODO: 实现QR码生成
    alert('QR码生成功能开发中...');
  };

  if (isCalculating) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          正在计算排名结果...
        </Typography>
        <LinearProgress sx={{ maxWidth: 400, mx: 'auto', my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          正在使用TOPSIS方法进行多准则决策分析
        </Typography>
      </Box>
    );
  }

  if (!topsisResult) {
    return (
      <Alert severity="error">
        计算过程中出现错误，请重新开始。
      </Alert>
    );
  }

  const getRankColor = (rank: number): 'success' | 'primary' | 'warning' | 'default' => {
    if (rank === 1) return 'success';
    if (rank <= 3) return 'primary';
    if (rank <= 5) return 'warning';
    return 'default';
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <Box sx={{ pb: { xs: 2, sm: 0 } }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
        决策结果分析
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        TOPSIS分析已完成！以下是基于AHP权重和方案评分的综合排名结果。
      </Alert>

      {/* 排名结果 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              方案综合排名
            </Typography>
            <Chip
              label={`总方案数: ${decisionProblem.alternatives.length}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>

          <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 400, sm: 600 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: { xs: 60, sm: 80 } }}>排名</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>方案名称</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: { xs: 100, sm: 120 } }} align="center">
                    相对贴近度
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: { xs: 80, sm: 120 } }} align="center">
                    评价
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topsisResult.rankings
                  .map((rank: number, index: number) => ({
                    rank,
                    alternative: decisionProblem.alternatives[index],
                    closeness: topsisResult.closenessCoefficients[index]
                  }))
                  .sort((a: any, b: any) => a.rank - b.rank)
                  .map((item: any) => (
                    <TableRow
                      key={item.alternative.id}
                      sx={{
                        backgroundColor: item.rank === 1 ? 'success.light' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={getRankIcon(item.rank)}
                          color={getRankColor(item.rank)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {item.alternative.name}
                          </Typography>
                          {item.alternative.description && (
                            <Typography variant="caption" color="text.secondary">
                              {item.alternative.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="h6"
                          color="primary.main"
                          fontWeight="bold"
                        >
                          {(item.closeness * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getRankingDescription(item.rank, decisionProblem.alternatives.length)}
                          color={getRankColor(item.rank)}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 可视化图表 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            权重分布可视化
          </Typography>
          <WeightDistributionChart
            decisionProblem={decisionProblem}
            topsisResult={topsisResult}
          />
        </CardContent>
      </Card>

      {/* 排名可视化 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            方案排名可视化
          </Typography>
          <RankingBarChart
            decisionProblem={decisionProblem}
            topsisResult={topsisResult}
          />
        </CardContent>
      </Card>

      {/* 雷达图 */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              前三名方案雷达图
            </Typography>
            <CriteriaRadarChart
              decisionProblem={decisionProblem}
              topsisResult={topsisResult}
            />
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              评分对比分析
            </Typography>
            <ScoreComparisonChart
              decisionProblem={decisionProblem}
              topsisResult={topsisResult}
            />
          </CardContent>
        </Card>
      </Box>

      {/* 分析摘要 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            分析摘要
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: { xs: 2, sm: 3 }
          }}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                最优方案
              </Typography>
              <Typography variant="h6" color="success.main">
                {decisionProblem.alternatives
                  .find((_, index) => topsisResult.rankings[index] === 1)
                  ?.name || '未知'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                相对贴近度范围
              </Typography>
              <Typography variant="body1">
                {Math.min(...topsisResult.closenessCoefficients).toFixed(3)} - {Math.max(...topsisResult.closenessCoefficients).toFixed(3)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                决策时间
              </Typography>
              <Typography variant="body1">
                {new Date().toLocaleString('zh-CN')}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                总方案数
              </Typography>
              <Typography variant="body1">
                {decisionProblem.alternatives.length}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            结果操作
          </Typography>
          <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap',
            '& .MuiButton-root': {
              flex: { xs: '1 1 calc(50% - 8px)', sm: 'none' },
              minWidth: { xs: 'auto', sm: '120px' }
            }
          }}>
            <Button
              startIcon={<Download />}
              variant="contained"
              onClick={handleExportPDF}
            >
              导出PDF报告
            </Button>
            <Button
              startIcon={<Share />}
              variant="outlined"
              onClick={handleShare}
            >
              分享结果
            </Button>
            <Button
              startIcon={<QrCode />}
              variant="outlined"
              onClick={handleGenerateQR}
            >
              生成QR码
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onReset}
            >
              重新开始
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 计算过程说明 */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>计算过程说明：</strong>
          本系统使用AHP方法确定准则权重，通过TOPSIS方法计算各方案与理想解的相对贴近度。
          相对贴近度越接近1，表示该方案越接近理想解，排名越高。
        </Typography>
      </Alert>
    </Box>
  );
};