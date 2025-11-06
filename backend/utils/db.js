import mysql from 'mysql2/promise';
import dbConfig from '../config/database.js';

// 创建数据库连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 获取数据库连接
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

// 执行查询
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute('SELECT 1 + 1 AS result');
    connection.release();
    console.log('Database connection test successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
};

export { getConnection, query, testConnection };
export default pool;