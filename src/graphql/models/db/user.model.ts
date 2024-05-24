import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateResolver } from 'graphql-scalars';
import { UserRole } from './user.role';

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
export class UserWithRoles extends BasicUserInfo {
  @Field(() => [UserRole], { nullable: true })
  Roles?: UserRole[];
}

@ObjectType()
export class User extends UserWithRoles {
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
