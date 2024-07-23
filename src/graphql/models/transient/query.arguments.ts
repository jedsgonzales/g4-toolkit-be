import { InputType, Field, Int } from "@nestjs/graphql";


@InputType()
export class QueryArguments {
  @Field({ nullable: true })
  Where?: string;

  @Field({ nullable: true })
  Filter?: string;

  @Field({ nullable: true })
  Order?: string;

  @Field({ nullable: true })
  Cursor?: string;

  @Field(() => Int, { nullable: true })
  PageSize?: number = 10;
}
