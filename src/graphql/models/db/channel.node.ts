import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { NetworkDeviceBase } from './network.device';
import { ChannelStatusBase } from './channel.status';
import { ChannelStatusHistoryBase } from './channel.status.history';

@ObjectType()
export class ChannelNodeBase {
  @Field(() => ID!)
  Id: any;

  @Field(() => Int)
  NetworkDevId: number;

  @Field(() => Int)
  NodeNo: number;

  @Field()
  NodeType: string;

  @Field()
  NodeDesc: string;

  @Field({ nullable: true })
  CustomDesc: string | null;
}

@ObjectType()
export class ChannelNode extends ChannelNodeBase {
  @Field(() => NetworkDeviceBase)
  NetworkDevice: NetworkDeviceBase;

  @Field(() => [ChannelStatusBase], { nullable: true })
  Status: ChannelStatusBase[];

  @Field(() => [ChannelStatusHistoryBase], { nullable: true })
  History: ChannelStatusHistoryBase[];
}
