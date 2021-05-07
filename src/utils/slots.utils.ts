import * as moment from 'moment';
import axios from 'axios';
import { ICenter, ICenterMini } from 'src/models/center.model';

export class SlotManager {
  pincode: string;
  age: number;

  constructor(pincode: string, age: number) {
    this.pincode = pincode;
    this.age = age;
  }

  async checkAvailibility(): Promise<ICenterMini[]> {
    const datesArray = this.fetchNext10Days();
    const availableCenters: ICenterMini[] = [];
    const tasks = [];
    datesArray.forEach((date) => {
      tasks.push(this.getSlotsForDate(date));
    });
    const res: ICenterMini[][] = await Promise.all(tasks);
    res.forEach((center) => {
      if (center) availableCenters.push(...center);
    });
    return availableCenters;
  }

  private fetchNext10Days() {
    const dates: string[] = [];
    const today = moment();
    for (let i = 0; i < 10; i++) {
      const dateString = today.format('DD-MM-YYYY');
      dates.push(dateString);
      today.add(1, 'day');
    }
    return dates;
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
        const availableCenters: ICenterMini[] = [];
        centers.forEach((center) => {
          const validSessions = center.sessions.filter(
            (slot) => slot.available_capacity > 0,
          );

          if (validSessions.length > 0) {
            availableCenters.push({
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
      console.log(e);
      return [];
    }
  }
}
