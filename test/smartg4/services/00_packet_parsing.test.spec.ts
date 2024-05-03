import { SMARTCLOUD } from '@constants';
import {
  MalformedSmartG4MessageError,
  getDataAfterHeader,
  getIpBeforeHeader,
  withCorrectCRC,
  withLeadCodes,
  withProperLength,
  withSmartG4Header,
} from '@services';
import { describe, expect, test } from 'bun:test';
import { SOURCE_IP } from '../packet_samples';

import packet_0x0031_relayQuery from '../packet_samples/0x0031_query_relay';

describe('SmartG4 Message Parsing', () => {
  test('withLeadCodes', () => {
    expect(() => {
      withLeadCodes(packet_0x0031_relayQuery);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('withProperLength', () => {
    expect(() => {
      withProperLength(packet_0x0031_relayQuery);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('withSmartG4Header', () => {
    expect(() => {
      withSmartG4Header(packet_0x0031_relayQuery);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('withCorrectCRC', () => {
    expect(() => {
      withCorrectCRC(packet_0x0031_relayQuery);
    }).not.toThrow(MalformedSmartG4MessageError);
  });

  test('getDataAfterHeader', () => {
    expect(getDataAfterHeader(packet_0x0031_relayQuery)).toEqual(
      packet_0x0031_relayQuery.subarray(SOURCE_IP.length + SMARTCLOUD.length),
    );
  });

  test('getIpBeforeHeader', () => {
    expect(getIpBeforeHeader(packet_0x0031_relayQuery)).toEqual(SOURCE_IP);
  });
});
