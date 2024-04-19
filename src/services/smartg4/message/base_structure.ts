import { LEAD_CODES } from '@constants';
import {
  getDataAfterHeader,
  withCorrectCRC,
  withLeadCodes,
  withProperLength,
} from '.';
import { RawStructure } from './raw_structure';

export interface DeviceAddress {
  SubnetId: number;
  DeviceId: number;
}

export class BaseStructure extends RawStructure {
  OriginAddress: DeviceAddress;
  TargetAddress: DeviceAddress;
  OpCode: number;
  DeviceType: number;
  Length: number;

  /** contains command parameter data */
  Content: Buffer;

  Crc: number;

  /** contains lead code until crc */
  DataBody: Buffer;

  constructor(input: RawStructure | Buffer) {
    if (input instanceof RawStructure) {
      super(input.Raw);
    } else {
      super(input);

      withLeadCodes(input);
      withProperLength(input);
      withCorrectCRC(input);

      this.DataBody = getDataAfterHeader(input);

      this.Length = this.DataBody.subarray(
        LEAD_CODES.length,
        LEAD_CODES.length + 1,
      ).readUInt8(0);

      const [
        oSubId,
        oDevId,
        oTypeH,
        oTypeL,
        opCodeH,
        opCodeL,
        tSubId,
        tDevId,
        ...content
      ] = this.DataBody.subarray(LEAD_CODES.length + 1);

      this.OriginAddress = {
        SubnetId: oSubId,
        DeviceId: oDevId,
      };

      this.TargetAddress = {
        SubnetId: tSubId,
        DeviceId: tDevId,
      };

      this.OpCode = (opCodeH << 8) | opCodeL;
      this.DeviceType = (oTypeH << 8) | oTypeL;

      this.Content = Buffer.from(content).subarray(0, content.length - 2);

      this.Crc =
        (content[content.length - 2] << 8) | content[content.length - 1];
    }
  }
}
