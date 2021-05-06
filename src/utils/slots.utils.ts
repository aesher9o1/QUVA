import moment from 'moment';
import axios from 'axios';

export class SlotManager {
  pincode: string;
  age: number;

  constructor(pincode: string, age: number) {
    this.pincode = pincode;
    this.age = age;
  }
  async checkAvailibility() {
    const datesArray = await this.fetchNext10Days();
    datesArray.forEach((date) => {
      this.getSlotsForDate(date);
    });
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

  private getSlotsForDate(date: string) {
    axios
      .get(
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
      )
      .then(function (slots) {
        const centers = slots.data.centers;

        if (centers.length > 0) {
          centers.forEach((center) => {
            const sessions = center.sessions;
            const validSlots = sessions.filter(
              (slot) =>
                slot.min_age_limit <= this.age && slot.available_capacity > 0,
            );

            if (validSlots.length > 0) {
              // send alert
            }
          });
        }
      })
      .catch(function (error) {
        //   console.log(error);
      });
  }
}
