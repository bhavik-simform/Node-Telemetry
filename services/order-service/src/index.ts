import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { initDB, pool } from './db';
import { connectRabbitMQ, publishEvent } from './rabbitmq';
import { metrics } from '@opentelemetry/api';

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

const meter = metrics.getMeter('order-service');
const orderCreateCounter = meter.createCounter('order_created_total', {
  description: 'Total number of orders created',
});

app.post('/orders', async (req, res) => {
  const { user_id, product, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO orders (user_id, product, amount) VALUES ($1, $2, $3) RETURNING id, user_id, product, amount',
      [user_id, product, amount]
    );
    const order = result.rows[0];
    
    // Publish event
    publishEvent('order.created', order);
    
    // Custom metrics
    orderCreateCounter.add(1);

    res.status(201).json(order);
  } catch (error: any) {
    logger.error({ err: error }, "Failed to create order");
    res.status(500).json({ error: error.message });
  }
});

app.get('/orders/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error({ err: error }, "Failed to fetch order");
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;

const start = async () => {
  await initDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    logger.info(`Order service listening on port ${PORT}`);
  });
};

start();
