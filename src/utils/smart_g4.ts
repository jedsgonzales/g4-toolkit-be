import { NetworkDevice } from '@internal/prisma/smartg4';
import { isIPv4 } from 'net';
import {
  DRY_CONTACT_STATUS,
  DRY_CONTACT_TYPE,
  HVACStateControl,
  SenderOpts,
  TEMP_UNIT,
} from 'src/types/smart_g4';

import { ChannelNode } from 'src/models/smartg4/channels/channel.node';
import { Dimmer } from 'src/models/smartg4/channels/dimmer';
import { Relay } from 'src/models/smartg4/channels/relay';
import { HVAC } from 'src/models/smartg4/channels/hvac';
import { DryContact } from 'src/models/smartg4/channels/dry_contact';
import { MotionSensor } from 'src/models/smartg4/channels/motion_sensor';
import { TemperatureSensor } from 'src/models/smartg4/channels/temperature_sensor';
import { OccupancySensor } from 'src/models/smartg4/channels/occupancy.sensor';
import { CurtainControl } from 'src/models/smartg4/channels/curtain.control';

import { CRC_TABLE } from 'src/constants/smart_g4';
import { BaseStructure } from 'src/models/smartg4/message/base_structure';

const smartcloud = Buffer.from('SMARTCLOUD');
const standardHeader = Buffer.from([...smartcloud, 0xaa, 0xaa]);

export const withLeadCodes = (fullPacket: Buffer) => {
  const smartCloundIndex = fullPacket.indexOf(smartcloud);
  const targetIdx = smartCloundIndex + smartcloud.length;

  if (
    !(fullPacket.subarray(targetIdx, targetIdx + 2).readUInt16BE(0) == 0xaaaa)
  ) {
    throw new MalformedSmartG4MessageError('Missing lead codes');
  }

  return true;
};

export const withProperLength = (fullPacket: Buffer) => {
  const smartCloundIndex = fullPacket.indexOf(smartcloud);
  const minLength = smartCloundIndex + standardHeader.length + 1; // IP + Header + Lead Code
  const length = fullPacket.subarray(minLength - 1, minLength).readUInt8(0);
  const reqLength = minLength + length - 1;

  if (!(length >= 11 && length <= 78 && fullPacket.length >= reqLength)) {
    throw new MalformedSmartG4MessageError('Wrong length');
  }

  return length;
};

export const withCorrectCRC = (fullPacket: Buffer) => {
  const smartCloundIndex = fullPacket.indexOf(smartcloud);
  const minLength = smartCloundIndex + standardHeader.length + 1; // IP + Header + Lead Code
  const length = fullPacket.subarray(minLength - 1, minLength).readUInt8(0);

  const crc = checkCRC(fullPacket.subarray(minLength - 1), length - 2);
  if (!crc) {
    throw new MalformedSmartG4MessageError('Bad CRC');
  }

  return crc;
};

/**
 * Checks the presence of Smart G4 header `SMARTCLOUD`
 * @param fullPacket packet to check
 */
export const withSmartG4Header = (fullPacket: Buffer) => {
  if (!(fullPacket.indexOf(standardHeader) > 3)) {
    throw new MalformedSmartG4MessageError('Missing Smart G4 Header');
  }
};

/**
 * Extracts packet data from lead code up to CRC
 * @param fullPacket source packet
 * @returns extracted packet as Buffer
 */
export const getDataAfterHeader = (fullPacket: Buffer) => {
  const headerIndex = fullPacket.indexOf(smartcloud);
  const dataLength = fullPacket
    .subarray(headerIndex + 2, headerIndex + 3)
    .readUInt8(0);

  return fullPacket.subarray(
    headerIndex + smartcloud.length,
    headerIndex + smartcloud.length + dataLength,
  );
};

export const getIpBeforeHeader = (fullPacket: Buffer) => {
  const headerIndex = fullPacket.indexOf(smartcloud);
  return fullPacket.subarray(headerIndex - 4, headerIndex);
};

export class MalformedSmartG4MessageError extends Error {
  constructor(msg?: string) {
    super(msg || 'Malformed SmartG4 message');
  }
}

