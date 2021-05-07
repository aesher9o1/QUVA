import { BullModule, InjectQueue } from '@nestjs/bull';
import { MiddlewareConsumer, NestModule, Module } from '@nestjs/common';
import { Queue } from 'bull';
import { createBullBoard } from 'bull-board';
import { BullAdapter } from 'bull-board/bullAdapter';
import { BullQueueNames } from '../utils/config.utils';
import { WhatsappConsumer } from 'src/consumers/whatsapp.consumer';
import { WhatsappService } from 'src/whatsapp.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubscriberCollection,
  SubscriberSchema,
} from 'src/models/subscriber.model';

const MessageQueueModule = BullModule.registerQueueAsync({
  name: BullQueueNames.WHATSAPP_ALERTS,
  useFactory: () => ({
    name: BullQueueNames.WHATSAPP_ALERTS,
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
  imports: [
    MessageQueueModule,
    MongooseModule.forFeature([
      { name: SubscriberCollection.name, schema: SubscriberSchema },
    ]),
  ],
  providers: [WhatsappConsumer, WhatsappService],
  exports: [MessageQueueModule],
})
export class BullQueueManager implements NestModule {
  constructor(
    @InjectQueue(BullQueueNames.WHATSAPP_ALERTS)
    private readonly messageQueue: Queue,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const { router } = createBullBoard([new BullAdapter(this.messageQueue)]);
    consumer.apply(router).forRoutes('queues');
  }
}
