import express from 'express';
import DecisionProblem from '../models/DecisionProblem.js';
import Criterion from '../models/Criterion.js';
import Alternative from '../models/Alternative.js';
import User from '../models/User.js';
import { generateFingerprintData, validateFingerprintData } from '../utils/fingerprint.js';
import { generateWithLLM } from '../utils/llm.js';

const router = express.Router();

// 用户识别中间件
const identifyUser = async (req, res, next) => {
  try {
    // 从请求头获取指纹数据
    const fingerprintData = generateFingerprintData(req);

    if (!validateFingerprintData(fingerprintData)) {
      return res.status(400).json({
        success: false,
        message: '无效的指纹数据'
      });
    }

    // 查找或创建用户
    const user = await User.findOrCreate(fingerprintData);
    req.user = user;
    next();
  } catch (error) {
    console.error('Error identifying user:', error);
    res.status(500).json({
      success: false,
      message: '用户识别失败',
      error: error.message
    });
  }
};

// 获取用户的所有决策问题（新API）
router.get('/', identifyUser, async (req, res) => {
  try {
    const problems = await User.getUserDecisionProblems(req.user.user_id);

    // 转换格式以匹配前端期望
    const formattedProblems = problems.map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      status: problem.status || 'draft',
      createdAt: problem.created_at,
      criteria: problem.criteria || [],
      alternatives: problem.alternatives || []
    }));

    res.json(formattedProblems);
  } catch (error) {
    console.error('Error fetching user decision problems:', error);
    res.status(500).json({
      success: false,
      message: '获取决策问题列表失败',
      error: error.message
    });
  }
});

// 创建新的决策问题（新API）- 简化版本，自动生成准则和方案
router.post('/', identifyUser, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: '决策问题标题不能为空'
      });
    }

    // 调用LLM自动生成准则和方案
    const generatedContent = await generateWithLLM(title.trim());

    // 提取默认权重
    const defaultWeights = generatedContent.criteria.map(criterion => criterion.defaultWeight || 0);

    // 创建决策问题（包含默认权重）
    const problemId = await DecisionProblem.create({
      userId: req.user.user_id,
      title: title.trim(),
      description: '',
      weights: defaultWeights
    });

    // 创建生成的准则
    for (const [index, criterion] of generatedContent.criteria.entries()) {
      await Criterion.create({
        problemId,
        name: criterion.name,
        description: criterion.description,
        sortOrder: index,
        isLLMGenerated: true
      });
    }

    // 创建生成的备选方案（包含默认评分）
    for (const alternative of generatedContent.alternatives) {
      // 将默认评分转换为数组格式
      const defaultScores = generatedContent.criteria.map(criterion => {
        return alternative.defaultScores?.[criterion.name] || 50; // 默认为50分
      });

      await Alternative.create({
        problemId,
        name: alternative.name,
        description: alternative.description,
        scores: defaultScores,
        isLLMGenerated: true
      });
    }

    // 获取完整的问题详情
    const fullProblem = await DecisionProblem.getFullProblem(problemId);

    res.status(201).json({
      id: fullProblem.id,
      title: fullProblem.title,
      description: fullProblem.description,
      status: 'draft',
      createdAt: fullProblem.created_at,
      criteria: fullProblem.criteria || [],
      alternatives: fullProblem.alternatives || []
    });
  } catch (error) {
    console.error('Error creating decision problem:', error);
    res.status(500).json({
      success: false,
      message: '创建决策问题失败',
      error: error.message
    });
  }
});

// 获取决策问题详情（新API）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await DecisionProblem.getFullProblem(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: '决策问题不存在'
      });
    }

    // 转换格式以匹配前端期望
    const formattedProblem = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      status: problem.status || 'draft',
      createdAt: problem.created_at,
      criteria: problem.criteria || [],
      alternatives: problem.alternatives || []
    };

    res.json(formattedProblem);
  } catch (error) {
    console.error('Error fetching decision problem:', error);
    res.status(500).json({
      success: false,
      message: '获取决策问题失败',
      error: error.message
    });
  }
});

// 更新决策问题（新API）
router.put('/:id', identifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查问题是否存在
    const existingProblem = await DecisionProblem.findById(id);
    if (!existingProblem) {
      return res.status(404).json({
        success: false,
        message: '决策问题不存在'
      });
    }

    // 检查用户权限
    if (existingProblem.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: '无权修改此决策问题'
      });
    }

    // 更新问题
    await DecisionProblem.update(id, updateData);

    // 获取完整的问题详情
    const fullProblem = await DecisionProblem.getFullProblem(id);

    res.json({
      id: fullProblem.id,
      title: fullProblem.title,
      description: fullProblem.description,
      status: fullProblem.status || 'draft',
      createdAt: fullProblem.created_at,
      criteria: fullProblem.criteria || [],
      alternatives: fullProblem.alternatives || []
    });
  } catch (error) {
    console.error('Error updating decision problem:', error);
    res.status(500).json({
      success: false,
      message: '更新决策问题失败',
      error: error.message
    });
  }
});

export default router;