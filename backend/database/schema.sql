-- 决策系统数据库表结构

-- 用户表（无感注册）
CREATE TABLE IF NOT EXISTS or_users (
    user_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    fingerprint_hash VARCHAR(64) NOT NULL, -- 浏览器指纹哈希
    user_agent TEXT, -- 用户代理信息
    screen_resolution VARCHAR(20), -- 屏幕分辨率
    timezone VARCHAR(50), -- 时区
    language VARCHAR(10), -- 语言
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fingerprint (fingerprint_hash),
    INDEX idx_created_at (created_at)
);

-- 决策问题表
CREATE TABLE IF NOT EXISTS or_decision_problems (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL, -- 关联用户ID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    weights JSON, -- 存储权重数组 [0.3, 0.4, 0.3]
    consistency_ratio DECIMAL(5,4), -- AHP一致性比率
    is_consistent BOOLEAN DEFAULT FALSE, -- 是否通过一致性检验
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES or_users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- 评价准则表
CREATE TABLE IF NOT EXISTS or_criteria (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    problem_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0, -- 排序字段
    is_llm_generated BOOLEAN DEFAULT FALSE, -- 是否为LLM自动生成
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES or_decision_problems(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id)
);

-- 备选方案表
CREATE TABLE IF NOT EXISTS or_alternatives (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    problem_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scores JSON, -- 存储评分数组 [85, 90, 75]
    closeness_coefficient DECIMAL(5,4), -- TOPSIS贴近度系数
    ranking INT, -- 最终排名
    is_llm_generated BOOLEAN DEFAULT FALSE, -- 是否为LLM自动生成
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES or_decision_problems(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id),
    INDEX idx_ranking (ranking)
);

-- AHP两两比较矩阵表
CREATE TABLE IF NOT EXISTS or_ahp_comparisons (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    problem_id VARCHAR(36) NOT NULL,
    row_index INT NOT NULL, -- 行索引
    col_index INT NOT NULL, -- 列索引
    comparison_value DECIMAL(5,3) NOT NULL, -- 比较值 (1-9标度)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES or_decision_problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comparison (problem_id, row_index, col_index),
    INDEX idx_problem_id (problem_id)
);

-- TOPSIS计算结果表
CREATE TABLE IF NOT EXISTS or_topsis_results (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    problem_id VARCHAR(36) NOT NULL,
    alternative_id VARCHAR(36) NOT NULL,
    normalized_score DECIMAL(8,6), -- 标准化得分
    weighted_score DECIMAL(8,6), -- 加权得分
    distance_to_ideal DECIMAL(8,6), -- 到理想解距离
    distance_to_negative DECIMAL(8,6), -- 到负理想解距离
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES or_decision_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (alternative_id) REFERENCES or_alternatives(id) ON DELETE CASCADE,
    UNIQUE KEY unique_result (problem_id, alternative_id),
    INDEX idx_problem_id (problem_id)
);