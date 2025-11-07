import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { ProblemDefinition } from './ProblemDefinition';
import { AHPWeighting } from './AHPWeighting';
import { AlternativeScoring } from './AlternativeScoring';
import { ResultsDisplay } from './ResultsDisplay';
import type { DecisionProblem } from '../types';

const steps = [
  '问题定义',
  '准则权重分配',
  '方案评分',
  '结果分析'
];

export const DecisionFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [decisionProblem, setDecisionProblem] = useState<DecisionProblem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setDecisionProblem(null);
    setError(null);
  };

  const handleProblemDefined = (problem: DecisionProblem) => {
    setDecisionProblem(problem);
    handleNext();
  };

  const handleWeightsCalculated = (weights: number[]) => {
    if (decisionProblem) {
      setDecisionProblem({
        ...decisionProblem,
        weights
      });
      handleNext();
    }
  };

  const handleScoresUpdated = (alternatives: DecisionProblem['alternatives']) => {
    if (decisionProblem) {
      setDecisionProblem({
        ...decisionProblem,
        alternatives
      });
      handleNext();
    }
  };

  const renderStepContent = (step: number) => {
    if (!decisionProblem && step > 0) {
      return (
        <Alert severity="warning">
          请先完成问题定义步骤
        </Alert>
      );
    }

    switch (step) {
      case 0:
        return (
          <ProblemDefinition
            onProblemDefined={handleProblemDefined}
            onError={setError}
          />
        );
      case 1:
        return (
          <AHPWeighting
            criteria={decisionProblem!.criteria}
            onWeightsCalculated={handleWeightsCalculated}
            onError={setError}
          />
        );
      case 2:
        return (
          <AlternativeScoring
            criteria={decisionProblem!.criteria}
            alternatives={decisionProblem!.alternatives}
            onScoresUpdated={handleScoresUpdated}
            onError={setError}
          />
        );
      case 3:
        return (
          <ResultsDisplay
            decisionProblem={decisionProblem!}
            onReset={handleReset}
          />
        );
      default:
        return <div>未知步骤</div>;
    }
  };

  return (
    <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 步骤指示器 - 移动端优化 */}
      <Stepper
        activeStep={activeStep}
        sx={{
          mb: { xs: 2, sm: 3, md: 4 },
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 步骤内容 - 移动端优化 */}
      <Box
        sx={{
          p: { xs: 0, sm: 0 },
          minHeight: { xs: 300, sm: 400 },
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        {renderStepContent(activeStep)}
      </Box>

      {/* 导航按钮 - 移动端优化 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        mt: 2,
        gap: 1
      }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
          size="large"
          sx={{
            flex: 1,
            minHeight: '48px'
          }}
        >
          上一步
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleReset}
            variant="contained"
            size="large"
            sx={{
              flex: 1,
              minHeight: '48px'
            }}
          >
            重新开始
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            size="large"
            disabled={!decisionProblem && activeStep > 0}
            sx={{
              flex: 1,
              minHeight: '48px'
            }}
          >
            下一步
          </Button>
        )}
      </Box>

      {/* 进度信息 */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          步骤 {activeStep + 1} / {steps.length}
        </Typography>
      </Box>
    </Box>
  );
};