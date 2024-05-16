import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { AreaBase } from './area';
import { NetworkBroadcaster } from './network.broadcaster';

@ObjectType()
export class NetworkDeviceBase {
  @Field(() => ID!)
  Id: any;

  @Field({ nullable: true })
  CustomDesc: string | null;

  @Field(() => Int)
  DeviceId: number;

  @Field(() => Int)
  SubnetId: number;

  @Field(() => Int)
  DeviceType: number;

  @Field()
  BroadcasterId: string;

  @Field(() => Int, { nullable: true })
  AreaId: number | null;

  @Field({ nullable: true })
  Enabled: boolean | null;

  @Field(() => DateTimeResolver, { nullable: true })
  EnabledOn: Date | null;

  @Field({ nullable: true })
  EnabledBy: string | null;

  @Field(() => DateTimeResolver, { nullable: true })
  DisabledOn: Date | null;

  @Field({ nullable: true })
  DisabledBy: string | null;
}

@ObjectType()
export class NetworkDevice extends NetworkDeviceBase {
  @Field(() => AreaBase, { nullable: true })
  Area: AreaBase | null;

  @Field(() => NetworkBroadcaster)
  NetworkBroadcaster: NetworkBroadcaster;
}
