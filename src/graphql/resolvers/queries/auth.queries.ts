import { UseGuards } from '@nestjs/common';
import { Context, Query, Resolver } from '@nestjs/graphql';
import { GraphQLContext } from 'src/app.module';
import { UserWithRoles } from 'src/graphql/models/db/user.model';
import { AuthGuard } from 'src/guards/admin.guard';

@Resolver()
export class AuthQueries {
  constructor() {}

  @UseGuards(AuthGuard)
  @Query(() => UserWithRoles, { nullable: true })
  ValidateAuth(@Context() ctx: GraphQLContext) {
    return ctx.req.user;
  }
}
