import { query } from '../utils/db.js';

class DecisionProblem {
  // 创建决策问题
  static async create(problemData) {
    const {
      title,
      description = null,
      weights = null,
      consistencyRatio = null,
      isConsistent = false
    } = problemData;

    const sql = `
      INSERT INTO or_decision_problems
      (title, description, weights, consistency_ratio, is_consistent)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      title,
      description,
      weights ? JSON.stringify(weights) : null,
      consistencyRatio,
      isConsistent
    ]);

    return result.insertId;
  }

  // 根据ID获取决策问题
  static async findById(id) {
    const sql = 'SELECT * FROM or_decision_problems WHERE id = ?';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  }

  // 获取完整的决策问题（包含准则和方案）
  static async getFullProblem(id) {
    const problem = await this.findById(id);
    if (!problem) return null;

    // 获取准则
    const criteriaSql = 'SELECT * FROM or_criteria WHERE problem_id = ? ORDER BY sort_order';
    const criteria = await query(criteriaSql, [id]);

    // 获取方案
    const alternativesSql = 'SELECT * FROM or_alternatives WHERE problem_id = ? ORDER BY ranking';
    const alternatives = await query(alternativesSql, [id]);

    return {
      ...problem,
      criteria,
      alternatives
    };
  }
}

export default DecisionProblem;