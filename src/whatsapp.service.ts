/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
import { Whatsapp, create } from 'venom-bot';
import { AlertHandler } from './utils/alerts.utils';
import { InjectModel } from '@nestjs/mongoose';
import { SubscriberCollection } from './models/subscriber.model';
import { Model } from 'mongoose';

@Injectable()
export class WhatsappService {
  private client: Whatsapp;
  constructor(
    @InjectModel(SubscriberCollection.name)
    private subscriberModel: Model<SubscriberCollection>,
  ) {
    this.createSession();
  }

  private async createSession() {
    try {
      this.client = await create(
        'qcine',
        //catchQR
        (base64Qrimg) => {
          new AlertHandler().sendBase64Img(base64Qrimg);
        },
        () => {},
        {
          useChrome: false,
          headless: true,
          debug: false,
          logQR: false,
          disableSpins: true,
        },
      );

      this.setMessageListener(this.client);
    } catch (e) {
      console.log(e);
    }
  }

  private setMessageListener(client: Whatsapp) {
    client.onMessage((message) => {
      const PINCODE_REGEX = new RegExp('^[1-9][0-9]{5}$');

      if (message.body) {
        const pincodeFromBody = message.body.split('notify ')[1];

        if (pincodeFromBody && PINCODE_REGEX.test(pincodeFromBody)) {
          const phoneNumber = message.from.toString().split('@c.us')[0];
          this.addSubscriber(phoneNumber, pincodeFromBody);
        }
      }
    });
  }

  addSubscriber(phoneNumber: string, pincode: string) {
    console.log(`Adding ${phoneNumber}`);
    this.subscriberModel
      .updateOne(
        {
          phoneNumber,
          pincode,
        },
        {
          phoneNumber,
          pincode,
        },
        {
          upsert: true,
        },
      )
      .catch((err) => console.log(err));
  }

  async getClient() {
    if (!this.client) await this.createSession();
    return this.client;
  }
}
