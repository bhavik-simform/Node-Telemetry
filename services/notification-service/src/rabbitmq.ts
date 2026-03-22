import amqp, { Connection, Channel } from 'amqplib';
import { logger } from './logger';

let channel: Channel;

export const connectRabbitMQ = async () => {
  const url = process.env.RABBITMQ_URL || 'amqp://localhost';
  try {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange('events', 'topic', { durable: true });
    
    // Setup queue for this service and bind it to routing keys
    const q = await channel.assertQueue('notification_service_queue', { durable: true });
    await channel.bindQueue(q.queue, 'events', 'order.created');
    
    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        const event = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        
        // Structured logging of notification
        logger.info({ 
            routingKey, 
            event, 
            message: `Sending notification for order ${event.id} to user ${event.user_id} regarding ${event.product}` 
        }, "Notification processed");

        channel.ack(msg);
    });

    logger.info("Connected to RabbitMQ and consuming events");
  } catch (error) {
    logger.error({ err: error }, "Failed to connect to RabbitMQ");
    setTimeout(connectRabbitMQ, 5000); // Retry logic
  }
};
