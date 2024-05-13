import { AuthAdminGuard } from '@guards';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { DeviceService, SystemFilterService } from '@services';
import { GraphQLContext } from 'src/app.module';
import { SystemFilter, SystemFilterInput } from 'src/graphql/models';

@Resolver()
export class FilterMutations {
  constructor(
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
    @Args('devices') IdList: number[],
    @Args('status') IdStates: boolean[],
    @Context() ctx: GraphQLContext,
  ) {
    await this.deviceService.toggleDevices(
      IdList,
      IdStates,
      ctx.req.user.Username,
    );

    return true;
  }
}
