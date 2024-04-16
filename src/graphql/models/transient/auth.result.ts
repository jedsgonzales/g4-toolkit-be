import { Field, ObjectType } from '@nestjs/graphql';
import { BasicUserInfo } from '..';

@ObjectType()
export class AuthResult {
  @Field()
  AccessToken: string;

  @Field(() => BasicUserInfo)
  User: BasicUserInfo;
}
