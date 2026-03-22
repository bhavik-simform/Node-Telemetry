import amqp, { Connection, Channel } from 'amqplib';
import { logger } from './logger';
import { pool } from './db';

let channel: Channel;

export const connectRabbitMQ = async () => {
  const url = process.env.RABBITMQ_URL || 'amqp://localhost';
  try {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange('events', 'topic', { durable: true });
    
    const q = await channel.assertQueue('order_service_queue', { durable: true });
    await channel.bindQueue(q.queue, 'events', 'user.created');
    
    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        const event = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        logger.info({ routingKey, event }, "Received event");

        if (routingKey === 'user.created') {
            try {
                // Keep local representation
                await pool.query(
                    'INSERT INTO local_users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [event.id, event.email]
                );
                channel.ack(msg);
            } catch (err) {
                logger.error({ err }, "Error processing user.created event");
                channel.nack(msg);
            }
        }
    });

    logger.info("Connected to RabbitMQ and consuming events");
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
