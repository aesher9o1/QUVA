import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { Model } from 'mongoose';
import {
  ISubscriptionCollection,
  SubscriberCollection,
} from './models/subscriber.model';
import { AlertHandler } from './utils/alerts.utils';
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

  @Cron(CronExpression.EVERY_30_SECONDS)
  async sendUpdate() {
    new AlertHandler().sendText('STARTING_CRON');
    Logger.log('STARTING_CRON', this.sendUpdate.name);

    try {
      const res: {
        _id: string;
        data: { phoneNumber: string; age?: number }[];
      }[] = await this.subscriberModel.aggregate([
        {
          $group: {
            _id: '$pincode',
            data: {
              $addToSet: {
                phoneNumber: '$$ROOT.phoneNumber',
                age: '$$ROOT.age',
              },
            },
          },
        },
      ]);

      Logger.log(`DB_FETCH ${res.length}`, this.sendUpdate.name);

      res.forEach((entry, index) => {
        setTimeout(() => {
          const slotManager = new SlotManager(entry._id, 200);

          slotManager
            .checkAvailibility()
            .then((availables) => {
              if (availables?.length)
                Logger.log(entry._id, availables.length.toString());
              availables = availables || [];
              entry.data.forEach((doc) => {
                this.messageQueue.add({
                  pincode: entry._id,
                  phoneNumber: doc.phoneNumber,
                  centers: availables,
                  age: doc.age,
                });
              });
            })
            .catch(() => {});
        }, index * 2);
      });
    } catch (e) {}
  }

  async sendAnnouncement(message: string) {
    try {
      const res = await this.subscriberModel.aggregate([
        {
          $group: {
            _id: '$phoneNumber',
          },
        },
      ]);
      res.forEach((entry) => {
        this.messageQueue.add({
          phoneNumber: entry._id,
          message,
          pincode: '',
          age: 200,
          centers: [] as any,
        });
      });
    } catch (e) {}
  }
}
