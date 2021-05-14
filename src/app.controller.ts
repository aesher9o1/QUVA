import { Body, Controller, Get, Post } from '@nestjs/common';
import _ from 'lodash';
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

  @Post('announcement')
  announce(
    @Body('password') password: string,
    @Body('content') content: string,
  ) {
    if (_.eq(password, process.env.PASSWORD)) {
      this.cronService.sendAnnouncement(content);
      return {
        message: 'DONE',
      };
    } else {
      return {
        message: 'UNAUTHORIZED',
      };
    }
  }
}
