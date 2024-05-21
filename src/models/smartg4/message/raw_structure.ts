import { SMARTCLOUD } from 'src/constants/smart_g4';
import {
  withSmartG4Header,
  withProperLength,
  withCorrectCRC,
  getDataAfterHeader,
} from 'src/utils/smart_g4';
import { DeviceAddress } from './base_structure';

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

    this.OriginIp = Array.from(
      input.subarray(this.StartIndex, smartCloundIndex),
    )
      .map((o) => o.toString(10))
      .join('.');

    const subnetPos = smartCloundIndex + SMARTCLOUD.length + 2;
    this.OriginAddress = {
      SubnetId: input.subarray(subnetPos + 1, subnetPos + 2).readUint8(0),
      DeviceId: input.subarray(subnetPos + 2, subnetPos + 3).readUint8(0),
    };

    this.Data = getDataAfterHeader(input);
    this.Raw = input;
  }
}
