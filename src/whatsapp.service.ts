/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
import { Whatsapp, create } from 'venom-bot';
import { AlertHandler } from './utis/alerts';

@Injectable()
export class WhatsappService {
  private client: Whatsapp;
  constructor() {
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
          console.log({
            body: message.body,
            from: Number(message.from.toString().split('@c.us')[0]),
            pincode: Number(pincodeFromBody),
          });
        }
      }
    });
  }

  async getClient() {
    if (!this.client) await this.createSession();
    return this.client;
  }
}
