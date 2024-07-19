import { Field, Int, ArgsType } from "@nestjs/graphql";
import { DateTimeResolver } from "graphql-scalars";


@ArgsType()
export class HistoryArguments {
  @Field(() => DateTimeResolver, { nullable: true })
  StartDate?: Date;

  @Field(() => DateTimeResolver, { nullable: true })
  EndDate?: Date;

  @Field({ nullable: true })
  Order?: string;

  @Field({ nullable: true })
  Cursor?: string;

  @Field(() => Int, { nullable: true })
  PageSize?: number = 10;

  @Field(() => String, { nullable: true })
  LastId?: string;
}
