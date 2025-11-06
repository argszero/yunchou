import { query } from '../utils/db.js';

class Alternative {
  // 创建备选方案
  static async create(alternativeData) {
    const {
      problemId,
      name,
      description = null,
      scores = null,
      closenessCoefficient = null,
      ranking = null
    } = alternativeData;

    // 生成UUID
    const { v4: uuidv4 } = await import('uuid');
    const alternativeId = uuidv4();

    const sql = `
      INSERT INTO or_alternatives
      (id, problem_id, name, description, scores, closeness_coefficient, ranking)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      alternativeId,
      problemId,
      name,
      description,
      scores ? JSON.stringify(scores) : null,
      closenessCoefficient,
      ranking
    ]);

    return alternativeId;
  }
}

export default Alternative;