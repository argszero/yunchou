import { query } from '../utils/db.js';

class User {
  // 根据指纹哈希查找或创建用户
  static async findOrCreate(fingerprintData) {
    const { fingerprintHash, userAgent, screenResolution, timezone, language } = fingerprintData;

    // 首先尝试查找现有用户
    const existingUser = await query(
      'SELECT user_id, fingerprint_hash, user_agent, screen_resolution, timezone, language, created_at, last_seen_at FROM or_users WHERE fingerprint_hash = ?',
      [fingerprintHash]
    );

    if (existingUser.length > 0) {
      // 更新最后访问时间
      await query(
        'UPDATE or_users SET last_seen_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [existingUser[0].user_id]
      );
      return existingUser[0];
    }

    // 创建新用户
    const result = await query(
      'INSERT INTO or_users (fingerprint_hash, user_agent, screen_resolution, timezone, language) VALUES (?, ?, ?, ?, ?)',
      [fingerprintHash, userAgent, screenResolution, timezone, language]
    );

    const newUser = await query(
      'SELECT user_id, fingerprint_hash, user_agent, screen_resolution, timezone, language, created_at, last_seen_at FROM or_users WHERE user_id = ?',
      [result.insertId]
    );

    return newUser[0];
  }

  // 根据用户ID查找用户
  static async findById(userId) {
    const users = await query(
      'SELECT user_id, fingerprint_hash, user_agent, screen_resolution, timezone, language, created_at, last_seen_at FROM or_users WHERE user_id = ?',
      [userId]
    );
    return users[0] || null;
  }

  // 获取用户的所有决策问题（包括创建的和参与的）
  static async getUserDecisionProblems(userId) {
    const problems = await query(
      `SELECT
         p.id,
         p.user_id,
         p.title,
         p.description,
         p.consistency_ratio,
         p.is_consistent,
         p.created_at,
         p.updated_at,
         CASE
           WHEN p.user_id = ? THEN 'creator'
           ELSE 'participant'
         END as user_role
       FROM or_decision_problems p
       WHERE p.user_id = ?
       OR p.id IN (
         SELECT problem_id FROM or_user_participations WHERE user_id = ?
       )
       ORDER BY p.created_at DESC`,
      [userId, userId, userId]
    );
    return problems;
  }

  // 记录用户参与问题
  static async addParticipation(userId, problemId) {
    try {
      await query(
        'INSERT IGNORE INTO or_user_participations (user_id, problem_id) VALUES (?, ?)',
        [userId, problemId]
      );
      return true;
    } catch (error) {
      console.error('Error adding participation:', error);
      return false;
    }
  }

  // 移除用户参与关系
  static async removeParticipation(userId, problemId) {
    try {
      const result = await query(
        'DELETE FROM or_user_participations WHERE user_id = ? AND problem_id = ?',
        [userId, problemId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing participation:', error);
      return false;
    }
  }
}

export default User;