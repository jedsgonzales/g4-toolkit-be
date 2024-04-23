import { DimmerChannel } from './dimmer';

export class CurtainControlChannel extends DimmerChannel {
  constructor({
    ChannelNo,
    Status,
    Percentage,
  }: {
    ChannelNo: number;
    Status: boolean;
    Percentage: number;
  }) {
    super({ ChannelNo, Status, Percentage });
    this.TypeName = 'CurtainControl';
    this.TypeId = 2;
  }
}
