import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    targets: [
      {
        target: 'pino-opentelemetry-transport',
        options: {
          loggerName: process.env.OTEL_SERVICE_NAME || 'notification-service',
          resourceAttributes: {
            'service.name': process.env.OTEL_SERVICE_NAME || 'notification-service'
          },
          logRecordProcessorOptions: [
            { recordProcessorType: 'simple' }
          ]
        },
        level: 'info',
      },
      {
        target: 'pino/file',
        options: { destination: 1 },
        level: 'info',
      },
    ],
  },
});
