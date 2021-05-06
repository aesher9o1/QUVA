import * as fs from 'fs';
import * as FormData from 'form-data';
import axios from 'axios';

export class AlertHandler {
  sendBase64Img(image: string) {
    const filePrefix = new Date().getTime().toString();
    const imgAsBase64 = image.substring(image.indexOf(',') + 1);
    fs.writeFileSync(`${filePrefix}.png`, imgAsBase64, 'base64');

    const data = new FormData();
    data.append('channels', process.env.BOT_ALERT_CHANNEL);
    data.append('title', 'LOGIN TO WHATSAPP');
    data.append('file', fs.createReadStream(`${filePrefix}.png`));

    axios({
      url: 'https://slack.com/api/files.upload',
      method: 'POST',
      headers: {
        ...data.getHeaders(),
        Authorization: `Bearer ${process.env.BOT_ACCESS_TOKEN}`,
      },
      data,
    })
      .then(({ data }) => console.log(data))
      .catch((err) => console.log(err));
  }
}
