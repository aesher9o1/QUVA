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
  sendMessage(job: Job<ISubscriptionCollection>) {
    console.log('Sending message');
    const info: string[] = [];
    job.data.centers.forEach((center) => {
      const message = [
        `*Name:* ${center.name}`,
        `*Address:* ${center.address}`,
        `*Pin Code:* ${center.pincode}`,
        `*Fee Type:* ${center.feeType}`,
        '*Available Sessions:*',
        `*---*`,
      ];
      center.sessions.forEach((session, index) => {
        if (index !== 0) message.push(`\n`);
        message.push(`*Date:* ${session.date}`);
        message.push(`*Age Group:* ${session.minAgeLimit}`);
        message.push(`*Availability:* ${session.availableCapacity}`);
        message.push(`*Vaccine:* ${session.vaccine}`);
        message.push(
          `*Slots:* ${
            session.slots.length > 0
              ? `\n${session.slots.join(', ')}`
              : 'Slot Information Unavailable'
          }`,
        );
      });
      message.push('*---*');
      info.push(message.join('\n'));
    });
    this.client
      .sendText(`${job.data.phoneNumber}@c.us`, info.join('\n\n'))
      .then(() => console.log('Sent Message'))
      .catch((e) => console.log(e));
  }

  @OnQueueError()
  async notifySlack(error: Error) {
    console.log(error);
  }
}
