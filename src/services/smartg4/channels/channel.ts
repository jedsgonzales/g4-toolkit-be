import { OverrideOpts } from '@localtypes';
import { Device } from '../device';

export abstract class Channel<T, C> {
  ChannelDevice: Device;

  TypeName: string = 'Channel';
  ChannelNo: number = -1;

  State: T;

  constructor(props: T) {
    this.State = props;
  }

  abstract setState(newState: C & OverrideOpts);
  abstract queryStatus(opts: OverrideOpts);
}
