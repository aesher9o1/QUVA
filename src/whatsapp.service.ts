/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
import { Whatsapp, create, Message } from 'venom-bot';
import { AlertHandler } from './utils/alerts.utils';
import { InjectModel } from '@nestjs/mongoose';
import { SubscriberCollection } from './models/subscriber.model';
import { Model } from 'mongoose';
import { WhatsappCommands } from './models/commands.model';

@Injectable()
export class WhatsappService {
  private client: Whatsapp;
  private pincodeRegex: RegExp;
  constructor(
    @InjectModel(SubscriberCollection.name)
    private subscriberModel: Model<SubscriberCollection>,
  ) {
    this.createSession();
    this.pincodeRegex = new RegExp('^[1-9][0-9]{5}$');
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

  async addNumber(phoneNumber: string, pincode: string) {
    if (pincode && this.pincodeRegex.test(pincode)) {
      try {
        await this.subscriberModel.updateOne(
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
        );
        return `Alerts added for ${pincode}`;
      } catch (e) {
        return 'Something unexpected happened';
      }
    } else {
      return `Make sure the pincode entered is correct`;
    }
  }

  private async removeNumber(phoneNumber: string) {
    await this.subscriberModel.deleteMany({ phoneNumber });
    return `All alerts have been removed`;
  }

  private setMessageListener(client: Whatsapp) {
    client.onMessage(async (message) => {
      if (!message.body) return;
      const parts = message.body.toLowerCase().split(/ +/);
      const command = parts.shift();
      try {
        let response: string;
        switch (command) {
          case WhatsappCommands.NOTIFY:
            response = await this.addNumber(message.from, parts.shift());
            break;
          case WhatsappCommands.STOP:
            response = await this.removeNumber(message.from);
            break;
        }
        if (response) await client.sendText(message.from, response);
      } catch (e) {
        console.log(e);
      }
    });
  }

  async getClient() {
    if (!this.client) await this.createSession();
    return this.client;
  }
}
