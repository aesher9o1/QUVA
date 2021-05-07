import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { CronService } from './cron.service';
import {
  SubscriberCollection,
  SubscriberSchema,
} from './models/subscriber.model';
import { BullQueueManager } from './modules/bull.module';
import { MongooseHandlerModule } from './modules/mongoose.module';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [
    MongooseHandlerModule,
    ScheduleModule.forRoot(),
    BullQueueManager,
    MongooseModule.forFeature([
      { name: SubscriberCollection.name, schema: SubscriberSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [WhatsappService, CronService],
})
export class AppModule {}
