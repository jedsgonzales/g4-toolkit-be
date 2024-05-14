import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ChannelNodeBase } from './channel.node';
import { DateTimeResolver } from 'graphql-scalars';

@ObjectType()
export class ChannelStatusHistoryBase {
  @Field(() => ID!)
  Id: any;

  @Field(() => DateTimeResolver)
  Time: Date;

  @Field()
  State: string;
}

@ObjectType()
export class ChannelStatusHistory extends ChannelStatusHistoryBase {
  @Field(() => ChannelNodeBase!)
  ChannelNode: ChannelNodeBase;
}
