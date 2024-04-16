import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateResolver } from 'graphql-scalars';

@ObjectType()
export class BasicUserInfo {
  @Field(() => ID!)
  Id: any;

  @Field()
  Username: string;

  @Field({ nullable: true })
  FirstName?: string | null;

  @Field({ nullable: true })
  LastName?: string | null;

  @Field()
  Email: string;

  @Field(() => DateResolver)
  CreatedOn: Date;
}

@ObjectType()
export class User extends BasicUserInfo {
  @Field({ nullable: true })
  LoginKey?: string | null;

  @Field(() => DateResolver, { nullable: true })
  LoginKeyExpireOn?: Date | null;

  @Field()
  IsDisabled: boolean;

  @Field({ nullable: true })
  IsArchived?: boolean;

  @Field(() => DateResolver, { nullable: true })
  ArchivedOn?: Date;
}
