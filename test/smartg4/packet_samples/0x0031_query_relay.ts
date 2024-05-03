import { LEAD_CODES, SMARTCLOUD } from '@constants';
import { SOURCE_IP } from '.';

export default Buffer.from([
  ...SOURCE_IP,
  ...SMARTCLOUD,
  ...LEAD_CODES,
  0x0f, // length
  0x01, // subnet id
  0xfe, // device id
  0xff, // device type H
  0xfe, // device type L
  0x00, // op code H
  0x31, // op code L
  0x01, // target subnet id
  0x08, // target device id
  0x03,
  0x64,
  0x00,
  0x00,
  0xd3, // crc H
  0x69, // crc L
]);
