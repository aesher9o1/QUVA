import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { ISubscriptionCollection } from 'src/models/subscriber.model';
import { AlertHandler } from 'src/utils/alerts.utils';
import { WhatsappService } from 'src/whatsapp.service';
import { BullQueueNames } from '../utils/config.utils';

@Processor(BullQueueNames.WHATSAPP_ALERTS)
export class WhatsappConsumer {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Process()
  async sendMessage(job: Job<ISubscriptionCollection>) {
    return new Promise(async (resolve, reject) => {
      const info: string[] = [];
      if (_.isNil(job?.data?.centers)) {
        job.progress(100);
        resolve(true);
      } else {
        try {
          const client = await this.whatsappService.getClient();
          if (_.isNil(client?.isLoggedIn)) {
            job.progress(100);
            resolve(true);
          } else {
            if (!job.data.centers.length) {
              client.sendText(
                job.data.phoneNumber,
                `This is no notify you that there are no available slots at ${job.data.pincode} location yet. However we'll keep notifying you about the updates`,
              );
              job.progress(100);
              resolve(true);
            } else {
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

              client
                .sendText(job.data.phoneNumber, info.join('\n\n'))
                .catch((e: any) => {})
                .then(() => {
                  job.progress(100);
                  resolve(true);
                });
            }
          }
        } catch (e) {
          new AlertHandler().sendText(JSON.stringify(e));
          job.progress(100);
          resolve(true);
        }
      }
    });
  }

  @OnQueueError()
  async notifySlack(error: Error) {
    console.log(error);
  }
}
