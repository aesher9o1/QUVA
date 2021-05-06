import { Injectable } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class AppService {
  constructor(private readonly whatsappService: WhatsappService) {}

  async startWhatsapp() {
    const whatsappClient = await this.whatsappService.getClient();
    whatsappClient.sendText('9660690531', 'hello how are you');

    return {
      message: 'DONE',
    };
  }
}
