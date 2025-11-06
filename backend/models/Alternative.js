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

    const sql = `
      INSERT INTO or_alternatives
      (problem_id, name, description, scores, closeness_coefficient, ranking)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      problemId,
      name,
      description,
      scores ? JSON.stringify(scores) : null,
      closenessCoefficient,
      ranking
    ]);

    return result.insertId;
  }
}

export default Alternative;