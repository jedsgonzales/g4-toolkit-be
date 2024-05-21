import { Field, ObjectType } from '@nestjs/graphql';
import { BasicUserInfo } from '../db/user.model';

@ObjectType()
export class AuthResult {
  @Field()
  AccessToken: string;

  @Field(() => BasicUserInfo)
  User: BasicUserInfo;
}
