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
          updatesLog: true,
          headless: true,
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

  async addNumber(phoneNumber: string, pincode: string, age: number) {
    pincode = pincode.replace(/>/g, '').replace(/</g, '');
    if (pincode && this.pincodeRegex.test(pincode)) {
      this.client.sendText(
        phoneNumber,
        `You have subscribed to vaccine slots notification. We pray for you and your family's safety and welfare. *Team QuillBot*`,
      );
      try {
        if (isNaN(age)) age = null;
        await this.subscriberModel.updateOne(
          {
            phoneNumber,
            pincode,
            age,
          },
          {
            phoneNumber,
            pincode,
            age,
          },
          {
            upsert: true,
          },
        );
        return `Alerts added for ${pincode} ${age ? `for age ${age}` : ''}`;
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

  private async listPins(phoneNumber: string) {
    const res = await this.subscriberModel.find({ phoneNumber });
    return `Listening to alerts for: \n${res
      .map(
        (doc, index) =>
          `${index + 1}. ${doc.pincode} ${doc.age ? `(${doc.age})` : ''}`,
      )
      .join('\n')}`;
  }

  private help() {
    return [
      '- To recieve notifications for a certain pincode, simply type *notify <pincode>*.',
      '- You can be notified about multiple pincodes at a time with updates on an hourly basis.',
      '- To stop notifications, type in *stop* whereafter no messages will be sent until you ask for notifications again.',
      '- To view the list of pins you are notified about, type in *list*.',
    ].join('\n');
  }

  private setMessageListener(client: Whatsapp) {
    if (!_.isNil(client)) {
      client.onMessage(async (message) => {
        if (!message.body) return;
        const parts = message.body.toLowerCase().split(/ +/);
        const command = parts.shift();

        try {
          let response: string;
          switch (command) {
            case WhatsappCommands.NOTIFY:
              response = await this.addNumber(
                message.from,
                parts.shift(),
                parseInt(parts.shift()),
              );
              break;
            case WhatsappCommands.STOP:
              response = await this.removeNumber(message.from);
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
