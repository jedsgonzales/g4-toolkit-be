import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { NetworkDeviceBase } from './network.device';

@ObjectType()
export class AreaBase {
  @Field(() => ID!)
  Id: any;

  @Field()
  Name: string;

  @Field({ nullable: true })
  Details: string | null;

  @Field(() => Int, { nullable: true })
  ParentAreaId: number | null;

  @Field(() => DateTimeResolver)
  CreatedOn: Date;

  @Field()
  CreatedBy: string;

  @Field(() => DateTimeResolver, { nullable: true })
  UpdatedOn: Date | null;

  @Field({ nullable: true })
  UpdatedBy: string | null;
}

@ObjectType()
export class Area extends AreaBase {
  @Field(() => AreaBase, { nullable: true })
  ParentArea: AreaBase | null;

  @Field(() => [AreaBase])
  SubAreas: AreaBase[];

  @Field(() => [NetworkDeviceBase])
  Devices: NetworkDeviceBase[];
}
