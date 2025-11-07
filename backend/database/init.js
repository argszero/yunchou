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

async function initializeDatabase() {
  let connection;
  try {
    console.log('Connecting to MySQL database...');

    // Connect to MySQL without specifying database first
    const tempConfig = { ...config };
    delete tempConfig.database;
    connection = await mysql.createConnection(tempConfig);

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${config.database}' created or already exists`);

    // Close temporary connection
    await connection.end();

    // Connect to the specific database
    connection = await mysql.createConnection(config);
    console.log('Connected to database successfully');

    // Read and execute schema SQL
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL by semicolons and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('Executed SQL statement');
      }
    }

    console.log('Database schema initialized successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase;