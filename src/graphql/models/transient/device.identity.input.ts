import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class DeviceIdentityInput {
  @Field({ nullable: true })
  Ip?: string;

  @Field(() => Int, { nullable: true })
  SubnetId?: number;

  @Field(() => Int, { nullable: true })
  DeviceId?: number;

  @Field(() => Int, { nullable: true })
  DeviceType?: number;
}
