import { query } from '../utils/db.js';

class Criterion {
  // 创建准则
  static async create(criterionData) {
    const { problemId, name, description = null, sortOrder = 0 } = criterionData;

    const sql = `
      INSERT INTO or_criteria (problem_id, name, description, sort_order)
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [problemId, name, description, sortOrder]);
    return result.insertId;
  }
}

export default Criterion;