import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { DateTimeResolver } from 'graphql-scalars';

@ObjectType()
export class SystemFilter {
  @Field(() => ID!)
  Id: any;

  @Field({ nullable: true })
  RuleName: string | null;

  @Field(() => Int)
  OrderNo: number;

  @Field()
  Ip: string;

  @Field({ nullable: true })
  DeviceId: string | null;

  @Field({ nullable: true })
  SubnetId: string;

  @Field()
  FilterAction: string;

  @Field(() => DateTimeResolver)
  DetectedOn: Date;

  @Field(() => DateTimeResolver, { nullable: true })
  UpdatedOn: Date | null;

  @Field({ nullable: true })
  UpdatedBy: string | null;
}

@InputType()
export class SystemFilterInput {
  @Field(() => ID, { nullable: true })
  Id: any;

  @Field()
  RuleName: string;

  @Field(() => Int)
  OrderNo: number;

  @Field()
  Ip: string;

  @Field({ nullable: true })
  DeviceId: string | null;

  @Field({ nullable: true })
  SubnetId: string;

  @Field()
  FilterAction: string;
}
