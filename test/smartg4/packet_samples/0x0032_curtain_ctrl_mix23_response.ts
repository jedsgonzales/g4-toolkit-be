import { LEAD_CODES, SMARTCLOUD } from '@constants';
import { SOURCE_IP } from '.';
import { packCRC } from '@services';

const openCurtain = [
  0x12, // length
  0x01, // subnet id
  0xfe, // device id
  0x13, // device type H, Mix23
  0x9c, // device type L, Mix23
  0x00, // op code H
  0x32, // op code L
  0x01, // target subnet id
  0x08, // target device id
  0x0d, // channel 13
  0xf8, // success/fail
  0x32, // open curtain at 50%
  0x0f, // 15 qty of device relay channels
  0x25, // status of channels 1 - 8, channels 1,3,6 are ON
  0x02, // status of channels 9 - 16, channels 10 is ON
  0x00, // curtain is not stopped so this becomes 0
  // crc H
  // crc L
];

const stoppedCurtain = [
  0x12, // length
  0x01, // subnet id
  0xfe, // device id
  0x13, // device type H, Mix23
  0x9c, // device type L, Mix23
  0x00, // op code H
  0x32, // op code L
  0x01, // target subnet id
  0x08, // target device id
  0x0e, // channel 14
  0xf8, // success/fail
  0x00, // curtain is stopped
  0x0f, // 15 qty of device relay channels
  0x25, // status of channels 1 - 8, channels 1,3,6 are ON
  0x02, // status of channels 9 - 16, channels 10 is ON
  0x32, // curtain is stopped, this indicates that curtain is open at 50%
  // crc H
  // crc L
];

export const mix23_curtain_open_to_50pct = Buffer.from([
  ...SOURCE_IP,
  ...SMARTCLOUD,
  ...LEAD_CODES,
  ...openCurtain,
  ...packCRC(Buffer.from(openCurtain), openCurtain.length),
]);

export const mix23_stopped_curtain_open_at_50pct = Buffer.from([
  ...SOURCE_IP,
  ...SMARTCLOUD,
  ...LEAD_CODES,
  ...stoppedCurtain,
  ...packCRC(Buffer.from(stoppedCurtain), stoppedCurtain.length),
]);
