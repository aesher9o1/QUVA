import { Injectable } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { createBullBoard } from 'bull-board';
import { BullAdapter } from 'bull-board/bullAdapter';
import { InjectQueue } from '@nestjs/bull';
import { Queues } from './modules/bull.module';
import { Queue } from 'bull';

@Injectable()
export class AppService {
  constructor(
    private readonly whatsappService: WhatsappService,
    @InjectQueue(Queues.MESSAGE) private readonly messageQueue: Queue,
  ) {
    createBullBoard([new BullAdapter(messageQueue)]);
  }

  async startWhatsapp() {
    const whatsappClient = await this.whatsappService.getClient();
    whatsappClient.sendText('9660690531', 'hello how are you');

    return {
      message: 'DONE',
    };
  }
}
