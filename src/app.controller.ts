import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('startWhatsapp')
  async startWhatsapp() {
    return await this.appService.startWhatsapp();
  }

  // @Get('stopWhatsapp')
  // async stopWhatsapp() {
  //   return await this.appService.stopWhatsapp();
  // }
}
