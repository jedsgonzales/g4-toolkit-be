import { RawStructure } from '@services';
import { test, describe, expect } from 'bun:test';
import relayQueryPacket from '../packet_samples/0x0031_query_relay';
import { SOURCE_IP } from '../packet_samples';
import { SMARTCLOUD } from '@constants';

describe('SmartG4::RawStructure', () => {
  const instance = new RawStructure(relayQueryPacket);

  test('has detected correct IP', () => {
    expect(instance.OriginIp).toEqual(new String(SOURCE_IP).toString());
  });

  test('has extracted correct data', () => {
    expect(instance.Data).toEqual(
      relayQueryPacket.subarray(SOURCE_IP.length + SMARTCLOUD.length),
    );
  });
});
