import { Pool } from 'pg';
import { logger } from './logger';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const initDB = async () => {
  try {
    const client = await pool.connect();
    // Wait for DB to be ready, docker healthcheck should handle but just in case
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info("Database initialized successfully");
    client.release();
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize database");
    setTimeout(initDB, 5000); // Retry after 5 secs
  }
};
