import { Field, ObjectType } from '@nestjs/graphql';
import { UserWithRoles } from '../db/user.model';

@ObjectType()
export class AuthResult {
  @Field()
  AccessToken: string;

  @Field(() => UserWithRoles)
  User: UserWithRoles;
}
