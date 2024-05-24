import { Context, Query, Resolver } from '@nestjs/graphql';
import { GraphQLContext } from 'src/app.module';
import { UserWithRoles } from 'src/graphql/models/db/user.model';

@Resolver()
export class AuthQueries {
  constructor() {}

  @Query(() => UserWithRoles)
  ValidateAuth(@Context() ctx: GraphQLContext) {
    return ctx.req.user;
  }
}
