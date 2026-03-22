import amqp, { Connection, Channel } from 'amqplib';
import { logger } from './logger';

let channel: Channel;

export const connectRabbitMQ = async () => {
  const url = process.env.RABBITMQ_URL || 'amqp://localhost';
  try {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange('events', 'topic', { durable: true });
    logger.info("Connected to RabbitMQ");
  } catch (error) {
    logger.error({ err: error }, "Failed to connect to RabbitMQ");
    setTimeout(connectRabbitMQ, 5000); // Retry logic
  }
};

export const publishEvent = (routingKey: string, message: any) => {
  if (!channel) return;
  channel.publish('events', routingKey, Buffer.from(JSON.stringify(message)));
  logger.info({ routingKey, message }, "Event published");
};
