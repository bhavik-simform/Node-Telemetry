import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { connectRabbitMQ } from './rabbitmq';

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 3003;

const start = async () => {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    logger.info(`Notification service listening on port ${PORT}`);
  });
};

start();
