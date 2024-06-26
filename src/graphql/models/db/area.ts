import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { NetworkDeviceBase } from './network.device';
import { AreaType } from 'src/types/smart_g4';

@ObjectType()
export class AreaBase {
  @Field(() => ID!)
  Id: any;

  @Field()
  Name: string;

  @Field(() => String)
  Type: AreaType | string;

  @Field({ nullable: true })
  Details: string | null;

  @Field(() => ID, { nullable: true })
  ParentAreaId: any;

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

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  DeviceCount: number;
}

@InputType()
export class PropertyAreaInput {
  @Field(() => ID, { nullable: true })
  Id: any;

  @Field()
  Name: string;

  @Field({ nullable: true })
  Details: string | null;
}

@InputType()
export class LevelAreaInput {
  @Field(() => ID, { nullable: true })
  Id: any;

  @Field()
  Name: string;

  @Field({ nullable: true })
  Details: string | null;

  @Field(() => Int)
  ParentAreaId: number;
}

@InputType()
export class UnitAreaInput {
  @Field(() => ID, { nullable: true })
  Id: any;

  @Field()
  Name: string;

  @Field({ nullable: true })
  Details: string | null;

  @Field(() => Int)
  ParentAreaId: number;
}
