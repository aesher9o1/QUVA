/* eslint-disable @typescript-eslint/no-empty-function */
import _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { Whatsapp, create } from 'venom-bot';
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
    this.pincodeRegex = new RegExp('^[1-9][0-9]{5}$');
  }

  public async createSession() {
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
          updatesLog: false,
          headless: true,
          disableWelcome: true,
          debug: false,
          logQR: false,
          disableSpins: true,
          browserArgs: [
            '--disable-web-security',
            '--no-sandbox',
            '--disable-web-security',
            '--aggressive-cache-discard',
            '--disable-cache',
            '--disable-application-cache',
            '--disable-offline-load-stale-cache',
            '--disk-cache-size=0',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
          ],
        },
      );

      this.setMessageListener(this.client);
    } catch (e) {
      console.log(e);
    }
  }

  async addNumber(phoneNumber: string, pincode: string) {
    pincode = pincode.replace(/>/g, '').replace(/</g, '');
    if (pincode && this.pincodeRegex.test(pincode)) {
      this.client.sendText(
        phoneNumber,
        `You have subscribed to vaccine slots notification. We pray for you and your family's safety and welfare. *Team QuillBot*`,
      );
      try {
        const find_age = (
          await this.subscriberModel.findOne({
            phoneNumber,
            age: { $ne: null },
          })
        )?.age;
        console.log(`AGE ${find_age}`);
        await this.subscriberModel.updateOne(
          {
            phoneNumber,
            pincode,
          },
          {
            phoneNumber,
            pincode,
            age: !_.isNaN(find_age) ? find_age : -1,
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

  private async ageUpdate(phoneNumber: string, age: number) {
    let age_text = 'Age filter set to ';
    await this.subscriberModel.updateMany({ phoneNumber }, { $set: { age } });
    if (_.eq(age, 18)) {
      age_text += '18-44';
    } else if (_.eq(age, 45)) {
      age_text += '45+';
    } else if (_.eq(age, -1)) {
      age_text += 'all';
    } else {
      age_text =
        'Invalid age filter provided. Age filter must be *18*, *45* or *all*';
    }
    return age_text;
  }

  private async listPins(phoneNumber: string) {
    const res = await this.subscriberModel.find({ phoneNumber });
    if (res.length > 0) {
      return `Listening to alerts for: \n${res
        .map((doc, index) => `${index + 1}. ${doc.pincode}`)
        .join('\n')}`;
    } else {
      return `You haven't subscribed to any pincodes.`;
    }
  }

  private help() {
    return [
      '- To receive notifications for a certain pincode, simply type *notify pincode*, for example to subscribe for pincode 208026, type *notify 208026*',
      '- Notifications will only be sent if slots are available',
      '- You can be notified about multiple pincodes at a time',
      '- You can also set age filter to *18*, *45* or *all*, for example to set age to 18+ filter simply type *age 18*',
      '- To stop notifications, type in *stop* whereafter no messages will be sent until you ask for notifications again.',
      '- To view the list of pins you are notified about, type in *list*.',
    ].join('\n');
  }

  private setMessageListener(client: Whatsapp) {
    if (!_.isNil(client)) {
      client.onMessage(async (message) => {
        console.log(`MESSAGE RECEIVED: ${message.body}`);
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
            case WhatsappCommands.AGE:
              const age_part = parts.shift();
              let age = parseInt(age_part);
              if (_.eq(age_part, 'all')) {
                age = -1;
              }
              response = await this.ageUpdate(
                message.from,
                isNaN(age) ? 0 : age,
              );
              break;
            case WhatsappCommands.LIST:
              response = await this.listPins(message.from);
              break;
            default:
              response = this.help();
              break;
          }
          if (response) await client.sendText(message.from, response);
        } catch (e) {
          console.log(e);
        }
      });
    }
  }

  async getClient() {
    if (!this.client) await this.createSession();
    return this.client;
  }
}
