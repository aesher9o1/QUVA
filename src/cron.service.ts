import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { Model } from 'mongoose';
import {
  ISubscriptionCollection,
  SubscriberCollection,
} from './models/subscriber.model';
import { BullQueueNames } from './utils/config.utils';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(SubscriberCollection.name)
    private subscriberModel: Model<SubscriberCollection>,
    private readonly whatsappService: WhatsappService,
    @InjectQueue(BullQueueNames.WHATSAPP_ALERTS)
    private readonly messageQueue: Queue<ISubscriptionCollection>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendUpdate() {
    // add data to queue like this
    // this.messageQueue.add({});
    const res = await this.subscriberModel.aggregate([
      {
        $group: {
          _id: '$pincode',
          phoneNumber: {
            $push: '$$ROOT.phoneNumber',
          },
        },
      },
    ]);
    const client = await this.whatsappService.getClient();
    res.forEach((entry) => {
      entry.phoneNumber.forEach((number) => {
        client
          .sendText(`@c.us${number}`, entry._id)
          .catch((e) => console.log(e));
      });
    });
  }
}
