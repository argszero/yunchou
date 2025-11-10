import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './utils/db.js';
import initializeDatabase from './database/init.js';
import problemsRouter from './routes/problems.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 添加JSON解析中间件
app.use(express.json());

// API路由
app.use('/api/problems', problemsRouter);

// 数据库健康检查接口
app.get('/api/health/db', async (_req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({ status: 'ok', message: 'Database connection successful' });
    } else {
      res.status(503).json({ status: 'error', message: 'Database connection failed' });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});

// 在生产模式下提供静态文件服务
if (process.env.NODE_ENV === 'production') {
  // 提供静态文件服务
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // 处理SPA路由，所有未匹配的路由都返回index.html
  app.use((_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// 启动服务器并初始化数据库
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // 初始化数据库
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    // 测试数据库连接
    console.log('Testing database connection...');
    await testConnection();
    console.log('Database connection test passed');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
});