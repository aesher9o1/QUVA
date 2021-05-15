import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import _ from 'lodash';
import { ICenterMini } from 'src/models/center.model';
import { ISubscriptionCollection } from 'src/models/subscriber.model';
import { AlertHandler } from 'src/utils/alerts.utils';
import { WhatsappService } from 'src/whatsapp.service';
import { BullQueueNames } from '../utils/config.utils';

@Processor(BullQueueNames.WHATSAPP_ALERTS)
export class WhatsappConsumer {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Process()
  async sendMessage(job: Job<ISubscriptionCollection>) {
    return new Promise(async (resolve) => {
      const currentTime = new Date();
      const sendInavailability =
        currentTime.getHours() % 3 === 0 && currentTime.getMinutes() % 30 === 0;
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
            // if (_.isNil(job.data.message)) {
            if (!_.isNil(job.data.age)) {
              const data: ICenterMini[] = [];
              job.data.centers.forEach((center) => {
                center.sessions = center.sessions.filter(
                  (session) =>
                    _.eq(session.minAgeLimit, job.data.age) ||
                    _.eq(job.data.age, -1),
                );
                if (center.sessions.length > 0) data.push(center);
              });
              job.data.centers = data;
            }
            if (_.isNil(job.data.message)) {
              if (!job.data.centers.length) {
                if (sendInavailability) {
                  client.sendText(
                    job.data.phoneNumber,
                    `This is to notify you that there are no available slots at ${job.data.pincode} location yet. However we'll keep notifying you about the updates periodically.`,
                  );
                }
                job.progress(100);
                resolve(true);
              } else {
                const message = [];
                const grouped_centers = _.values(
                  _.groupBy(job.data.centers, 'center_id'),
                );
                grouped_centers.forEach((center) => {
                  message.push(
                    ...[
                      `*Name:* ${center[0].name}`,
                      `*Address:* ${center[0].address}`,
                      `*Pin Code:* ${center[0].pincode}`,
                      `*Fee Type:* ${center[0].feeType}`,
                      `*Age Group:* ${center[0].sessions[0].minAgeLimit}`,
                    ],
                  );
                  const sessions = _.uniqBy(
                    _.flatMap(center.map((sub_center) => sub_center.sessions)),
                    'date',
                  );
                  message.push(
                    `*Vaccines:* ${_.uniq(
                      sessions.map((session) => session.vaccine),
                    ).join(', ')}`,
                  );
                  // message.push(
                  //   `*Time Slots:* ${_.uniq(
                  //     _.flatMapDeep(sessions.map((session) => session.slots)),
                  //   ).join(', ')}`,
                  // );
                  message.push('*Availability:*');
                  sessions.forEach((session, index) => {
                    message.push(
                      `\t\t\t\t\t\t\t\t\t\t\t*${
                        index + 1
                      }:*  ${session.date.replace(/-/g, '/')} *-* ${
                        session.availableCapacity
                      } slots${_.eq(index, sessions.length - 1) ? '\n' : ''}`,
                    );
                  });
                });
                client
                  .sendText(job.data.phoneNumber, message.join('\n'))
                  .catch(() => {
                    job.progress(100);
                    resolve(true);
                  })
                  .then(() => {
                    job.progress(100);
                    resolve(true);
                  });
              }
            } else {
              client
                .sendText(job.data.phoneNumber, job.data.message)
                .catch(() => {
                  job.progress(100);
                  resolve(true);
                })
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
