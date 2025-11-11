import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const config = {
  host: '39.105.53.16',
  user: 'argszero',
  password: 'Xj9mK2pL5vN8@qR',
  database: 'or',
  charset: 'utf8mb4'
};

async function migrateWeights() {
  let connection;
  try {
    console.log('开始迁移权重数据...');

    // 连接到数据库
    connection = await mysql.createConnection(config);
    console.log('数据库连接成功');

    // 1. 为 or_criteria 表添加 weight 字段
    console.log('为 or_criteria 表添加 weight 字段...');
    try {
      await connection.execute(`
        ALTER TABLE or_criteria
        ADD COLUMN weight DECIMAL(5,2) DEFAULT NULL
      `);
      console.log('✅ 成功添加 weight 字段');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  weight 字段已存在，跳过添加');
      } else {
        throw error;
      }
    }

    // 2. 迁移现有权重数据
    console.log('开始迁移现有权重数据...');

    // 获取所有有权重数据的决策问题
    const [problemsWithWeights] = await connection.execute(`
      SELECT id, weights FROM or_decision_problems
      WHERE weights IS NOT NULL AND JSON_LENGTH(weights) > 0
    `);

    console.log(`找到 ${problemsWithWeights.length} 个有权重数据的决策问题`);

    let totalMigrated = 0;

    for (const problem of problemsWithWeights) {
      const problemId = problem.id;

      // 处理权重数据格式（可能是字符串格式 "25,20,15,20,10,10"）
      let weights;
      if (typeof problem.weights === 'string' && problem.weights.includes(',')) {
        // 字符串格式，直接分割
        weights = problem.weights.split(',').map(w => parseFloat(w.trim()));
      } else if (typeof problem.weights === 'string') {
        // 尝试JSON解析
        try {
          weights = JSON.parse(problem.weights);
        } catch {
          console.log(`无法解析权重数据: ${problem.weights}`);
          continue;
        }
      } else {
        // 其他格式，直接使用
        weights = problem.weights;
      }

      // 获取该问题的所有准则（按 sort_order 排序）
      const [criteria] = await connection.execute(`
        SELECT id, sort_order FROM or_criteria
        WHERE problem_id = ?
        ORDER BY sort_order
      `, [problemId]);

      console.log(`问题 ${problemId}: ${criteria.length} 个准则, ${weights.length} 个权重`);

      // 将权重分配给对应的准则
      for (let i = 0; i < Math.min(criteria.length, weights.length); i++) {
        const criterion = criteria[i];
        const weight = weights[i];

        await connection.execute(`
          UPDATE or_criteria
          SET weight = ?
          WHERE id = ?
        `, [weight, criterion.id]);

        totalMigrated++;
      }
    }

    console.log(`✅ 成功迁移 ${totalMigrated} 个准则的权重数据`);

    // 3. 可选：移除 or_decision_problems 表的 weights 字段
    // 暂时保留，等确认迁移成功后再移除
    console.log('ℹ️  权重数据迁移完成，or_decision_problems.weights 字段暂时保留');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行迁移
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateWeights()
    .then(() => {
      console.log('✅ 权重数据迁移完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 权重数据迁移失败:', error);
      process.exit(1);
    });
}

export default migrateWeights;