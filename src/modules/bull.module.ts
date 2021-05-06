import { BullModule, InjectQueue } from '@nestjs/bull';
import { MiddlewareConsumer, NestModule, Module } from '@nestjs/common';
import { Queue } from 'bull';
import { createBullBoard } from 'bull-board';
import { BullAdapter } from 'bull-board/bullAdapter';

export enum Queues {
  WHATSAPP_ALERTS = 'whatsapp_alerts',
}

const MessageQueueModule = BullModule.registerQueueAsync({
  name: Queues.WHATSAPP_ALERTS,
  useFactory: () => ({
    name: Queues.WHATSAPP_ALERTS,
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

@Module({
  imports: [MessageQueueModule],
})
export class BullQueueManager implements NestModule {
  constructor(
    @InjectQueue(Queues.WHATSAPP_ALERTS) private readonly messageQueue: Queue,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const { router } = createBullBoard([new BullAdapter(this.messageQueue)]);
    consumer.apply(router).forRoutes('queues');
  }
}
