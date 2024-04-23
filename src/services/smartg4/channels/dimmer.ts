import { Channel } from './channel';

export class DimmerChannel extends Channel {
  Percentage: number;

  constructor({
    ChannelNo,
    Status,
    Percentage,
  }: {
    ChannelNo: number;
    Status: boolean;
    Percentage: number;
  }) {
    super({ ChannelNo, Status });
    this.Percentage = Percentage;
    this.TypeName = 'Dimmer';
    this.TypeId = 2;
  }
}
