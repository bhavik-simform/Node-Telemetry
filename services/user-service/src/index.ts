import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { initDB, pool } from './db';
import { connectRabbitMQ, publishEvent } from './rabbitmq';
import { metrics } from '@opentelemetry/api';

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

const meter = metrics.getMeter('user-service');
const userCreateCounter = meter.createCounter('user_created_total', {
  description: 'Total number of users created',
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
      [name, email]
    );
    const user = result.rows[0];
    
    // Publish event
    publishEvent('user.created', user);
    
    // Custom metrics
    userCreateCounter.add(1);

    res.status(201).json(user);
  } catch (error: any) {
    logger.error({ err: error }, "Failed to create user");
    res.status(500).json({ error: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error({ err: error }, "Failed to fetch user");
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

const start = async () => {
  await initDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    logger.info(`User service listening on port ${PORT}`);
  });
};

start();
