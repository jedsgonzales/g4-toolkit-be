import { LEAD_CODES, SMARTCLOUD } from '@constants';
import { SOURCE_IP } from '.';
import { packCRC } from '@services';

const data = [
  0x12, // length
  0x01, // subnet id
  0xfe, // device id
  0xff, // device type H
  0xfe, // device type L
  0x00, // op code H
  0x32, // op code L
  0x01, // target subnet id
  0x08, // target device id
  0x03, // channel 3
  0xf8, // success/fail
  0x01, // powered on
  0x14, // 20 qty of device relay channels
  0x25, // status of channels 01 - 08, channels 1,3,6 are ON
  0x02, // status of channels 09 - 16, channels 10 is ON
  0x08, // status of channels 17 - 24, channels 20 is ON
  // crc H
  // crc L
];

const crc = packCRC(Buffer.from(data), data.length);

export default Buffer.from([
  ...SOURCE_IP,
  ...SMARTCLOUD,
  ...LEAD_CODES,
  ...data,
  ...crc,
]);
