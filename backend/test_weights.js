import mysql from 'mysql2/promise';

const config = {
  host: '39.105.53.16',
  user: 'argszero',
  password: 'Xj9mK2pL5vN8@qR',
  database: 'or',
  charset: 'utf8mb4'
};

async function testWeights() {
  let connection;
  try {
    console.log('测试权重数据重构...');

    // 连接到数据库
    connection = await mysql.createConnection(config);

    // 1. 检查criteria表是否有weight字段
    console.log('\n1. 检查criteria表结构...');
    const [criteriaColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'or' AND TABLE_NAME = 'or_criteria' AND COLUMN_NAME = 'weight'
    `);

    if (criteriaColumns.length > 0) {
      console.log('✅ criteria表包含weight字段:', criteriaColumns[0]);
    } else {
      console.log('❌ criteria表缺少weight字段');
    }

    // 2. 检查权重数据迁移情况
    console.log('\n2. 检查权重数据迁移情况...');
    const [criteriaWithWeights] = await connection.execute(`
      SELECT COUNT(*) as count FROM or_criteria WHERE weight IS NOT NULL
    `);
    console.log(`✅ 有 ${criteriaWithWeights[0].count} 个准则已分配权重`);

    // 3. 检查示例数据
    console.log('\n3. 检查示例权重数据...');
    const [sampleCriteria] = await connection.execute(`
      SELECT c.id, c.name, c.weight, p.id as problem_id, p.title
      FROM or_criteria c
      JOIN or_decision_problems p ON c.problem_id = p.id
      WHERE c.weight IS NOT NULL
      LIMIT 5
    `);

    console.log('示例准则权重数据:');
    sampleCriteria.forEach(criterion => {
      console.log(`  - ${criterion.name}: ${criterion.weight}% (问题: ${criterion.title})`);
    });

    // 4. 检查决策问题是否不再包含weights字段
    console.log('\n4. 检查决策问题表结构...');
    const [problemColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'or' AND TABLE_NAME = 'or_decision_problems' AND COLUMN_NAME = 'weights'
    `);

    if (problemColumns.length > 0) {
      console.log('ℹ️  decision_problems表仍包含weights字段（暂时保留）');
    } else {
      console.log('✅ decision_problems表已移除weights字段');
    }

    console.log('\n✅ 权重数据重构测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testWeights()
    .then(() => {
      console.log('✅ 权重重构测试完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 权重重构测试失败:', error);
      process.exit(1);
    });
}