import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { ISubscriptionCollection } from 'src/models/subscriber.model';
import { WhatsappService } from 'src/whatsapp.service';
import { Whatsapp } from 'venom-bot';
import { BullQueueNames } from '../utils/config.utils';

@Processor(BullQueueNames.WHATSAPP_ALERTS)
export class WhatsappConsumer {
  client: Whatsapp;
  constructor(private readonly whatsappService: WhatsappService) {
    this.whatsappService.getClient().then((client) => {
      this.client = client;
    });
  }

  @Process()
  async sendMessage(job: Job<ISubscriptionCollection>) {
    const info: string[] = [];
    job.data.data.forEach((centers) => {
      centers.forEach((center) => {
        info.push(
          `Name: ${center.name}\nAddress: ${center.address}\nPin: ${
            center.pincode
          }\nFee: ${center.fee_type}\nSessions:${center.sessions
            .map((session) => ({
              vaccine: session.vaccine,
              slots: session.slots.join(', '),
            }))
            .join('\n')}`,
        );
      });
    });
    this.client.sendText(job.data.phoneNumber, info.join('\n\n'));
  }

  @OnQueueError()
  async notifySlack(error: Error) {
    console.log(error);
  }
}
