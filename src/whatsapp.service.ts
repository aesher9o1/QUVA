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
  }

  private setMessageListener(client: Whatsapp) {
    client.onMessage((message) => console.log(message));
  }

  async getClient() {
    if (!this.client) await this.createSession();
    return this.client;
  }
}
