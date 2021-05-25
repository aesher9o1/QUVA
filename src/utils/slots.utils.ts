import moment from 'moment';
import axios from 'axios';
import { ICenter, ICenterMini } from 'src/models/center.model';
import { AlertHandler } from './alerts.utils';
import { Logger } from '@nestjs/common';

export class SlotManager {
  pincode: string;
  age: number;

  constructor(pincode: string, age: number) {
    this.pincode = pincode;
    this.age = age;
  }

  async checkAvailibility(): Promise<ICenterMini[]> {
    Logger.log(
      `CHECKING_AVAILIBILITY_${this.pincode}_${this.age}`,
      this.checkAvailibility.name,
    );
    const availableCenters: ICenterMini[] = [];
    const center = await this.getSlotsForDate(moment().format('DD-MM-YYYY'));
    if (center) availableCenters.push(...center);
    return availableCenters;
  }

  private async getSlotsForDate(date: string): Promise<ICenterMini[]> {
    try {
      const slots = await axios.get(
        `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${this.pincode}&date=${date}
          `,
        {
          headers: {
            accept: 'application/json',
            'Accept-Language': 'hi_IN',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
          },
        },
      );

      const centers: ICenter[] = slots.data.centers;
      if (centers.length > 0) {
        const yesterday = moment().subtract(1, 'day').startOf('day');
        const availableCenters: ICenterMini[] = [];
        centers.forEach((center) => {
          const validSessions = center.sessions.filter(
            (slot) =>
              slot.available_capacity > 0 &&
              moment(slot.date, 'DD/MM/YYYY').isAfter(yesterday),
          );

          if (validSessions.length > 0) {
            availableCenters.push({
              center_id: center.center_id,
              name: center.name,
              address: center.address,
              pincode: center.pincode,
              feeType: center.fee_type,
              sessions: validSessions.map((session) => ({
                date: session.date,
                availableCapacity: session.available_capacity,
                minAgeLimit: session.min_age_limit,
                vaccine: session.vaccine,
                slots: session.slots,
              })),
            });
          }
        });
        return availableCenters;
      }
    } catch (e) {
      Logger.error(e, this.getSlotsForDate.name);
      new AlertHandler().sendText(JSON.stringify(e.response));
      return [];
    }
  }
}
