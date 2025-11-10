# 运筹决策助手 - 设计文档

## 设计理念
极简交互 + 智能辅助 = 高效决策

## 核心功能流程

### 1. 首页 - 决策问题列表
**路径**: `/`
**功能**:
- 显示用户创建和参与的所有决策问题
- 按状态分类：进行中、已完成
- 快速创建新问题的入口

**界面元素**:
- 顶部：应用标题 + 创建按钮
- 中部：问题列表（标题、状态、创建时间）
- 底部：导航栏

### 2. 创建决策问题
**路径**: `/create`
**交互流程**:
1. 用户输入决策问题标题
2. 点击"创建"按钮
3. 系统调用LLM自动生成：
   - 3-5个评价准则
   - 5-8个备选方案
4. 自动跳转到问题详情页

**LLM提示词示例**:
```
用户输入："选择最优的运筹学作业课题"

请为这个决策问题生成：
1. 3-5个评价准则（每个准则包含名称和简短描述）
2. 5-8个备选方案（每个方案包含名称和简短描述）

返回JSON格式：
{
  "criteria": [
    {"name": "数据可得性", "description": "获取相关数据的难易程度"},
    ...
  ],
  "alternatives": [
    {"name": "共享单车调度优化", "description": "优化共享单车的分布和调度"},
    ...
  ]
}
```

### 3. 问题详情页
**路径**: `/problem/:id`
**功能**: 分步骤完成决策过程

#### 3.1 调整评价准则
**交互**:
- 查看LLM生成的准则列表
- 删除不需要的准则
- 修改准则名称/描述
- 智能新增：输入关键词，LLM生成相关准则

#### 3.2 调整备选方案
**交互**:
- 查看LLM生成的方案列表
- 删除不需要的方案
- 修改方案名称/描述
- 智能新增：输入关键词，LLM生成相关方案

#### 3.3 准则权重分配
**交互**:
- 默认：均匀权重（所有准则权重相等）
- 手动调整：通过滑块或百分比输入
- 支持AHP两两比较（可选）

#### 3.4 方案评分
**交互**:
- 为每个方案在各项准则上打分（1-10分）
- 支持批量评分
- 保存个人评分

### 4. 结果分析页
**路径**: `/problem/:id/results`
**功能**: 两种视角的结果展示

#### 4.1 个人结果
- 基于用户自己的评分和权重
- TOPSIS算法计算综合得分
- 方案排名和详细分析

#### 4.2 集体结果
- 基于所有参与者的评分和权重
- 加权平均计算综合得分
- 显示集体偏好和共识度

## 数据库设计

### 决策问题表 (decision_problems)
```sql
id | title | created_by | created_at | status
```

### 评价准则表 (criteria)
```sql
id | problem_id | name | description | is_llm_generated
```

### 备选方案表 (alternatives)
```sql
id | problem_id | name | description | is_llm_generated
```

### 用户权重表 (user_weights)
```sql
id | problem_id | user_id | criterion_id | weight
```

### 用户评分表 (user_scores)
```sql
id | problem_id | user_id | alternative_id | criterion_id | score
```

## API 设计

### LLM集成API
```typescript
POST /api/llm/generate
Body: {
  problem_title: string
}
Response: {
  criteria: Criterion[],
  alternatives: Alternative[]
}
```

### 问题管理API
```typescript
GET /api/problems - 获取用户问题列表
POST /api/problems - 创建新问题
GET /api/problems/:id - 获取问题详情
PUT /api/problems/:id/criteria - 更新准则
PUT /api/problems/:id/alternatives - 更新方案
```

### 决策过程API
```typescript
POST /api/problems/:id/weights - 保存权重
POST /api/problems/:id/scores - 保存评分
GET /api/problems/:id/results - 获取结果
```

## 技术实现要点

### 前端架构
- 单页面应用（SPA）
- 组件化设计
- 响应式布局（移动优先）

### 后端架构
- RESTful API
- LLM集成（DeepSeek API）
- 数据库操作
- 算法计算（AHP + TOPSIS）

### 关键算法
1. **AHP权重计算** - 用于精确权重分配
2. **TOPSIS评分** - 用于方案排序
3. **集体决策算法** - 加权平均计算

## 开发优先级

### Phase 1: 核心流程
1. 首页和问题列表
2. 简化创建流程
3. LLM自动生成

### Phase 2: 调整功能
1. 准则调整界面
2. 方案调整界面
3. 权重分配界面

### Phase 3: 决策分析
1. 方案评分界面
2. 结果展示界面
3. 个人/集体视图切换

### Phase 4: 高级功能
1. AHP两两比较
2. 多人协作
3. 历史版本管理

## 成功指标
- 创建决策问题时间 < 30秒
- 完成完整决策流程时间 < 5分钟
- 用户满意度 > 4.5/5
- 重复使用率 > 60%