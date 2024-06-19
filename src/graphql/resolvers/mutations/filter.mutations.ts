import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/decorators/roles.decorator';
import {
  SystemFilter,
  SystemFilterInput,
} from 'src/graphql/models/db/system.filter';
import { AuthGuard } from 'src/guards/admin.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { DeviceService } from 'src/services/db/device.service';
import { SystemFilterService } from 'src/services/db/system.filter.service';
import { GraphQLContext } from 'src/types/graphql.ctx';

@Resolver()
export class FilterMutations {
  constructor(
    @Inject(forwardRef(() => SystemFilterService))
    private readonly systemFilterService: SystemFilterService,
    private readonly deviceService: DeviceService,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => SystemFilter)
  async UpdateFilter(
    @Args('filter') input: SystemFilterInput,
    @Context() ctx: GraphQLContext,
  ) {
    return await this.systemFilterService.saveFilter(
      input,
      ctx.req.user.Username,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => Int)
  async DeleteFilter(@Args({name: 'filterIds', type: () => [String]}) id: string[]) {
    return (await this.systemFilterService.deleteFilter(id)).count;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => Boolean)
  async UpdateDeviceFilter(
    @Args({ name: 'DeviceIds', type: () => [Int] }) IdList: number[],
    @Args({ name: 'States', type: () => [Boolean] }) States: boolean[],
    @Context() ctx: GraphQLContext,
  ) {
    await this.deviceService.toggleDevices(
      IdList,
      States,
      ctx.req.user.Username,
    );

    return true;
  }
}
