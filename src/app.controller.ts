import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { WhatsappService } from './whatsapp.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Get('startWhatsapp')
  async startWhatsapp() {
    return await this.appService.startWhatsapp();
  }

  // @Get('stopWhatsapp')
  // async stopWhatsapp() {
  //   return await this.appService.stopWhatsapp();
  // }

  @Get('addSubscriber')
  addSubscriber(@Query('pin') pin: string, @Query('number') number: string) {
    this.whatsappService.addSubscriber(number, pin);
    return {
      message: 'DONE',
    };
  }
}
