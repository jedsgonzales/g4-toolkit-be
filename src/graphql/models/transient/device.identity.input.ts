import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
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
