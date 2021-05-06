import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { ISubscriptionCollection } from 'src/models/subscriber.model';
import { BullQueueNames } from '../utils/config.utils';

@Processor(BullQueueNames.WHATSAPP_ALERTS)
export class WhatsappConsumer {
  @Process()
  async sendMessage(job: Job<ISubscriptionCollection>) {
    return {};
  }

  @OnQueueError()
  async notifySlack(error: Error) {
    console.log(error);
  }
}