export const packCRC = (arrayPtrBuf: Buffer, intBufLen: number) => {
  let wdCRC: number = 0;
  let wdPtrCount: number = 0;
  let bytDat: number;

  try {
    while (intBufLen !== 0) {
      bytDat = (wdCRC >> 8) & 0x00ff;
      wdCRC = (wdCRC << 8) & 0xff00;
      wdCRC = wdCRC ^ CRC_TABLE[bytDat ^ arrayPtrBuf[wdPtrCount]];

      wdPtrCount++;
      intBufLen--;
    }

    const mbytCRCHighData = wdCRC >> 8;
    const mbytCRCLowData = wdCRC & 0x00ff;

    return [mbytCRCHighData, mbytCRCLowData];
  } catch (ex: any) {
    console.error(ex.message + '(PackCRC)');
  }
};

export const checkCRC = (arrayPtrBuf: Buffer, intBufLen: number) => {
  let wdCRC: number = 0;
  let bytDat: number;
  let bytPtrCount: number = 0;

  try {
    while (intBufLen !== 0) {
      bytDat = (wdCRC >> 8) & 0x00ff;
      wdCRC = (wdCRC << 8) & 0xff00;
      wdCRC = wdCRC ^ CRC_TABLE[bytDat ^ arrayPtrBuf[bytPtrCount]];

      bytPtrCount++;
      intBufLen--;
    }

    if (
      arrayPtrBuf[bytPtrCount] === wdCRC >> 8 &&
      arrayPtrBuf[bytPtrCount + 1] === (wdCRC & 0x00ff)
    ) {
      return arrayPtrBuf.subarray(bytPtrCount, bytPtrCount + 2);
    }
  } catch (ex: any) {
    console.error(ex.message + '(CheckCRC)');
  }

  return false;
};

export const createSourceIp = (ip: string) => {
  if (isIPv4(ip)) {
    return ip.split('.').map((octet) => parseInt(octet, 10));
  }

  throw new Error(`IP is not a valid IPv4 address - ${ip}`);
};

const buildPrefix = (
  { Source, Target }: Omit<SenderOpts, 'ChannelNo'>,
  opCode: number,
) => {
  return [
    Source.address.SubnetId || 0xff,
    Source.address.DeviceId || 0xff,
    (Source.type || 0x0000) >> 8,
    (Source.type || 0x0000) & 0x00ff,
    opCode >> 8,
    0x31 & 0x00ff,
    Target.address.SubnetId || 1,
    Target.address.SubnetId || 1,
  ];
};

const makePayload = (data: number[]) => {
  // prepend length
  data.unshift(data.length + 3);

  const crc = packCRC(Buffer.from(data), data.length);

  return Buffer.from([...data, ...crc]);
};

export const opCodeHex = (val: number) => {
  let opCodeStr = val.toString(16);
  if (opCodeStr.length < 4) {
    opCodeStr = opCodeStr.padStart(4, '0');
  }

  return `0x${opCodeStr}`;
};

export const senderOpCodeMap = {
  '0x0031': ({
    Percentage,
    RunningTime,
    Source,
    Target,
    ChannelNo,
    Status,
  }: {
    Percentage?: number;
    RunningTime: number;
    Status: boolean;
  } & SenderOpts) => {
    // dimmer/relay/curtain on/off/set percentage
    return makePayload([
      // LEN
      ...buildPrefix(
        {
          Source,
          Target,
        },
        0x0031,
      ),
      ChannelNo,
      Percentage || Status ? 1 : 0,
      RunningTime >> 8,
      RunningTime & 0x00ff,
      // CRCH
      // CRCL
    ]);
  },
  '0x0033': ({ Source, Target }: SenderOpts) => {
    // dimmer/relay/curtain motor status query
    return makePayload([
      // LEN
      ...buildPrefix(
        {
          Source,
          Target,
        },
        0x0033,
      ),
      // CRCH
      // CRCL
    ]);
  },
  '0xdc1c': ({
    RunningTime,
    Source,
    Target,
    ChannelNo,
  }: {
    RunningTime: number;
  } & SenderOpts) => {
    // dimmer/relay/curtain motor reversing control
    return makePayload([
      // LEN
      ...buildPrefix(
        {
          Source,
          Target,
        },
        0x0031,
      ),
      ChannelNo,
      0,
      RunningTime >> 8,
      RunningTime & 0x00ff,
      // CRCH
      // CRCL
    ]);
  },
  '0xe0ec': ({ Source, Target }: SenderOpts) => {
    // dimmer/relay/curtain motor status query
    return makePayload([
      // LEN
      ...buildPrefix(
        {
          Source,
          Target,
        },
        0xe0ec,
      ),
      // CRCH
      // CRCL
    ]);
  },
  '0x193a': ({
    CoolSetting,
    FanIndex,
    ModeIndex,
    HeatSetting,
    AutoSetting,
    TempUnit,
    Source,
    Target,
    AcNo,
    Status,
  }: HVACStateControl & SenderOpts & { AcNo: number }) => {
    // dimmer/relay/curtain on/off/set percentage
    return makePayload([
      // LEN
      ...buildPrefix(
        {
          Source,
          Target,
        },
        0x193a,
      ),
      AcNo & 0xff,
      TempUnit,
      0x00,
      CoolSetting & 0xff,
      HeatSetting & 0xff,
      AutoSetting & 0xff,
      0x00,
      (ModeIndex << 4) | (FanIndex & 0x0f),
      Status ? 1 : 0,
      0x00,
      0x00,
      0x00,
      0x00,
      // CRCH
      // CRCL
    ]);
  },

  '0x012c': ({ Source, Target }: SenderOpts) => {
    // read dry connector NC/NO status query
    return makePayload([
      // LEN
      ...buildPrefix(
        {
          Source,
          Target,
        },
        0x012c,
      ),
      0x00,
      // CRCH
      // CRCL
    ]);
  },

  '0xdb00': ({
    Source,
    Target,
    PageNo = 0x00,
  }: SenderOpts & { PageNo?: number }) => {
    // read sensor status query
    return makePayload([
      // LEN
      ...buildPrefix(
        {
          Source,
          Target,
        },
        0xdb00,
      ),
      PageNo,
      // CRCH
      // CRCL
    ]);
  },
};

