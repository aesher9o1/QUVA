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

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendUpdate() {
    try {
      console.log('Sending Update');
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
        slotManager
          .checkAvailibility()
          .then((availables) => {
            availables = availables || [];

            console.log(`Acquired ${availables.length} places`);
            entry.phoneNumber.forEach((number: string) => {
              this.messageQueue
                .add({
                  pincode: entry._id,
                  phoneNumber: number,
                  centers: availables,
                })
                .catch((e) => console.log(e));
            });
          })
          .catch((e) => {
            console.log(e);
          });
      });
    } catch (e) {
      console.log(e);
    }
  }
}
