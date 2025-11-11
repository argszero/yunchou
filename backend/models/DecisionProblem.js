import { query } from '../utils/db.js';

class DecisionProblem {
  // 创建决策问题
  static async create(problemData) {
    const {
      userId,
      title,
      description = null,
      consistencyRatio = null,
      isConsistent = false
    } = problemData;

    // 生成UUID
    const { v4: uuidv4 } = await import('uuid');
    const problemId = uuidv4();

    const sql = `
      INSERT INTO or_decision_problems
      (id, user_id, title, description, consistency_ratio, is_consistent)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      problemId,
      userId,
      title,
      description,
      consistencyRatio,
      isConsistent
    ]);

    return problemId;
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

    // 转换权重数据类型（MySQL DECIMAL返回字符串）
    const formattedCriteria = criteria.map(criterion => ({
      ...criterion,
      weight: criterion.weight !== null ? parseFloat(criterion.weight) : null
    }));

    return {
      ...problem,
      criteria: formattedCriteria,
      alternatives
    };
  }

  // 更新决策问题
  static async update(id, updateData) {
    const {
      title,
      description,
      consistencyRatio,
      isConsistent
    } = updateData;

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }


    if (consistencyRatio !== undefined) {
      updates.push('consistency_ratio = ?');
      values.push(consistencyRatio);
    }

    if (isConsistent !== undefined) {
      updates.push('is_consistent = ?');
      values.push(isConsistent);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE or_decision_problems
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    values.push(id);

    await query(sql, values);

    return await this.findById(id);
  }

  // 删除决策问题（包括相关的准则和方案）
  static async delete(id) {
    // 先删除相关的准则
    const deleteCriteriaSql = 'DELETE FROM or_criteria WHERE problem_id = ?';
    await query(deleteCriteriaSql, [id]);

    // 再删除相关的方案
    const deleteAlternativesSql = 'DELETE FROM or_alternatives WHERE problem_id = ?';
    await query(deleteAlternativesSql, [id]);

    // 最后删除决策问题本身
    const deleteProblemSql = 'DELETE FROM or_decision_problems WHERE id = ?';
    const result = await query(deleteProblemSql, [id]);

    return result.affectedRows > 0;
  }
}

export default DecisionProblem;