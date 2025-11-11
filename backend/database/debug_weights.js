import mysql from 'mysql2/promise';

const config = {
  host: '39.105.53.16',
  user: 'argszero',
  password: 'Xj9mK2pL5vN8@qR',
  database: 'or',
  charset: 'utf8mb4'
};

async function debugWeights() {
  let connection;
  try {
    console.log('检查权重数据格式...');

    // 连接到数据库
    connection = await mysql.createConnection(config);

    // 获取权重数据样本
    const [problems] = await connection.execute(`
      SELECT id, weights FROM or_decision_problems
      WHERE weights IS NOT NULL
      LIMIT 5
    `);

    console.log(`找到 ${problems.length} 个有权重数据的问题`);

    for (const problem of problems) {
      console.log(`\n问题 ID: ${problem.id}`);
      console.log(`权重数据原始格式: ${typeof problem.weights} - ${problem.weights}`);

      try {
        const parsed = JSON.parse(problem.weights);
        console.log(`解析成功:`, parsed);
      } catch (error) {
        console.log(`解析失败:`, error.message);

        // 尝试其他解析方式
        if (typeof problem.weights === 'string') {
          console.log('字符串内容:', problem.weights);
          console.log('字符串长度:', problem.weights.length);
          console.log('前10个字符:', problem.weights.substring(0, 10));
        }
      }
    }

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行调试
if (import.meta.url === `file://${process.argv[1]}`) {
  debugWeights()
    .then(() => {
      console.log('✅ 调试完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 调试失败:', error);
      process.exit(1);
    });
}