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

  // 获取用户的所有决策问题
  static async getUserDecisionProblems(userId) {
    const problems = await query(
      `SELECT id, title, description, weights, consistency_ratio, is_consistent, created_at, updated_at
       FROM or_decision_problems
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return problems;
  }
}

export default User;