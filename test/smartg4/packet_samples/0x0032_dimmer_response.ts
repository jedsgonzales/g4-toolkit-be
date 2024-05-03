import { LEAD_CODES, SMARTCLOUD } from '@constants';
import { SOURCE_IP } from '.';
import { packCRC } from '@services';

const data = [
  0x0e, // length
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
  0x32, // 50% brightness
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
