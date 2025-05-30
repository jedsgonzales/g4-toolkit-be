import { LEAD_CODES } from 'src/constants/smart_g4';
import { withLeadCodes, withProperLength } from 'src/utils/smart_g4';
import { RawStructure } from './raw_structure';

export interface DeviceAddress {
  SubnetId: number;
  DeviceId: number;
}

export class BaseStructure extends RawStructure {
  TargetAddress: DeviceAddress;
  OpCode: number;
  DeviceType: number;
  Length: number;

  /** contains command parameter data */
  Content: Buffer;

  /** contains lead code until crc */
  /* DataBody: Buffer; */

  constructor(input: RawStructure | Buffer) {
    if (input instanceof RawStructure) {
      super(input.Raw);
    } else {
      super(input);

      withLeadCodes(input);
      withProperLength(input);

      /* this.DataBody = getDataAfterHeader(input); */

      this.Length = this.Data.subarray(
        LEAD_CODES.length,
        LEAD_CODES.length + 1,
      ).readUInt8(0);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const [oTypeH, oTypeL, opCodeH, opCodeL, tSubId, tDevId, ...content] =
        this.Data.subarray(LEAD_CODES.length + 3);

      this.TargetAddress = {
        SubnetId: tSubId,
        DeviceId: tDevId,
      };

      this.OpCode = (opCodeH << 8) | opCodeL;
      this.DeviceType = (oTypeH << 8) | oTypeL;

      this.Content = Buffer.from(content).subarray(0, content.length - 2);
    }
  }
}
