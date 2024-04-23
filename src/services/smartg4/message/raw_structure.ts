import { SMARTCLOUD } from '@constants';
import {
  DeviceAddress,
  getDataAfterHeader,
  withCorrectCRC,
  withProperLength,
  withSmartG4Header,
} from '.';

export class RawStructure {
  OriginIp: string;
  OriginAddress: DeviceAddress;
  Crc: Buffer;
  Data: Buffer;

  /** contains the whole packet structure */
  Raw: Buffer;

  StartIndex: number;
  EndIndex: number;
  PayloadLength: number;

  constructor(input: Buffer) {
    withSmartG4Header(input);

    this.PayloadLength = withProperLength(input);
    this.Crc = withCorrectCRC(input);

    const smartCloundIndex = input.indexOf(SMARTCLOUD);

    this.StartIndex = smartCloundIndex - 4;
    this.EndIndex = smartCloundIndex + SMARTCLOUD.length + this.PayloadLength;

    this.OriginIp = new String(
      input.subarray(this.StartIndex, smartCloundIndex),
    ).toString();

    const subnetPos = smartCloundIndex + SMARTCLOUD.length + 2;
    this.OriginAddress = {
      SubnetId: input.subarray(subnetPos + 1, subnetPos + 2).readUint8(0),
      DeviceId: input.subarray(subnetPos + 2, subnetPos + 3).readUint8(0),
    };

    this.Data = getDataAfterHeader(input);
    this.Raw = input;
  }
}