/**
 * All response code map function arguments must be of the form:
 * [dataLength, ...data, crcH, crcL]
 */
export interface ResponseOpCodeMap {
  [key: string]: (packet: BaseStructure) => ChannelNode<any, any>[];
}
export const responseOpCodeMap: ResponseOpCodeMap = {
  '0x0032': (packet: BaseStructure) => {
    if (packet.OpCode !== 0x0032) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0x0032, got ${packet.OpCode.toString(16)}`,
      );
    }

    const channelStatus: (Dimmer | Relay | CurtainControl)[] = [];

    const [channel, _isSuccess, percentage] = packet.Content;

    console.log('channel', channel);
    console.log('channel state', percentage);

    if (packet.Content.length > 3) {
      const qtyOfChannels = packet.Content.subarray(3).readUInt8(0);
      const channelsData = packet.Content.subarray(4);

      // parse all channel status, bit by bit

      const bytesCount = Math.ceil(qtyOfChannels / 8);
      for (
        let i = 0;
        i < bytesCount && channelStatus.length < qtyOfChannels;
        i++
      ) {
        const byte = channelsData.readUInt8(i);
        for (let j = 0; j < 8 && channelStatus.length < qtyOfChannels; j++) {
          const channelPos = i * 8 + j + 1;
          const status = byte & (1 << j) ? 100 : 0;

          if(channelPos === channel){
            if (percentage > 1) {
              // most probably a dimmer channel that uses 0 to 100 value
              // relay is only using 0 and 1 to state power status
              channelStatus.push(
                new Dimmer(
                  {
                    Status: !!status,
                    Percentage: percentage,
                  },
                  channelPos,
                ),
              );
            } else {
              channelStatus.push(new Relay({ Status: !!status }, channelPos));
            }

            break;
          }
        }
      }

      // by device type + channel number conditions
      // DeviceType:
      //    0x139c or 5020 is SB-ZMIX23-DN Zone Beast 23 port Mix Control Module
      if (packet.DeviceType === 0x139c && [13, 14].includes(channel)) {
        // this is curtain control

        let curtainStatus = percentage;
        if (percentage === 0) {
          // obtain open staus of curtain at byte before crc values
          curtainStatus = packet.Content.subarray(
            packet.Content.length - 1,
            packet.Content.length,
          ).readUint8(0);
        }

        /**
         * at some point, the other curtain control will still be classified
         * as relay until we detect that it is a curtain control
         */
        const index = channelStatus.findIndex((c) => c.NodeNo === channel);
        const newChannel = new CurtainControl(
          {
            Status: percentage > 0,
            Percentage: curtainStatus,
          },
          channel,
        );

        if (index > -1) {
          channelStatus[index] = newChannel;
        } else {
          channelStatus.push(newChannel);
        }
      } else {
        // this is relay reporting, no changes
      }
    } else {
      // only the dimmer status is present if content length is only 3
      channelStatus.push(
        new Dimmer(
          {
            Status: percentage > 0,
            Percentage: percentage,
          },
          channel,
        ),
      );
    }

    return channelStatus;
  },

  '0x0034': (packet: BaseStructure) => {
    if (packet.OpCode !== 0x0034) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0x0034, got ${packet.OpCode.toString(16)}`,
      );
    }

    const [channels] = packet.Content;

    // parse all channel status
    const channelStatus: (Dimmer | Relay | CurtainControl)[] = [];

    for (let i = 0; i < channels; i++) {
      const channel = i + 1;
      const percentage = packet.Content.readUInt8(i + 1);
      channelStatus.push(
        new Dimmer(
          {
            Status: percentage > 0,
            Percentage: percentage,
          },
          channel,
        ),
      );
    }

    return channelStatus;
  },

  '0xefff': (packet: BaseStructure) => {
    if (packet.OpCode !== 0xefff) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0xefff, got ${packet.OpCode.toString(16)}`,
      );
    }

    const [qtyOfZones] = packet.Content;

    /* const zonesData = data.subarray(2, 2 + qtyOfZones); */
    const qtyOfChannels = packet.Content.subarray(1 + qtyOfZones).readUInt8(0);
    const channelsData = packet.Content.subarray(
      2 + qtyOfZones,
      packet.Content.length,
    );

    // parse all channel status, bit by bit
    const channelStatus: (Dimmer | Relay | CurtainControl)[] = [];

    const bytesCount = Math.ceil(qtyOfChannels / 8);
    for (
      let i = 0;
      i < bytesCount && channelStatus.length < qtyOfChannels;
      i++
    ) {
      const byte = channelsData.readUInt8(i);
      for (let j = 0; j < 8 && channelStatus.length < qtyOfChannels; j++) {
        const channel = i * 8 + j + 1;
        const status = byte & (1 << j) ? 100 : 0;

        channelStatus.push(
          new Relay(
            {
              Status: status > 0,
            },
            channel,
          ),
        );
      }
    }

    return channelStatus;
  },

  '0x193b': (packet: BaseStructure) => {
    if (packet.OpCode !== 0x193b) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0x193b, got ${packet.OpCode.toString(16)}`,
      );
    }

    // parse all channel status, bit by bit
    const channelStatus: HVAC[] = [];

    channelStatus.push(
      new HVAC(
        {
          Status: packet.Content.readUInt8(0) > 0,
          CoolSetting: packet.Content.readUInt8(3),
          FanIndex: packet.Content.readUInt8(7) & 0x0f,
          ModeIndex: (packet.Content.readUInt8(7) >> 4) & 0x0f,
          CurrentTemp: packet.Content.readInt8(2),
          HeatSetting: packet.Content.readUInt8(4),
          AutoSetting: packet.Content.readUInt8(5),
          TempUnit: packet.Content.readUInt8(1)
            ? TEMP_UNIT.FAHRENHEIT
            : TEMP_UNIT.CELSIUS,
        },
        packet.Content.readUInt8(0),
      ),
    );

    return channelStatus;
  },

  /* '0xdc1d': (packet: BaseStructure) => {
    if (packet.OpCode !== 0xdc1d) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0xdc1d, got ${packet.OpCode.toString(16)}`,
      );
    }

    const [channel, result] = packet.Content;

    return {
      channel,
      success: result === 0xf8,
    };
  }, */

  '0xe3e8': (packet: BaseStructure) => {
    // temp sensor passive status report
    if (packet.OpCode !== 0xe3e8) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0xe3e8, got ${packet.OpCode.toString(16)}`,
      );
    }

    const [unit, temp] = packet.Content;

    return [
      new TemperatureSensor({
        CurrentTemp: temp,
        TempUnit: unit === 1 ? TEMP_UNIT.CELSIUS : TEMP_UNIT.FAHRENHEIT,
      }),
    ];
  },

  '0x012d': (packet: BaseStructure) => {
    // dry contact NC/NO status reply
    if (packet.OpCode !== 0x012d) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0x012d, got ${packet.OpCode.toString(16)}`,
      );
    }

    const isSuccess = packet.Content.readUInt8(0) === 0xf8;
    if (!isSuccess) {
      throw new Error('Dry contact NC/NO status error');
    }

    // parse all channel status, bit by bit
    const channelStatus: DryContact[] = [];

    const contacts = packet.Content.readUInt8(1);
    for (let i = 0; i < contacts; i++) {
      const contact = i + 1;
      const type = packet.Content.readUInt8(i + 2) > 0;
      const status = packet.Content.readUInt8(i + 2 + contacts) > 0;

      channelStatus.push(
        new DryContact(
          {
            Status: status
              ? DRY_CONTACT_STATUS.OPEN
              : DRY_CONTACT_STATUS.CLOSED,
            Type: type
              ? DRY_CONTACT_TYPE.NORMALLY_OPEN
              : DRY_CONTACT_TYPE.NORMALLY_CLOSED,
          },
          contact,
        ),
      );
    }

    return channelStatus;
  },

  '0xdc22': (packet: BaseStructure) => {
    // dry contact NC/NO passive status report
    if (packet.OpCode !== 0xdc22) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0xdc22, got ${packet.OpCode.toString(16)}`,
      );
    }

    // parse all channel status, bit by bit
    const channelStatus: DryContact[] = [];

    const contacts = packet.Content.readUInt8(0);
    for (let i = 0; i < contacts; i++) {
      const contact = i + 1;
      const type = packet.Content.readUInt8(i + 1) > 0;
      const status = packet.Content.readUInt8(i + 1 + contacts) > 0;

      channelStatus.push(
        new DryContact(
          {
            Status: status
              ? DRY_CONTACT_STATUS.OPEN
              : DRY_CONTACT_STATUS.CLOSED,
            Type: type
              ? DRY_CONTACT_TYPE.NORMALLY_OPEN
              : DRY_CONTACT_TYPE.NORMALLY_CLOSED,
          },
          contact,
        ),
      );
    }

    return channelStatus;
  },

  '0xdb01': (packet: BaseStructure) => {
    // sensor status report (5PIR)

    if (packet.OpCode !== 0xdb01) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0xdb01, got ${packet.OpCode.toString(16)}`,
      );
    }

    // parse all channel status, bit by bit
    const channelStatus: (DryContact | MotionSensor)[] = [];

    // TODO: This logic applies to 5PIR, which I cant find the device type is

    for (let i = 0; i < 5; i++) {
      const status = packet.Content.readUInt8(i) > 0;

      channelStatus.push(
        new MotionSensor(
          {
            MotionDetected: status,
          },
          i + 1,
        ),
      );
    }

    for (let i = 5; i < 7; i++) {
      const status = packet.Content.readUInt8(i) > 0;

      channelStatus.push(
        new DryContact(
          {
            Status: status
              ? DRY_CONTACT_STATUS.OPEN
              : DRY_CONTACT_STATUS.CLOSED,
          },
          i - 4,
        ),
      );
    }

    return channelStatus;
  },

  '0x02fe': (packet: BaseStructure) => {
    if (packet.OpCode !== 0x02fe) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0x02fe, got ${packet.OpCode.toString(16)}`,
      );
    }

    // room occupancy status
    //
    // <c0 a8 01 64 53 4d 41 52 54 43 4c 4f 55 44 aa aa 0c 01 32 13 b0 02 fe ff ff 00 64 7a>
    // <c0 a8 01 64 53 4d 41 52 54 43 4c 4f 55 44 aa aa 0c 01 32 13 b0 02 fe ff ff 01 74 5b>
    //
    // <c0 a8 01 64 53 4d 41 52 54 43 4c 4f 55 44 aa aa 0c 01 32 13 b0 02 fe ff ff 00 64 7a>
    // <c0 a8 01 64 53 4d 41 52 54 43 4c 4f 55 44 aa aa 0c 01 32 13 b0 02 fe ff ff 01 74 5b>

    const channelStatus: OccupancySensor[] = [
      new OccupancySensor(
        {
          OccupancyDetected: packet.Content.readUInt8(0) > 0,
        },
        1,
      ),
    ];

    return channelStatus;
  },
};

export const createChannelNode = (
  nodeType: string,
  state: any,
  nodeNo: number,
  device: NetworkDevice,
): ChannelNode<any, any> => {
  switch (nodeType) {
    case 'Dimmer':
      return new Dimmer(state, nodeNo, device);
    case 'Relay':
      return new Relay(state, nodeNo, device);
    case 'HVAC':
      return new HVAC(state, nodeNo, device);
    case 'MotionSensor':
      return new MotionSensor(state, nodeNo, device);
    case 'DryContact':
      return new DryContact(state, nodeNo, device);
    case 'TemperatureSensor':
      return new TemperatureSensor(state, nodeNo, device);
    case 'OccupancySensor':
      return new OccupancySensor(state, nodeNo, device);
    case 'CurtainControl':
      return new CurtainControl(state, nodeNo, device);
  }
};
