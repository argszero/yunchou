import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import type { DecisionProblem } from '../types';

interface ChartsProps {
  decisionProblem: DecisionProblem;
  topsisResult: any;
}

export const WeightDistributionChart: React.FC<ChartsProps> = ({
  decisionProblem
}) => {
  const data = decisionProblem.criteria.map((criterion, index) => ({
    name: criterion.name,
    weight: decisionProblem.weights[index] * 100
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
        <YAxis label={{ value: '权重 (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => [`${value}%`, '权重']} />
        <Bar dataKey="weight" fill="#8884d8">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const RankingBarChart: React.FC<ChartsProps> = ({
  decisionProblem,
  topsisResult
}) => {
  const data = decisionProblem.alternatives
    .map((alternative, index) => ({
      name: alternative.name,
      相对贴近度: topsisResult.closenessCoefficients[index] * 100,
      排名: topsisResult.rankings[index]
    }))
    .sort((a, b) => b.相对贴近度 - a.相对贴近度);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} label={{ value: '相对贴近度 (%)', position: 'insideBottom', offset: -5 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(value) => [`${value}%`, '相对贴近度']} />
        <Bar dataKey="相对贴近度" fill="#82ca9d">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.排名 === 1 ? '#4CAF50' : entry.排名 <= 3 ? '#2196F3' : '#FFC107'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const CriteriaRadarChart: React.FC<ChartsProps> = ({
  decisionProblem,
  topsisResult
}) => {
  // 获取排名前三的方案数据
  const topAlternatives = decisionProblem.alternatives
    .map((alternative, index) => ({
      ...alternative,
      closeness: topsisResult.closenessCoefficients[index],
      ranking: topsisResult.rankings[index]
    }))
    .sort((a, b) => a.ranking - b.ranking)
    .slice(0, 3);

  const radarData = decisionProblem.criteria.map((criterion, critIndex) => {
    const dataPoint: any = { criterion: criterion.name };

    topAlternatives.forEach((alt, altIndex) => {
      dataPoint[`方案${altIndex + 1}`] = alt.scores[critIndex] * 20; // 转换为百分比
    });

    return dataPoint;
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="criterion" />
        <PolarRadiusAxis domain={[0, 100]} />
        {topAlternatives.map((alt, index) => (
          <Radar
            key={alt.id}
            name={`${alt.name} (第${alt.ranking}名)`}
            dataKey={`方案${index + 1}`}
            stroke={COLORS[index]}
            fill={COLORS[index]}
            fillOpacity={0.6}
          />
        ))}
        <Legend />
        <Tooltip formatter={(value) => [`${value}%`, '得分']} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export const ScoreComparisonChart: React.FC<ChartsProps> = ({
  decisionProblem
}) => {
  const data = decisionProblem.criteria.map((criterion, critIndex) => {
    const dataPoint: any = { criterion: criterion.name };

    // 计算每个准则的平均分
    const totalScore = decisionProblem.alternatives.reduce(
      (sum, alt) => sum + alt.scores[critIndex], 0
    );
    dataPoint.平均分 = totalScore / decisionProblem.alternatives.length;

    // 计算最高分和最低分
    dataPoint.最高分 = Math.max(...decisionProblem.alternatives.map(alt => alt.scores[critIndex]));
    dataPoint.最低分 = Math.min(...decisionProblem.alternatives.map(alt => alt.scores[critIndex]));

    return dataPoint;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="criterion" angle={-45} textAnchor="end" height={80} />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="平均分" fill="#8884d8" name="平均分" />
        <Bar dataKey="最高分" fill="#82ca9d" name="最高分" />
        <Bar dataKey="最低分" fill="#ffc658" name="最低分" />
      </BarChart>
    </ResponsiveContainer>
  );
};