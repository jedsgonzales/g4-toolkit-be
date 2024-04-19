import { SMARTCLOUD } from '@constants';
import { withSmartG4Header } from '.';

export class RawStructure {
  OriginIp: string;
  Data: Buffer;

  /** contains the whole packet structure */
  Raw: Buffer;

  constructor(input: Buffer) {
    withSmartG4Header(input);

    this.OriginIp = new String(input.subarray(0, 4)).toString();
    this.Data = input.subarray(4 + SMARTCLOUD.length);
    this.Raw = input;
  }
}
