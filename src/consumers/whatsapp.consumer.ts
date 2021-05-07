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
    // const test = [
    //   {
    //     name: 'Test Center',
    //     address: 'Test Address',
    //     pincode: '560061',
    //     feeType: 'Free',
    //     sessions: [
    //       {
    //         vaccine: 'Covaxine',
    //         slots: ['9:00-10:00', '13:00-14:00'],
    //       },
    //     ],
    //   },
    // ];
    const info: string[] = [];
    job.data.centers.forEach((center) => {
      info.push(
        `*Name:* ${center.name}\n*Address:* ${center.address}\n*Pin Code:* ${
          center.pincode
        }\n*Payment Method:* ${
          center.feeType
        }\n*Sessions:*\n${center.sessions
          .map(
            (session) =>
              `*Date:* ${session.date}\n*Vaccine:* ${
                session.vaccine
              }\n*Slots:*\n${session.slots.join(', ')}`,
          )
          .join('\n')}`,
      );
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
