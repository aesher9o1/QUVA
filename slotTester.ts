import { SlotManager } from './src/utils/slots.utils';

new SlotManager('793001', 18)
  .checkAvailibility()
  .then((res) => console.log(res));
