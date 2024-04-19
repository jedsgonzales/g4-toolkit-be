import {
  MalformedSmartG4MessageError,
  getDataAfterHeader,
  getIpBeforeHeader,
  withCorrectCRC,
  withLeadCodes,
  withProperLength,
  withSmartG4Header,
} from '@services';
import { test, describe, expect } from 'bun:test';
import relayQueryPacket from '../packet_samples/query_relay';
import { SOURCE_IP } from '../packet_samples';
import { SMARTCLOUD } from '@constants';

describe('SmartG4 Message Parsing', () => {
  test('withLeadCodes', () => {
    expect(() => {
      withLeadCodes(relayQueryPacket);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('withProperLength', () => {
    expect(() => {
      withProperLength(relayQueryPacket);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('withSmartG4Header', () => {
    expect(() => {
      withSmartG4Header(relayQueryPacket);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('withCorrectCRC', () => {
    expect(() => {
      withCorrectCRC(relayQueryPacket);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('getDataAfterHeader', () => {
    expect(getDataAfterHeader(relayQueryPacket)).toEqual(
      relayQueryPacket.subarray(SOURCE_IP.length + SMARTCLOUD.length),
    );
  });

  test('getIpBeforeHeader', () => {
    expect(getIpBeforeHeader(relayQueryPacket)).toEqual(SOURCE_IP);
  });
});
