// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'args-mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'argszero',
  password: process.env.DB_PASSWORD || 'Xj9mK2pL5vN8@qR',
  database: process.env.DB_NAME || 'args',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  connectionLimit: 10,
  queueLimit: 0
};

export default dbConfig;