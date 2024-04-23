export class Channel {
  TypeName: string = 'Channel';
  TypeId: number = 0;

  ChannelNo: number;
  Status: boolean;

  constructor(props: { ChannelNo: number; Status: boolean }) {
    this.ChannelNo = props.ChannelNo;
    this.Status = props.Status;
  }
}
