import fetch from 'node-fetch';

const DEEPSEEK_API_KEY = 'sk-c44cb75c510940899b66e79ac93bb32c';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 调用DeepSeek API生成决策问题的准则和方案
 */
export async function generateWithLLM(problemTitle) {
  try {
    const prompt = `用户输入了一个决策问题："${problemTitle}"

请为这个决策问题生成：
1. 5-8个评价准则（每个准则包含名称、简短描述和默认权重百分比）
2. 3-5个备选方案（每个方案包含名称、简短描述）
3. 每个方案针对每个准则的默认评分（0-100分）

要求：
- 准则要覆盖问题的不同维度，权重总和为100%
- 方案要具体可行
- 评分要基于方案在对应准则上的表现
- 描述要简洁明了

请返回JSON格式：
{
  "criteria": [
    {
      "name": "准则名称",
      "description": "准则描述",
      "defaultWeight": 权重百分比
    },
    ...
  ],
  "alternatives": [
    {
      "name": "方案名称",
      "description": "方案描述",
      "defaultScores": {
        "准则名称": 评分,
        ...
      }
    },
    ...
  ]
}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的决策分析助手，擅长为各种决策问题生成评价准则和备选方案。请始终返回有效的JSON格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 提取JSON内容
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从LLM响应中提取JSON');
    }

    const generatedContent = JSON.parse(jsonMatch[0]);

    // 验证生成的内容
    if (!generatedContent.criteria || !generatedContent.alternatives) {
      throw new Error('LLM返回的内容格式不正确');
    }

    // 确保数量在合理范围内
    const criteria = generatedContent.criteria.slice(0, 8); // 最多8个准则
    const alternatives = generatedContent.alternatives.slice(0, 5); // 最多5个方案

    return {
      criteria,
      alternatives
    };

  } catch (error) {
    console.error('Error calling DeepSeek API:', error);

    // 如果LLM调用失败，返回默认内容
    return getDefaultContent(problemTitle);
  }
}

/**
 * 获取默认的准则和方案（当LLM调用失败时使用）
 */
function getDefaultContent(problemTitle) {
  // 通用的评价准则（带默认权重）
  const defaultCriteria = [
    {
      name: '可行性',
      description: '方案实施的难易程度和现实可行性',
      defaultWeight: 25
    },
    {
      name: '成本效益',
      description: '投入与产出的比例关系',
      defaultWeight: 20
    },
    {
      name: '时间效率',
      description: '方案实施和见效的时间周期',
      defaultWeight: 20
    },
    {
      name: '风险控制',
      description: '方案实施过程中的风险程度和可控性',
      defaultWeight: 20
    },
    {
      name: '可持续性',
      description: '方案效果的持久性和长期影响',
      defaultWeight: 15
    }
  ];

  // 根据问题标题生成相关方案（带默认评分）
  const defaultAlternatives = generateDefaultAlternatives(problemTitle, defaultCriteria);

  return {
    criteria: defaultCriteria,
    alternatives: defaultAlternatives
  };
}

/**
 * 根据问题标题生成默认的备选方案（带默认评分）
 */
function generateDefaultAlternatives(problemTitle, criteria) {
  const alternatives = [
    {
      name: '保守方案',
      description: '风险较低但收益也相对有限的方案',
      defaultScores: {
        '可行性': 85,
        '成本效益': 60,
        '时间效率': 70,
        '风险控制': 90,
        '可持续性': 75
      }
    },
    {
      name: '进取方案',
      description: '风险较高但潜在收益也更大的方案',
      defaultScores: {
        '可行性': 60,
        '成本效益': 85,
        '时间效率': 50,
        '风险控制': 40,
        '可持续性': 80
      }
    },
    {
      name: '平衡方案',
      description: '在风险和收益之间取得平衡的折中方案',
      defaultScores: {
        '可行性': 75,
        '成本效益': 75,
        '时间效率': 65,
        '风险控制': 70,
        '可持续性': 80
      }
    }
  ];

  // 如果问题标题包含特定关键词，可以添加更相关的方案
  if (problemTitle.includes('运筹学') || problemTitle.includes('作业')) {
    alternatives.push({
      name: '理论分析方案',
      description: '基于数学模型和理论分析的方案',
      defaultScores: {
        '可行性': 70,
        '成本效益': 65,
        '时间效率': 80,
        '风险控制': 85,
        '可持续性': 70
      }
    });
    alternatives.push({
      name: '实践应用方案',
      description: '注重实际应用和案例分析的方案',
      defaultScores: {
        '可行性': 80,
        '成本效益': 70,
        '时间效率': 60,
        '风险控制': 75,
        '可持续性': 85
      }
    });
  }

  return alternatives;
}