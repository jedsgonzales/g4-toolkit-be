import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { GraphQLContext } from 'src/app.module';
import {
  SystemFilter,
  SystemFilterInput,
} from 'src/graphql/models/db/system.filter';
import { AuthAdminGuard } from 'src/guards/admin.guard';
import { DeviceService } from 'src/services/db/device.service';
import { SystemFilterService } from 'src/services/db/system.filter.service';

@Resolver()
export class FilterMutations {
  constructor(
    @Inject(forwardRef(() => SystemFilterService))
    private readonly systemFilterService: SystemFilterService,
    private readonly deviceService: DeviceService,
  ) {}

  @UseGuards(AuthAdminGuard)
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

  @UseGuards(AuthAdminGuard)
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
