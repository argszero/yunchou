import { query } from '../utils/db.js';

class Criterion {
  // 创建准则
  static async create(criterionData) {
    const { problemId, name, description = null, sortOrder = 0 } = criterionData;

    // 生成UUID
    const { v4: uuidv4 } = await import('uuid');
    const criterionId = uuidv4();

    const sql = `
      INSERT INTO or_criteria (id, problem_id, name, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `;

    await query(sql, [criterionId, problemId, name, description, sortOrder]);
    return criterionId;
  }
}

export default Criterion;