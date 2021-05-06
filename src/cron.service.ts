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
import { SlotManager } from './utils/slots.utils';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(SubscriberCollection.name)
    private subscriberModel: Model<SubscriberCollection>,
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
    res.forEach((entry) => {
      const slotManager = new SlotManager(entry._id, 200);
      slotManager.checkAvailibility().then((availables) => {
        entry.phoneNumber.forEach((number) => {
          this.messageQueue.add({
            pincode: entry._id,
            phoneNumber: number,
            data: availables,
          });
        });
      });
    });
  }
}
