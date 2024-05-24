import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasicUserInfo } from './user.model';

@ObjectType()
export class UserRoleBase {
  @Field(() => ID!)
  Id: any;

  @Field()
  RoleName: string;

  @Field({ nullable: true })
  Description: string | null;
}

@ObjectType()
export class UserRole extends UserRoleBase {
  @Field(() => [BasicUserInfo], { nullable: true })
  Users?: BasicUserInfo[];
}
