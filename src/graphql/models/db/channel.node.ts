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
export class ChannelNodeWithStatus extends ChannelNodeBase {
  @Field(() => [ChannelStatusBase], { nullable: true })
  Status: ChannelStatusBase[];
}

@ObjectType()
export class ChannelNode extends ChannelNodeWithStatus {
  @Field(() => NetworkDeviceBase)
  NetworkDevice: NetworkDeviceBase;
}

@ObjectType()
export class ChannelNodeWithHistory extends ChannelNode {
  @Field(() => [ChannelStatusHistoryBase], { nullable: true })
  History: ChannelStatusHistoryBase[];
}
