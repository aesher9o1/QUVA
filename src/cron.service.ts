import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { SubscriberCollection } from './models/subscriber.model';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(SubscriberCollection.name)
    private subscriberModel: Model<SubscriberCollection>,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Cron('0 * * * *')
  async sendUpdate() {
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
