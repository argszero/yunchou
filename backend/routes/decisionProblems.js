import express from 'express';
import DecisionProblem from '../models/DecisionProblem.js';
import Criterion from '../models/Criterion.js';
import Alternative from '../models/Alternative.js';
import User from '../models/User.js';
import { generateFingerprintData, validateFingerprintData } from '../utils/fingerprint.js';

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

// 创建新的决策问题
router.post('/', identifyUser, async (req, res) => {
  try {
    const { title, description, criteria, alternatives } = req.body;

    // 创建决策问题
    const problemId = await DecisionProblem.create({
      userId: req.user.user_id,
      title,
      description
    });

    // 创建准则
    for (const [index, criterion] of criteria.entries()) {
      await Criterion.create({
        problemId,
        name: criterion.name,
        description: criterion.description,
        sortOrder: index
      });
    }

    // 创建备选方案
    for (const alternative of alternatives) {
      await Alternative.create({
        problemId,
        name: alternative.name,
        description: alternative.description,
        scores: alternative.scores
      });
    }

    const fullProblem = await DecisionProblem.getFullProblem(problemId);
    res.status(201).json({
      success: true,
      data: fullProblem
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

// 获取用户的所有决策问题
router.get('/', identifyUser, async (req, res) => {
  try {
    const problems = await User.getUserDecisionProblems(req.user.user_id);
    res.json({
      success: true,
      data: problems
    });
  } catch (error) {
    console.error('Error fetching user decision problems:', error);
    res.status(500).json({
      success: false,
      message: '获取决策问题列表失败',
      error: error.message
    });
  }
});

// 获取决策问题详情
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

    // 尝试识别用户并记录参与关系
    try {
      const fingerprintData = generateFingerprintData(req);
      if (validateFingerprintData(fingerprintData)) {
        const user = await User.findOrCreate(fingerprintData);
        // 如果用户不是问题的创建者，则记录参与关系
        if (user.user_id !== problem.user_id) {
          await User.addParticipation(user.user_id, id);
        }
      }
    } catch (userError) {
      // 用户识别失败不影响返回问题数据
      console.warn('User identification failed, but still returning problem data:', userError.message);
    }

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Error fetching decision problem:', error);
    res.status(500).json({
      success: false,
      message: '获取决策问题失败',
      error: error.message
    });
  }
});

export default router;