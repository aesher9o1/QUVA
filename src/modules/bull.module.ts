import { BullModule } from '@nestjs/bull';

export enum Queues {
  MESSAGE = 'MESSAGE',
}
export const MessageQueueModule = BullModule.registerQueueAsync({
  name: Queues.MESSAGE,
  useFactory: () => ({
    name: Queues.MESSAGE,
    redis: { host: 'localhost', port: 6379 },
    defaultJobOptions: {
      removeOnComplete: true,
      delay: 250,
      removeOnFail: false,
      attempts: 3,
    },
    prefix: 'WAPP',
    settings: {
      retryProcessDelay: 300,
      lockRenewTime: 1000,
      maxStalledCount: 0,
      lockDuration: 300000,
    },
  }),
});
