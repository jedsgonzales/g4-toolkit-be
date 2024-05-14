import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ChannelNodeBase } from './channel.node';

@ObjectType()
export class ChannelStatusBase {
  @Field(() => ID!)
  Id: any;

  @Field()
  StateName: string;

  @Field()
  StateValue: string;

  @Field()
  StateType: string;
}

@ObjectType()
export class ChannelStatus extends ChannelStatusBase {
  @Field(() => ChannelNodeBase!)
  ChannelNode: ChannelNodeBase;
}
