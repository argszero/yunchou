import { query } from '../utils/db.js';

class Criterion {
  // 创建准则
  static async create(criterionData) {
    const {
      problemId,
      name,
      description = null,
      sortOrder = 0,
      weight = null,
      isLLMGenerated = false
    } = criterionData;

    // 生成UUID
    const { v4: uuidv4 } = await import('uuid');
    const criterionId = uuidv4();

    const sql = `
      INSERT INTO or_criteria (id, problem_id, name, description, sort_order, weight, is_llm_generated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [criterionId, problemId, name, description, sortOrder, weight, isLLMGenerated]);
    return criterionId;
  }
}

export default Criterion;