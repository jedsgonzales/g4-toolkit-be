import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { NetworkDeviceBase } from './network.device';

@ObjectType()
export class NetworkBroadcasterBase {
  @Field(() => ID!)
  Id: any;

  @Field({ nullable: true })
  Name: string | null;

  @Field()
  AllowDevicesByDefault: boolean;

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

  @Field(() => DateTimeResolver)
  DetectedOn: Date;

  @Field(() => DateTimeResolver, { nullable: true })
  LastMsgOn: Date | null;
}

@ObjectType()
export class NetworkBroadcaster extends NetworkBroadcasterBase {
  @Field(() => [NetworkDeviceBase])
  Devices: NetworkDeviceBase[];
}
