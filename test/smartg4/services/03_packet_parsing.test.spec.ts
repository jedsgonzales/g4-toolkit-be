import {
  BaseStructure,
  CurtainControlChannel,
  DimmerChannel,
  RelayChannel,
} from '@services';
import { describe, expect, test } from 'bun:test';

import {
  mix23_curtain_open_to_50pct,
  mix23_stopped_curtain_open_at_50pct,
} from '../packet_samples/0x0032_curtain_ctrl_mix23_response';
import packet_0x0032_dimmerResponse from '../packet_samples/0x0032_dimmer_response';
import packet_0x0032_15ch_relayResponse from '../packet_samples/0x0032_relay_response_15ch';
import packet_0x0032_20ch_relayResponse from '../packet_samples/0x0032_relay_response_20ch';
import { responseOpCodeMap } from '@utils';

describe('SmartG4 Message Parsing', () => {
  test('0x0032 Dimmer Response', () => {
    const result = responseOpCodeMap['0x0032'](
      new BaseStructure(packet_0x0032_dimmerResponse),
    );

    expect(result.success).toBe(true);
    expect(result.channels.length).toEqual(1);
    expect(result.channels[0] instanceof DimmerChannel).toBe(true);
    expect(result.channels[0].ChannelNo).toEqual(3);
    expect(result.channels[0].State.Status).toEqual(true);
    expect((result.channels[0] as DimmerChannel).State.Percentage).toEqual(50);
  });

  test('0x0032 15 Channel Relay Response', () => {
    const result = responseOpCodeMap['0x0032'](
      new BaseStructure(packet_0x0032_15ch_relayResponse),
    );

    expect(result.success).toBe(true);
    expect(result.channels.length).toEqual(15);

    const poweredOnChannels = [1, 3, 6, 10];
    for (let i = 0; i < result.channels.length; i++) {
      expect(result.channels[i] instanceof RelayChannel).toBe(true);
      expect(result.channels[i].ChannelNo).toEqual(i + 1);
      expect(result.channels[i].State.Status).toBe(
        poweredOnChannels.includes(i + 1),
      );
    }
  });

  test('0x0032 20 Channel Relay Response', () => {
    const result = responseOpCodeMap['0x0032'](
      new BaseStructure(packet_0x0032_20ch_relayResponse),
    );

    expect(result.success).toBe(true);
    expect(result.channels.length).toEqual(20);

    const poweredOnChannels = [1, 3, 6, 10, 20];
    for (let i = 0; i < result.channels.length; i++) {
      expect(result.channels[i] instanceof RelayChannel).toBe(true);
      expect(result.channels[i].ChannelNo).toEqual(i + 1);
      expect(result.channels[i].State.Status).toBe(
        poweredOnChannels.includes(i + 1),
      );
    }
  });

  test('0x0032 Mix23 Ch 13 Opening Curtain Response', () => {
    const result = responseOpCodeMap['0x0032'](
      new BaseStructure(mix23_curtain_open_to_50pct),
    );

    expect(result.success).toBe(true);
    expect(result.channels.length).toEqual(15);

    const poweredOnChannels = [1, 3, 6, 10, 20];
    const curtainChannel = 13;
    for (let i = 0; i < result.channels.length; i++) {
      expect(result.channels[i].ChannelNo).toEqual(i + 1);

      if (i + 1 === curtainChannel) {
        expect(result.channels[i] instanceof CurtainControlChannel).toBe(true);
        expect((result.channels[i] as CurtainControlChannel).State.Status).toBe(
          true,
        );
        expect(
          (result.channels[i] as CurtainControlChannel).State.Percentage,
        ).toEqual(50);
      } else {
        expect(result.channels[i] instanceof RelayChannel).toBe(true);
        expect(result.channels[i].State.Status).toBe(
          poweredOnChannels.includes(i + 1),
        );
      }
    }
  });

  test('0x0032 Mix23 Ch 14 Curtain Stopped Response', () => {
    const result = responseOpCodeMap['0x0032'](
      new BaseStructure(mix23_stopped_curtain_open_at_50pct),
    );

    expect(result.success).toBe(true);
    expect(result.channels.length).toEqual(15);

    const poweredOnChannels = [1, 3, 6, 10, 20];
    const curtainChannel = 14;
    for (let i = 0; i < result.channels.length; i++) {
      expect(result.channels[i].ChannelNo).toEqual(i + 1);

      if (i + 1 === curtainChannel) {
        expect(result.channels[i] instanceof CurtainControlChannel).toBe(true);
        expect((result.channels[i] as CurtainControlChannel).State.Status).toBe(
          false,
        );
        expect(
          (result.channels[i] as CurtainControlChannel).State.Percentage,
        ).toEqual(50);
      } else {
        expect(result.channels[i] instanceof RelayChannel).toBe(true);
        expect(result.channels[i].State.Status).toBe(
          poweredOnChannels.includes(i + 1),
        );
      }
    }
  });
});
