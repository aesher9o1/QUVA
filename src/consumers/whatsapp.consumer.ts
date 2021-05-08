import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { ISubscriptionCollection } from 'src/models/subscriber.model';
import { WhatsappService } from 'src/whatsapp.service';
import { BullQueueNames } from '../utils/config.utils';

@Processor(BullQueueNames.WHATSAPP_ALERTS)
export class WhatsappConsumer {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Process()
  sendMessage(job: Job<ISubscriptionCollection>) {
    console.log('Generating message');
    const info: string[] = [];

    if (!job.data?.centers) return;

    if (!job.data.centers.length) {
      this.whatsappService.getClient().then((client) => {
        client
          .sendText(
            job.data.phoneNumber,
            `This is no notify you that there are no available slots at ${job.data.pincode} location yet. However we'll keep notifying you about the updates`,
          )
          .then(() => console.log('Sent message'))
          .catch((e) => console.log(e));
      });
    }
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
    console.log('Sending message');
    this.whatsappService.getClient().then((client) => {
      client
        .sendText(job.data.phoneNumber, info.join('\n\n'))
        .then(() => console.log('Sent message'))
        .catch((e) => console.log(e));
    });
  }

  @OnQueueError()
  async notifySlack(error: Error) {
    console.log(error);
  }
}
