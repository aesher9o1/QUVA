import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export class AlertHandler {
  sendText(text: string) {
    axios({
      url: '  https://slack.com/api/chat.postMessage',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BOT_ACCESS_TOKEN}`,
      },
      data: { text },
    }).catch((err) => console.log(err));
  }

  sendBase64Img(image: string) {
    const filePrefix = new Date().getTime().toString();
    const imgAsBase64 = image.substring(image.indexOf(',') + 1);
    fs.writeFileSync(`${filePrefix}.png`, imgAsBase64, 'base64');

    // Prevent sending to slack channel for dev
    if (process.env.NODE_ENV !== 'production')
      return console.log('QR file loaded');

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
    }).catch((err) => console.log(err));
  }
}
