import { BaseStructure } from '@services';
import { test, describe, expect } from 'bun:test';
import relayQueryPacket from '../packet_samples/query_relay';
import { SOURCE_IP } from '../packet_samples';
import { LEAD_CODES, SMARTCLOUD } from '@constants';

describe('SmartG4::BaseStructure', () => {
  const instance = new BaseStructure(relayQueryPacket);

  test('has detected data length', () => {
    const index = SOURCE_IP.length + SMARTCLOUD.length + LEAD_CODES.length;

    expect(instance.Length).toEqual(relayQueryPacket[index]);
  });

  test('has detected origin address', () => {
    const index = SOURCE_IP.length + SMARTCLOUD.length + LEAD_CODES.length + 1;

    expect(instance.OriginAddress).toStrictEqual({
      SubnetId: relayQueryPacket.subarray(index, index + 1).readUInt8(0),
      DeviceId: relayQueryPacket.subarray(index + 1, index + 2).readUInt8(0),
    });
  });

  test('has detected target address', () => {
    const index = SOURCE_IP.length + SMARTCLOUD.length + LEAD_CODES.length + 7;

    expect(instance.TargetAddress).toStrictEqual({
      SubnetId: relayQueryPacket.subarray(index, index + 1).readUInt8(0),
      DeviceId: relayQueryPacket.subarray(index + 1, index + 2).readUInt8(0),
    });
  });

  test('has detected OP Code', () => {
    const index = SOURCE_IP.length + SMARTCLOUD.length + LEAD_CODES.length + 5;

    expect(instance.OpCode).toStrictEqual(
      relayQueryPacket.subarray(index, index + 2).readUInt16BE(0),
    );
  });

  test('has detected origin device type', () => {
    const index = SOURCE_IP.length + SMARTCLOUD.length + LEAD_CODES.length + 3;

    expect(instance.DeviceType).toStrictEqual(
      relayQueryPacket.subarray(index, index + 2).readUInt16BE(0),
    );
  });

  test('has detected crc', () => {
    const index = relayQueryPacket.length - 2;

    expect(instance.Crc).toStrictEqual(
      relayQueryPacket.subarray(index, index + 2).readUInt16BE(0),
    );
  });
});
