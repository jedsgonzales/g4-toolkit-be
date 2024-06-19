import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { UserWithRoles } from 'src/graphql/models/db/user.model';
import { AuthGuard } from 'src/guards/admin.guard';
import { UserService } from 'src/services/db/users.service';

@Resolver()
export class UserQueries {
  constructor(
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => [UserWithRoles])
  async AllUsers() {
    return await this.userService.list(true);
  }
}
