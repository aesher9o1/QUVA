import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  SubscriberCollection,
  SubscriberSchema,
} from './models/subscriber.model';
import { MongooseHandlerModule } from './modules/mongoose.module';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [
    MongooseHandlerModule,
    MongooseModule.forFeature([
      { name: SubscriberCollection.name, schema: SubscriberSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, WhatsappService],
})
export class AppModule {}
