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
    // Cache users from user service locally to enforce foreign keys logic
    await client.query(`
      CREATE TABLE IF NOT EXISTS local_users (
        id INTEGER PRIMARY KEY,
        email VARCHAR(100) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES local_users(id),
        product VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
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
