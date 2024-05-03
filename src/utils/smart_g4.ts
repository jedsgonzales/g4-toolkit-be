import {
  packCRC,
  BaseStructure,
  MalformedSmartG4MessageError,
  DimmerChannel,
  RelayChannel,
  CurtainControlChannel,
  HVAC,
} from '@services';
import { isIPv4 } from 'net';
import { HVACStateControl, SenderOpts } from '@localtypes';
import { DryContact } from 'src/services/smartg4/channels/dry_contact';
import { DRY_CONTACT_STATUS, DRY_CONTACT_TYPE, TEMP_UNIT } from '@constants';
import { MotionSensor } from 'src/services/smartg4/channels/motion_sensor';

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
export const responseOpCodeMap = {
  '0x0032': (packet: BaseStructure) => {
    if (packet.OpCode !== 0x0032) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0x0032, got ${packet.OpCode.toString(16)}`,
      );
    }

    const channelStatus: (
      | DimmerChannel
      | RelayChannel
      | CurtainControlChannel
    )[] = [];

    const [channel, result, percentage] = packet.Content;

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

          if (channelPos === channel && percentage > 1) {
            // most probably a dimmer channel that uses 0 to 100 value
            // relay is only using 0 and 1 to state power status
            channelStatus.push(
              new DimmerChannel(
                {
                  Status: !!status,
                  Percentage: percentage,
                },
                channelPos,
              ),
            );
          } else {
            channelStatus.push(
              new RelayChannel({ Status: !!status }, channelPos),
            );
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
        const index = channelStatus.findIndex((c) => c.ChannelNo === channel);
        const newChannel = new CurtainControlChannel(
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
        new DimmerChannel(
          {
            Status: percentage > 0,
            Percentage: percentage,
          },
          channel,
        ),
      );
    }

    return {
      channels: channelStatus,
      success: result === 0xf8,
    };
  },

  '0x0034': (packet: BaseStructure) => {
    if (packet.OpCode !== 0x0034) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0x0034, got ${packet.OpCode.toString(16)}`,
      );
    }

    const [channels] = packet.Content;

    // parse all channel status
    const channelStatus: (
      | DimmerChannel
      | RelayChannel
      | CurtainControlChannel
    )[] = [];

    for (let i = 0; i < channels; i++) {
      const channel = i + 1;
      const percentage = packet.Content.readUInt8(i + 1);
      channelStatus.push(
        new DimmerChannel(
          {
            Status: percentage > 0,
            Percentage: percentage,
          },
          channel,
        ),
      );
    }

    return {
      channels: channelStatus,
    };
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
    const channelStatus: (
      | DimmerChannel
      | RelayChannel
      | CurtainControlChannel
    )[] = [];

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
          new RelayChannel(
            {
              Status: status > 0,
            },
            channel,
          ),
        );
      }
    }

    return {
      channels: channelStatus,
    };
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

    return {
      channels: channelStatus,
    };
  },

  '0xdc1d': (packet: BaseStructure) => {
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
  },

  '0xe3e8': (packet: BaseStructure) => {
    // temp sensor passive status report
    if (packet.OpCode !== 0xe3e8) {
      throw new MalformedSmartG4MessageError(
        `Expected OpCode 0xe3e8, got ${packet.OpCode.toString(16)}`,
      );
    }

    const [temp, unit] = packet.Content;

    return {
      temparature: temp,
      tempUnit: unit === 0 ? 'C' : 'F',
    };
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

    return {
      channels: channelStatus,
    };
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

    return {
      channels: channelStatus,
    };
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

    return {
      channels: channelStatus,
    };
  },
};
