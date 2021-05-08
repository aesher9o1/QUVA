import { Controller, Get } from '@nestjs/common';
import { CronService } from './cron.service';

@Controller()
export class AppController {
  constructor(private readonly cronService: CronService) {}

  // @Get('addSubscriber')
  // addSubscriber(@Query('pin') pin: string, @Query('number') number: string) {
  //   this.whatsappService.addNumber(number, pin);
  //   return {
  //     message: 'DONE',
  //   };
  // }

  @Get('getSlots')
  async getSlots() {
    await this.cronService.sendUpdate();
    return {
      message: 'DONE',
    };
  }
}
